import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import { sendDiscordWebhook, COLORS } from "@/lib/webhook";

const schema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(4000).nullable().optional(),
  scheduledAt: z.string().min(10),
  location: z.string().max(255).nullable().optional(),
  participantIds: z.array(z.string()).default([]),
  mentionAll: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "RH"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const date = new Date(parsed.data.scheduledAt);
  if (isNaN(date.getTime())) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const meeting = await prisma.meeting.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      scheduledAt: date,
      location: parsed.data.location ?? null,
      createdById: session.user.id,
      participants: {
        create: parsed.data.participantIds.map((userId) => ({ userId })),
      },
    },
    include: { participants: { include: { user: true } } },
  });

  const userMentions = meeting.participants
    .map((p) => (p.user.discordId ? `<@${p.user.discordId}>` : null))
    .filter(Boolean) as string[];

  const staffRoleId = process.env.DISCORD_MEETING_MENTION_ROLE_ID;
  const roleMention = parsed.data.mentionAll && staffRoleId ? `<@&${staffRoleId}>` : "";
  const content = [roleMention, ...userMentions].filter(Boolean).join(" ") || undefined;

  await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_MEETING, {
    content,
    allowedRoles: parsed.data.mentionAll && staffRoleId ? [staffRoleId] : [],
    allowedUsers: meeting.participants
      .map((p) => p.user.discordId)
      .filter(Boolean) as string[],
    embeds: [{
      title: `📅 Nouvelle réunion : ${meeting.title}`,
      description: meeting.description ?? undefined,
      color: COLORS.BLUE,
      fields: [
        { name: "Quand", value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
        ...(meeting.location ? [{ name: "Où", value: meeting.location, inline: true }] : []),
        { name: "Organisateur", value: session.user.name ?? "?", inline: true },
        { name: "Participants", value: meeting.participants.map((p) => p.user.name).join(", ") || "—" },
      ],
      timestamp: new Date().toISOString(),
    }],
  });

  return NextResponse.json({ id: meeting.id });
}
