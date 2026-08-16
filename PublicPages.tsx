--- src/pages/PublicPages.tsx (原始)


+++ src/pages/PublicPages.tsx (修改后)
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, ChevronDown, Clock, FileCheck2, Mail, MapPin, Phone, ScanLine, Search, Send, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { PublicHeader, Footer } from "../components/layout";
import { Badge, Button, Card, Field, Input, Select, Textarea, useToast } from "../components/ui";
import { QRSvg, Reveal, UPSeal } from "../components/widgets";
import { ACT_TYPES, FAQ_ITEMS } from "../lib/data";
import { ACT_ICONS } from "./Home";
import { useStore } from "../lib/store";
import type { Application } from "../lib/types";
import { actById } from "../lib/data";
import { fmtDateLong, fmtDateTime } from "../lib/utils";
import { cn } from "../lib/utils";

const REQUIRED_DOCS: Record<string, string[]> = {
  "att-reussite": ["Pièce d'identité (CNI / passeport)", "Relevé de notes de l'année concernée", "Quittance de paiement des frais"],
  "cert-scolarite": ["Quittance d'inscription de l'année en cours", "Pièce d'identité"],
  "releve-notes": ["Pièce d'identité", "Numéro matricule à jour"],
  "att-diplome": ["Pièce d'identité", "PV de soutenance ou relevé final", "Quittance de paiement"],
  diplome: ["Pièce d'identité", "Attestation de réussite ou PV de soutenance", "Déclaration de perte (le cas échéant)", "Quittance de paiement"],
  "cert-validation": ["Pièce d'identité", "Relevés des semestres concernés"],
  "att-inscription": ["Quittance d'inscription", "Pièce d'identité"],
  autre: ["Pièce d'identité", "Lettre de motivation de la demande"],
};

/* ------------------------------ Actes ------------------------------- */

export function ActsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[1200px] px-4 pb-10 pt-12 sm:px-6">
        <Reveal y={16}>
          <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold">Catalogue officiel</p>
          <h1 className="font-display mt-3 text-[30px] font-bold leading-tight text-ink sm:text-[40px]">Actes académiques disponibles</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mut">
            Tous les actes délivrés par la scolarité de la FLASH, avec leurs tarifs officiels, délais indicatifs et pièces justificatives requises.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ACT_TYPES.map((a, i) => {
            const Icon = ACT_ICONS[a.icon] ?? FileCheck2;
            return (
              <Reveal key={a.id} delay={(i % 2) * 0.08}>
                <Card className="group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-royal/50 hover:shadow-xl hover:shadow-royal/8 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-royalsoft text-royal transition-colors duration-300 group-hover:bg-goldsoft group-hover:text-gold">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge tone="gold">{a.fee > 0 ? `${a.fee.toLocaleString("fr-FR")} FCFA` : "Sur devis"}</Badge>
                      <span className="flex items-center gap-1 text-[11.5px] font-semibold text-mut"><Clock className="h-3 w-3" /> {a.delay}</span>
                    </div>
                  </div>
                  <h2 className="font-display mt-4 text-lg font-bold text-ink">{a.name}</h2>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-mut">{a.desc}</p>
                  <div className="mt-4 rounded-lg border border-line bg-cardsoft/70 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Pièces requises</p>
                    <ul className="mt-2 space-y-1.5">
                      {(REQUIRED_DOCS[a.id] ?? REQUIRED_DOCS.autre).map((d) => (
                        <li key={d} className="flex items-start gap-2 text-[12.5px] font-medium text-inksoft">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" strokeWidth={3} /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to={`/demande?acte=${a.id}`} className="mt-5">
                    <Button variant="outline" className="w-full group/btn">
                      Demander cet acte <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </Card>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-2xl border border-line bg-card px-7 py-7 sm:flex-row sm:px-9">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-goldsoft text-gold"><Wallet className="h-6 w-6" /></span>
              <div>
                <p className="font-display text-base font-bold text-ink">Un doute sur l'acte à demander ?</p>
                <p className="text-[13.5px] text-mut">La scolarité vous oriente gratuitement, du lundi au vendredi.</p>
              </div>
            </div>
            <Link to="/contact"><Button>Contact & assistance</Button></Link>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------- FAQ -------------------------------- */

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const items = FAQ_ITEMS.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[820px] px-4 pb-10 pt-12 sm:px-6">
        <Reveal y={16}>
          <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold">Assistance</p>
          <h1 className="font-display mt-3 text-[30px] font-bold leading-tight text-ink sm:text-[40px]">Foire aux questions</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-mut">Tout ce qu'il faut savoir sur vos demandes d'actes académiques.</p>
        </Reveal>
        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mut" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une question…"
            aria-label="Rechercher une question"
            className="h-12 w-full rounded-lg border border-line bg-card pl-11 pr-4 text-sm text-ink placeholder:text-mut/70 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
          />
        </div>
        <div className="mt-6 space-y-3">
          {items.map((f, i) => {
            const open = openIdx === i;
            return (
              <Card key={f.q} className={cn("overflow-hidden transition-colors", open && "border-royal/50")}>
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left"
                >
                  <span className="font-display text-[15px] font-bold text-ink">{f.q}</span>
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300", open ? "rotate-180 border-royal bg-royal text-white" : "border-linestrong text-mut")}>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                      <p className="border-t border-line px-6 py-4 text-[14px] leading-relaxed text-inksoft">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
          {items.length === 0 && <p className="py-10 text-center text-sm text-mut">Aucune question ne correspond à « {q} ».</p>}
        </div>
        <Reveal>
          <div className="mt-12 rounded-2xl bg-navy px-7 py-8 text-center sm:px-10">
            <p className="font-display text-xl font-bold text-white">Vous n'avez pas trouvé votre réponse ?</p>
            <p className="mt-2 text-[13.5px] text-[#a9bade]">Le guichet unique de la scolarité vous répond sous 24 h ouvrées.</p>
            <Link to="/contact" className="mt-5 inline-block"><Button variant="gold">Contacter la scolarité</Button></Link>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}

/* ----------------------------- Contact ------------------------------ */

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "Demande d'information", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { push } = useToast();
  const submit = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Indiquez votre nom complet.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide.";
    if (form.message.trim().length < 15) e.message = "Votre message est trop court (15 caractères min.).";
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setSent(true);
      push("success", "Message envoyé", "La scolarité vous répondra sous 24 h ouvrées.");
    }
  };
  const infos = [
    { icon: MapPin, t: "Adresse", d: "Université de Parakou — Campus principal, BP 123, Parakou, République du Bénin" },
    { icon: Phone, t: "Téléphone", d: "(+229) 23 61 02 44 · (+229) 97 48 22 10" },
    { icon: Mail, t: "Email", d: "scolarite.flash@up.bj" },
    { icon: Clock, t: "Horaires du guichet", d: "Lundi – Vendredi : 8 h 00 – 16 h 00 · Samedi : 9 h 00 – 12 h 00" },
  ];
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[1100px] px-4 pb-10 pt-12 sm:px-6">
        <Reveal y={16}>
          <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold">Assistance</p>
          <h1 className="font-display mt-3 text-[30px] font-bold leading-tight text-ink sm:text-[40px]">Contacter la FLASH</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mut">Une question sur votre dossier, un paiement ou un acte ? Écrivez-nous ou passez au guichet unique.</p>
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {infos.map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06}>
                <Card className="flex gap-4 p-5 transition hover:border-royal/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-goldsoft text-gold"><c.icon className="h-5 w-5" /></span>
                  <div>
                    <p className="font-display text-[14px] font-bold text-ink">{c.t}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-mut">{c.d}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <div className="relative overflow-hidden rounded-xl border border-line bg-navy p-6">
                <MapPin className="absolute -right-4 -top-4 h-28 w-28 text-white/[0.06]" />
                <p className="font-display text-[14px] font-bold text-white">Localisation</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#a9bade]">
                  Guichet unique — Bâtiment de la scolarité de la FLASH, à 200 m de l'entrée principale du campus de l'Université de Parakou.
                </p>
                <Badge tone="gold" className="mt-3">Repère officiel communiqué par l'administration</Badge>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <Card className="p-6 sm:p-8">
              {sent ? (
                <div className="py-10 text-center">
                  <motion.svg viewBox="0 0 96 96" className="mx-auto h-20 w-20" aria-hidden>
                    <motion.circle cx="48" cy="48" r="42" fill="none" strokeWidth="5" className="stroke-ok" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                    <motion.path d="M30 50l13 13 24-28" fill="none" strokeWidth="6" className="stroke-ok" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.4 }} />
                  </motion.svg>
                  <h2 className="font-display mt-4 text-xl font-bold text-ink">Message bien reçu</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mut">Merci {form.name.split(" ")[0]}. Un accusé de réception a été envoyé à {form.email}.</p>
                  <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "Demande d'information", message: "" }); }}>
                    Envoyer un autre message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-lg font-bold text-ink">Formulaire de contact</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Nom complet" required error={errors.name}>
                      <Input value={form.name} invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom NOM" />
                    </Field>
                    <Field label="Email" required error={errors.email}>
                      <Input type="email" value={form.email} invalid={!!errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.bj" />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label="Sujet" required>
                      <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                        {["Demande d'information", "Problème avec ma demande", "Paiement", "Document délivré", "Autre"].map((s) => <option key={s}>{s}</option>)}
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label="Message" required error={errors.message}>
                      <Textarea value={form.message} invalid={!!errors.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre besoin en précisant votre numéro de suivi le cas échéant…" rows={5} />
                    </Field>
                  </div>
                  <Button size="lg" className="mt-6 w-full group" onClick={submit}>
                    <Send className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" /> Envoyer le message
                  </Button>
                </>
              )}
            </Card>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ---------------------------- Vérification -------------------------- */

export function VerifyPage() {
  const [params] = useSearchParams();
  const { applications } = useStore();
  const [code, setCode] = useState(params.get("ref") ?? params.get("code") ?? "");
  const [phase, setPhase] = useState<"idle" | "loading" | "found" | "none">("idle");
  const [found, setFound] = useState<Application | null>(null);

  const check = (raw: string) => {
    setPhase("loading");
    setFound(null);
    window.setTimeout(() => {
      const norm = raw.trim().toUpperCase();
      const app = applications.find((a) => a.ref.toUpperCase() === norm) || applications.find((a) => a.document && a.document.verifyCode.toUpperCase() === norm) || applications.find((a) => norm.length >= 6 && a.ref.toUpperCase().endsWith(norm));
      if (app && app.document) {
        setFound(app);
        setPhase("found");
      } else {
        setPhase("none");
      }
    }, 800);
  };

  useEffect(() => {
    const r = params.get("ref") ?? params.get("code");
    if (r) {
      setCode(r);
      check(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[720px] px-4 pb-10 pt-12 sm:px-6">
        <Reveal y={16}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-goldbright"><ShieldCheck className="h-5.5 w-5.5" /></span>
            <div>
              <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold">Contrôle officiel</p>
              <h1 className="font-display mt-1 text-[28px] font-bold leading-tight text-ink sm:text-[34px]">Vérification d'authenticité</h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-mut">
            Saisissez la référence du document ou scannez son QR Code. Seules les informations strictement nécessaires sont affichées.
          </p>
        </Reveal>

        <form
          className="mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) check(code);
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <ScanLine className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mut" aria-hidden />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="FLASH-2026-004417 ou FA-8K2L-9Q4T"
                aria-label="Référence ou code de vérification"
                className="h-12 w-full rounded-lg border border-line bg-card pl-11 pr-4 font-mono text-sm font-semibold text-ink placeholder:font-body placeholder:font-normal focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
              />
            </div>
            <Button size="lg" type="submit" disabled={!code.trim()}>Vérifier</Button>
          </div>
          <button type="button" onClick={() => { setCode("FA-8K2L-9Q4T"); check("FA-8K2L-9Q4T"); }} className="mt-3 rounded-full border border-dashed border-linestrong px-3.5 py-1.5 text-[12px] font-semibold text-mut transition hover:border-royal hover:text-royal">
            Tester avec un document de démonstration
          </button>
        </form>

        <div className="mt-8" aria-live="polite">
          {phase === "loading" && (
            <Card className="p-10 text-center">
              <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-royal border-t-transparent" />
              <p className="mt-4 text-sm font-bold text-ink">Interrogation du registre des actes…</p>
              <p className="mt-1 text-[12.5px] text-mut">Contrôle de la signature et du QR Code</p>
            </Card>
          )}

          {phase === "none" && (
            <Card className="border-bad/35 p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-badsoft text-bad"><ShieldAlert className="h-7 w-7" /></span>
              <h2 className="font-display mt-4 text-xl font-bold text-bad">Document non reconnu</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mut">
                Aucune correspondance dans le registre des actes de la FLASH. Ce document peut être falsifié : ne lui accordez aucune valeur et signalez-le à <span className="font-semibold text-ink">scolarite.flash@up.bj</span>.
              </p>
            </Card>
          )}

          {phase === "found" && found && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden border-ok/40">
                <div className="bg-oksoft/60 px-7 py-6 text-center">
                  <motion.svg viewBox="0 0 96 96" className="mx-auto h-16 w-16" aria-hidden>
                    <motion.circle cx="48" cy="48" r="42" fill="none" strokeWidth="5" className="stroke-ok" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                    <motion.path d="M30 50l13 13 24-28" fill="none" strokeWidth="6" className="stroke-ok" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.4 }} />
                  </motion.svg>
                  <p className="font-display mt-3 text-[13px] font-bold uppercase tracking-[0.2em] text-ok">Document authentique</p>
                  <h2 className="font-display mt-1 text-2xl font-bold text-ink">Document vérifié</h2>
                </div>
                <dl className="grid gap-x-8 gap-y-4 px-7 py-6 text-sm sm:grid-cols-2">
                  <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Référence</dt><dd className="mt-0.5 font-mono text-[14px] font-bold text-royal">{found.ref}</dd></div>
                  <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Nom</dt><dd className="mt-0.5 font-semibold text-ink">{found.studentName}</dd></div>
                  <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Type</dt><dd className="mt-0.5 font-semibold text-ink">{actById(found.actId).name}</dd></div>
                  <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Date de délivrance</dt><dd className="mt-0.5 font-semibold text-ink">{fmtDateLong(found.document!.issuedAt)}</dd></div>
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-cardsoft/60 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <QRSvg seed={"FLASHACTES|VERIFY|" + found.document!.verifyCode} size={52} />
                    <div>
                      <Badge tone="ok" className="px-3 py-1 text-[12px]">Statut : VALIDE</Badge>
                      <p className="mt-1 font-mono text-[11.5px] font-bold text-mut">{found.document!.verifyCode}</p>
                    </div>
                  </div>
                  <p className="max-w-[240px] text-[11.5px] leading-relaxed text-mut">
                    Vérification journalisée le {fmtDateTime(new Date().toISOString())}. Aucune donnée supplémentaire n'est exposée.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {phase === "idle" && (
            <Card className="border-dashed p-10 text-center">
              <UPSeal className="mx-auto h-16 w-16 text-linestrong" />
              <p className="font-display mt-4 text-base font-bold text-ink">En attente de vérification</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-mut">Employeurs, ambassades et universités partenaires : ce guichet est public et gratuit.</p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
