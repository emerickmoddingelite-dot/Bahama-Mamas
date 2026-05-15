"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["VISITOR", "EMPLOYEE", "RH", "COPATRON", "PATRON", "ADMIN"] as const;

export default function RoleSelect({
  userId, current, disabled,
}: { userId: string; current: string; disabled?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);

  async function update(next: string) {
    setLoading(true);
    setValue(next);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else setValue(current);
  }

  return (
    <select
      className="select"
      value={value}
      disabled={disabled || loading}
      onChange={(e) => update(e.target.value)}
    >
      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}
