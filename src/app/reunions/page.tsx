import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import MeetingForm from "./MeetingForm";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "EMPLOYEE")) {
    return <div className="card">Accès réservé aux employés.</div>;
  }
  const canCreate = hasRole(session.user.role, "RH");

  const meetings = await prisma.meeting.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { createdBy: true, participants: { include: { user: true } } },
  });
  const users = canCreate
    ? await prisma.user.findMany({ where: { role: { not: "VISITOR" } }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-bahama-400">Réunions</h1>

      {canCreate && (
        <section className="card">
          <h2 className="text-xl font-semibold mb-4">Planifier une réunion</h2>
          <MeetingForm users={users.map((u: any) => ({ id: u.id, name: u.name ?? "?" }))} />
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Réunions à venir &amp; passées</h2>
        {meetings.length === 0 ? (
          <p className="text-bahama-100/60">Aucune réunion planifiée.</p>
        ) : (
          <ul className="space-y-3">
            {meetings.map((m: any) => {
              const past = new Date(m.scheduledAt).getTime() < Date.now();
              return (
                <li key={m.id} className={`card ${past ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg">{m.title}</div>
                    <div className="text-xs text-bahama-100/70">
                      {new Date(m.scheduledAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  {m.location && (
                    <div className="text-sm text-bahama-100/70">📍 {m.location}</div>
                  )}
                  {m.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-bahama-50/80">{m.description}</p>
                  )}
                  <div className="mt-3 text-xs text-bahama-100/60">
                    Participants ({m.participants.length}): {m.participants.map((p: any) => p.user.name).join(", ") || "—"}
                  </div>
                  <div className="mt-1 text-xs text-bahama-100/40">
                    Organisé par {m.createdBy.name}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
