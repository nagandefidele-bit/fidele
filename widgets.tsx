--- src/components/widgets.tsx (原始)


+++ src/components/widgets.tsx (修改后)
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import type { Application } from "../lib/types";
import { actById } from "../lib/data";
import { TRACK_STEPS, cn, fmtDateLong, fmtDateTime, maskRef, qrMatrix, statusStep } from "../lib/utils";

/* ------------------------------- Logo ------------------------------- */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" className="fill-navy dark:fill-navy3" />
      <path d="M20 14h24v7H28v9h13v7H28v13h-8z" fill="var(--color-goldbright, #d4af37)" />
      <circle cx="47" cy="47" r="7" fill="none" stroke="#5B84F0" strokeWidth="3.5" />
      <path d="M44 47l2.2 2.2L50.5 45" fill="none" stroke="#5B84F0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9 shrink-0" />
      {!compact && (
        <span className="leading-none">
          <span className="font-display block text-[17px] font-bold tracking-tight text-ink">
            FLASH <span className="text-royal">ACTES</span>
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-mut">Université de Parakou</span>
        </span>
      )}
    </span>
  );
}

export function UPSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M60 34c-9-5-20-6-27-5v44c7-1 18 0 27 5 9-5 20-6 27-5V29c-7-1-18 0-27 5z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M60 34v44" stroke="currentColor" strokeWidth="2" />
      <path d="M40 44c6 0 13 1 18 3M40 54c6 0 13 1 18 3M80 44c-6 0-13 1-18 3M80 54c-6 0-13 1-18 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M60 14l3.5 7 7.8 1.1-5.6 5.5 1.3 7.7L60 31.7l-7 3.6 1.3-7.7-5.6-5.5 7.8-1.1z" fill="currentColor" />
      <text x="60" y="102" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="Space Grotesk, sans-serif" letterSpacing="2">
        UP · FLASH
      </text>
    </svg>
  );
}

/* ------------------------------ Reveal ------------------------------ */

export function Reveal({ children, delay = 0, y = 26, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ Counter ----------------------------- */

export function Counter({ to, prefix = "", suffix = "", duration = 1600 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {new Intl.NumberFormat("fr-FR").format(val)}
      {suffix}
    </span>
  );
}

/* ------------------------------- Ticker ----------------------------- */

export function Ticker({ apps }: { apps: Application[] }) {
  const items = apps.slice(0, 9);
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((a) => (
        <span key={key + a.id} className="mx-5 flex items-center gap-2.5 text-[12.5px] font-medium text-mut">
          <span className={cn("h-1.5 w-1.5 rounded-full", a.status === "REJECTED" ? "bg-bad" : a.status === "DOCUMENT_READY" || a.status === "COMPLETED" ? "bg-ok" : "bg-royal")} />
          <span className="font-mono font-semibold tracking-tight text-ink/80 dark:text-ink/90">{maskRef(a.ref)}</span>
          {actById(a.actId).name}
          <span className="text-mut/70">·</span>
          <span className="uppercase tracking-wide text-[11px]">{a.status === "DOCUMENT_READY" ? "délivré" : a.status === "COMPLETED" ? "clôturé" : "en cours"}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden border-y border-line bg-card/70 py-3" aria-hidden>
      <div className="marquee-track flex w-max">{row("a")}{row("b")}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}

/* ------------------------------ QR (SVG) ---------------------------- */

export function QRSvg({ seed, size = 116, className, light = "#fdfdfb" }: { seed: string; size?: number; className?: string; light?: string }) {
  const m = useMemo(() => qrMatrix(seed, 21), [seed]);
  const n = m.length;
  const q = 2;
  const total = n + q * 2;
  const cell = size / total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="QR Code de vérification">
      <rect width={size} height={size} fill={light} rx={4} />
      {m.map((row, r) =>
        row.map((v, c) =>
          v ? <rect key={`${r}-${c}`} x={(c + q) * cell} y={(r + q) * cell} width={cell + 0.3} height={cell + 0.3} fill="#0c1b3a" /> : null
        )
      )}
    </svg>
  );
}

/* --------------------------- Timeline suivi ------------------------- */

export function TrackTimeline({ app, compact }: { app: Application; compact?: boolean }) {
  const step = statusStep(app.status);
  const rejected = app.status === "REJECTED";
  const correction = app.history.find((h) => h.status === "CORRECTION_REQUIRED");
  const dateFor = (key: string) => {
    const h = app.history.filter((x) => x.status === key);
    return h.length ? h[h.length - 1] : undefined;
  };
  return (
    <ol className="relative">
      {!compact && (
        <span className="absolute bottom-3 left-[13px] top-3 w-px bg-line" aria-hidden>
          <span
            className="timeline-draw absolute inset-0 bg-gradient-to-b from-royal to-gold"
            style={{ clipPath: `inset(0 0 ${100 - Math.max(0, (rejected ? 2.6 : step + 0.6)) * (100 / 5.6)}% 0)` }}
          />
        </span>
      )}
      {TRACK_STEPS.map((s, i) => {
        const done = !rejected && step >= i;
        const current = !rejected && step === i;
        const h = dateFor(s.key);
        return (
          <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
            <span
              className={cn(
                "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
                done ? "border-royal bg-royal text-white" : "border-linestrong bg-card text-transparent",
                current && "pulse-dot border-royal bg-card",
                rejected && i === 3 && "border-bad bg-bad text-white"
              )}
            >
              {done && !current ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : current ? <span className="h-2 w-2 rounded-full bg-royal" /> : rejected && i === 3 ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-linestrong" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-sm font-bold", done || current ? "text-ink" : "text-mut")}>
                {s.label}
                {rejected && i === 3 && <span className="ml-2 rounded-full bg-badsoft px-2 py-0.5 text-[11px] font-bold text-bad">Demande rejetée</span>}
              </p>
              {!compact && <p className={cn("mt-0.5 text-[12.5px] leading-relaxed", done || current ? "text-mut" : "text-mut/60")}>{rejected && i === 3 ? "Votre dossier n'a pas pu aboutir. Consultez le motif ci-dessous." : s.desc}</p>}
              {h && (
                <p className="mt-1.5 text-[11.5px] font-semibold text-royal">
                  {fmtDateTime(h.at)} <span className="font-medium text-mut">· {h.by}</span>
                </p>
              )}
              {h?.comment && <p className="mt-1 max-w-md rounded-lg border border-line bg-cardsoft px-3 py-2 text-[12px] italic leading-relaxed text-inksoft">« {h.comment} »</p>}
            </div>
          </li>
        );
      })}
      {correction && !rejected && (
        <li className="relative flex gap-4 pb-1">
          <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-warn bg-warnsoft text-warn">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <div className="pt-0.5">
            <p className="text-sm font-bold text-warn">Correction demandée</p>
            <p className="mt-1 text-[11.5px] font-semibold text-royal">
              {fmtDateTime(correction.at)} <span className="font-medium text-mut">· {correction.by}</span>
            </p>
            {correction.comment && <p className="mt-1 max-w-md rounded-lg border border-warn/30 bg-warnsoft px-3 py-2 text-[12px] italic leading-relaxed text-inksoft">« {correction.comment} »</p>}
          </div>
        </li>
      )}
    </ol>
  );
}

/* ------------------------------ Graphiques -------------------------- */

const CHART_COLORS = ["#1a4fd6", "#d4af37", "#5b84f0", "#177a49", "#e2a63d", "#8b5cf6", "#bb3a3a"];

export function MonthBars({ data, height = 210 }: {  Array<{ m: string; v: number }>; height?: number }) {
  const max = Math.max(...data.map((d) => d.v));
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="relative">
      <div className="flex items-end gap-[6%] px-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.m} className="group relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            {active === i && (
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] font-bold text-white shadow-lg">
                {d.v} demandes
              </div>
            )}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] }}
              className={cn("origin-bottom rounded-t-[5px] transition-colors", i === data.length - 1 ? "bg-goldbright" : "bg-royal/85 group-hover:bg-royal")}
              style={{ height: `${(d.v / max) * 100}%` }}
              role="img"
              aria-label={`${d.m} : ${d.v} demandes`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[6%] border-t border-line px-1 pt-2">
        {data.map((d) => (
          <span key={d.m} className="flex-1 text-center text-[10.5px] font-semibold text-mut">
            {d.m}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ items, centerLabel }: { items: Array<{ label: string; value: number }>; centerLabel: string }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" strokeWidth="17" className="stroke-line" />
        {items.map((it, i) => {
          const frac = it.value / total;
          const dash = `${frac * C} ${C}`;
          const off = -acc * C;
          acc += frac;
          return (
            <motion.circle
              key={it.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              strokeWidth="17"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeDasharray={dash}
              initial={{ strokeDashoffset: 0, opacity: 0 }}
              whileInView={{ strokeDashoffset: off, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          );
        })}
        <g className="rotate-90" style={{ transformOrigin: "70px 70px" }}>
          <text x="70" y="66" textAnchor="middle" className="fill-ink font-display" fontSize="22" fontWeight="700">
            {total}
          </text>
          <text x="70" y="84" textAnchor="middle" className="fill-mut" fontSize="9" fontWeight="600">
            {centerLabel}
          </text>
        </g>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="truncate font-medium text-inksoft">{it.label}</span>
            <span className="ml-auto font-bold text-ink">{Math.round((it.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBars({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((i) => i.value)) || 1;
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
            <span className="font-medium text-inksoft">{it.label}</span>
            <span className="font-bold text-ink">{it.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cardsoft">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(it.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-royal to-royal/70"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------ Aperçu document officiel ------------------ */

export function DocumentPreview({ app }: { app: Application }) {
  const act = actById(app.actId);
  return (
    <div className="paper relative mx-auto w-full max-w-[620px] overflow-hidden rounded-sm px-8 py-9 sm:px-12 sm:py-11">
      <UPSeal className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rotate-[-14deg] text-[#16233f]/[0.05]" />
      <header className="relative text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a742c]">République du Bénin · Ministère de l'Enseignement Supérieur</p>
        <div className="mx-auto mt-4 flex items-center justify-center gap-3">
          <UPSeal className="h-14 w-14 text-[#0f2c5e]" />
          <div className="text-left">
            <p className="font-display text-[17px] font-bold leading-tight text-[#0f2c5e]">UNIVERSITÉ DE PARAKOU</p>
            <p className="text-[11px] font-semibold text-[#48536e]">Faculté des Lettres, Arts et Sciences Humaines — FLASH</p>
          </div>
        </div>
        <div className="mx-auto mt-5 h-[3px] w-24 bg-[#d4af37]" />
        <h4 className="font-display mt-6 text-[22px] font-bold uppercase tracking-wide text-[#0f2c5e]">{act.name}</h4>
        <p className="mt-1.5 text-[12px] font-bold tracking-wide text-[#1a4fd6]">Référence : {app.ref}</p>
      </header>

      <div className="relative mt-7 space-y-3 text-[12.5px] leading-relaxed text-[#2a3550]">
        <p>Le Doyen de la Faculté des Lettres, Arts et Sciences Humaines de l'Université de Parakou, vu les registres d'inscription et les procès-verbaux de délibération de la FLASH, atteste que :</p>
        <p className="text-center">
          <span className="font-display text-[17px] font-bold text-[#0f2c5e]">{app.studentName}</span>
          <br />
          <span className="text-[11.5px] text-[#48536e]">
            Matricule {app.matricule} — né(e) le {fmtDateLong(app.birthDate)}
          </span>
          <br />
          <span className="text-[11.5px] text-[#48536e]">
            {app.program} · {app.level}
            {app.graduationYear !== "—" ? ` · Année d'obtention ${app.graduationYear}` : ` · Année académique ${app.academicYear}`}
          </span>
        </p>
        <p>a satisfait aux exigences académiques requises et se voit délivrer la présente {act.name.toLowerCase()} pour servir et valoir ce que de droit.</p>
      </div>

      <div className="relative mt-8 flex items-end justify-between gap-6">
        <div>
          <QRSvg seed={"FLASHACTES|VERIFY|" + (app.document?.verifyCode ?? app.ref)} size={92} />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#0f2c5e]">Vérification d'authenticité</p>
          <p className="font-mono text-[11px] font-bold text-[#1a4fd6]">{app.document?.verifyCode ?? "—"}</p>
          <p className="mt-0.5 text-[9.5px] text-[#7a839c]">flash-actes.up.bj/verify</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-[#2a3550]">Fait à Parakou, le {fmtDateLong(app.document?.issuedAt ?? app.createdAt)}</p>
          <p className="mt-10 text-[12.5px] font-bold text-[#0f2c5e]">Le Doyen de la FLASH</p>
          <div className="mx-auto mt-1 h-px w-36 bg-[#b9c2d4]" />
          <p className="mt-1 text-[9.5px] italic text-[#7a839c]">Signature électronique sécurisée</p>
        </div>
      </div>

      <footer className="relative mt-8 border-t border-[#e3e6ee] pt-3 text-center text-[9px] italic text-[#8a93a8]">
        Document numérique délivré via FLASH ACTES — toute falsification expose son auteur à des poursuites.
      </footer>
    </div>
  );
}
