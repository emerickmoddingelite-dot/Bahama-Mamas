import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import { sendDiscordWebhook } from "@/lib/webhook";

const schema = z.object({
  title: z.string().min(2).max(140),
  content: z.string().min(10).max(4000),
  audience: z.enum(["STAFF", "CITIZENS"]).default("STAFF"),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 Mo (limite webhook Discord standard)

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "COPATRON"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Form invalide" }, { status: 400 });

  const parsed = schema.safeParse({
    title: form.get("title"),
    content: form.get("content"),
    audience: form.get("audience") ?? "STAFF",
    imageUrl: form.get("imageUrl") ?? "",
  });
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const fileField = form.get("image");
  let filePayload: { name: string; buffer: ArrayBuffer; type?: string } | undefined;
  if (fileField && typeof fileField !== "string") {
    if (fileField.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux (8 Mo max)" }, { status: 400 });
    }
    if (!fileField.type.startsWith("image/")) {
      return NextResponse.json({ error: "Seules les images sont autorisées" }, { status: 400 });
    }
    const buffer = await fileField.arrayBuffer();
    const safeName = (fileField.name || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
    filePayload = { name: safeName, buffer, type: fileField.type };
  }

  const isCitizens = parsed.data.audience === "CITIZENS";
  const webhookUrl = isCitizens
    ? process.env.DISCORD_WEBHOOK_ANNOUNCEMENT_PUBLIC
    : process.env.DISCORD_WEBHOOK_ANNOUNCEMENT;
  const pingEnv = isCitizens
    ? process.env.DISCORD_ANNOUNCEMENT_PUBLIC_PING_ROLE_IDS
    : process.env.DISCORD_ANNOUNCEMENT_PING_ROLE_IDS;
  const pingRoles = (pingEnv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const roleMentions = pingRoles.map((id) => `<@&${id}>`).join(" ");

  // Message style "utilisateur Discord" : titre en gras + contenu, pas d'embed
  const parts = [
    roleMentions,
    `**${parsed.data.title}**`,
    parsed.data.content,
    parsed.data.imageUrl || "",
  ].filter(Boolean);
  const message = parts.join("\n").slice(0, 1990);

  const result = await sendDiscordWebhook(webhookUrl, {
    content: message,
    allowedRoles: pingRoles,
    file: filePayload,
    username: `Bahama Mamas — ${session.user.name ?? "Direction"}`,
  });
  void isCitizens;

  // URL finale : CDN Discord si fichier uploade, sinon URL fournie
  const finalImageUrl = result.attachmentUrl ?? (parsed.data.imageUrl || null);

  const a = await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      audience: parsed.data.audience,
      imageUrl: finalImageUrl,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ id: a.id });
}
