--- src/components/ui.tsx (原始)


+++ src/components/ui.tsx (修改后)
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn, STATUS_META } from "../lib/utils";
import type { AppStatus } from "../lib/types";

/* ------------------------------ Toasts ------------------------------ */

type ToastKind = "success" | "info" | "warning" | "danger";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
}
const ToastCtx = createContext<{ push: (kind: ToastKind, title: string, desc?: string) => void } | null>(null);
export function useToast() {
  const t = useContext(ToastCtx);
  if (!t) throw new Error("ToastProvider manquant");
  return t;
}

const TOAST_META: Record<ToastKind, { icon: typeof Info; cls: string; bar: string }> = {
  success: { icon: CheckCircle2, cls: "text-ok", bar: "bg-ok" },
  info: { icon: Info, cls: "text-info", bar: "bg-info" },
  warning: { icon: AlertTriangle, cls: "text-warn", bar: "bg-warn" },
  danger: { icon: XCircle, cls: "text-bad", bar: "bg-bad" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((kind: ToastKind, title: string, desc?: string) => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts.slice(-3), { id, kind, title, desc }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4600);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="fixed right-4 top-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((t) => {
            const M = TOAST_META[t.kind];
            const Icon = M.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="relative overflow-hidden rounded-lg border border-line bg-card shadow-lg shadow-navy/10"
              >
                <div className={cn("absolute inset-y-0 left-0 w-1", M.bar)} />
                <div className="flex items-start gap-3 py-3 pl-4 pr-3">
                  <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", M.cls)} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{t.title}</p>
                    {t.desc && <p className="mt-0.5 text-xs leading-relaxed text-mut">{t.desc}</p>}
                  </div>
                  <button
                    onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
                    className="ml-auto rounded p-1 text-mut transition hover:bg-cardsoft hover:text-ink"
                    aria-label="Fermer la notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------ Button ------------------------------ */

type BtnVariant = "primary" | "gold" | "outline" | "ghost" | "danger" | "ok" | "navy";
type BtnSize = "sm" | "md" | "lg";

const BTN_V: Record<BtnVariant, string> = {
  primary: "bg-royal text-white hover:bg-royaldeep shadow-sm shadow-royal/25",
  gold: "bg-goldbright text-navy hover:brightness-105 shadow-sm shadow-gold/30 font-bold",
  outline: "border border-linestrong bg-card text-ink hover:border-royal hover:text-royal",
  ghost: "text-inksoft hover:bg-cardsoft hover:text-ink",
  danger: "bg-bad text-white hover:brightness-110 shadow-sm shadow-bad/25",
  ok: "bg-ok text-white hover:brightness-110 shadow-sm shadow-ok/25",
  navy: "bg-navy text-white hover:bg-navy3 border border-navy3",
};
const BTN_S: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        BTN_V[variant],
        BTN_S[size],
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------ Badges ------------------------------ */

export type Tone = "mut" | "info" | "warn" | "ok" | "bad" | "gold" | "royal";
const TONE_CLS: Record<Tone, string> = {
  mut: "bg-cardsoft text-mut border-line",
  info: "bg-infosoft text-info border-info/25",
  warn: "bg-warnsoft text-warn border-warn/25",
  ok: "bg-oksoft text-ok border-ok/25",
  bad: "bg-badsoft text-bad border-bad/25",
  gold: "bg-goldsoft text-gold border-gold/30",
  royal: "bg-royalsoft text-royal border-royal/25",
};

export function Badge({ tone = "mut", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", TONE_CLS[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: AppStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <Badge tone={m.tone} dot className={className}>
      {m.label}
    </Badge>
  );
}

/* ------------------------------- Cards ------------------------------ */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(10_20_40/0.04)]", className)}>{children}</div>;
}

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={cn("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      <p className={cn("eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold")}>{eyebrow}</p>
      <h2 className="font-display mt-3 text-[26px] font-bold leading-tight text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3.5 text-[15px] leading-relaxed text-mut">{sub}</p>}
    </div>
  );
}

/* ------------------------------ Champs ------------------------------ */

const FIELD_BASE =
  "w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-mut/70 transition focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20";

export function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-ink">
        <span>
          {label} {required && <span className="text-bad">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-mut">{hint}</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-bad">
          <AlertTriangle className="h-3 w-3" aria-hidden /> {error}
        </span>
      )}
    </label>
  );
}

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(FIELD_BASE, invalid && "border-bad focus:border-bad focus:ring-bad/15", className)} {...props} />;
}
export function Select({ invalid, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select className={cn(FIELD_BASE, "appearance-none bg-[url('image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%3E%3Cpath%20d=%22M1%201l5%205%205-5%22%20stroke=%22%235d6f92%22%20stroke-width=%221.6%22%20fill=%22none%22/%3E%3C/svg%3E')] bg-[right_14px_center] bg-no-repeat pr-9", invalid && "border-bad", className)} {...props}>
      {children}
    </select>
  );
}
export function Textarea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn(FIELD_BASE, "min-h-[96px]", invalid && "border-bad", className)} {...props} />;
}

/* ------------------------------- Modal ------------------------------ */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card shadow-2xl sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-6 py-4">
              <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-mut transition hover:bg-cardsoft hover:text-ink" aria-label="Fermer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------- Divers états --------------------------- */

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-linestrong bg-cardsoft/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-royalsoft text-royal">{icon}</div>
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-mut">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} role="status" aria-label="Chargement" />
  );
}

/* ----------------------------- Pagination --------------------------- */

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 pt-4" aria-label="Pagination">
      <p className="text-xs text-mut">
        Page <span className="font-bold text-ink">{page}</span> / {pages}
      </p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
          Précédent
        </Button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-bold transition",
              p === page ? "bg-royal text-white" : "border border-line bg-card text-inksoft hover:border-royal hover:text-royal"
            )}
          >
            {p}
          </button>
        ))}
        <Button variant="outline" size="sm" disabled={page === pages} onClick={() => onPage(page + 1)}>
          Suivant
        </Button>
      </div>
    </nav>
  );
}
