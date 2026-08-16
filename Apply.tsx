--- src/pages/Apply.tsx (原始)


+++ src/pages/Apply.tsx (修改后)
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, FileDown, FileText, Paperclip, ScanLine, Trash2, Upload, Wallet, X } from "lucide-react";
import { PublicHeader, Footer } from "../components/layout";
import { Badge, Button, Card, Field, Input, Select, StatusBadge, useToast } from "../components/ui";
import { Reveal } from "../components/widgets";
import { ACT_TYPES, ACADEMIC_YEARS, DEPARTMENTS, LEVELS, MOTIFS, actById } from "../lib/data";
import { useStore } from "../lib/store";
import type { NewApplicationInput } from "../lib/store";
import { receiptPdf } from "../lib/pdf";
import type { Application } from "../lib/types";
import { cn, downloadBlob, fmtDateTime, fmtFCFA, fmtSize, uid } from "../lib/utils";

const STEPS = ["Identification", "Parcours", "Acte", "Pièces", "Récapitulatif"];
const PAY_METHODS = [
  { id: "mtn-momo", label: "MTN Mobile Money", note: "MoMo" },
  { id: "moov-money", label: "Moov Money", note: "Flooz" },
  { id: "celtiis-cash", label: "Celtiis Cash", note: "Cash" },
];

interface UFile { id: string; name: string; size: number; progress: number }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Apply() {
  const [params] = useSearchParams();
  const { session, students, createApplication } = useStore();
  const { push } = useToast();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Application | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const rec = session?.matricule ? students.find((s) => s.matricule === session.matricule) : undefined;

  const [s1, setS1] = useState({ matricule: rec?.matricule ?? "", nom: rec ? rec.name.split(" ").slice(-1)[0] : "", prenoms: rec ? rec.name.split(" ").slice(0, -1).join(" ") : "", birthDate: "", phone: rec?.phone ?? "", email: rec?.email ?? "" });
  const [s2, setS2] = useState({ department: rec?.department && rec.department !== "—" ? rec.department : "", program: rec?.program && rec.program !== "—" ? rec.program : "", level: rec?.level && rec.level !== "—" ? rec.level : "", academicYear: ACADEMIC_YEARS[0], graduationYear: "—" });
  const [s3, setS3] = useState({ actId: params.get("acte") ?? "", copies: 1, motif: "", format: "Numerique (PDF)" as Application["format"] });
  const [files, setFiles] = useState<UFile[]>([]);
  const [payMethod, setPayMethod] = useState(PAY_METHODS[0].id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const act = s3.actId ? actById(s3.actId) : null;
  const dept = DEPARTMENTS.find((d) => d.name === s2.department);

  /* simulation de téléversement */
  useEffect(() => {
    if (!files.some((f) => f.progress < 100)) return;
    const t = window.setInterval(() => {
      setFiles((fs) => fs.map((f) => (f.progress < 100 ? { ...f, progress: Math.min(100, f.progress + 18 + Math.random() * 16) } : f)));
    }, 160);
    return () => window.clearInterval(t);
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: UFile[] = [];
    Array.from(list).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
        push("danger", "Format non accepté", `${f.name} — formats acceptés : PDF, JPG, JPEG, PNG.`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        push("danger", "Fichier trop volumineux", `${f.name} dépasse la limite de 5 Mo.`);
        return;
      }
      ok.push({ id: uid(), name: f.name, size: f.size, progress: 4 });
    });
    if (ok.length) setFiles((fs) => [...fs, ...ok]);
  };

  const validate = (i: number): boolean => {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!s1.matricule.trim()) e.matricule = "Le numéro matricule est requis.";
      else if (!/^UP-[A-Z]+-\d{4}-\d{3}$/i.test(s1.matricule.trim())) e.matricule = "Format attendu : UP-FLASH-2026-001.";
      if (!s1.nom.trim()) e.nom = "Le nom est requis.";
      if (!s1.prenoms.trim()) e.prenoms = "Les prénoms sont requis.";
      if (!s1.birthDate) e.birthDate = "La date de naissance est requise.";
      if (s1.phone.replace(/\D/g, "").length < 8) e.phone = "Numéro de téléphone invalide.";
      if (!EMAIL_RE.test(s1.email)) e.email = "Adresse email invalide.";
    }
    if (i === 1) {
      if (!s2.department) e.department = "Sélectionnez votre département.";
      if (!s2.program) e.program = "Sélectionnez votre filière.";
      if (!s2.level) e.level = "Sélectionnez votre niveau.";
      if (!s2.academicYear) e.academicYear = "Sélectionnez l'année académique.";
    }
    if (i === 2) {
      if (!s3.actId) e.actId = "Choisissez le type d'acte.";
      if (s3.copies < 1 || s3.copies > 10) e.copies = "Entre 1 et 10 exemplaires.";
      if (!s3.motif) e.motif = "Indiquez le motif de la demande.";
    }
    if (i === 3 && files.length === 0) e.files = "Ajoutez au moins une pièce justificative.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((v) => Math.min(4, v + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = () => {
    setStep((v) => Math.max(0, v - 1));
    setErrors({});
  };

  const confirm = () => {
    if (!act) return;
    setSubmitting(true);
    window.setTimeout(() => {
      const input: NewApplicationInput = {
        studentName: `${s1.prenoms.trim()} ${s1.nom.trim().toUpperCase()}`,
        matricule: s1.matricule.trim().toUpperCase(),
        email: s1.email.trim(),
        phone: s1.phone.trim(),
        birthDate: s1.birthDate,
        department: s2.department,
        program: s2.program,
        level: s2.level,
        academicYear: s2.academicYear,
        graduationYear: s2.graduationYear,
        actId: s3.actId,
        copies: s3.copies,
        motif: s3.motif,
        format: s3.format,
        files: files.map((f) => ({ id: f.id, name: f.name, size: f.size })),
        payMethod: PAY_METHODS.find((p) => p.id === payMethod)?.label ?? payMethod,
        provider: payMethod,
      };
      const app = createApplication(input);
      setDone(app);
      setSubmitting(false);
      push("success", "Demande enregistrée", `Votre référence est ${app.ref}.`);
      window.scrollTo({ top: 0 });
    }, 900);
  };

  const copyRef = async () => {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done.ref);
      push("success", "Référence copiée", done.ref);
    } catch {
      push("warning", "Copie impossible", "Sélectionnez et copiez la référence manuellement.");
    }
  };

  /* ------------------------- écran de succès ------------------------ */
  if (done) {
    return (
      <div className="min-h-screen bg-bg">
        <PublicHeader />
        <main className="mx-auto max-w-[760px] px-4 pb-10 pt-14 sm:px-6">
          <div className="text-center">
            <motion.svg viewBox="0 0 96 96" className="mx-auto h-24 w-24" aria-hidden>
              <motion.circle cx="48" cy="48" r="42" fill="none" strokeWidth="5" className="stroke-ok" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: "easeOut" }} />
              <motion.path d="M30 50l13 13 24-28" fill="none" strokeWidth="6" className="stroke-ok" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55, duration: 0.45, ease: "easeOut" }} />
            </motion.svg>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-display mt-5 text-[30px] font-bold text-ink sm:text-4xl">
              Demande enregistrée
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-mut">
              Votre demande a été enregistrée avec succès et transmise à la scolarité de la FLASH. Conservez précieusement votre numéro de suivi : il vous permettra de suivre votre dossier et de récupérer votre document.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <Card className="mt-9 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-cardsoft/70 px-6 py-5 sm:px-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mut">Votre référence</p>
                  <p className="font-mono mt-1 text-[22px] font-bold tracking-wide text-royal sm:text-2xl">{done.ref}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyRef}><Copy className="h-3.5 w-3.5" /> Copier</Button>
                  <StatusBadge status={done.status} />
                </div>
              </div>
              <dl className="grid gap-x-8 gap-y-4 px-6 py-6 text-sm sm:grid-cols-2 sm:px-8">
                <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Date de la demande</dt><dd className="mt-0.5 font-semibold text-ink">{fmtDateTime(done.createdAt)}</dd></div>
                <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Type d'acte</dt><dd className="mt-0.5 font-semibold text-ink">{actById(done.actId).name}</dd></div>
                <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Étudiant(e)</dt><dd className="mt-0.5 font-semibold text-ink">{done.studentName} · {done.matricule}</dd></div>
                <div><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Paiement</dt><dd className="mt-0.5 font-semibold text-ink">{fmtFCFA(done.payment.amount)} · {done.payment.method} <Badge tone="ok" className="ml-1">Simulé</Badge></dd></div>
              </dl>
              <div className="flex flex-col gap-3 border-t border-line bg-cardsoft/50 px-6 py-5 sm:flex-row sm:px-8">
                <Button onClick={() => downloadBlob(`recu_${done.ref}.pdf`, receiptPdf(done))} className="group flex-1">
                  <FileDown className="h-4.5 w-4.5" /> Télécharger le reçu (PDF)
                </Button>
                <Link to={`/suivi?ref=${done.ref}`} className="flex-1">
                  <Button variant="outline" className="w-full"><ScanLine className="h-4.5 w-4.5" /> Suivre ma demande</Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 rounded-xl border border-info/25 bg-infosoft px-6 py-5">
            <p className="text-sm font-bold text-info">Et maintenant ?</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-inksoft">
              Le service de scolarité vérifie votre dossier (généralement sous 48 h ouvrées). Vous recevrez une notification à chaque changement d'état, et pourrez télécharger votre document dès qu'il sera disponible.
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------------------------- formulaire -------------------------- */

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[820px] px-4 pb-10 pt-12 sm:px-6">
        <Reveal y={16}>
          <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold">Nouvelle demande</p>
          <h1 className="font-display mt-3 text-[30px] font-bold leading-tight text-ink sm:text-[38px]">Demandez votre acte en 5 étapes</h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-mut">Comptez environ 10 minutes. Vos informations sont transmises uniquement au service de scolarité de la FLASH.</p>
        </Reveal>

        {/* progression */}
        <div className="mt-9">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-[13px] font-bold text-royal">Étape {step + 1} / 5 — {STEPS[step]}</p>
            <p className="text-[12px] font-semibold text-mut">{Math.round(((step + 1) / 5) * 100)} %</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-cardsoft">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-royal to-goldbright" animate={{ width: `${((step + 1) / 5) * 100}%` }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <ol className="mt-4 hidden grid-cols-5 gap-2 sm:grid" aria-hidden>
            {STEPS.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-2 text-[12px] font-bold", i < step ? "text-ok" : i === step ? "text-royal" : "text-mut/70")}>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]", i < step ? "border-ok bg-ok text-white" : i === step ? "border-royal bg-royal text-white" : "border-linestrong bg-card")}>
                  {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <Card className="mt-7 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="px-6 py-7 sm:px-9 sm:py-9">
              {step === 0 && (
                <fieldset>
                  <legend className="font-display mb-6 text-lg font-bold text-ink">1 · Identification</legend>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="Numéro matricule" required error={errors.matricule} hint="Format : UP-FLASH-2026-001">
                        <Input value={s1.matricule} invalid={!!errors.matricule} onChange={(e) => setS1({ ...s1, matricule: e.target.value })} placeholder="UP-FLASH-2026-001" autoComplete="off" />
                      </Field>
                    </div>
                    <Field label="Nom" required error={errors.nom}>
                      <Input value={s1.nom} invalid={!!errors.nom} onChange={(e) => setS1({ ...s1, nom: e.target.value })} placeholder="TCHALOKO" />
                    </Field>
                    <Field label="Prénoms" required error={errors.prenoms}>
                      <Input value={s1.prenoms} invalid={!!errors.prenoms} onChange={(e) => setS1({ ...s1, prenoms: e.target.value })} placeholder="Emmanuel" />
                    </Field>
                    <Field label="Date de naissance" required error={errors.birthDate}>
                      <Input type="date" value={s1.birthDate} invalid={!!errors.birthDate} onChange={(e) => setS1({ ...s1, birthDate: e.target.value })} />
                    </Field>
                    <Field label="Téléphone" required error={errors.phone}>
                      <Input type="tel" value={s1.phone} invalid={!!errors.phone} onChange={(e) => setS1({ ...s1, phone: e.target.value })} placeholder="+229 97 00 00 00" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Email" required error={errors.email} hint="Les notifications y seront envoyées">
                        <Input type="email" value={s1.email} invalid={!!errors.email} onChange={(e) => setS1({ ...s1, email: e.target.value })} placeholder="prenom.nom@flash.up.bj" />
                      </Field>
                    </div>
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <fieldset>
                  <legend className="font-display mb-6 text-lg font-bold text-ink">2 · Parcours académique</legend>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Département" required error={errors.department}>
                      <Select value={s2.department} invalid={!!errors.department} onChange={(e) => setS2({ ...s2, department: e.target.value, program: "" })}>
                        <option value="">— Sélectionner —</option>
                        {DEPARTMENTS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Filière" required error={errors.program}>
                      <Select value={s2.program} invalid={!!errors.program} disabled={!dept} onChange={(e) => setS2({ ...s2, program: e.target.value })}>
                        <option value="">{dept ? "— Sélectionner —" : "Choisissez d'abord le département"}</option>
                        {dept?.programs.map((p) => <option key={p} value={p}>{p}</option>)}
                      </Select>
                    </Field>
                    <Field label="Niveau" required error={errors.level}>
                      <Select value={s2.level} invalid={!!errors.level} onChange={(e) => setS2({ ...s2, level: e.target.value })}>
                        <option value="">— Sélectionner —</option>
                        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </Select>
                    </Field>
                    <Field label="Année académique" required error={errors.academicYear}>
                      <Select value={s2.academicYear} onChange={(e) => setS2({ ...s2, academicYear: e.target.value })}>
                        {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </Select>
                    </Field>
                    <Field label="Année d'obtention" hint="Si déjà diplômé(e)">
                      <Select value={s2.graduationYear} onChange={(e) => setS2({ ...s2, graduationYear: e.target.value })}>
                        {["—", "2025", "2024", "2023", "2022", "2021", "2020"].map((y) => <option key={y} value={y}>{y}</option>)}
                      </Select>
                    </Field>
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="font-display mb-6 text-lg font-bold text-ink">3 · Acte demandé</legend>
                  <Field label="Type d'acte" required error={errors.actId}>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {ACT_TYPES.map((a) => (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => setS3({ ...s3, actId: a.id })}
                          aria-pressed={s3.actId === a.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-all",
                            s3.actId === a.id ? "border-royal bg-royalsoft text-royal shadow-sm" : "border-line bg-card text-inksoft hover:border-linestrong hover:bg-cardsoft"
                          )}
                        >
                          <span>{a.name}</span>
                          <span className={cn("shrink-0 text-[11.5px] font-bold", s3.actId === a.id ? "text-royal" : "text-mut")}>{a.fee > 0 ? fmtFCFA(a.fee) : "Devis"}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <Field label="Nombre d'exemplaires" required error={errors.copies}>
                      <Input type="number" min={1} max={10} value={s3.copies} invalid={!!errors.copies} onChange={(e) => setS3({ ...s3, copies: Number(e.target.value) })} />
                    </Field>
                    <Field label="Motif" required error={errors.motif}>
                      <Select value={s3.motif} invalid={!!errors.motif} onChange={(e) => setS3({ ...s3, motif: e.target.value })}>
                        <option value="">— Sélectionner —</option>
                        {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </Select>
                    </Field>
                    <Field label="Format souhaité" required>
                      <Select value={s3.format} onChange={(e) => setS3({ ...s3, format: e.target.value as Application["format"] })}>
                        <option value="Numerique (PDF)">Numérique (PDF)</option>
                        <option value="Papier">Papier (retrait au guichet)</option>
                        <option value="Papier + Numerique">Papier + Numérique</option>
                      </Select>
                    </Field>
                  </div>
                  {act && (
                    <p className="mt-6 rounded-lg border border-gold/30 bg-goldsoft px-4 py-3 text-[13px] font-semibold text-gold">
                      Frais de dossier : {act.fee > 0 ? fmtFCFA(act.fee) : "établis sur devis"} · Délai indicatif : {act.delay}
                    </p>
                  )}
                </fieldset>
              )}

              {step === 3 && (
                <fieldset>
                  <legend className="font-display mb-6 text-lg font-bold text-ink">4 · Pièces justificatives</legend>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all",
                      dragging ? "border-royal bg-royalsoft/60 scale-[1.01]" : errors.files ? "border-bad/60 bg-badsoft/40" : "border-linestrong bg-cardsoft/60 hover:border-royal/60"
                    )}
                  >
                    <span className={cn("flex h-13 w-13 items-center justify-center rounded-full p-3.5", dragging ? "bg-royal text-white" : "bg-royalsoft text-royal")}>
                      <Upload className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-sm font-bold text-ink">Glissez-déposez vos fichiers ici</p>
                    <p className="mt-1 text-[12.5px] text-mut">PDF, JPG, JPEG ou PNG · 5 Mo maximum par fichier</p>
                    <Button type="button" variant="outline" size="sm" className="mt-5" onClick={() => fileInput.current?.click()}>
                      <Paperclip className="h-3.5 w-3.5" /> Parcourir mes fichiers
                    </Button>
                    <input ref={fileInput} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="sr-only" aria-label="Sélectionner des fichiers" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                  </div>
                  {errors.files && <p role="alert" className="mt-2 text-xs font-medium text-bad">{errors.files}</p>}

                  {files.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                      {files.map((f) => (
                        <li key={f.id} className="flex items-center gap-3.5 rounded-lg border border-line bg-card px-4 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royalsoft text-royal"><FileText className="h-4.5 w-4.5" /></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="truncate text-[13px] font-bold text-ink">{f.name}</p>
                              <p className="shrink-0 text-[11.5px] font-semibold text-mut">{fmtSize(f.size)}</p>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cardsoft">
                              <div className={cn("h-full rounded-full transition-all duration-200", f.progress >= 100 ? "bg-ok" : "bg-royal")} style={{ width: `${f.progress}%` }} />
                            </div>
                          </div>
                          {f.progress >= 100 ? (
                            <Check className="h-4.5 w-4.5 shrink-0 text-ok" strokeWidth={3} />
                          ) : (
                            <span className="text-[11px] font-bold text-royal">{Math.round(f.progress)} %</span>
                          )}
                          <button type="button" onClick={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))} className="rounded-lg p-1.5 text-mut transition hover:bg-badsoft hover:text-bad" aria-label={`Supprimer ${f.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </fieldset>
              )}

              {step === 4 && (
                <fieldset>
                  <legend className="font-display mb-6 text-lg font-bold text-ink">5 · Récapitulatif & paiement</legend>
                  <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-line bg-cardsoft/60 px-5 py-5 text-sm sm:grid-cols-2">
                    {[
                      ["Étudiant(e)", `${s1.prenoms} ${s1.nom.toUpperCase()}`],
                      ["Matricule", s1.matricule.toUpperCase()],
                      ["Contact", `${s1.phone} · ${s1.email}`],
                      ["Parcours", `${s2.program} — ${s2.level}`],
                      ["Acte demandé", act?.name ?? "—"],
                      ["Exemplaires / Motif", `${s3.copies} · ${s3.motif}`],
                      ["Format", s3.format],
                      ["Pièces fournies", `${files.length} fichier${files.length > 1 ? "s" : ""}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">{k}</dt>
                        <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="font-display mt-7 mb-3 text-sm font-bold text-ink">Moyen de paiement</p>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {PAY_METHODS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPayMethod(p.id)}
                        aria-pressed={payMethod === p.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                          payMethod === p.id ? "border-royal bg-royalsoft shadow-sm" : "border-line bg-card hover:border-linestrong"
                        )}
                      >
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", payMethod === p.id ? "bg-royal text-white" : "bg-cardsoft text-mut")}><Wallet className="h-4 w-4" /></span>
                        <span>
                          <span className="block text-[13px] font-bold text-ink">{p.label}</span>
                          <span className="block text-[11px] font-semibold text-mut">{p.note}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/35 bg-goldsoft px-5 py-4">
                    <p className="text-sm font-bold text-gold">Montant à régler : {act && act.fee > 0 ? fmtFCFA(act.fee) : "Selon devis"}</p>
                    <Badge tone="gold">Paiement simulé — aucun débit réel (démo)</Badge>
                  </div>
                </fieldset>
              )}

              {/* navigation */}
              <div className="mt-9 flex items-center justify-between gap-3 border-t border-line pt-6">
                <Button variant="ghost" onClick={prev} disabled={step === 0}>
                  <ArrowLeft className="h-4 w-4" /> Précédent
                </Button>
                {step < 4 ? (
                  <Button onClick={next} className="group">
                    Continuer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button variant="ok" size="lg" onClick={confirm} disabled={submitting} className="group min-w-[220px]">
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Enregistrement…
                      </>
                    ) : (
                      <>Confirmer ma demande <Check className="h-4.5 w-4.5" strokeWidth={3} /></>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>

        <p className="mt-6 text-center text-[12.5px] text-mut">
          Déjà une référence ? <Link to="/suivi" className="font-bold text-royal hover:underline">Suivez votre demande</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
