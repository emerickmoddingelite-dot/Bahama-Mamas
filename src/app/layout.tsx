import "./globals.css";
import type { Metadata } from "next";
import { auth } from "@/auth";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Bahama Mamas — Espace RH",
  description: "Recrutements, démissions, réunions et annonces — Bahama Mamas RP",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="fr">
      <body>
        <Nav session={session} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-bahama-100/40">
          Bahama Mamas — Espace RP interne
        </footer>
      </body>
    </html>
  );
}
