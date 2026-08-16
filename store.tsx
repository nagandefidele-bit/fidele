--- src/lib/store.tsx (原始)


+++ src/lib/store.tsx (修改后)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Application, AppStatus, AuditLog, NotifItem, Session, User, StudentRecord } from "./types";
import { DEMO_PASSWORD, SEED_APPLICATIONS, SEED_LOGS, SEED_NOTIFS, SEED_STUDENTS, SEED_USERS, actById } from "./data";
import { genPaymentRef, genRef, genVerifyCode, nowISO, uid } from "./utils";

const LS_KEY = "flashactes:v1";

export const TWO_FA_CODE = "246810";

interface Persisted {
  applications: Application[];
  notifs: NotifItem[];
  logs: AuditLog[];
  users: User[];
  students: StudentRecord[];
  session: Session | null;
  theme: "light" | "dark";
}

function loadInitial(): Persisted {
  const fallback: Persisted = {
    applications: SEED_APPLICATIONS,
    notifs: SEED_NOTIFS,
    logs: SEED_LOGS,
    users: SEED_USERS,
    students: SEED_STUDENTS,
    session: null,
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      applications: parsed.applications ?? fallback.applications,
      notifs: parsed.notifs ?? fallback.notifs,
      logs: parsed.logs ?? fallback.logs,
      users: parsed.users ?? fallback.users,
      students: parsed.students ?? fallback.students,
      session: parsed.session ?? null,
      theme: parsed.theme ?? fallback.theme,
    };
  } catch {
    return fallback;
  }
}

export interface NewApplicationInput {
  studentName: string;
  matricule: string;
  email: string;
  phone: string;
  birthDate: string;
  department: string;
  program: string;
  level: string;
  academicYear: string;
  graduationYear: string;
  actId: string;
  copies: number;
  motif: string;
  format: Application["format"];
  files: Array<{ id: string; name: string; size: number }>;
  payMethod: string;
  provider: string;
}

interface StoreApi {
  theme: "light" | "dark";
  toggleTheme: () => void;
  session: Session | null;
  login: (email: string, password: string) => { ok: boolean; twoFA?: boolean; error?: string };
  verifyTwoFA: (code: string) => { ok: boolean; error?: string };
  logout: () => void;
  register: (name: string, email: string, matricule: string, phone: string, password: string) => { ok: boolean; error?: string };
  users: User[];
  students: StudentRecord[];
  applications: Application[];
  notifs: NotifItem[];
  logs: AuditLog[];
  createApplication: (input: NewApplicationInput) => Application;
  setStatus: (id: string, status: AppStatus, comment?: string) => void;
  addNote: (id: string, text: string) => void;
  assignAgent: (id: string, agentName: string) => void;
  notifyStudent: (forUser: string | undefined, title: string, body: string, kind: NotifItem["kind"]) => void;
  markRead: (id: string) => void;
  markAllRead: (audience: "student" | "staff", forUser?: string) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  updateProfile: (patch: { name: string; phone: string }) => void;
  unreadFor: (session: Session | null) => number;
  resetDemo: () => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function useStore(): StoreApi {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider manquant");
  return s;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [init] = useState(loadInitial);
  const [applications, setApplications] = useState(init.applications);
  const [notifs, setNotifs] = useState(init.notifs);
  const [logs, setLogs] = useState(init.logs);
  const [users, setUsers] = useState(init.users);
  const [students, setStudents] = useState(init.students);
  const [session, setSession] = useState<Session | null>(init.session);
  const [theme, setTheme] = useState<"light" | "dark">(init.theme);
  const [pendingStaff, setPendingStaff] = useState<User | null>(null);

  useEffect(() => {
    const  Persisted = { applications, notifs, logs, users, students, session, theme };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* stockage plein : on ignore */
    }
  }, [applications, notifs, logs, users, students, session, theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("flashactes:theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  const pushLog = useCallback((actor: string, action: string, target: string) => {
    setLogs((ls) => [{ id: uid(), at: nowISO(), actor, action, target, ip: "10.24.3." + (10 + Math.floor(Math.random() * 80)) }, ...ls]);
  }, []);

  const pushNotif = useCallback((n: Omit<NotifItem, "id" | "at" | "read">) => {
    setNotifs((ns) => [{ ...n, id: uid(), at: nowISO(), read: false }, ...ns]);
  }, []);

  /* ---------------------------- auth ---------------------------- */

  const login = useCallback(
    (email: string, password: string) => {
      const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u) return { ok: false, error: "Aucun compte associé à cet email." };
      if (!u.active) return { ok: false, error: "Ce compte a été désactivé. Contactez l'administration." };
      if (password !== DEMO_PASSWORD) return { ok: false, error: "Mot de passe incorrect (mot de passe démo : demo2026)." };
      if (u.role !== "STUDENT" && u.twoFA) {
        setPendingStaff(u);
        return { ok: true, twoFA: true };
      }
      const s: Session = { userId: u.id, name: u.name, email: u.email, role: u.role, matricule: u.matricule };
      setSession(s);
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, lastLogin: nowISO() } : x)));
      pushLog(u.name, "Connexion réussie", u.role === "STUDENT" ? "Session étudiant" : "Session personnel");
      return { ok: true };
    },
    [users, pushLog]
  );

  const verifyTwoFA = useCallback(
    (code: string) => {
      if (!pendingStaff) return { ok: false, error: "Aucune vérification en cours." };
      if (code.trim() !== TWO_FA_CODE) {
        pushLog("Système", "Échec 2FA", pendingStaff.email);
        return { ok: false, error: "Code invalide. Code de démonstration : 246810." };
      }
      const u = pendingStaff;
      const s: Session = { userId: u.id, name: u.name, email: u.email, role: u.role, matricule: u.matricule };
      setSession(s);
      setPendingStaff(null);
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, lastLogin: nowISO() } : x)));
      pushLog(u.name, "Connexion réussie (2FA validée)", "Session personnel");
      return { ok: true };
    },
    [pendingStaff, pushLog]
  );

  const logout = useCallback(() => {
    if (session) pushLog(session.name, "Déconnexion", "Session fermée");
    setSession(null);
  }, [session, pushLog]);

  const register = useCallback(
    (name: string, email: string, matricule: string, phone: string, password: string) => {
      if (users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase()))
        return { ok: false, error: "Un compte existe déjà avec cet email." };
      if (password.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
      const u: User = { id: uid(), name: name.trim(), email: email.trim(), role: "STUDENT", matricule: matricule.trim(), phone, active: true, lastLogin: nowISO(), twoFA: false };
      setUsers((us) => [...us, u]);
      const existing = students.some((st) => st.matricule === matricule.trim());
      if (!existing)
        setStudents((ss) => [
          { matricule: matricule.trim(), name: name.trim(), email: email.trim(), phone, department: "—", program: "—", level: "—", active: true },
          ...ss,
        ]);
      setSession({ userId: u.id, name: u.name, email: u.email, role: "STUDENT", matricule: u.matricule });
      pushNotif({ audience: "student", forUser: u.id, title: "Bienvenue sur FLASH ACTES", body: "Votre compte étudiant a été créé. Vous pouvez maintenant déposer votre première demande d'acte académique.", kind: "success", channels: ["Interne", "Email"] });
      pushLog(name, "Création de compte étudiant", matricule);
      return { ok: true };
    },
    [users, students, pushLog, pushNotif]
  );

  /* ------------------------- applications ----------------------- */

  const createApplication = useCallback(
    (input: NewApplicationInput): Application => {
      const ref = genRef();
      const at = nowISO();
      const act = actById(input.actId);
      const app: Application = {
        id: uid(),
        ref,
        studentName: input.studentName,
        matricule: input.matricule,
        email: input.email,
        phone: input.phone,
        birthDate: input.birthDate,
        department: input.department,
        program: input.program,
        level: input.level,
        academicYear: input.academicYear,
        graduationYear: input.graduationYear,
        actId: input.actId,
        copies: input.copies,
        motif: input.motif,
        format: input.format,
        files: input.files.map((f) => ({ ...f, progress: 100 })),
        status: "RECEIVED",
        createdAt: at,
        history: [
          { status: "SUBMITTED", at, by: input.studentName },
          { status: "RECEIVED", at, by: "Système", comment: "Paiement simulé confirmé — dossier transmis à la scolarité." },
        ],
        notes: [],
        payment: { ref: genPaymentRef(), amount: act.fee, method: input.payMethod, provider: input.provider, status: "CONFIRME", at },
      };
      setApplications((as) => [app, ...as]);
      pushNotif({ audience: "staff", title: "Nouvelle demande", body: `${ref} — ${input.studentName} — ${act.name}. Dossier en attente d'affectation.`, kind: "info", channels: ["Interne"] });
      const owner = users.find((u) => u.matricule === input.matricule);
      pushNotif({ audience: "student", forUser: owner?.id, title: "Demande enregistrée", body: `Votre demande ${ref} (${act.name}) a bien été reçue. Conservez votre numéro de suivi.`, kind: "success", channels: ["Interne", "Email", "SMS"] });
      pushLog("Système", "Création de demande + paiement simulé", ref);
      return app;
    },
    [users, pushLog, pushNotif]
  );

  const setStatus = useCallback(
    (id: string, status: AppStatus, comment?: string) => {
      const by = session?.name ?? "Agent";
      setApplications((as) =>
        as.map((a) => {
          if (a.id !== id) return a;
          const doc = status === "DOCUMENT_READY" ? a.document ?? { issuedAt: nowISO(), verifyCode: genVerifyCode() } : a.document;
          return { ...a, status, document: doc, assignee: a.assignee ?? by, history: [...a.history, { status, at: nowISO(), by, comment }] };
        })
      );
      const app = applications.find((a) => a.id === id);
      if (!app) return;
      const act = actById(app.actId);
      const owner = users.find((u) => u.matricule === app.matricule);
      const msg: Record<AppStatus, [NotifItem["kind"], string, string] | null> = {
        SUBMITTED: null,
        RECEIVED: ["info", "Dossier reçu", `Votre demande ${app.ref} a été transmise au service de scolarité.`],
        UNDER_REVIEW: ["warning", "Vérification en cours", `Votre demande ${app.ref} (${act.name}) est en cours de vérification administrative.`],
        CORRECTION_REQUIRED: ["warning", "Correction demandée", `Un complément est nécessaire pour ${app.ref} : ${comment ?? "consultez le suivi."}`],
        APPROVED: ["success", "Demande validée", `Votre dossier ${app.ref} est validé. Le document est en cours d'établissement.`],
        DOCUMENT_READY: ["success", "Document disponible", `Votre ${act.name} (${app.ref}) est prêt. Téléchargez-le depuis votre espace.`],
        COMPLETED: ["info", "Demande clôturée", `La demande ${app.ref} est clôturée. Le document reste vérifiable par QR Code.`],
        REJECTED: ["danger", "Demande rejetée", `Votre demande ${app.ref} a été rejetée. Motif : ${comment ?? "voir le suivi."}`],
      };
      const m = msg[status];
      if (m) pushNotif({ audience: "student", forUser: owner?.id, title: m[1], body: m[2], kind: m[0], channels: ["Interne", "Email", "SMS"] });
      pushLog(by, `Changement de statut → ${status}`, app.ref);
    },
    [applications, users, session, pushLog, pushNotif]
  );

  const addNote = useCallback(
    (id: string, text: string) => {
      const by = session?.name ?? "Agent";
      setApplications((as) => as.map((a) => (a.id === id ? { ...a, notes: [...a.notes, { at: nowISO(), by, text }] } : a)));
      const app = applications.find((a) => a.id === id);
      if (app) pushLog(by, "Ajout d'une note interne", app.ref);
    },
    [applications, session, pushLog]
  );

  const assignAgent = useCallback(
    (id: string, agentName: string) => {
      setApplications((as) => as.map((a) => (a.id === id ? { ...a, assignee: agentName } : a)));
      const app = applications.find((a) => a.id === id);
      if (app) pushLog(session?.name ?? "Superviseur", `Affectation à ${agentName}`, app.ref);
    },
    [applications, session, pushLog]
  );

  const notifyStudent = useCallback(
    (forUser: string | undefined, title: string, body: string, kind: NotifItem["kind"]) => {
      pushNotif({ audience: "student", forUser, title, body, kind, channels: ["Interne", "Email", "WhatsApp"] });
      const app = applications.find((a) => users.find((u) => u.id === forUser)?.matricule === a.matricule);
      pushLog(session?.name ?? "Agent", "Notification envoyée", app?.ref ?? forUser ?? "—");
    },
    [applications, users, session, pushNotif, pushLog]
  );

  const markRead = useCallback((id: string) => setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(
    (audience: "student" | "staff", forUser?: string) =>
      setNotifs((ns) => ns.map((n) => (n.audience === audience && (!forUser || n.forUser === forUser || !n.forUser) ? { ...n, read: true } : n))),
    []
  );

  const updateUser = useCallback(
    (id: string, patch: Partial<User>) => {
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));
      const u = users.find((x) => x.id === id);
      if (u) pushLog(session?.name ?? "Admin", "Mise à jour utilisateur", u.email);
    },
    [users, session, pushLog]
  );

  const updateProfile = useCallback(
    (patch: { name: string; phone: string }) => {
      if (!session) return;
      setUsers((us) => us.map((u) => (u.id === session.userId ? { ...u, name: patch.name, phone: patch.phone } : u)));
      setSession({ ...session, name: patch.name });
      if (session.matricule)
        setStudents((ss) => ss.map((st) => (st.matricule === session.matricule ? { ...st, name: patch.name, phone: patch.phone } : st)));
    },
    [session]
  );

  const unreadFor = useCallback(
    (s: Session | null): number => {
      if (!s) return 0;
      if (s.role === "STUDENT") return notifs.filter((n) => n.audience === "student" && (!n.forUser || n.forUser === s.userId) && !n.read).length;
      return notifs.filter((n) => n.audience === "staff" && !n.read).length;
    },
    [notifs]
  );

  const resetDemo = useCallback(() => {
    setApplications(SEED_APPLICATIONS);
    setNotifs(SEED_NOTIFS);
    setLogs(SEED_LOGS);
    setUsers(SEED_USERS);
    setStudents(SEED_STUDENTS);
    setSession(null);
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      theme,
      toggleTheme,
      session,
      login,
      verifyTwoFA,
      logout,
      register,
      users,
      students,
      applications,
      notifs,
      logs,
      createApplication,
      setStatus,
      addNote,
      assignAgent,
      notifyStudent,
      markRead,
      markAllRead,
      updateUser,
      updateProfile,
      unreadFor,
      resetDemo,
    }),
    [theme, toggleTheme, session, login, verifyTwoFA, logout, register, users, students, applications, notifs, logs, createApplication, setStatus, addNote, assignAgent, notifyStudent, markRead, markAllRead, updateUser, updateProfile, unreadFor, resetDemo]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
