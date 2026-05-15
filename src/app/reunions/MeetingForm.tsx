"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type U = { id: string; name: string };

export default function MeetingForm({ users }: { users: U[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [mentionAll, setMentionAll] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectAll() {
    setSelected(users.map((u) => u.id));
  }
  function clearAll() {
    setSelected([]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reunions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        description: fd.get("description") || null,
        scheduledAt: fd.get("scheduledAt"),
        location: fd.get("location") || null,
        participantIds: selected,
        mentionAll,
      }),
    });
    setLoading(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setSelected([]);
      setMsg("Réunion créée.");
      router.refresh();
    } else setMsg("Erreur.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Titre</label>
        <input name="title" required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Date &amp; heure</label>
          <input name="scheduledAt" type="datetime-local" required className="input" />
        </div>
        <div>
          <label className="label">Lieu / lien</label>
          <input name="location" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Description / ordre du jour</label>
        <textarea name="description" rows={4} className="textarea" />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
          <input type="checkbox" checked={mentionAll} onChange={(e) => setMentionAll(e.target.checked)} />
          <span>Mentionner tout le staff sur Discord (@rôle)</span>
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">Participants ({selected.length})</label>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={selectAll} className="text-bahama-300 hover:underline">Tout cocher</button>
            <button type="button" onClick={clearAll} className="text-bahama-300 hover:underline">Effacer</button>
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-auto rounded-md border border-white/10 bg-black/20 p-2">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 rounded px-2 py-1">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              {u.name}
            </label>
          ))}
        </div>
      </div>
      <button disabled={loading} className="btn-primary">{loading ? "Envoi…" : "Planifier"}</button>
      {msg && <p className="text-sm text-bahama-200">{msg}</p>}
    </form>
  );
}
