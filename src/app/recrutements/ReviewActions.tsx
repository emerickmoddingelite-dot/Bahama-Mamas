"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function review(status: "ACCEPTED" | "REJECTED") {
    setLoading(true);
    const res = await fetch(`/api/recrutements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote: note || null }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        placeholder="Note (optionnelle)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input flex-1"
      />
      <button onClick={() => review("ACCEPTED")} disabled={loading} className="btn-success">
        Accepter
      </button>
      <button onClick={() => review("REJECTED")} disabled={loading} className="btn-danger">
        Refuser
      </button>
    </div>
  );
}
