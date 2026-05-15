"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResignationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm("Confirmer la soumission de votre démission ?")) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/demissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: fd.get("reason") }),
    });
    setLoading(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setMsg("Démission soumise.");
      router.refresh();
    } else setMsg("Erreur.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Motif</label>
        <textarea name="reason" required minLength={10} rows={5} className="textarea" />
      </div>
      <button disabled={loading} className="btn-danger">{loading ? "Envoi…" : "Soumettre ma démission"}</button>
      {msg && <p className="text-sm text-bahama-200">{msg}</p>}
    </form>
  );
}
