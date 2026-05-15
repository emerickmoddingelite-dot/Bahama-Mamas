import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import { sendDiscordWebhook, COLORS } from "@/lib/webhook";

const schema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  reviewNote: z.string().max(2000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "RH"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const app = await prisma.recruitment.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote ?? null,
      reviewedById: session.user.id,
    },
    include: { applicant: true },
  });

  if (parsed.data.status === "ACCEPTED" && app.applicant.role === "VISITOR") {
    await prisma.user.update({ where: { id: app.applicantId }, data: { role: "EMPLOYEE" } });
  }

  await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_RECRUITMENT, {
    embeds: [{
      title: parsed.data.status === "ACCEPTED" ? "✅ Candidature acceptée" : "❌ Candidature refusée",
      color: parsed.data.status === "ACCEPTED" ? COLORS.GREEN : COLORS.RED,
      fields: [
        { name: "Candidat", value: `${app.applicant.name ?? "?"} (<@${app.applicant.discordId ?? ""}>)`, inline: true },
        { name: "Nom & Prénom", value: app.fullName, inline: true },
        { name: "Décision par", value: session.user.name ?? "?", inline: true },
        ...(app.reviewNote ? [{ name: "Note", value: app.reviewNote }] : []),
      ],
      timestamp: new Date().toISOString(),
    }],
  });

  return NextResponse.json({ ok: true });
}
