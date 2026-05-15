import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import AnnouncementForm from "./AnnouncementForm";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "EMPLOYEE")) {
    return <div className="card">Accès réservé aux employés.</div>;
  }
  const canPost = hasRole(session.user.role, "COPATRON");

  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-bahama-400">Annonces</h1>

      {canPost && (
        <section className="card">
          <h2 className="text-xl font-semibold mb-4">Publier une annonce</h2>
          <AnnouncementForm />
        </section>
      )}

      <section className="space-y-3">
        {items.length === 0 ? (
          <p className="text-bahama-100/60">Aucune annonce.</p>
        ) : (
          items.map((a: any) => (
            <article key={a.id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <div className="text-xs text-bahama-100/60">
                  {new Date(a.createdAt).toLocaleString("fr-FR")}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-bahama-50/80">{a.content}</p>
              {a.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={a.imageUrl}
                  alt={a.title}
                  className="mt-3 max-h-80 rounded-md border border-white/10 object-contain"
                />
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-bahama-100/50">
                <span>— {a.createdBy.name}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5">
                  {a.audience === "CITIZENS" ? "🏝️ Citoyens" : "👔 Employés"}
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
