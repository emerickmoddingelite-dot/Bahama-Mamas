import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLE_LABELS } from "@/lib/permissions";
import RoleSelect from "./RoleSelect";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "ADMIN")) {
    return <div className="card">Accès réservé aux administrateurs.</div>;
  }

  const users = await prisma.user.findMany({ orderBy: [{ role: "desc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-bahama-400">Administration</h1>
      <section className="card">
        <h2 className="text-xl font-semibold mb-4">Utilisateurs &amp; rôles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-bahama-100/70">
                <th className="py-2">Utilisateur</th>
                <th>Discord</th>
                <th>Rôle actuel</th>
                <th>Modifier</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {u.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="h-7 w-7 rounded-full" />
                      )}
                      <span>{u.name ?? "?"}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{u.discordId ?? "—"}</td>
                  <td>{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</td>
                  <td>
                    <RoleSelect userId={u.id} current={u.role} disabled={u.id === session.user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
