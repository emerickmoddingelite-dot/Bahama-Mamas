import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLE_LABELS } from "@/lib/permissions";
import RecruitmentForm from "./RecruitmentForm";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

const POSITION_LABELS: Record<string, string> = {
  BARMAN: "Barman",
  SERVEUR: "Serveur / Serveuse",
  SECURITE: "Agent de sécurité",
  DJ: "DJ",
  DANSEUR: "Danseur / Danseuse",
  RESPONSABLE: "Responsable",
};
const GENDER_LABELS: Record<string, string> = {
  HOMME: "Homme", FEMME: "Femme", AUTRE: "Autre",
};

export default async function RecruitmentsPage() {
  const session = await auth();
  if (!session?.user) {
    return <div className="card">Connectez-vous pour postuler.</div>;
  }
  const isStaff = hasRole(session.user.role, "RH");

  const myApps = await prisma.recruitment.findMany({
    where: { applicantId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const allApps = isStaff
    ? await prisma.recruitment.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: { applicant: true, reviewer: true },
      })
    : [];

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-bahama-400">Recrutements</h1>

      <RecruitmentForm logoUrl={process.env.BAHAMA_LOGO_URL} />

      <section>
        <h2 className="text-xl font-semibold mb-4">Mes candidatures</h2>
        {myApps.length === 0 ? (
          <p className="text-bahama-100/60">Aucune candidature.</p>
        ) : (
          <ul className="space-y-3">
            {myApps.map((a: any) => (
              <li key={a.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.fullName} — {POSITION_LABELS[a.desiredPosition]}</div>
                  <div className="text-xs text-bahama-100/60">
                    {new Date(a.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {isStaff && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Toutes les candidatures (staff — {ROLE_LABELS[session.user.role]})
          </h2>
          {allApps.length === 0 ? (
            <p className="text-bahama-100/60">Aucune candidature à examiner.</p>
          ) : (
            <ul className="space-y-3">
              {allApps.map((a: any) => (
                <li key={a.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{a.fullName}</div>
                      <div className="text-xs text-bahama-100/60">
                        Discord : {a.applicant.name ?? "?"} •{" "}
                        {new Date(a.createdAt).toLocaleString("fr-FR")}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Info label="Poste">{POSITION_LABELS[a.desiredPosition]}</Info>
                    <Info label="Salaire">{a.desiredSalary}</Info>
                    <Info label="Disponibilités">{a.availability}</Info>
                    <Info label="Âge">{a.age}</Info>
                    <Info label="Naissance">{new Date(a.birthDate).toLocaleDateString("fr-FR")}</Info>
                    <Info label="Sexe">{GENDER_LABELS[a.gender]}</Info>
                    <Info label="Téléphone">{a.phone}</Info>
                    <Info label="Casier RP">{a.hasCriminalRecord ? "Oui" : "Non"}</Info>
                    <Info label="Permis">{a.hasDrivingLicense ? "Oui" : "Non"}</Info>
                    <Info label="Travail de nuit">{a.canWorkNight ? "Oui" : "Non"}</Info>
                  </div>

                  {a.hasCriminalRecord && a.criminalRecordDetails && (
                    <p className="mt-2 text-sm">
                      <strong>Détails casier :</strong> {a.criminalRecordDetails}
                    </p>
                  )}

                  {a.hasNightclubExp && (
                    <div className="mt-3 text-sm">
                      <strong>Expérience nightclub :</strong>{" "}
                      {a.previousNightclub ?? "—"} / {a.previousCompany ?? "—"} /{" "}
                      poste : {a.previousPosition ?? "—"} / responsable : {a.previousManager ?? "—"} /{" "}
                      durée : {a.timeInPreviousCompany ?? "—"}
                      {a.departureReason && (
                        <p className="mt-1 italic opacity-80">Départ : {a.departureReason}</p>
                      )}
                    </div>
                  )}

                  <p className="mt-3 whitespace-pre-wrap text-sm text-bahama-50/80">
                    <strong>Motivation :</strong> {a.motivation}
                  </p>

                  <p className="mt-2 text-xs text-bahama-100/50 italic">
                    Signature : {a.signature}
                  </p>

                  {a.reviewNote && (
                    <p className="mt-2 text-sm italic text-bahama-100/70">
                      Note staff : {a.reviewNote} {a.reviewer?.name && `— ${a.reviewer.name}`}
                    </p>
                  )}
                  {a.status === "PENDING" && <ReviewActions id={a.id} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "ACCEPTED" | "REJECTED" }) {
  const map = {
    PENDING: "bg-yellow-500/20 text-yellow-300",
    ACCEPTED: "bg-green-500/20 text-green-300",
    REJECTED: "bg-red-500/20 text-red-300",
  } as const;
  const label = { PENDING: "En attente", ACCEPTED: "Acceptée", REJECTED: "Refusée" } as const;
  return <span className={`badge ${map[status]}`}>{label[status]}</span>;
}

function Info({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded border border-white/10 bg-black/20 px-2 py-1 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-bahama-100/50">{label}</div>
      <div>{children}</div>
    </div>
  );
}
