import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import { sendDiscordWebhook, COLORS } from "@/lib/webhook";

const schema = z.object({ reason: z.string().min(10).max(4000) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "EMPLOYEE"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const r = await prisma.resignation.create({
    data: { reason: parsed.data.reason, userId: session.user.id },
  });

  const pingRoles = (process.env.DISCORD_RESIGNATION_PING_ROLE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const roleMentions = pingRoles.map((id) => `<@&${id}>`).join(" ");

  await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_RESIGNATION, {
    content: roleMentions || undefined,
    allowedRoles: pingRoles,
    embeds: [{
      title: "📤 Nouvelle démission",
      color: COLORS.RED,
      fields: [
        { name: "Membre", value: `${session.user.name ?? "?"} (<@${session.user.discordId ?? ""}>)`, inline: true },
        { name: "Motif", value: parsed.data.reason.slice(0, 1500) },
      ],
      timestamp: new Date().toISOString(),
    }],
  });

  return NextResponse.json({ id: r.id });
}
