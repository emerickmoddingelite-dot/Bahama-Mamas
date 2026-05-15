import Link from "next/link";
import type { Session } from "next-auth";
import { signIn, signOut } from "@/auth";
import { hasRole, ROLE_LABELS } from "@/lib/permissions";

export default function Nav({ session }: { session: Session | null }) {
  const role = session?.user?.role;
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍹</span>
          <span className="font-bold tracking-wide text-bahama-400">Bahama Mamas</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {session && (
            <>
              <NavLink href="/recrutements">Recrutements</NavLink>
              {role && hasRole(role, "EMPLOYEE") && (
                <>
                  <NavLink href="/demissions">Démissions</NavLink>
                  <NavLink href="/reunions">Réunions</NavLink>
                  <NavLink href="/annonces">Annonces</NavLink>
                </>
              )}
              {role && hasRole(role, "ADMIN") && <NavLink href="/admin">Admin</NavLink>}
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <div className="hidden text-right text-xs sm:block">
                <div className="font-medium text-bahama-50">{session.user.name}</div>
                <div className="text-bahama-100/60">{ROLE_LABELS[role ?? "VISITOR"]}</div>
              </div>
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-8 w-8 rounded-full ring-2 ring-bahama-500/50" />
              )}
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button className="btn-secondary">Déconnexion</button>
              </form>
            </>
          ) : (
            <form action={async () => { "use server"; await signIn("discord", { redirectTo: "/" }); }}>
              <button className="btn-primary">Se connecter avec Discord</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 text-bahama-50/80 hover:bg-white/5 hover:text-bahama-50">
      {children}
    </Link>
  );
}
