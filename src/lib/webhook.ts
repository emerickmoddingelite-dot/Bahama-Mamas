type EmbedField = { name: string; value: string; inline?: boolean };

export type WebhookEmbed = {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  fields?: EmbedField[];
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  author?: { name: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
};

const LOGO_URL = process.env.BAHAMA_LOGO_URL || "";

export type SendWebhookResult = {
  ok: boolean;
  attachmentUrl?: string;
};

export async function sendDiscordWebhook(
  url: string | undefined,
  payload: {
    content?: string;
    embeds?: WebhookEmbed[];
    username?: string;
    avatar_url?: string;
    allowedRoles?: string[];
    allowedUsers?: string[];
    file?: { name: string; buffer: ArrayBuffer; type?: string };
  }
): Promise<SendWebhookResult> {
  if (!url) return { ok: false };
  // Injecte la thumbnail logo dans chaque embed qui n'en a pas déjà une
  const embeds = (payload.embeds ?? []).map((e) => ({
    ...e,
    thumbnail: e.thumbnail ?? (LOGO_URL ? { url: LOGO_URL } : undefined),
  }));

  const allowed_mentions: {
    parse: string[];
    roles?: string[];
    users?: string[];
  } = { parse: [] };
  if (payload.allowedRoles && payload.allowedRoles.length > 0) {
    allowed_mentions.roles = payload.allowedRoles;
  }
  if (payload.allowedUsers && payload.allowedUsers.length > 0) {
    allowed_mentions.users = payload.allowedUsers;
  }

  const json: Record<string, unknown> = {
    username: payload.username ?? "Bahama Mamas",
    avatar_url: payload.avatar_url ?? (LOGO_URL || undefined),
    content: payload.content,
    embeds,
    allowed_mentions,
  };

  try {
    // On utilise wait=true pour recevoir le message cree (et l'URL d'attachement)
    const fullUrl = url + (url.includes("?") ? "&" : "?") + "wait=true";

    let res: Response;
    if (payload.file) {
      // Reference l'image dans l'embed via attachment://
      json.embeds = (embeds ?? []).map((e) => ({
        ...e,
        image: e.image ?? { url: `attachment://${payload.file!.name}` },
      }));
      const fd = new FormData();
      fd.append("payload_json", JSON.stringify(json));
      const blob = new Blob([payload.file.buffer], {
        type: payload.file.type ?? "application/octet-stream",
      });
      fd.append("files[0]", blob, payload.file.name);
      res = await fetch(fullUrl, { method: "POST", body: fd });
    } else {
      res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
    }

    if (!res.ok) {
      console.error("Webhook Discord failed:", res.status, await res.text());
      return { ok: false };
    }

    let attachmentUrl: string | undefined;
    try {
      const data = (await res.json()) as { attachments?: Array<{ url?: string }> };
      attachmentUrl = data.attachments?.[0]?.url;
    } catch {
      /* pas de body JSON */
    }
    return { ok: true, attachmentUrl };
  } catch (e) {
    console.error("Webhook Discord error:", e);
    return { ok: false };
  }
}

export const COLORS = {
  ORANGE: 0xf97316,
  GREEN: 0x16a34a,
  RED: 0xdc2626,
  BLUE: 0x2563eb,
  YELLOW: 0xeab308,
};
