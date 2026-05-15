import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");
  return (
    <div className="mx-auto max-w-md card text-center">
      <h1 className="text-2xl font-bold text-bahama-400">Connexion</h1>
      <p className="mt-2 text-bahama-100/70">Connectez-vous via votre compte Discord.</p>
      <form action={async () => { "use server"; await signIn("discord", { redirectTo: "/" }); }} className="mt-6">
        <button className="btn-primary w-full">Continuer avec Discord</button>
      </form>
    </div>
  );
}
