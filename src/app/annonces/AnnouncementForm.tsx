"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [audience, setAudience] = useState<"STAFF" | "CITIZENS">("STAFF");
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    fd.set("audience", audience);
    if (imageFile) fd.set("image", imageFile);

    const res = await fetch("/api/annonces", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      formEl.reset();
      setImageFile(null);
      setMsg("Annonce publiée.");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error ?? "Erreur lors de l'envoi.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Destinataires</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAudience("STAFF")}
            className={`btn ${audience === "STAFF" ? "bg-bahama-500 text-white" : "bg-white/10 text-bahama-50 hover:bg-white/20 border border-white/10"}`}
          >
            👔 Employés
          </button>
          <button
            type="button"
            onClick={() => setAudience("CITIZENS")}
            className={`btn ${audience === "CITIZENS" ? "bg-bahama-500 text-white" : "bg-white/10 text-bahama-50 hover:bg-white/20 border border-white/10"}`}
          >
            🏝️ Citoyens
          </button>
        </div>
      </div>
      <div>
        <label className="label">Titre</label>
        <input name="title" required maxLength={140} className="input" />
      </div>
      <div>
        <label className="label">Contenu</label>
        <textarea name="content" required minLength={10} rows={5} className="textarea" />
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
        <div className="text-sm font-semibold text-bahama-100">Image (optionnel)</div>
        <div>
          <label className="label text-xs">Lien d&apos;une image</label>
          <input
            name="imageUrl"
            type="url"
            placeholder="https://…"
            className="input"
            disabled={!!imageFile}
          />
        </div>
        <div className="text-xs text-bahama-100/50">— ou —</div>
        <div>
          <label className="label text-xs">Depuis ton PC</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-bahama-100 file:mr-3 file:rounded-md file:border-0 file:bg-bahama-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-bahama-600"
          />
          {imageFile && (
            <div className="mt-2 flex items-center justify-between text-xs text-bahama-100/70">
              <span>📎 {imageFile.name} ({Math.round(imageFile.size / 1024)} Ko)</span>
              <button type="button" onClick={() => setImageFile(null)} className="text-red-300 hover:underline">Retirer</button>
            </div>
          )}
        </div>
      </div>

      <button disabled={loading} className="btn-primary">{loading ? "Envoi…" : "Publier"}</button>
      {msg && <p className="text-sm text-bahama-200">{msg}</p>}
    </form>
  );
}
