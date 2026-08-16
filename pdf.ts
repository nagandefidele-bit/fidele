--- src/lib/pdf.ts (原始)


+++ src/lib/pdf.ts (修改后)
import type { Application } from "./types";
import { fmtDateLong, qrMatrix } from "./utils";
import { actById } from "./data";

/* ------------------------------------------------------------------ */
/* Générateur PDF minimal (format PDF 1.4 écrit à la main)             */
/* Textes Helvetica (WinAnsi), rectangles, lignes, QR en cellules.     */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

type PdfOp =
  | { k: "rect"; x: number; y: number; w: number; h: number; color: RGB }
  | { k: "line"; x1: number; y1: number; x2: number; y2: number; color: RGB; width: number }
  | { k: "text"; x: number; y: number; size: number; text: string; font?: 1 | 2 | 3; color?: RGB; center?: boolean }
  | { k: "qr"; x: number; y: number; cell: number; seed: string; color: RGB };

const H = 842; // hauteur A4 en points

const NAVY: RGB = [0.055, 0.098, 0.2];
const GOLD: RGB = [0.79, 0.64, 0.16];
const INK: RGB = [0.11, 0.16, 0.28];
const MUT: RGB = [0.42, 0.48, 0.58];

function norm(s: string): string {
  return s
    .replace(/\u2019/g, "'")
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\xFF]/g, "");
}

function esc(s: string): string {
  return norm(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function latin1(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const rgb = (c: RGB) => c.map((v) => v.toFixed(3)).join(" ");

function opToStr(op: PdfOp): string {
  switch (op.k) {
    case "rect":
      return `${rgb(op.color)} rg ${op.x} ${H - op.y - op.h} ${op.w} ${op.h} re f`;
    case "line":
      return `${rgb(op.color)} RG ${op.width} w ${op.x1} ${H - op.y1} m ${op.x2} ${H - op.y2} l S`;
    case "text": {
      const w = op.text.length * op.size * (op.font === 2 ? 0.56 : 0.5);
      const x = op.center ? Math.max(0, (595 - w) / 2) : op.x;
      const col = rgb(op.color ?? INK);
      return `BT ${col} rg /F${op.font ?? 1} ${op.size} Tf ${x.toFixed(1)} ${H - op.y} Td (${esc(op.text)}) Tj ET`;
    }
    case "qr": {
      const m = qrMatrix(op.seed, 21);
      const cells: string[] = [];
      for (let r = 0; r < m.length; r++)
        for (let c = 0; c < m[r].length; c++)
          if (m[r][c]) cells.push(`${op.x + c * op.cell} ${H - op.y - (r + 1) * op.cell} ${op.cell} ${op.cell} re`);
      return `${rgb(op.color)} rg ${cells.join(" ")} f`;
    }
  }
}

function buildPdf(ops: PdfOp[]): Blob {
  const content = ops.map(opToStr).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>",
    `<< /Length ${latin1(content).length} >>\nstream\n${content}\nendstream`,
  ];
  const parts: Uint8Array[] = [latin1("%PDF-1.4\n")];
  const offsets: number[] = [];
  let pos = parts[0].length;
  objects.forEach((body, i) => {
    offsets.push(pos);
    const chunk = latin1(`${i + 1} 0 obj\n${body}\nendobj\n`);
    parts.push(chunk);
    pos += chunk.length;
  });
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) xref += `${String(o).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;
  parts.push(latin1(xref));
  return new Blob([concatBytes(parts).buffer as ArrayBuffer], { type: "application/pdf" });
}

function wrap(text: string, max = 96): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else cur += " " + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function header(ops: PdfOp[], subtitle: string): void {
  ops.push({ k: "rect", x: 0, y: 0, w: 595, h: 92, color: NAVY });
  ops.push({ k: "rect", x: 0, y: 92, w: 595, h: 3, color: GOLD });
  ops.push({ k: "text", x: 0, y: 32, size: 15, font: 2, text: "UNIVERSITE DE PARAKOU", color: [1, 1, 1], center: true });
  ops.push({ k: "text", x: 0, y: 52, size: 9.5, font: 2, text: "FACULTE DES LETTRES, ARTS ET SCIENCES HUMAINES (FLASH)", color: [0.87, 0.76, 0.42], center: true });
  ops.push({ k: "text", x: 0, y: 72, size: 8, font: 3, text: subtitle, color: [0.72, 0.78, 0.88], center: true });
}

function qrBlock(ops: PdfOp[], x: number, y: number, seed: string): void {
  ops.push({ k: "rect", x: x - 6, y: y - 6, w: 21 * 3.4 + 12, h: 21 * 3.4 + 12, color: [1, 1, 1] });
  ops.push({ k: "line", x1: x - 6, y1: y - 6, x2: x + 21 * 3.4 + 6, y2: y - 6, color: [0.85, 0.87, 0.9], width: 0.6 });
  ops.push({ k: "line", x1: x - 6, y1: y + 21 * 3.4 + 6, x2: x + 21 * 3.4 + 6, y2: y + 21 * 3.4 + 6, color: [0.85, 0.87, 0.9], width: 0.6 });
  ops.push({ k: "line", x1: x - 6, y1: y - 6, x2: x - 6, y2: y + 21 * 3.4 + 6, color: [0.85, 0.87, 0.9], width: 0.6 });
  ops.push({ k: "line", x1: x + 21 * 3.4 + 6, y1: y - 6, x2: x + 21 * 3.4 + 6, y2: y + 21 * 3.4 + 6, color: [0.85, 0.87, 0.9], width: 0.6 });
  ops.push({ k: "qr", x, y, cell: 3.4, seed, color: NAVY });
}

function footer(ops: PdfOp[], note: string): void {
  ops.push({ k: "line", x1: 48, y1: 782, x2: 547, y2: 782, color: [0.82, 0.85, 0.9], width: 0.7 });
  ops.push({ k: "text", x: 48, y: 798, size: 7.5, font: 3, text: note, color: MUT });
  ops.push({ k: "text", x: 547, y: 798, size: 7.5, font: 3, text: "flash-actes.up.bj", color: MUT, });
}

/* ------------------------- Reçu de demande ------------------------ */

export function receiptPdf(app: Application): Blob {
  const act = actById(app.actId);
  const ops: PdfOp[] = [];
  header(ops, "Plateforme numerique de demande et de suivi des actes academiques");

  ops.push({ k: "text", x: 0, y: 140, size: 18, font: 2, text: "RECU DE DEMANDE", color: NAVY, center: true });
  ops.push({ k: "rect", x: 252, y: 152, w: 91, h: 2.4, color: GOLD });
  ops.push({ k: "text", x: 0, y: 178, size: 12, font: 2, text: app.ref, color: [0.1, 0.3, 0.8], center: true });
  ops.push({ k: "text", x: 0, y: 196, size: 9, font: 3, text: "Conservez cette reference pour suivre votre dossier", color: MUT, center: true });

  const rows: Array<[string, string]> = [
    ["Etudiant(e)", app.studentName],
    ["Matricule", app.matricule],
    ["Departement", app.department],
    ["Filiere / Niveau", `${app.program} - ${app.level}`],
    ["Acte demande", act.name],
    ["Nombre d'exemplaires", String(app.copies)],
    ["Motif", app.motif],
    ["Format souhaite", app.format],
    ["Date de la demande", fmtDateLong(app.createdAt)],
  ];
  let y = 236;
  for (const [k, v] of rows) {
    ops.push({ k: "text", x: 60, y, size: 9.5, font: 2, text: k.toUpperCase(), color: MUT });
    ops.push({ k: "text", x: 205, y, size: 10, font: 1, text: v, color: INK });
    ops.push({ k: "line", x1: 60, y1: y + 8, x2: 535, y2: y + 8, color: [0.9, 0.92, 0.95], width: 0.6 });
    y += 27;
  }

  ops.push({ k: "rect", x: 60, y: y + 4, w: 475, h: 52, color: [0.96, 0.94, 0.87] });
  ops.push({ k: "text", x: 78, y: y + 26, size: 9.5, font: 2, text: "FRAIS DE DOSSIER", color: [0.55, 0.45, 0.15] });
  ops.push({ k: "text", x: 78, y: y + 44, size: 13, font: 2, text: act.fee > 0 ? `${act.fee.toLocaleString("fr-FR").replace(/\u202f/g, " ")} FCFA` : "Selon devis", color: NAVY });
  ops.push({ k: "text", x: 517, y: y + 26, size: 9.5, font: 2, text: app.payment.status === "CONFIRME" ? "PAIEMENT CONFIRME" : "PAIEMENT EN ATTENTE", color: app.payment.status === "CONFIRME" ? [0.09, 0.48, 0.29] : [0.66, 0.42, 0.06] });
  ops.push({ k: "text", x: 517, y: y + 44, size: 8.5, font: 3, text: `${app.payment.method} - ${app.payment.ref}`, color: MUT });

  qrBlock(ops, 66, 660, "FLASHACTES|" + app.ref);
  ops.push({ k: "text", x: 156, y: 676, size: 9.5, font: 2, text: "Code de verification", color: NAVY });
  ops.push({ k: "text", x: 156, y: 694, size: 11, font: 2, text: app.ref, color: [0.1, 0.3, 0.8] });
  ops.push({ k: "text", x: 156, y: 714, size: 8.5, font: 1, text: "Scannez le QR Code ou saisissez la reference sur", color: MUT });
  ops.push({ k: "text", x: 156, y: 728, size: 8.5, font: 2, text: "flash-actes.up.bj/suivi", color: NAVY });

  footer(ops, "Document genere par FLASH ACTES - environnement de demonstration, donnees fictives.");
  return buildPdf(ops);
}

/* ----------------------- Document académique ---------------------- */

export function documentPdf(app: Application): Blob {
  const act = actById(app.actId);
  const ops: PdfOp[] = [];
  header(ops, "Republique du Benin - Ministere de l'Enseignement Superieur et de la Recherche Scientifique");

  // cadre décoratif
  ops.push({ k: "line", x1: 30, y1: 112, x2: 565, y2: 112, color: [0.85, 0.74, 0.42], width: 1.4 });
  ops.push({ k: "line", x1: 34, y1: 116, x2: 561, y2: 116, color: [0.88, 0.82, 0.62], width: 0.5 });
  ops.push({ k: "line", x1: 30, y1: 760, x2: 565, y2: 760, color: [0.85, 0.74, 0.42], width: 1.4 });
  ops.push({ k: "line", x1: 30, y1: 112, x2: 30, y2: 760, color: [0.88, 0.82, 0.62], width: 0.5 });
  ops.push({ k: "line", x1: 565, y1: 112, x2: 565, y2: 760, color: [0.88, 0.82, 0.62], width: 0.5 });

  ops.push({ k: "text", x: 0, y: 170, size: 21, font: 2, text: act.name.toUpperCase(), color: NAVY, center: true });
  ops.push({ k: "rect", x: 247, y: 182, w: 101, h: 2.6, color: GOLD });
  ops.push({ k: "text", x: 0, y: 208, size: 10.5, font: 2, text: `Reference : ${app.ref}`, color: [0.1, 0.3, 0.8], center: true });

  const body = [
    "Le Doyen de la Faculte des Lettres, Arts et Sciences Humaines de l'Universite de Parakou,",
    "vu les registres d'inscription et les proces-verbaux de deliberation de la FLASH,",
    "atteste que :",
  ];
  let y = 252;
  for (const p of body) {
    for (const line of wrap(p, 92)) {
      ops.push({ k: "text", x: 66, y, size: 10.5, font: 1, text: line, color: INK });
      y += 17;
    }
  }

  y += 8;
  ops.push({ k: "text", x: 0, y, size: 15, font: 2, text: `${app.studentName}`, color: NAVY, center: true });
  y += 22;
  const idLines = [
    `Matricule : ${app.matricule}   -   Ne(e) le ${fmtDateLong(app.birthDate)}`,
    `${app.program} - ${app.level}`,
    app.graduationYear !== "—" ? `Annee d'obtention : ${app.graduationYear}` : `Annee academique : ${app.academicYear}`,
  ];
  for (const l of idLines) {
    ops.push({ k: "text", x: 0, y, size: 10.5, font: 1, text: l, color: INK, center: true });
    y += 18;
  }

  y += 12;
  const closing = wrap(
    `a satisfait aux exigences academiques requises et se voit delivrer la presente ${act.name.toLowerCase()} pour servir et valoir ce que de droit.`,
    92
  );
  for (const line of closing) {
    ops.push({ k: "text", x: 66, y, size: 10.5, font: 1, text: line, color: INK });
    y += 17;
  }

  ops.push({ k: "text", x: 535, y: 600, size: 10.5, font: 1, text: "Fait a Parakou,", color: INK });
  ops.push({ k: "text", x: 535, y: 618, size: 10.5, font: 2, text: `le ${fmtDateLong(app.document?.issuedAt ?? app.createdAt)}`, color: INK });
  ops.push({ k: "text", x: 448, y: 656, size: 10.5, font: 2, text: "Le Doyen de la FLASH", color: NAVY });
  ops.push({ k: "line", x1: 420, y1: 700, x2: 545, y2: 700, color: [0.75, 0.78, 0.84], width: 0.8 });
  ops.push({ k: "text", x: 440, y: 716, size: 8.5, font: 3, text: "Signature electronique securisee", color: MUT });

  qrBlock(ops, 62, 610, "FLASHACTES|VERIFY|" + (app.document?.verifyCode ?? app.ref));
  ops.push({ k: "text", x: 62, y: 700, size: 8.5, font: 2, text: "VERIFICATION D'AUTHENTICITE", color: NAVY });
  ops.push({ k: "text", x: 62, y: 716, size: 9.5, font: 2, text: app.document?.verifyCode ?? "—", color: [0.1, 0.3, 0.8] });
  ops.push({ k: "text", x: 62, y: 732, size: 8, font: 1, text: "Scannez le QR Code pour verifier ce document", color: MUT });
  ops.push({ k: "text", x: 62, y: 746, size: 8, font: 1, text: "sur flash-actes.up.bj/verify", color: MUT });

  footer(ops, "Document numerique signe - toute falsification expose a des poursuites. Demonstration : donnees fictives.");
  return buildPdf(ops);
}
