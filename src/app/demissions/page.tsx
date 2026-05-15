import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";
import ResignationForm from "./ResignationForm";

export const dynamic = "force-dynamic";

export default async function ResignationsPage() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "EMPLOYEE")) {
    return <div className="card">Accès réservé aux employés.</div>;
  }

  const isStaff = hasRole(session.user.role, "RH");
  const items = isStaff
    ? await prisma.resignation.findMany({ orderBy: { createdAt: "desc" }, include: { user: true } })
    : await prisma.resignation.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-bahama-400">Démissions</h1>

      <section className="card">
        <h2 className="text-xl font-semibold mb-4">Soumettre une démission</h2>
        <ResignationForm />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{isStaff ? "Toutes les démissions" : "Mes démissions"}</h2>
        {items.length === 0 ? (
          <p className="text-bahama-100/60">Aucune démission.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((r: any) => (
              <li key={r.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{isStaff ? r.user?.name ?? "?" : "Vous"}</div>
                  <div className="text-xs text-bahama-100/60">
                    {new Date(r.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-bahama-50/80">{r.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
