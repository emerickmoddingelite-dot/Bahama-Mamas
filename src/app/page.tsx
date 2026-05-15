import Link from "next/link";
import { auth, signIn } from "@/auth";
import { hasRole } from "@/lib/permissions";

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <div className="space-y-10">
      <section className="text-center py-10">
        <h1 className="text-5xl font-extrabold tracking-tight">
          <span className="text-bahama-400">Bahama Mamas</span> — Espace RH
        </h1>
        <p className="mt-4 text-lg text-bahama-100/70">
          Recrutements, démissions, réunions et annonces pour le serveur RolePlay.
        </p>
        {!session && (
          <form action={async () => { "use server"; await signIn("discord", { redirectTo: "/" }); }} className="mt-6">
            <button className="btn-primary">Se connecter avec Discord</button>
          </form>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile href="/recrutements" emoji="📝" title="Recrutements" desc="Postuler ou gérer les candidatures." />
        <Tile href="/demissions" emoji="📤" title="Démissions" desc="Soumettre une démission." disabled={!hasRole(role, "EMPLOYEE")} />
        <Tile href="/reunions" emoji="📅" title="Réunions" desc="Planning et participants." disabled={!hasRole(role, "EMPLOYEE")} />
        <Tile href="/annonces" emoji="📣" title="Annonces" desc="Communications internes." disabled={!hasRole(role, "EMPLOYEE")} />
      </section>
    </div>
  );
}

function Tile({ href, emoji, title, desc, disabled }: { href: string; emoji: string; title: string; desc: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="card opacity-50 cursor-not-allowed">
        <div className="text-3xl">{emoji}</div>
        <div className="mt-3 font-bold">{title}</div>
        <div className="text-sm text-bahama-100/60">Connexion / rôle requis</div>
      </div>
    );
  }
  return (
    <Link href={href} className="card hover:border-bahama-500/50 hover:bg-white/10 transition-colors">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-3 font-bold">{title}</div>
      <div className="text-sm text-bahama-100/60">{desc}</div>
    </Link>
  );
}
