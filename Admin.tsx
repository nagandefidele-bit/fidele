--- src/pages/Admin.tsx (原始)


+++ src/pages/Admin.tsx (修改后)
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, ArrowUpDown, BarChart3, BellRing, Check, CheckCheck, Download, FileDown, FileText, FolderOpen,
  History, Inbox, LayoutDashboard, MessageSquare, Paperclip, QrCode, Search, Send, Settings, ShieldCheck, UserCog, Users, Wallet, X,
} from "lucide-react";
import { DashboardShell } from "../components/layout";
import type { DashNavItem } from "../components/layout";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Pagination, Select, StatusBadge, Textarea, useToast } from "../components/ui";
import { DonutChart, HBars, MonthBars, TrackTimeline } from "../components/widgets";
import { useStore } from "../lib/store";
import { ACT_TYPES, MONTHLY_APPS, actById, DEPARTMENTS } from "../lib/data";
import { receiptPdf } from "../lib/pdf";
import type { AppStatus, Application } from "../lib/types";
import { STATUS_META, cn, downloadBlob, exportCSV, fmtDate, fmtDateTime, fmtFCFA, nextStatuses, timeAgo } from "../lib/utils";

const NAV: DashNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard />, end: true, section: "Pilotage" },
  { to: "/admin/demandes", label: "Demandes", icon: <FolderOpen />, section: "Pilotage" },
  { to: "/admin/statistiques", label: "Statistiques", icon: <BarChart3 />, section: "Pilotage" },
  { to: "/admin/journal", label: "Journal d'activité", icon: <History />, section: "Pilotage" },
  { to: "/admin/etudiants", label: "Étudiants", icon: <Users />, section: "Gestion" },
  { to: "/admin/documents", label: "Documents", icon: <FileText />, section: "Gestion" },
  { to: "/admin/paiements", label: "Paiements", icon: <Wallet />, section: "Gestion" },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: <UserCog />, section: "Gestion" },
  { to: "/admin/notifications", label: "Notifications", icon: <BellRing />, section: "Communication" },
  { to: "/admin/parametres", label: "Paramètres", icon: <Settings />, section: "Communication" },
];

const ROLE_LABEL: Record<string, string> = { STUDENT: "Étudiant", AGENT: "Agent", SUPERVISOR: "Superviseur", ADMIN: "Administrateur" };

/* ------------------------------ Dashboard --------------------------- */

function DashAdmin() {
  const { applications, logs } = useStore();
  const latestDay = applications.reduce((m, a) => (a.createdAt > m ? a.createdAt : m), "");
  const today = latestDay.slice(0, 10);
  const kpis = [
    { label: "Demandes aujourd'hui", v: applications.filter((a) => a.createdAt.slice(0, 10) === today).length, tone: "bg-royalsoft text-royal", icon: <FolderOpen className="h-4 w-4" /> },
    { label: "En attente", v: applications.filter((a) => ["SUBMITTED", "RECEIVED", "UNDER_REVIEW"].includes(a.status)).length, tone: "bg-warnsoft text-warn", icon: <History className="h-4 w-4" /> },
    { label: "Traitées", v: applications.filter((a) => ["APPROVED", "DOCUMENT_READY", "COMPLETED"].includes(a.status)).length, tone: "bg-oksoft text-ok", icon: <CheckCheck className="h-4 w-4" /> },
    { label: "Rejetées", v: applications.filter((a) => a.status === "REJECTED").length, tone: "bg-badsoft text-bad", icon: <X className="h-4 w-4" /> },
  ];
  const byAct = ACT_TYPES.map((t) => ({ label: t.name, value: applications.filter((a) => a.actId === t.id).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const byDept = DEPARTMENTS.map((d) => ({ label: d.name, value: applications.filter((a) => a.department === d.name).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-ink">Vue d'ensemble</h1>
          <p className="mt-1 text-sm text-mut">Activité de la scolarité — données de démonstration.</p>
        </div>
        <Link to="/admin/demandes"><Button variant="outline" size="sm">Ouvrir la file des demandes <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-royal/8">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-mut">{k.label}</p>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", k.tone)}>{k.icon}</span>
            </div>
            <p className="font-display mt-2 text-[32px] font-bold leading-none text-ink">{k.v}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">Demandes par mois</h2>
            <Badge tone="royal">12 derniers mois</Badge>
          </div>
          <MonthBars data={MONTHLY_APPS} />
        </Card>
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-bold text-ink">Actes les plus demandés</h2>
          <DonutChart items={byAct} centerLabel="demandes" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-bold text-ink">Demandes par département</h2>
          <HBars items={byDept} />
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-base font-bold text-ink">Dernière activité</h2>
            <Link to="/admin/journal" className="text-[12.5px] font-bold text-royal hover:underline">Journal complet</Link>
          </div>
          <ul className="divide-y divide-line/60">
            {logs.slice(0, 6).map((l) => (
              <li key={l.id} className="flex items-center gap-4 px-6 py-3.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-goldbright" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{l.action} <span className="font-mono text-[12px] font-bold text-royal">{l.target}</span></p>
                  <p className="text-[11.5px] text-mut">{l.actor} · {timeAgo(l.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------- Liste demandes ------------------------- */

const PAGE_SIZE = 6;

function RequestsList() {
  const { applications } = useStore();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fAct, setFAct] = useState("all");
  const [fDept, setFDept] = useState("all");
  const [fAgent, setFAgent] = useState("all");
  const [fDate, setFDate] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const { push } = useToast();

  const agentNames = useMemo(() => Array.from(new Set(applications.map((a) => a.assignee).filter(Boolean))) as string[], [applications]);

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return applications
      .filter((a) => (fStatus === "all" || a.status === fStatus))
      .filter((a) => (fAct === "all" || a.actId === fAct))
      .filter((a) => (fDept === "all" || a.department === fDept))
      .filter((a) => (fAgent === "all" || a.assignee === fAgent))
      .filter((a) => (!fDate || a.createdAt.slice(0, 10) === fDate))
      .filter((a) => !norm || a.ref.toLowerCase().includes(norm) || a.studentName.toLowerCase().includes(norm) || a.matricule.toLowerCase().includes(norm))
      .sort((a, b) => (sortAsc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  }, [applications, q, fStatus, fAct, fDept, fAgent, fDate, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reset = () => { setPage(1); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Gestion des demandes</h1>
          <p className="mt-1 text-sm text-mut">{filtered.length} dossier{filtered.length > 1 ? "s" : ""} — recherchez, filtrez, traitez.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { exportCSV(`flash_actes_demandes_${new Date().toISOString().slice(0, 10)}.csv`, filtered.map((a) => ({ Reference: a.ref, Etudiant: a.studentName, Matricule: a.matricule, Acte: actById(a.actId).name, Date: fmtDate(a.createdAt), Statut: STATUS_META[a.status].label, Agent: a.assignee ?? "—" }))); push("success", "Export généré", `${filtered.length} lignes exportées en CSV.`); }}>
          <Download className="h-3.5 w-3.5" /> Exporter CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_150px_auto]">
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mut" aria-hidden />
            <input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Référence, nom, matricule…" aria-label="Rechercher une demande" className="h-10 w-full rounded-lg border border-line bg-card pl-9.5 pr-3 text-sm text-ink placeholder:text-mut/70 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20" />
          </div>
          <Select value={fStatus} onChange={(e) => { setFStatus(e.target.value); reset(); }} aria-label="Filtrer par statut">
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Select value={fAct} onChange={(e) => { setFAct(e.target.value); reset(); }} aria-label="Filtrer par acte">
            <option value="all">Tous les actes</option>
            {ACT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select value={fDept} onChange={(e) => { setFDept(e.target.value); reset(); }} aria-label="Filtrer par département">
            <option value="all">Tous les départements</option>
            {DEPARTMENTS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </Select>
          <Select value={fAgent} onChange={(e) => { setFAgent(e.target.value); reset(); }} aria-label="Filtrer par agent">
            <option value="all">Tous les agents</option>
            {agentNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={fDate} onChange={(e) => { setFDate(e.target.value); reset(); }} aria-label="Filtrer par date" className="h-10 py-0 text-[12.5px]" />
            <Button variant="ghost" size="sm" className="h-10 shrink-0" onClick={() => setSortAsc((s) => !s)} aria-label="Inverser le tri par date">
              <ArrowUpDown className="h-3.5 w-3.5" /> {sortAsc ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </Card>

      {pageRows.length === 0 ? (
        <EmptyState icon={<Inbox className="h-5 w-5" />} title="Aucun dossier ne correspond" desc="Ajustez vos filtres ou votre recherche." action={<Button variant="outline" size="sm" onClick={() => { setQ(""); setFStatus("all"); setFAct("all"); setFDept("all"); setFAgent("all"); setFDate(""); reset(); }}>Réinitialiser les filtres</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.1em] text-mut">
                  <th className="px-6 py-3.5">Référence</th><th className="px-3 py-3.5">Étudiant</th><th className="px-3 py-3.5">Acte</th><th className="px-3 py-3.5">Date</th><th className="px-3 py-3.5">Statut</th><th className="px-3 py-3.5">Agent</th><th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((a) => (
                  <tr key={a.id} className="cursor-pointer border-b border-line/60 transition hover:bg-royalsoft/40 last:border-0" onClick={() => (window.location.hash = `#/admin/demandes/${a.id}`)}>
                    <td className="px-6 py-4 font-mono text-[12.5px] font-bold text-royal">{a.ref}</td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-ink">{a.studentName}</p>
                      <p className="text-[11.5px] text-mut">{a.matricule}</p>
                    </td>
                    <td className="px-3 py-4 font-medium text-inksoft">{actById(a.actId).name}</td>
                    <td className="px-3 py-4 text-mut">{fmtDate(a.createdAt)}</td>
                    <td className="px-3 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-3 py-4 text-[12.5px] font-semibold text-inksoft">{a.assignee ?? <Badge tone="warn">Non assigné</Badge>}</td>
                    <td className="px-6 py-4 text-right"><span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-royal">Ouvrir <ArrowRight className="h-3.5 w-3.5" /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line/60 lg:hidden">
            {pageRows.map((a) => (
              <li key={a.id}>
                <Link to={`/admin/demandes/${a.id}`} className="block px-5 py-4 transition hover:bg-royalsoft/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[12.5px] font-bold text-royal">{a.ref}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink">{a.studentName} · {actById(a.actId).name}</p>
                  <p className="mt-0.5 text-[12px] text-mut">{fmtDate(a.createdAt)} · {a.assignee ?? "Non assigné"}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-6 pb-4">
            <Pagination page={page} pages={pages} onPage={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}

/* --------------------------- Fiche demande -------------------------- */

function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, users, setStatus, addNote, assignAgent, notifyStudent } = useStore();
  const { push } = useToast();
  const app = applications.find((a) => a.id === id);
  const [modal, setModal] = useState<"reject" | "correct" | "note" | "notify" | null>(null);
  const [text, setText] = useState("");
  const [newStatus, setNewStatus] = useState<AppStatus | "">("");

  if (!app) {
    return (
      <EmptyState icon={<Inbox className="h-5 w-5" />} title="Demande introuvable" desc="Ce dossier n'existe pas ou a été archivé." action={<Link to="/admin/demandes"><Button variant="outline" size="sm">Retour aux demandes</Button></Link>} />
    );
  }
  const act = actById(app.actId);
  const owner = users.find((u) => u.matricule === app.matricule);
  const agents = users.filter((u) => u.role === "AGENT" || u.role === "SUPERVISOR");
  const allowed = nextStatuses(app.status);

  const close = () => { setModal(null); setText(""); };
  const run = (s: AppStatus, comment?: string) => {
    setStatus(app.id, s, comment);
    push("success", "Statut mis à jour", `${app.ref} → ${STATUS_META[s].label}. L'étudiant a été notifié.`);
    close();
  };

  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">{k}</dt>
      <dd className="mt-0.5 text-[13.5px] font-semibold text-ink">{v}</dd>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/demandes")} className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-card text-ink transition hover:border-royal hover:text-royal" aria-label="Retour">
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <p className="font-mono text-[17px] font-bold text-royal">{app.ref}</p>
            <p className="text-[13px] text-mut">{act.name} · déposée le {fmtDateTime(app.createdAt)}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <Button variant="outline" size="sm" onClick={() => { downloadBlob(`recu_${app.ref}.pdf`, receiptPdf(app)); push("success", "Reçu téléchargé", `${app.ref}.pdf`); }}>
          <FileDown className="h-3.5 w-3.5" /> Reçu PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne 1 : étudiant */}
        <Card className="h-fit p-6">
          <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Informations étudiant</h2>
          <dl className="space-y-3.5">
            <Row k="Nom complet" v={app.studentName} />
            <Row k="Matricule" v={<span className="font-mono text-[12.5px]">{app.matricule}</span>} />
            <Row k="Département" v={app.department} />
            <Row k="Filière" v={app.program} />
            <Row k="Niveau" v={app.level} />
            <Row k="Téléphone" v={app.phone} />
            <Row k="Email" v={<span className="break-all">{app.email}</span>} />
            <Row k="Né(e) le" v={fmtDate(app.birthDate)} />
          </dl>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Agent responsable</p>
            <Select className="mt-2" value={app.assignee ?? ""} onChange={(e) => { assignAgent(app.id, e.target.value); push("success", "Dossier affecté", `${app.ref} → ${e.target.value}`); }}>
              <option value="">— Affecter un agent —</option>
              {agents.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </Select>
          </div>
        </Card>

        {/* Colonne 2 : demande + historique + actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Informations demande</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <Row k="Acte" v={act.name} />
              <Row k="Exemplaires" v={String(app.copies)} />
              <Row k="Motif" v={app.motif} />
              <Row k="Format" v={app.format} />
              <Row k="Année académique" v={app.academicYear} />
              <Row k="Obtention" v={app.graduationYear} />
            </dl>
          </Card>
          <Card className="p-6">
            <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Historique du dossier</h2>
            <TrackTimeline app={app} compact />
          </Card>
          <Card className="p-6">
            <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="ok" size="sm" disabled={!allowed.includes("APPROVED") && app.status !== "UNDER_REVIEW" && app.status !== "CORRECTION_REQUIRED"} onClick={() => run("APPROVED", "Dossier validé.")}><Check className="h-3.5 w-3.5" /> Valider</Button>
              <Button size="sm" disabled={app.status !== "APPROVED" && app.status !== "DOCUMENT_READY"} onClick={() => run("DOCUMENT_READY", "Document généré, signé et disponible.")}><FileText className="h-3.5 w-3.5" /> Générer le document</Button>
              <Button variant="outline" size="sm" onClick={() => setModal("correct")}><MessageSquare className="h-3.5 w-3.5" /> Demander une correction</Button>
              <Button variant="danger" size="sm" onClick={() => setModal("reject")}><X className="h-3.5 w-3.5" /> Rejeter</Button>
              {app.status === "DOCUMENT_READY" && <Button variant="ghost" size="sm" onClick={() => run("COMPLETED", "Dossier clôturé.")}><CheckCheck className="h-3.5 w-3.5" /> Clôturer</Button>}
            </div>
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor="chg-status" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-mut">Changer le statut</label>
                <div className="flex gap-2">
                  <Select id="chg-status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as AppStatus | "")}>
                    <option value="">— Choisir —</option>
                    {allowed.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </Select>
                  <Button variant="outline" size="sm" className="h-10 shrink-0" disabled={!newStatus} onClick={() => newStatus && run(newStatus)}>OK</Button>
                </div>
              </div>
              <div className="flex flex-col justify-end gap-2 sm:pb-0.5">
                <Button variant="outline" size="sm" onClick={() => setModal("note")}><MessageSquare className="h-3.5 w-3.5" /> Ajouter une note</Button>
                <Button variant="outline" size="sm" onClick={() => setModal("notify")}><Send className="h-3.5 w-3.5" /> Notifier l'étudiant</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Colonne 3 : pièces, paiement, notes */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Pièces justificatives ({app.files.length})</h2>
            <ul className="space-y-2.5">
              {app.files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-lg border border-line bg-cardsoft/60 px-3.5 py-3">
                  <Paperclip className="h-4 w-4 shrink-0 text-royal" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-ink">{f.name}</span>
                    <span className="text-[11px] font-semibold text-mut">{(f.size / 1024).toFixed(0)} Ko · {f.name.split(".").pop()?.toUpperCase()}</span>
                  </span>
                  <Badge tone="ok">Conforme</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11.5px] leading-relaxed text-mut">Stockage privé avec URLs signées temporaires (architecture cible). En démo : métadonnées uniquement.</p>
          </Card>
          <Card className="p-6">
            <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Paiement</h2>
            <dl className="space-y-3">
              <Row k="Montant" v={fmtFCFA(app.payment.amount)} />
              <Row k="Référence" v={<span className="font-mono text-[12.5px]">{app.payment.ref}</span>} />
              <Row k="Mode" v={app.payment.method} />
              <Row k="Statut" v={<Badge tone={app.payment.status === "CONFIRME" ? "ok" : "warn"} dot>{app.payment.status === "CONFIRME" ? "Confirmé" : "En attente"}</Badge>} />
              <Row k="Date" v={fmtDateTime(app.payment.at)} />
            </dl>
          </Card>
          <Card className="p-6">
            <h2 className="font-display mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-mut">Notes internes ({app.notes.length})</h2>
            {app.notes.length === 0 ? (
              <p className="text-sm text-mut">Aucune note. Ajoutez des observations pour l'équipe.</p>
            ) : (
              <ul className="space-y-3">
                {app.notes.map((n, i) => (
                  <li key={i} className="rounded-lg border border-line bg-cardsoft/60 px-4 py-3">
                    <p className="text-[13px] leading-relaxed text-inksoft">{n.text}</p>
                    <p className="mt-1.5 text-[11px] font-bold text-mut">{n.by} · {fmtDateTime(n.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* modales */}
      <Modal open={modal === "reject"} onClose={close} title="Rejeter la demande">
        <Field label="Motif du rejet" required hint="Visible par l'étudiant">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. : quittance de paiement non conforme…" rows={4} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button variant="danger" disabled={text.trim().length < 5} onClick={() => run("REJECTED", text.trim())}>Confirmer le rejet</Button>
        </div>
      </Modal>
      <Modal open={modal === "correct"} onClose={close} title="Demander une correction">
        <Field label="Précisez le complément attendu" required hint="Visible par l'étudiant">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. : fournir une copie nette du relevé de notes (PDF)…" rows={4} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button disabled={text.trim().length < 5} onClick={() => run("CORRECTION_REQUIRED", text.trim())}>Envoyer la demande</Button>
        </div>
      </Modal>
      <Modal open={modal === "note"} onClose={close} title="Ajouter une note interne">
        <Field label="Note" required hint="Visible uniquement par l'équipe">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Observation, point de contrôle…" />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button disabled={text.trim().length < 3} onClick={() => { addNote(app.id, text.trim()); push("success", "Note ajoutée", "Visible par l'équipe uniquement."); close(); }}>Enregistrer</Button>
        </div>
      </Modal>
      <Modal open={modal === "notify"} onClose={close} title="Notifier l'étudiant">
        <p className="text-sm text-mut">Envoi à <span className="font-bold text-ink">{app.studentName}</span> ({app.email}) via les canaux Interne, Email et WhatsApp (si configuré).</p>
        <div className="mt-4">
          <Field label="Message" required>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={`Bonjour, votre dossier ${app.ref}…`} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={close}>Annuler</Button>
          <Button disabled={text.trim().length < 5} onClick={() => { notifyStudent(owner?.id, `Message de la scolarité — ${app.ref}`, text.trim(), "info"); push("success", "Notification envoyée", "L'étudiant a été prévenu."); close(); }}><Send className="h-4 w-4" /> Envoyer</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------ Étudiants --------------------------- */

function StudentsPage() {
  const { students } = useStore();
  const [q, setQ] = useState("");
  const filtered = students.filter((s) => !q.trim() || (s.name + s.matricule + s.email + s.program).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Étudiants</h1>
          <p className="mt-1 text-sm text-mut">{filtered.length} dossier{filtered.length > 1 ? "s" : ""} étudiant{filtered.length > 1 ? "s" : ""}.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mut" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un étudiant…" aria-label="Rechercher un étudiant" className="h-10 w-[260px] rounded-lg border border-line bg-card pl-9.5 pr-3 text-sm text-ink placeholder:text-mut/70 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20" />
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.1em] text-mut">
                <th className="px-6 py-3.5">Matricule</th><th className="px-3 py-3.5">Nom</th><th className="px-3 py-3.5">Filière</th><th className="px-3 py-3.5">Niveau</th><th className="px-6 py-3.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.matricule} className="border-b border-line/60 transition hover:bg-cardsoft/70 last:border-0">
                  <td className="px-6 py-3.5 font-mono text-[12.5px] font-bold text-royal">{s.matricule}</td>
                  <td className="px-3 py-3.5">
                    <p className="font-semibold text-ink">{s.name}</p>
                    <p className="text-[11.5px] text-mut">{s.email}</p>
                  </td>
                  <td className="px-3 py-3.5 text-[12.5px] text-inksoft">{s.program}</td>
                  <td className="px-3 py-3.5 text-[12.5px] text-inksoft">{s.level}</td>
                  <td className="px-6 py-3.5 text-right"><Badge tone={s.active ? "ok" : "bad"} dot>{s.active ? "Actif" : "Inactif"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line/60 md:hidden">
          {filtered.map((s) => (
            <li key={s.matricule} className="px-5 py-4">
              <p className="font-mono text-[12px] font-bold text-royal">{s.matricule}</p>
              <p className="mt-0.5 text-sm font-bold text-ink">{s.name}</p>
              <p className="text-[12px] text-mut">{s.program} · {s.level}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------ Documents --------------------------- */

function DocsAdmin() {
  const { applications } = useStore();
  const docs = applications.filter((a) => a.document);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Documents délivrés</h1>
        <p className="mt-1 text-sm text-mut">{docs.length} document{docs.length > 1 ? "s" : ""} signé{docs.length > 1 ? "s" : ""} électroniquement, avec QR Code de vérification.</p>
      </div>
      {docs.length === 0 ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="Aucun document délivré" desc="Générez un document depuis une demande validée." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((a) => (
            <Card key={a.id} className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-royal/8">
              <div className="flex items-start justify-between">
                <QrCode className="h-6 w-6 text-royal" />
                <Badge tone="ok" dot>VALIDE</Badge>
              </div>
              <p className="font-display mt-3 text-[14.5px] font-bold text-ink">{actById(a.actId).name}</p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-inksoft">{a.studentName}</p>
              <p className="mt-2 font-mono text-[11.5px] font-bold text-royal">{a.document!.verifyCode}</p>
              <p className="text-[11.5px] text-mut">Délivré le {fmtDate(a.document!.issuedAt)}</p>
              <div className="mt-4 flex gap-2">
                <Link to={`/verify?code=${a.document!.verifyCode}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">Vérifier</Button></Link>
                <Link to={`/admin/demandes/${a.id}`} className="flex-1"><Button size="sm" className="w-full">Dossier</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Paiements --------------------------- */

function PaymentsPage() {
  const { applications } = useStore();
  const rows = [...applications].sort((a, b) => b.payment.at.localeCompare(a.payment.at));
  const total = rows.filter((r) => r.payment.status === "CONFIRME").reduce((s, r) => s + r.payment.amount, 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Paiements</h1>
          <p className="mt-1 text-sm text-mut">Volume confirmé : <span className="font-bold text-ok">{fmtFCFA(total)}</span></p>
        </div>
      </div>
      <Card className="overflow-hidden border-gold/30 bg-goldsoft/40">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-goldbright text-navy"><Wallet className="h-5 w-5" /></span>
          <p className="flex-1 text-[13px] leading-relaxed text-inksoft">
            <span className="font-bold text-ink">Architecture PaymentProvider.</span> Les paiements passent par une abstraction serveur (<span className="font-mono text-[12px]">initPayment → webhook → confirmPayment → refund</span>) prête à connecter MTN MoMo, Moov Money et Celtiis Cash. <span className="font-bold">Aucun débit réel</span> n'est effectué en environnement de démonstration.
          </p>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.1em] text-mut">
                <th className="px-6 py-3.5">Référence</th><th className="px-3 py-3.5">Demande</th><th className="px-3 py-3.5">Montant</th><th className="px-3 py-3.5">Mode</th><th className="px-3 py-3.5">Date</th><th className="px-6 py-3.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-line/60 transition hover:bg-cardsoft/70 last:border-0">
                  <td className="px-6 py-3.5 font-mono text-[12px] font-bold text-ink">{a.payment.ref}</td>
                  <td className="px-3 py-3.5">
                    <p className="font-mono text-[12px] font-bold text-royal">{a.ref}</p>
                    <p className="text-[11.5px] text-mut">{a.studentName}</p>
                  </td>
                  <td className="px-3 py-3.5 font-bold text-ink">{fmtFCFA(a.payment.amount)}</td>
                  <td className="px-3 py-3.5 text-[12.5px] text-inksoft">{a.payment.method}</td>
                  <td className="px-3 py-3.5 text-[12.5px] text-mut">{fmtDateTime(a.payment.at)}</td>
                  <td className="px-6 py-3.5 text-right"><Badge tone={a.payment.status === "CONFIRME" ? "ok" : a.payment.status === "EN_ATTENTE" ? "warn" : "bad"} dot>{a.payment.status === "CONFIRME" ? "Confirmé" : a.payment.status === "EN_ATTENTE" ? "En attente" : "Échec"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line/60 md:hidden">
          {rows.map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex justify-between"><p className="font-mono text-[12px] font-bold text-royal">{a.ref}</p><Badge tone={a.payment.status === "CONFIRME" ? "ok" : "warn"} dot>{a.payment.status === "CONFIRME" ? "Confirmé" : "En attente"}</Badge></div>
              <p className="mt-1 text-sm font-bold text-ink">{fmtFCFA(a.payment.amount)} · {a.payment.method}</p>
              <p className="text-[12px] text-mut">{a.payment.ref} · {fmtDate(a.payment.at)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------------------- Notifications ------------------------- */

function NotifsStaff() {
  const { notifs, markRead, markAllRead, unreadFor, session } = useStore();
  const staff = notifs.filter((n) => n.audience === "staff");
  const unread = unreadFor(session);
  const dot: Record<string, string> = { info: "bg-info", success: "bg-ok", warning: "bg-warn", danger: "bg-bad" };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-mut">{unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllRead("staff")} disabled={unread === 0}><CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu</Button>
      </div>
      <ul className="space-y-3">
        {staff.map((n) => (
          <li key={n.id}>
            <button onClick={() => markRead(n.id)} className={cn("flex w-full items-start gap-4 rounded-xl border p-5 text-left transition", n.read ? "border-line bg-card" : "border-royal/40 bg-royalsoft/50")}>
              <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", dot[n.kind], !n.read && "pulse-dot")} />
              <span className="min-w-0 flex-1">
                <span className="text-[14px] font-bold text-ink">{n.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-mut">{n.body}</span>
                <span className="mt-1.5 block text-[11px] font-semibold text-mut">{fmtDateTime(n.at)} · Canaux : {n.channels.join(", ")}</span>
              </span>
            </button>
          </li>
        ))}
        {staff.length === 0 && <EmptyState icon={<BellRing className="h-5 w-5" />} title="Aucune notification" />}
      </ul>
    </div>
  );
}

/* ----------------------------- Utilisateurs ------------------------- */

function UsersPage() {
  const { users, updateUser } = useStore();
  const { push } = useToast();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Utilisateurs & rôles</h1>
        <p className="mt-1 text-sm text-mut">Contrôle d'accès basé sur les rôles (RBAC) : STUDENT · AGENT · SUPERVISOR · ADMIN.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.1em] text-mut">
                <th className="px-6 py-3.5">Utilisateur</th><th className="px-3 py-3.5">Rôle</th><th className="px-3 py-3.5">2FA</th><th className="px-3 py-3.5">Dernière connexion</th><th className="px-6 py-3.5 text-right">Compte</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line/60 transition hover:bg-cardsoft/70 last:border-0">
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-ink">{u.name}</p>
                    <p className="text-[11.5px] text-mut">{u.email}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <Select value={u.role} onChange={(e) => { updateUser(u.id, { role: e.target.value as typeof u.role }); push("success", "Rôle mis à jour", `${u.name} → ${ROLE_LABEL[e.target.value]}`); }} aria-label={`Rôle de ${u.name}`} className="h-8 w-[150px] py-1 text-[12px]">
                      {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  </td>
                  <td className="px-3 py-3.5">{u.twoFA ? <Badge tone="ok" dot>Activée</Badge> : <Badge tone="mut">—</Badge>}</td>
                  <td className="px-3 py-3.5 text-[12.5px] text-mut">{fmtDateTime(u.lastLogin)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button onClick={() => { updateUser(u.id, { active: !u.active }); push(u.active ? "warning" : "success", u.active ? "Compte désactivé" : "Compte réactivé", u.name); }} className={cn("rounded-full px-3 py-1 text-[11.5px] font-bold transition", u.active ? "bg-oksoft text-ok hover:bg-badsoft hover:text-bad" : "bg-badsoft text-bad hover:bg-oksoft hover:text-ok")}>
                      {u.active ? "Actif" : "Désactivé"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line/60 md:hidden">
          {users.map((u) => (
            <li key={u.id} className="px-5 py-4">
              <p className="text-sm font-bold text-ink">{u.name}</p>
              <p className="text-[12px] text-mut">{u.email}</p>
              <div className="mt-2 flex gap-2"><Badge tone="royal">{ROLE_LABEL[u.role]}</Badge>{u.twoFA && <Badge tone="ok" dot>2FA</Badge>}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------------------- Statistiques -------------------------- */

function StatsPage() {
  const { applications } = useStore();
  const processed = applications.filter((a) => ["APPROVED", "DOCUMENT_READY", "COMPLETED", "REJECTED"].includes(a.status)).length;
  const rate = applications.length ? Math.round((processed / applications.length) * 100) : 0;
  const byStatus = (Object.keys(STATUS_META) as AppStatus[]).map((s) => ({ label: STATUS_META[s].label, value: applications.filter((a) => a.status === s).length })).filter((x) => x.value > 0);
  const byAct = ACT_TYPES.map((t) => ({ label: t.name, value: applications.filter((a) => a.actId === t.id).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  const byDept = DEPARTMENTS.map((d) => ({ label: d.name, value: applications.filter((a) => a.department === d.name).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Statistiques</h1>
        <p className="mt-1 text-sm text-mut">Indicateurs de performance du service des actes académiques.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Taux de traitement", v: `${rate} %` },
          { l: "Délai moyen", v: "2,4 j" },
          { l: "Demandes (12 mois)", v: String(MONTHLY_APPS.reduce((s, m) => s + m.v, 0)) },
          { l: "Documents délivrés", v: String(applications.filter((a) => a.document).length) },
        ].map((k) => (
          <Card key={k.l} className="p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-mut">{k.l}</p>
            <p className="font-display mt-2 text-[30px] font-bold text-royal">{k.v}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-bold text-ink">Demandes par mois</h2>
          <MonthBars data={MONTHLY_APPS} height={190} />
        </Card>
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-bold text-ink">Répartition par statut</h2>
          <HBars items={byStatus} />
        </Card>
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-bold text-ink">Actes les plus demandés</h2>
          <HBars items={byAct} />
        </Card>
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-bold text-ink">Demandes par département</h2>
          <HBars items={byDept} />
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------- Paramètres --------------------------- */

function SettingsPage() {
  const { push } = useToast();
  const [sign, setSign] = useState("« Vos documents académiques, simplement. »");
  const [maxSize, setMaxSize] = useState("5");
  const [connectors] = useState([
    { name: "MTN Mobile Money", provider: "mtn-momo", state: "Sandbox active", ok: true },
    { name: "Moov Money", provider: "moov-money", state: "Sandbox active", ok: true },
    { name: "Celtiis Cash", provider: "celtiis-cash", state: "À configurer", ok: false },
  ]);
  return (
    <div className="max-w-[860px] space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Paramètres de la plateforme</h1>
        <p className="mt-1 text-sm text-mut">Réglages globaux du service — modifiables par les administrateurs.</p>
      </div>
      <Card className="p-6 sm:p-7">
        <h2 className="font-display text-base font-bold text-ink">Général</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Signature de la plateforme"><Input value={sign} onChange={(e) => setSign(e.target.value)} /></Field>
          <Field label="Taille max. des pièces (Mo)"><Input type="number" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} /></Field>
        </div>
        <div className="mt-5 flex justify-end"><Button onClick={() => push("success", "Paramètres enregistrés", "Application immédiate (démonstration).")}>Enregistrer</Button></div>
      </Card>
      <Card className="p-6 sm:p-7">
        <h2 className="font-display text-base font-bold text-ink">Connecteurs de paiement — abstraction PaymentProvider</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-navy px-5 py-4 font-mono text-[11.5px] leading-relaxed text-[#a9c1ee]">
{`interface PaymentProvider {
  id: "mtn-momo" | "moov-money" | "celtiis-cash";
  initPayment(order): Promise<{ ref, payUrl? }>;
  handleWebhook(event): Promise<void>;   // signé HMAC
  confirmPayment(ref): Promise<Payment>;
  refund(ref): Promise<void>;
}`}
        </pre>
        <ul className="mt-5 divide-y divide-line/70">
          {connectors.map((c) => (
            <li key={c.provider} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-bold text-ink">{c.name}</p>
                <p className="font-mono text-[11.5px] text-mut">{c.provider}</p>
              </div>
              <Badge tone={c.ok ? "ok" : "warn"} dot>{c.state}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex items-start gap-4 p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-royalsoft text-royal"><ShieldCheck className="h-5 w-5" /></span>
        <p className="text-[13px] leading-relaxed text-inksoft">
          <span className="font-bold text-ink">Sécurité appliquée côté serveur :</span> validation et sanitation des entrées, protection XSS/CSRF, rate limiting, contrôle d'accès RBAC, stockage privé des documents avec URLs signées, journal d'audit, mots de passe hachés et secrets en variables d'environnement. Le frontend n'est jamais considéré comme une couche de sécurité.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------- Journal ---------------------------- */

function LogsPage() {
  const { logs } = useStore();
  const [q, setQ] = useState("");
  const filtered = logs.filter((l) => !q.trim() || (l.actor + l.action + l.target).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Journal d'activité</h1>
          <p className="mt-1 text-sm text-mut">Audit trail horodaté — connexions, statuts, documents, sécurité.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mut" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer le journal…" aria-label="Filtrer le journal" className="h-10 w-[240px] rounded-lg border border-line bg-card pl-9.5 pr-3 text-sm text-ink placeholder:text-mut/70 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20" />
        </div>
      </div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line/60">
          {filtered.map((l) => (
            <li key={l.id} className="flex items-start gap-4 px-6 py-4">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", /échec|rejet/i.test(l.action) ? "bg-bad" : /connexion|login/i.test(l.action) ? "bg-info" : "bg-goldbright")} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{l.action} <span className="font-mono text-[12.5px] font-bold text-royal">{l.target}</span></p>
                <p className="mt-0.5 text-[12px] text-mut">{l.actor} · {fmtDateTime(l.at)} · IP {l.ip}</p>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-6 py-10 text-center text-sm text-mut">Aucune entrée ne correspond.</li>}
        </ul>
      </Card>
    </div>
  );
}

/* -------------------------------- Shell ----------------------------- */

export default function AdminSpace() {
  const { logout } = useStore();
  const navigate = useNavigate();
  return (
    <DashboardShell title="Administration" nav={NAV} onLogout={() => { logout(); navigate("/"); }}>
      <Routes>
        <Route index element={<DashAdmin />} />
        <Route path="demandes" element={<RequestsList />} />
        <Route path="demandes/:id" element={<RequestDetail />} />
        <Route path="etudiants" element={<StudentsPage />} />
        <Route path="documents" element={<DocsAdmin />} />
        <Route path="paiements" element={<PaymentsPage />} />
        <Route path="notifications" element={<NotifsStaff />} />
        <Route path="utilisateurs" element={<UsersPage />} />
        <Route path="statistiques" element={<StatsPage />} />
        <Route path="parametres" element={<SettingsPage />} />
        <Route path="journal" element={<LogsPage />} />
        <Route path="*" element={<DashAdmin />} />
      </Routes>
    </DashboardShell>
  );
}
