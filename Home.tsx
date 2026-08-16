--- src/pages/Home.tsx (原始)


+++ src/pages/Home.tsx (修改后)
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Clock, FileCheck2, GraduationCap, QrCode, ScanLine, Search, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicHeader, Footer } from "../components/layout";
import { Button, Card, SectionHead } from "../components/ui";
import { Counter, DocumentPreview, LogoMark, QRSvg, Reveal, Ticker, TrackTimeline, UPSeal } from "../components/widgets";
import { ACT_TYPES, FAQ_ITEMS } from "../lib/data";
import { useStore } from "../lib/store";
import { cn, fmtFCFA } from "../lib/utils";

export const ACT_ICONS: Record<string, LucideIcon> = {
  award: FileCheck2,
  grad: GraduationCap,
  list: BadgeCheck,
  medal: ShieldCheck,
  scroll: GraduationCap,
  badge: BadgeCheck,
  card: FileCheck2,
  doc: FileCheck2,
};

function Hero() {
  const demoApp = useStore().applications.find((a) => a.ref === "FLASH-2026-004582");
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(720px_480px_at_70%_20%,black,transparent)]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
        <div>
          <Reveal y={16}>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-goldsoft px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold">
              <LogoMark className="h-4.5 w-4.5" /> Université de Parakou · FLASH
            </p>
          </Reveal>
          <h1 className="font-display mt-6 text-[clamp(34px,5.2vw,56px)] font-bold leading-[1.06] tracking-tight text-ink">
            <span className="mask-line"><span>Vos actes académiques,</span></span>
            <span className="mask-line"><span style={{ animationDelay: "0.12s" }}>désormais accessibles</span></span>
            <span className="mask-line">
              <span style={{ animationDelay: "0.24s" }}>
                <em className="not-italic text-royal underline decoration-goldbright decoration-[3px] underline-offset-[7px]">en ligne.</em>
              </span>
            </span>
          </h1>
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-mut">
              Effectuez vos demandes d'attestations, relevés, certificats et autres documents académiques depuis votre téléphone ou votre ordinateur, sans déplacements inutiles.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link to="/demande">
                <Button size="lg" className="group">
                  Faire une demande
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/suivi">
                <Button size="lg" variant="outline">Suivre ma demande</Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.5}>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[13px] font-semibold text-inksoft">
              <li className="flex items-center gap-2"><QrCode className="h-4 w-4 text-gold" /> QR Code d'authenticité</li>
              <li className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-gold" /> Suivi en temps réel</li>
              <li className="flex items-center gap-2"><Wallet className="h-4 w-4 text-gold" /> Paiement Mobile Money</li>
            </ul>
          </Reveal>
        </div>

        {/* Composition vivante */}
        <div className="relative mx-auto w-full max-w-[520px] pb-10 pt-6 lg:pb-14" aria-hidden>
          <Reveal delay={0.25} y={34}>
            <div className="relative z-10 rotate-[1.5deg] transition-transform duration-500 hover:rotate-0">
              {demoApp ? <DocumentPreview app={demoApp} /> : <Card className="p-8"><div className="skeleton h-64" /></Card>}
            </div>
          </Reveal>
          <Reveal delay={0.5} y={20}>
            <div className="animate-floaty absolute -left-3 top-2 z-20 w-[220px] rounded-xl border border-line bg-card p-4 shadow-xl shadow-navy/10 sm:-left-8">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mut">Suivi du dossier</p>
              <ul className="mt-3 space-y-2.5">
                {["Demande soumise", "Dossier reçu", "Vérification"].map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5 text-[12.5px] font-semibold text-inksoft">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", i < 2 ? "bg-ok text-white" : "pulse-dot bg-royalsoft text-royal")}>
                      {i < 2 ? <FileCheck2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-royal" />}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.65} y={20}>
            <div className="animate-floaty-slow absolute -right-2 bottom-0 z-20 flex items-center gap-3 rounded-xl border border-line bg-card p-3.5 pr-5 shadow-xl shadow-navy/10 sm:-right-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oksoft text-ok"><FileCheck2 className="h-5 w-5" /></span>
              <span>
                <span className="block text-[12.5px] font-bold text-ink">Document disponible</span>
                <span className="block text-[11px] text-mut">Certificat de scolarité · PDF signé</span>
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { to: 1000, prefix: "+", suffix: "", label: "Demandes traitées" },
    { to: 98, prefix: "", suffix: " %", label: "Dossiers traités" },
    { to: 24, prefix: "", suffix: "/7", label: "Accès à la plateforme" },
    { to: 100, prefix: "", suffix: " %", label: "Suivi numérique" },
  ];
  return (
    <section className="relative overflow-hidden bg-navy py-14">
      <UPSeal className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rotate-12 text-white/[0.045]" />
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-10 px-4 sm:px-6 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="relative pl-5">
            <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-gradient-to-b from-goldbright to-royal" aria-hidden />
            <p className="font-display text-4xl font-bold tracking-tight text-white sm:text-[44px]">
              <Counter to={s.to} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8fa2c8]">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { n: "01", title: "Demandez", desc: "Choisissez votre acte et remplissez le formulaire.", icon: FileCheck2 },
    { n: "02", title: "Vérifiez", desc: "Ajoutez les informations et pièces nécessaires.", icon: ShieldCheck },
    { n: "03", title: "Suivez", desc: "Recevez un code et consultez l'évolution de votre dossier.", icon: ScanLine },
    { n: "04", title: "Recevez", desc: "Téléchargez votre document lorsqu'il est disponible.", icon: GraduationCap },
  ];
  return (
    <section id="process" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead center eyebrow="Comment ça marche ?" title={<>Un parcours simple, en <span className="text-royal">4 étapes</span></>} sub="De la demande au téléchargement, tout est pensé pour vous faire gagner du temps — et éviter les files d'attente au guichet." />
        <div className="relative grid gap-8 md:grid-cols-4 md:gap-6">
          <span className="absolute left-[12%] right-[12%] top-[46px] hidden h-px bg-linestrong md:block" aria-hidden />
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.n} delay={i * 0.12}>
                <div className="group relative text-center md:px-2">
                  <div className="relative z-10 mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-full border border-line bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-goldbright group-hover:shadow-lg group-hover:shadow-gold/15">
                    <Icon className="h-8 w-8 text-royal transition-colors group-hover:text-gold" />
                    <span className="font-display absolute -right-1 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-goldbright">{s.n}</span>
                  </div>
                  <h3 className="font-display mt-5 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-[220px] text-[13.5px] leading-relaxed text-mut">{s.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Acts() {
  return (
    <section id="actes" className="scroll-mt-24 bg-cardsoft/60 py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="Catalogue officiel" title={<>Actes <span className="text-royal">disponibles</span></>} sub="Chaque acte a un tarif officiel et un délai indicatif de traitement, affichés en toute transparence avant votre confirmation." />
          <Link to="/actes" className="mb-10 hidden items-center gap-2 text-sm font-bold text-royal transition hover:gap-3 sm:flex">
            Voir tous les détails <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACT_TYPES.map((a, i) => {
            const Icon = ACT_ICONS[a.icon] ?? FileCheck2;
            return (
              <Reveal key={a.id} delay={(i % 4) * 0.08}>
                <Link
                  to={`/demande?acte=${a.id}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgb(10_20_40/0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-royal/50 hover:shadow-xl hover:shadow-royal/10"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-royalsoft text-royal transition-colors duration-300 group-hover:bg-goldsoft group-hover:text-gold">
                      <Icon className="h-5.5 w-5.5" />
                    </span>
                    <span className="rounded-full bg-cardsoft px-2.5 py-1 text-[11px] font-bold text-mut">{a.fee > 0 ? fmtFCFA(a.fee) : "Sur devis"}</span>
                  </div>
                  <h3 className="font-display mt-4 text-[15.5px] font-bold leading-snug text-ink">{a.name}</h3>
                  <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-mut">{a.desc}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-mut">
                    <Clock className="h-3.5 w-3.5 text-gold" /> {a.delay}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-royal transition-all group-hover:gap-2.5">
                    Demander cet acte <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrackWidget() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const demo = useStore().applications.find((a) => a.ref === "FLASH-2026-004582");
  return (
    <section id="suivi-home" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div>
            <SectionHead eyebrow="Suivi en temps réel" title={<>Où en est votre <span className="text-royal">demande</span> ?</>} sub="Saisissez le numéro de suivi reçu lors de votre demande : chaque étape est datée, horodatée et associée à l'agent responsable." />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/suivi${code.trim() ? `?ref=${encodeURIComponent(code.trim())}` : ""}`);
              }}
              className="flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="track-home" className="sr-only">Entrez votre code de suivi</label>
              <input
                id="track-home"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="FLASH-2026-004582"
                className="h-12 flex-1 rounded-lg border border-line bg-card px-4 font-mono text-sm font-semibold tracking-wide text-ink placeholder:font-body placeholder:font-normal placeholder:tracking-normal focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
              />
              <Button size="lg" type="submit" className="group">
                Suivre ma demande <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
            <button onClick={() => setCode("FLASH-2026-004582")} className="mt-4 rounded-full border border-dashed border-linestrong px-3.5 py-1.5 text-[12px] font-semibold text-mut transition hover:border-royal hover:text-royal">
              Essayer avec le code de démonstration : FLASH-2026-004582
            </button>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <Card className="p-6 sm:p-8">
            {demo && (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mut">Dossier</p>
                    <p className="font-mono text-[15px] font-bold text-royal">{demo.ref}</p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-warnsoft px-3 py-1 text-[11.5px] font-bold text-warn">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-warn" /> En vérification
                  </span>
                </div>
                <TrackTimeline app={demo} compact />
              </>
            )}
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function Authenticity() {
  return (
    <section className="relative overflow-hidden bg-navy py-20 sm:py-24">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-[0.16] [mask-image:radial-gradient(600px_400px_at_20%_30%,black,transparent)]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div className="mx-auto w-fit rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <QRSvg seed="FLASHACTES|VERIFY|FA-8K2L-9Q4T" size={168} light="#fdfdfb" className="mx-auto rounded-lg shadow-2xl" />
            <p className="font-mono mt-5 text-[13px] font-bold tracking-wide text-goldbright">FA-8K2L-9Q4T</p>
            <p className="mt-1 text-[11.5px] text-[#8fa2c8]">Chaque document porte un code unique</p>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div>
            <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-goldbright">Authenticité garantie</p>
            <h2 className="font-display mt-3 text-[26px] font-bold leading-tight text-white sm:text-4xl">
              Chaque document est <span className="text-goldbright">vérifiable</span>, par quiconque, à tout moment.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#a9bade]">
              Les actes délivrés via FLASH ACTES embarquent un QR Code et un numéro unique de vérification. Un employeur, une ambassade ou une université peut confirmer leur authenticité en quelques secondes — sans exposer vos données personnelles.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                { icon: QrCode, t: "QR Code infalsifiable", d: "Généré à la délivrance, lié à la référence du dossier." },
                { icon: Smartphone, t: "Vérification mobile", d: "Un simple scan renvoie vers la page officielle de contrôle." },
                { icon: ShieldCheck, t: "Données minimales exposées", d: "Nom, type d'acte et statut uniquement — rien d'autre." },
              ].map((f) => (
                <li key={f.t} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-goldbright/15 text-goldbright"><f.icon className="h-4.5 w-4.5" /></span>
                  <span>
                    <span className="block text-[14.5px] font-bold text-white">{f.t}</span>
                    <span className="block text-[13px] text-[#8fa2c8]">{f.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/verify" className="mt-8 inline-block">
              <Button variant="gold" size="lg" className="group">
                Vérifier un document <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FaqTeaser() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead center eyebrow="Besoin d'aide ?" title={<>Questions <span className="text-royal">fréquentes</span></>} />
        <div className="grid gap-4 md:grid-cols-3">
          {FAQ_ITEMS.slice(0, 3).map((f, i) => (
            <Reveal key={f.q} delay={i * 0.08}>
              <Link to="/faq" className="group block h-full rounded-xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-royal/50 hover:shadow-lg hover:shadow-royal/8">
                <span className="font-display text-[13px] font-bold text-gold">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display mt-2 text-[15px] font-bold leading-snug text-ink">{f.q}</h3>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-mut">{f.a}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-royal transition-all group-hover:gap-2.5">Lire la réponse <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/faq"><Button variant="outline">Toutes les questions <Search className="ml-1.5 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="pb-4 pt-2">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-navy px-8 py-12 text-center sm:px-14 sm:py-16">
            <UPSeal className="animate-spin-slow pointer-events-none absolute -left-14 -top-14 h-56 w-56 text-white/[0.05]" />
            <UPSeal className="animate-spin-slow pointer-events-none absolute -bottom-16 -right-12 h-64 w-64 text-goldbright/[0.07]" />
            <h2 className="font-display relative mx-auto max-w-2xl text-[26px] font-bold leading-tight text-white sm:text-4xl">
              Prêt à obtenir votre prochain acte académique <span className="text-goldbright">sans vous déplacer</span> ?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#a9bade]">
              Déposez votre demande en moins de 10 minutes et recevez votre numéro de suivi immédiatement.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3.5">
              <Link to="/demande"><Button variant="gold" size="lg" className="group">Faire une demande <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" /></Button></Link>
              <Link to="/auth"><Button variant="outline" size="lg" className="border-white/25 bg-transparent text-white hover:border-goldbright hover:text-goldbright">Créer mon compte</Button></Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const apps = useStore().applications;
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main>
        <Hero />
        <Ticker apps={apps} />
        <Stats />
        <Process />
        <Acts />
        <TrackWidget />
        <Authenticity />
        <FaqTeaser />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
