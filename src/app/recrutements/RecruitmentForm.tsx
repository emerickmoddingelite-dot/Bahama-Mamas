"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = [
  { value: "BARMAN", label: "Barman" },
  { value: "SERVEUR", label: "Serveur / Serveuse" },
  { value: "SECURITE", label: "Agent de sécurité" },
  { value: "DJ", label: "DJ" },
  { value: "DANSEUR", label: "Danseur / Danseuse" },
  { value: "RESPONSABLE", label: "Responsable" },
] as const;

export default function RecruitmentForm({ logoUrl }: { logoUrl?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasNightclub, setHasNightclub] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);

    const payload: Record<string, any> = {
      fullName: fd.get("fullName"),
      age: Number(fd.get("age")),
      birthDate: fd.get("birthDate"),
      gender: fd.get("gender"),
      phone: fd.get("phone"),
      desiredPosition: fd.get("desiredPosition"),
      desiredSalary: fd.get("desiredSalary"),
      availability: fd.get("availability"),
      hasNightclubExp: hasNightclub,
      previousNightclub: fd.get("previousNightclub") || null,
      previousCompany: fd.get("previousCompany") || null,
      previousPosition: fd.get("previousPosition") || null,
      previousManager: fd.get("previousManager") || null,
      departureReason: fd.get("departureReason") || null,
      timeInPreviousCompany: fd.get("timeInPreviousCompany") || null,
      motivation: fd.get("motivation"),
      hasCriminalRecord: hasRecord,
      criminalRecordDetails: fd.get("criminalRecordDetails") || null,
      hasDrivingLicense: fd.get("hasDrivingLicense") === "on",
      canWorkNight: fd.get("canWorkNight") === "on",
      signature: fd.get("signature"),
    };

    const res = await fetch("/api/recrutements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setHasNightclub(false);
      setHasRecord(false);
      setMsg("Candidature envoyée !");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error ?? "Erreur lors de l'envoi.");
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-lg bg-[#fdf6e3] text-stone-900 shadow-2xl ring-1 ring-stone-300 p-8 sm:p-12 font-serif">
      {/* En-tête */}
      <header className="text-center border-b-2 border-double border-stone-700 pb-4 mb-6">
        {logoOk && logoUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt="Bahama Mamas"
            className="mx-auto h-24 w-24 rounded-full object-cover mb-3 ring-2 ring-stone-700"
            onError={() => setLogoOk(false)}
          />
        )}
        <h2 className="text-3xl font-extrabold tracking-widest">BAHAMA MAMAS</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-600 mt-1">
          Los Santos — Tel: 10174
        </p>
        <p className="mt-4 text-xl font-bold tracking-widest">FORMULAIRE DE CANDIDATURE</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="text-right text-sm">
          <span className="font-semibold">Date de candidature :</span>{" "}
          <input type="date" name="applicationDate" defaultValue={today} className="rp-input w-44" required />
        </div>

        <Section title="Informations personnelles">
          <Row>
            <Field label="Nom & Prénom" wide>
              <input name="fullName" required maxLength={120} className="rp-input" />
            </Field>
          </Row>
          <Row>
            <Field label="Âge">
              <input name="age" type="number" min={16} max={99} required className="rp-input" />
            </Field>
            <Field label="Date de naissance">
              <input name="birthDate" type="date" required className="rp-input" />
            </Field>
            <Field label="Sexe">
              <div className="flex gap-3 pt-1">
                <Radio name="gender" value="HOMME" label="Homme" defaultChecked />
                <Radio name="gender" value="FEMME" label="Femme" />
              </div>
            </Field>
          </Row>
          <Field label="Numéro de téléphone" wide>
            <input name="phone" required className="rp-input" placeholder="555-XXXX" />
          </Field>
        </Section>

        <Section title="Poste souhaité">
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            {POSITIONS.map((p, i) => (
              <Radio key={p.value} name="desiredPosition" value={p.value} label={p.label} defaultChecked={i === 0} />
            ))}
          </div>
          <Row>
            <Field label="Salaire souhaité">
              <input name="desiredSalary" required className="rp-input" placeholder="$ / heure ou $ / semaine" />
            </Field>
            <Field label="Disponibilités">
              <input name="availability" required className="rp-input" placeholder="Soirs, week-ends…" />
            </Field>
          </Row>
        </Section>

        <Section title="Expérience RP">
          <p className="text-sm font-semibold">Avez-vous déjà travaillé dans un établissement de nuit ?</p>
          <div className="flex gap-4 mb-3">
            <Check
              checked={hasNightclub}
              onChange={() => setHasNightclub(true)}
              label="Oui"
              type="radio"
            />
            <Check
              checked={!hasNightclub}
              onChange={() => setHasNightclub(false)}
              label="Non"
              type="radio"
            />
          </div>
          {hasNightclub && (
            <Field label="Si oui, lequel ?" wide>
              <input name="previousNightclub" className="rp-input" />
            </Field>
          )}
          <Row>
            <Field label="Ancienne entreprise / organisation" wide>
              <input name="previousCompany" className="rp-input" />
            </Field>
            <Field label="Poste occupé">
              <input name="previousPosition" className="rp-input" />
            </Field>
          </Row>
          <Row>
            <Field label="Nom du responsable">
              <input name="previousManager" className="rp-input" />
            </Field>
            <Field label="Temps passé dans cette entreprise">
              <input name="timeInPreviousCompany" className="rp-input" />
            </Field>
          </Row>
          <Field label="Raison du départ" wide>
            <textarea name="departureReason" rows={2} className="rp-input resize-none" />
          </Field>
        </Section>

        <Section title="Motivations">
          <Field label="Pourquoi souhaitez-vous rejoindre le Bahama Mamas ?" wide>
            <textarea name="motivation" required minLength={20} rows={5} className="rp-input resize-none" />
          </Field>
        </Section>

        <Section title="Informations RP">
          <p className="text-sm font-semibold">Avez-vous un casier judiciaire RP ?</p>
          <div className="flex gap-4 mb-3">
            <Check checked={hasRecord} onChange={() => setHasRecord(true)} label="Oui" type="radio" />
            <Check checked={!hasRecord} onChange={() => setHasRecord(false)} label="Non" type="radio" />
          </div>
          {hasRecord && (
            <Field label="Si oui, expliquez" wide>
              <textarea name="criminalRecordDetails" rows={2} className="rp-input resize-none" />
            </Field>
          )}
          <p className="text-sm font-semibold mt-4">Possédez-vous le permis de conduire ?</p>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="hasDrivingLicense" /> Oui
            </label>
          </div>
          <p className="text-sm font-semibold mt-2">Êtes-vous capable de travailler de nuit ?</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="canWorkNight" /> Oui
            </label>
          </div>
        </Section>

        <Section title="Signature">
          <p className="text-sm italic mb-4">
            Je certifie que les informations fournies sont correctes.
          </p>
          <Row>
            <Field label="Signature (nom complet)" wide>
              <input
                name="signature"
                required
                className="rp-input italic font-['Brush_Script_MT',cursive] text-2xl"
                placeholder="Votre nom"
              />
            </Field>
            <Field label="Date">
              <input type="date" defaultValue={today} disabled className="rp-input" />
            </Field>
          </Row>
        </Section>

        <div className="flex items-center justify-between border-t border-stone-300 pt-6">
          {msg && <p className="text-sm font-semibold">{msg}</p>}
          <button
            disabled={loading}
            className="ml-auto inline-flex items-center justify-center rounded-md bg-stone-900 px-6 py-3 text-sm font-bold uppercase tracking-widest text-amber-50 hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Soumettre la candidature"}
          </button>
        </div>
      </form>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-extrabold tracking-[0.25em] uppercase border-b border-stone-700 pb-1 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{children}</div>;
}

function Field({
  label, children, wide,
}: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 md:col-span-3" : ""}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Radio({
  name, value, label, defaultChecked,
}: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} required />
      <span>{label}</span>
    </label>
  );
}

function Check({
  checked, onChange, label, type = "checkbox",
}: { checked: boolean; onChange: () => void; label: string; type?: "checkbox" | "radio" }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type={type} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
