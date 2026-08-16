--- src/lib/utils.ts (原始)


+++ src/lib/utils.ts (修改后)
import type { AppStatus } from "./types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const D = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const DT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const DLONG = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : D.format(d);
}
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : DT.format(d);
}
export function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : DLONG.format(d);
}
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
export function fmtFCFA(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}
export function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}
export function nowISO(): string {
  return new Date().toISOString();
}
export function genRef(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `FLASH-2026-${n}`;
}
export function genVerifyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "FA-" + s.slice(0, 4) + "-" + s.slice(4);
}
export function genPaymentRef(): string {
  return "PAY-" + Math.floor(10000000 + Math.random() * 90000000);
}
export function maskRef(ref: string): string {
  const tail = ref.slice(-4);
  return ref.slice(0, 10) + "•••" + tail.slice(1);
}

/* ---------- workflow ---------- */

export const STATUS_META: Record<AppStatus, { label: string; tone: "mut" | "info" | "warn" | "ok" | "bad" }> = {
  SUBMITTED: { label: "Soumise", tone: "mut" },
  RECEIVED: { label: "Reçue", tone: "info" },
  UNDER_REVIEW: { label: "En vérification", tone: "warn" },
  CORRECTION_REQUIRED: { label: "Correction requise", tone: "warn" },
  APPROVED: { label: "Validée", tone: "ok" },
  DOCUMENT_READY: { label: "Document prêt", tone: "ok" },
  COMPLETED: { label: "Clôturée", tone: "ok" },
  REJECTED: { label: "Rejetée", tone: "bad" },
};

export const TRACK_STEPS: Array<{ key: AppStatus; label: string; desc: string }> = [
  { key: "SUBMITTED", label: "Demande soumise", desc: "Votre demande a été enregistrée et un numéro de suivi vous a été attribué." },
  { key: "RECEIVED", label: "Dossier reçu", desc: "Le service de scolarité a reçu votre dossier et votre paiement." },
  { key: "UNDER_REVIEW", label: "Vérification administrative", desc: "Un agent vérifie votre identité, votre parcours et vos pièces justificatives." },
  { key: "APPROVED", label: "Traitement en cours", desc: "Votre dossier est validé ; le document est en cours d'établissement." },
  { key: "DOCUMENT_READY", label: "Document disponible", desc: "Votre acte est prêt : téléchargez-le depuis votre espace ou via le suivi." },
  { key: "COMPLETED", label: "Demande clôturée", desc: "La demande est terminée. Le document reste vérifiable par QR Code." },
];

export function statusStep(status: AppStatus): number {
  switch (status) {
    case "SUBMITTED":
      return 0;
    case "RECEIVED":
      return 1;
    case "UNDER_REVIEW":
    case "CORRECTION_REQUIRED":
      return 2;
    case "APPROVED":
      return 3;
    case "DOCUMENT_READY":
      return 4;
    case "COMPLETED":
      return 5;
    default:
      return -1;
  }
}

export function nextStatuses(status: AppStatus): AppStatus[] {
  switch (status) {
    case "SUBMITTED":
      return ["RECEIVED", "REJECTED"];
    case "RECEIVED":
      return ["UNDER_REVIEW", "REJECTED"];
    case "UNDER_REVIEW":
      return ["CORRECTION_REQUIRED", "APPROVED", "REJECTED"];
    case "CORRECTION_REQUIRED":
      return ["UNDER_REVIEW", "REJECTED"];
    case "APPROVED":
      return ["DOCUMENT_READY"];
    case "DOCUMENT_READY":
      return ["COMPLETED"];
    default:
      return [];
  }
}

/* ---------- download / export ---------- */

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportCSV(filename: string, rows: Array<Record<string, string | number>>): void {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = "\uFEFF" + [keys.join(";"), ...rows.map((r) => keys.map((k) => esc(r[k])).join(";"))].join("\n");
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

/* ---------- deterministic pseudo-QR matrix ---------- */

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function qrMatrix(seed: string, n = 25): boolean[][] {
  const seedFn = xmur3(seed);
  let s = seedFn();
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const m: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const finder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[r0 + r][c0 + c] = edge || core;
      }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }
  const reserved = (r: number, c: number) =>
    (r < 9 && c < 9) || (r < 9 && c >= n - 8) || (r >= n - 8 && c < 9) || r === 6 || c === 6;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (!reserved(r, c)) m[r][c] = rng() < 0.46;
  return m;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}
