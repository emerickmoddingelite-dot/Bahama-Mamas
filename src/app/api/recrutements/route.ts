import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, COLORS } from "@/lib/webhook";

const schema = z.object({
  fullName: z.string().min(2).max(120),
  age: z.number().int().min(16).max(99),
  birthDate: z.string().min(8),
  gender: z.enum(["HOMME", "FEMME", "AUTRE"]),
  phone: z.string().min(3).max(40),
  desiredPosition: z.enum(["BARMAN", "SERVEUR", "SECURITE", "DJ", "DANSEUR", "RESPONSABLE"]),
  desiredSalary: z.string().min(1).max(80),
  availability: z.string().min(1).max(255),
  hasNightclubExp: z.boolean(),
  previousNightclub: z.string().max(120).nullable().optional(),
  previousCompany: z.string().max(120).nullable().optional(),
  previousPosition: z.string().max(120).nullable().optional(),
  previousManager: z.string().max(120).nullable().optional(),
  departureReason: z.string().max(2000).nullable().optional(),
  timeInPreviousCompany: z.string().max(80).nullable().optional(),
  motivation: z.string().min(20).max(4000),
  hasCriminalRecord: z.boolean(),
  criminalRecordDetails: z.string().max(2000).nullable().optional(),
  hasDrivingLicense: z.boolean(),
  canWorkNight: z.boolean(),
  signature: z.string().min(2).max(120),
});

const POSITION_LABELS: Record<string, string> = {
  BARMAN: "Barman",
  SERVEUR: "Serveur / Serveuse",
  SECURITE: "Agent de sécurité",
  DJ: "DJ",
  DANSEUR: "Danseur / Danseuse",
  RESPONSABLE: "Responsable",
};
const GENDER_LABELS: Record<string, string> = {
  HOMME: "Homme", FEMME: "Femme", AUTRE: "Autre",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const birth = new Date(d.birthDate);
  if (isNaN(birth.getTime())) {
    return NextResponse.json({ error: "Date de naissance invalide" }, { status: 400 });
  }

  const app = await prisma.recruitment.create({
    data: {
      applicantId: session.user.id,
      fullName: d.fullName,
      age: d.age,
      birthDate: birth,
      gender: d.gender,
      phone: d.phone,
      desiredPosition: d.desiredPosition,
      desiredSalary: d.desiredSalary,
      availability: d.availability,
      hasNightclubExp: d.hasNightclubExp,
      previousNightclub: d.previousNightclub ?? null,
      previousCompany: d.previousCompany ?? null,
      previousPosition: d.previousPosition ?? null,
      previousManager: d.previousManager ?? null,
      departureReason: d.departureReason ?? null,
      timeInPreviousCompany: d.timeInPreviousCompany ?? null,
      motivation: d.motivation,
      hasCriminalRecord: d.hasCriminalRecord,
      criminalRecordDetails: d.criminalRecordDetails ?? null,
      hasDrivingLicense: d.hasDrivingLicense,
      canWorkNight: d.canWorkNight,
      signature: d.signature,
    },
  });

  const yn = (b: boolean) => (b ? "Oui" : "Non");
  const pingRoles = (process.env.DISCORD_RECRUITMENT_PING_ROLE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const roleMentions = pingRoles.map((id) => `<@&${id}>`).join(" ");

  await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_RECRUITMENT, {
    content: roleMentions || undefined,
    allowedRoles: pingRoles,
    embeds: [{
      title: "📝 Nouvelle candidature — Bahama Mamas",
      description: `**${d.fullName}** postule pour **${POSITION_LABELS[d.desiredPosition]}**`,
      color: COLORS.ORANGE,
      fields: [
        { name: "Candidat Discord", value: `${session.user.name ?? "?"} (<@${session.user.discordId ?? ""}>)` },
        { name: "Âge", value: String(d.age), inline: true },
        { name: "Sexe", value: GENDER_LABELS[d.gender], inline: true },
        { name: "Téléphone", value: d.phone, inline: true },
        { name: "Disponibilités", value: d.availability, inline: true },
        { name: "Salaire souhaité", value: d.desiredSalary, inline: true },
        { name: "Casier RP", value: yn(d.hasCriminalRecord), inline: true },
        { name: "Permis", value: yn(d.hasDrivingLicense), inline: true },
        { name: "Travail de nuit", value: yn(d.canWorkNight), inline: true },
        { name: "Motivation", value: d.motivation.slice(0, 1000) },
      ],
      footer: { text: `Signature : ${d.signature}` },
      timestamp: new Date().toISOString(),
    }],
  });

  return NextResponse.json({ id: app.id });
}
