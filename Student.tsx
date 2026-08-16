--- src/pages/Student.tsx (原始)


+++ src/pages/Student.tsx (修改后)
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { ArrowRight, BellRing, CheckCheck, Eye, FileDown, FilePlus2, FileText, FolderOpen, Inbox, KeyRound, LayoutDashboard, QrCode, ScanLine, ShieldCheck, Smartphone, User } from "lucide-react";
import { DashboardShell } from "../components/layout";
import type { DashNavItem } from "../components/layout";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, StatusBadge, useToast } from "../components/ui";
import { DocumentPreview } from "../components/widgets";
import { useStore } from "../lib/store";
import { actById } from "../lib/data";
import { documentPdf } from "../lib/pdf";
import type { Application, NotifItem } from "../lib/types";
import { cn, downloadBlob, fmtDate, fmtDateTime, timeAgo } from "../lib/utils";

const NAV: DashNavItem[] = [
  { to: "/student", label: "Tableau de bord", icon: <LayoutDashboard />, end: true, section: "Mon espace" },
  { to: "/demande", label: "Nouvelle demande", icon: <FilePlus2 />, section: "Mon espace" },
  { to: "/student/demandes", label: "Mes demandes", icon: <FolderOpen />, section: "Mon espace" },
  { to: "/student/documents", label: "Mes documents", icon: <FileText />, section: "Mon espace" },
  { to: "/student/notifications", label: "Notifications", icon: <BellRing />, section: "Mon espace" },
  { to: "/student/profil", label: "Profil", icon: <User />, section: "Compte" },
  { to: "/student/securite", label: "Sécurité", icon: <ShieldCheck />, section: "Compte" },
];

function useMyApps(): Application[] {
  const { applications, session } = useStore();
  return useMemo(
    () => (session?.matricule ? applications.filter((a) => a.matricule === session.matricule) : []),
    [applications, session]
  );
}

const KIND_DOT: Record<NotifItem["kind"], string> = { info: "bg-info", success: "bg-ok", warning: "bg-warn", danger: "bg-bad" };

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) {
  return (
    <Card className="p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-royal/8">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-mut">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone)}>{icon}</span>
      </div>
      <p className="font-display mt-2 text-[32px] font-bold leading-none text-ink">{value}</p>
    </Card>
  );
}

function Dash() {
  const { session, notifs, unreadFor } = useStore();
  const apps = useMyApps();
  const first = (session?.name ?? "").split(" ")[0];
  const inProgress = apps.filter((a) => !["COMPLETED", "REJECTED"].includes(a.status)).length;
  const validated = apps.filter((a) => ["APPROVED", "DOCUMENT_READY", "COMPLETED"].includes(a.status)).length;
  const docs = apps.filter((a) => a.document).length;
  const myNotifs = notifs.filter((n) => n.audience === "student" && (!n.forUser || n.forUser === session?.userId)).slice(0, 3);
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-ink">Bonjour, {first}</h1>
          <p className="mt-1 text-sm text-mut">Voici l'état de vos dossiers au {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.</p>
        </div>
        <Link to="/demande"><Button className="group">Nouvelle demande <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Demandes totales" value={apps.length} icon={<FolderOpen className="h-4 w-4" />} tone="bg-royalsoft text-royal" />
        <StatCard label="En cours" value={inProgress} icon={<ScanLine className="h-4 w-4" />} tone="bg-warnsoft text-warn" />
        <StatCard label="Validées" value={validated} icon={<CheckCheck className="h-4 w-4" />} tone="bg-oksoft text-ok" />
        <StatCard label="Documents dispo." value={docs} icon={<FileText className="h-4 w-4" />} tone="bg-goldsoft text-gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-base font-bold text-ink">Mes dernières demandes</h2>
            <Link to="/student/demandes" className="text-[12.5px] font-bold text-royal hover:underline">Tout voir</Link>
          </div>
          {apps.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Inbox className="h-5 w-5" />} title="Aucune demande pour l'instant" desc="Déposez votre première demande d'acte académique en moins de 10 minutes." action={<Link to="/demande"><Button size="sm">Faire ma première demande</Button></Link>} />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] font-bold uppercase tracking-[0.1em] text-mut">
                      <th className="px-6 py-3">Référence</th><th className="px-3 py-3">Acte</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Statut</th><th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.slice(0, 5).map((a) => (
                      <tr key={a.id} className="border-b border-line/60 transition hover:bg-cardsoft/70 last:border-0">
                        <td className="px-6 py-3.5 font-mono text-[12.5px] font-bold text-royal">{a.ref}</td>
                        <td className="px-3 py-3.5 font-semibold text-ink">{actById(a.actId).name}</td>
                        <td className="px-3 py-3.5 text-mut">{fmtDate(a.createdAt)}</td>
                        <td className="px-3 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-6 py-3.5 text-right">
                          <Link to={`/suivi?ref=${a.ref}`} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-royal hover:underline"><ScanLine className="h-3.5 w-3.5" /> Suivre</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line/60 md:hidden">
                {apps.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[12.5px] font-bold text-royal">{a.ref}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-ink">{actById(a.actId).name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[12px] text-mut">{fmtDate(a.createdAt)}</span>
                      <Link to={`/suivi?ref=${a.ref}`} className="text-[12.5px] font-bold text-royal">Suivre →</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">Notifications</h2>
              <Link to="/student/notifications" className="text-[12.5px] font-bold text-royal hover:underline">Centre</Link>
            </div>
            <ul className="mt-4 space-y-3.5">
              {myNotifs.length === 0 && <li className="text-sm text-mut">Aucune notification récente.</li>}
              {myNotifs.map((n) => (
                <li key={n.id} className="flex gap-3">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", KIND_DOT[n.kind], !n.read && "pulse-dot")} />
                  <div className="min-w-0">
                    <p className={cn("text-[13px] leading-snug", n.read ? "font-semibold text-inksoft" : "font-bold text-ink")}>{n.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-mut">{timeAgo(n.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="relative overflow-hidden bg-navy p-6">
            <QrCode className="absolute -bottom-5 -right-5 h-28 w-28 text-goldbright/10" />
            <h3 className="font-display text-[15px] font-bold text-white">Un document à vérifier ?</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8fa2c8]">Contrôlez l'authenticité d'un acte via son QR Code ou sa référence.</p>
            <Link to="/verify" className="mt-4 inline-block"><Button variant="gold" size="sm">Vérifier un document</Button></Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MyRequests() {
  const apps = useMyApps();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Mes demandes</h1>
          <p className="mt-1 text-sm text-mut">{apps.length} demande{apps.length > 1 ? "s" : ""} enregistrée{apps.length > 1 ? "s" : ""}.</p>
        </div>
        <Link to="/demande"><Button size="sm" className="group">Nouvelle demande <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></Button></Link>
      </div>
      {apps.length === 0 ? (
        <EmptyState icon={<Inbox className="h-5 w-5" />} title="Aucune demande" desc="Vos demandes et leur statut s'afficheront ici." action={<Link to="/demande"><Button>Faire une demande</Button></Link>} />
      ) : (
        <div className="grid gap-4">
          {apps.map((a) => (
            <Card key={a.id} className="flex flex-col gap-4 p-5 transition hover:border-royal/40 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="font-mono text-[13px] font-bold text-royal">{a.ref}</p>
                  <StatusBadge status={a.status} />
                  {a.document && <Badge tone="gold">Document prêt</Badge>}
                </div>
                <p className="mt-1.5 text-[14.5px] font-bold text-ink">{actById(a.actId).name} · {a.copies} exemplaire{a.copies > 1 ? "s" : ""}</p>
                <p className="mt-0.5 text-[12.5px] text-mut">Déposée le {fmtDateTime(a.createdAt)} · Paiement {a.payment.status === "CONFIRME" ? "confirmé" : "en attente"} ({a.payment.method})</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link to={`/suivi?ref=${a.ref}`}><Button variant="outline" size="sm"><ScanLine className="h-3.5 w-3.5" /> Suivre</Button></Link>
                {a.document && <Link to="/student/documents"><Button size="sm" variant="ok"><FileDown className="h-3.5 w-3.5" /> Document</Button></Link>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MyDocs() {
  const apps = useMyApps().filter((a) => a.document);
  const [preview, setPreview] = useState<Application | null>(null);
  const { push } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Mes documents</h1>
        <p className="mt-1 text-sm text-mut">Documents officiels délivrés, signés électroniquement et vérifiables par QR Code.</p>
      </div>
      {apps.length === 0 ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="Aucun document disponible" desc="Vos actes apparaîtront ici dès que leur statut passera à « Document disponible »." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((a) => (
            <Card key={a.id} className="group flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-royal/10">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-oksoft text-ok"><FileText className="h-5 w-5" /></span>
                <Badge tone="ok">VALIDE</Badge>
              </div>
              <h2 className="font-display mt-4 text-[15.5px] font-bold text-ink">{actById(a.actId).name}</h2>
              <p className="mt-1 font-mono text-[12px] font-bold text-royal">{a.ref}</p>
              <p className="mt-1 text-[12px] text-mut">Délivré le {fmtDate(a.document!.issuedAt)} · Code {a.document!.verifyCode}</p>
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-oksoft/60 px-3 py-2 text-[12px] font-bold text-ok"><CheckCheck className="h-3.5 w-3.5" /> Votre document est disponible</p>
              <div className="mt-4 grid gap-2">
                <Button size="sm" onClick={() => { downloadBlob(`${a.ref}_${actById(a.actId).name}.pdf`, documentPdf(a)); push("success", "Téléchargement lancé", "Votre PDF signé est en cours de téléchargement."); }}>
                  <FileDown className="h-3.5 w-3.5" /> Télécharger PDF
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreview(a)}><Eye className="h-3.5 w-3.5" /> Voir</Button>
                  <Link to={`/verify?code=${a.document!.verifyCode}`}><Button size="sm" variant="outline" className="w-full"><QrCode className="h-3.5 w-3.5" /> Vérifier</Button></Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? actById(preview.actId).name : ""} wide>
        {preview && <DocumentPreview app={preview} />}
      </Modal>
    </div>
  );
}

function NotifsCenter() {
  const { notifs, session, markRead, markAllRead, unreadFor } = useStore();
  const mine = notifs.filter((n) => n.audience === "student" && (!n.forUser || n.forUser === session?.userId));
  const unread = unreadFor(session);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold text-ink">Centre de notifications</h1>
          <p className="mt-1 text-sm text-mut">{unread > 0 ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}.` : "Vous êtes à jour."}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllRead("student", session?.userId)} disabled={unread === 0}><CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu</Button>
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={<BellRing className="h-5 w-5" />} title="Aucune notification" desc="Vous serez averti(e) ici, par email et par SMS à chaque évolution de vos dossiers." />
      ) : (
        <ul className="space-y-3">
          {mine.map((n) => (
            <li key={n.id}>
              <button onClick={() => markRead(n.id)} className={cn("flex w-full items-start gap-4 rounded-xl border p-5 text-left transition", n.read ? "border-line bg-card" : "border-royal/40 bg-royalsoft/50 hover:bg-royalsoft/70")}>
                <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", KIND_DOT[n.kind], !n.read && "pulse-dot")} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className={cn("text-[14px]", n.read ? "font-semibold text-inksoft" : "font-bold text-ink")}>{n.title}</span>
                    <span className="text-[11px] font-semibold text-mut">{fmtDateTime(n.at)}</span>
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-mut">{n.body}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {n.channels.map((c) => <Badge key={c} tone="mut">{c}</Badge>)}
                  </span>
                </span>
                {!n.read && <Badge tone="royal">Nouveau</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Profil() {
  const { session, students, updateProfile } = useStore();
  const { push } = useToast();
  const rec = students.find((s) => s.matricule === session?.matricule);
  const [name, setName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState(rec?.phone ?? "");
  return (
    <div className="max-w-[640px] space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Mon profil</h1>
        <p className="mt-1 text-sm text-mut">Ces informations sont utilisées pour l'établissement de vos actes.</p>
      </div>
      <Card className="p-6 sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-goldbright">
            {(session?.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div>
            <p className="font-display text-lg font-bold text-ink">{session?.name}</p>
            <p className="text-[12.5px] font-semibold text-mut">{session?.matricule} · Étudiant(e)</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Téléphone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 …" /></Field>
          <Field label="Email institutionnel" hint="Non modifiable"><Input value={session?.email ?? ""} disabled className="opacity-60" /></Field>
          <Field label="Matricule" hint="Non modifiable"><Input value={session?.matricule ?? ""} disabled className="opacity-60" /></Field>
          <Field label="Département"><Input value={rec?.department ?? "—"} disabled className="opacity-60" /></Field>
          <Field label="Filière"><Input value={rec?.program ?? "—"} disabled className="opacity-60" /></Field>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => { updateProfile({ name: name.trim() || session?.name || "", phone }); push("success", "Profil mis à jour", "Vos informations ont été enregistrées."); }}>Enregistrer les modifications</Button>
        </div>
      </Card>
      <Card className="flex items-start gap-4 p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-infosoft text-info"><Smartphone className="h-5 w-5" /></span>
        <p className="text-[13px] leading-relaxed text-inksoft">
          Les canaux <span className="font-bold">Email</span>, <span className="font-bold">SMS</span> et <span className="font-bold">WhatsApp</span> (si configuré) sont utilisés pour vous notifier. Vous pouvez ajuster vos préférences auprès de la scolarité.
        </p>
      </Card>
    </div>
  );
}

function Securite() {
  const { session, users, updateUser } = useStore();
  const { push } = useToast();
  const me = users.find((u) => u.id === session?.userId);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const changePwd = () => {
    if (cur !== "demo2026") { push("danger", "Mot de passe actuel incorrect", "En démo : demo2026."); return; }
    if (nw.length < 8) { push("danger", "Trop court", "8 caractères minimum."); return; }
    if (nw !== conf) { push("danger", "Confirmation différente", "Vérifiez la saisie."); return; }
    push("success", "Mot de passe mis à jour", "Simulation — aucun changement réel en environnement de démonstration.");
    setCur(""); setNw(""); setConf("");
  };
  return (
    <div className="max-w-[640px] space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-bold text-ink">Sécurité du compte</h1>
        <p className="mt-1 text-sm text-mut">Protégez votre accès : vos documents académiques sont sensibles.</p>
      </div>
      <Card className="p-6 sm:p-7">
        <h2 className="font-display flex items-center gap-2 text-base font-bold text-ink"><KeyRound className="h-4.5 w-4.5 text-royal" /> Changer le mot de passe</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Mot de passe actuel" required><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="••••••••" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nouveau mot de passe" required hint="8 caractères min."><Input type="password" value={nw} onChange={(e) => setNw(e.target.value)} /></Field>
            <Field label="Confirmation" required><Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} /></Field>
          </div>
        </div>
        <div className="mt-5 flex justify-end"><Button onClick={changePwd}>Mettre à jour</Button></div>
      </Card>
      <Card className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-goldsoft text-gold"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-[14.5px] font-bold text-ink">Double authentification (2FA)</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-mut">Un code temporaire est exigé à chaque connexion depuis un nouvel appareil.</p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={me?.twoFA ?? false}
          onClick={() => { if (me) { updateUser(me.id, { twoFA: !me.twoFA }); push("success", me.twoFA ? "2FA désactivée" : "2FA activée", "Préférence enregistrée."); } }}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", me?.twoFA ? "bg-ok" : "bg-linestrong")}
        >
          <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", me?.twoFA ? "left-6" : "left-1")} />
        </button>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-ink">Sessions récentes</h2>
        <ul className="mt-4 divide-y divide-line/70">
          {[
            { d: "Cet appareil — Chrome · Parakou, Bénin", t: "Active", now: true },
            { d: "Android · Parakou, Bénin", t: "Il y a 2 jours", now: false },
          ].map((s) => (
            <li key={s.d} className="flex items-center justify-between py-3 text-sm">
              <span className="font-semibold text-inksoft">{s.d}</span>
              {s.now ? <Badge tone="ok" dot>Session active</Badge> : <span className="text-[12px] text-mut">{s.t}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-cardsoft px-4 py-3 text-[12px] leading-relaxed text-mut">
          <Lock16 /> Les mots de passe sont hachés (bcrypt/argon2), les sessions sont signées et expirées après inactivité, et chaque action sensible est journalisée dans l'audit trail.
        </p>
      </Card>
    </div>
  );
}

function Lock16() {
  return <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />;
}

export default function StudentSpace() {
  const { logout } = useStore();
  const navigate = useNavigate();
  return (
    <DashboardShell title="Espace étudiant" nav={NAV} onLogout={() => { logout(); navigate("/"); }}>
      <Routes>
        <Route index element={<Dash />} />
        <Route path="demandes" element={<MyRequests />} />
        <Route path="documents" element={<MyDocs />} />
        <Route path="notifications" element={<NotifsCenter />} />
        <Route path="profil" element={<Profil />} />
        <Route path="securite" element={<Securite />} />
        <Route path="*" element={<Dash />} />
      </Routes>
    </DashboardShell>
  );
}
