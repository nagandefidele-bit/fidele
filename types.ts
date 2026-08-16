--- src/lib/types.ts (原始)


+++ src/lib/types.ts (修改后)
export type Role = "STUDENT" | "AGENT" | "SUPERVISOR" | "ADMIN";

export type AppStatus =
  | "SUBMITTED"
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "APPROVED"
  | "DOCUMENT_READY"
  | "COMPLETED"
  | "REJECTED";

export interface HistoryEntry {
  status: AppStatus;
  at: string;
  by: string;
  comment?: string;
}

export interface AppFile {
  id: string;
  name: string;
  size: number;
  progress: number;
}

export interface Payment {
  ref: string;
  amount: number;
  method: string;
  provider: string;
  status: "CONFIRME" | "EN_ATTENTE" | "ECHEC";
  at: string;
}

export interface ApplicationNote {
  at: string;
  by: string;
  text: string;
}

export interface Application {
  id: string;
  ref: string;
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
  format: "Numerique (PDF)" | "Papier" | "Papier + Numerique";
  files: AppFile[];
  status: AppStatus;
  assignee?: string;
  createdAt: string;
  history: HistoryEntry[];
  notes: ApplicationNote[];
  payment: Payment;
  document?: { issuedAt: string; verifyCode: string };
}

export interface NotifItem {
  id: string;
  audience: "student" | "staff";
  forUser?: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "info" | "success" | "warning" | "danger";
  channels: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  matricule?: string;
  phone?: string;
  active: boolean;
  lastLogin: string;
  twoFA: boolean;
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
}

export interface ActType {
  id: string;
  name: string;
  desc: string;
  fee: number;
  delay: string;
  icon: string;
}

export interface StudentRecord {
  matricule: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  program: string;
  level: string;
  active: boolean;
}

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: Role;
  matricule?: string;
}
