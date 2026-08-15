/* ==========================================================================
   UP-GAA — Micro-interactions (motion.js)
   S'exécute après app.js (ordre des scripts defer).
   Ajoute la classe .js sur <html> : sans elle, aucun contenu n'est masqué
   (amélioration progressive). Respecte prefers-reduced-motion.
   Toutes les animations n'utilisent que transform / opacity.
   ========================================================================== */
(() => {
"use strict";

const d = document, de = d.documentElement;
de.classList.add("js");
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(pointer: fine)").matches;
de.classList.add(REDUCE ? "reduce" : "motion");
const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));

/* ---------- Révélations en cascade (IntersectionObserver) ---------- */
const initReveals = () => {
  /* Délais en cascade pour les groupes */
  $$("[data-reveal-cascade]").forEach(g => {
    Array.from(g.children).forEach((c, i) => {
      if (!c.hasAttribute("data-reveal")) c.setAttribute("data-reveal", "");
      c.style.transitionDelay = Math.min(i, 8) * 75 + "ms";
    });
  });
  const els = $$("[data-reveal]");
  if (REDUCE || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("is-in")); return; }
  const io = new IntersectionObserver(entries => {
    /* Lot de mises à jour groupé dans un seul rAF */
    requestAnimationFrame(() => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }
    });
  }, { threshold: .14, rootMargin: "0px 0px -7% 0px" });
  els.forEach(el => io.observe(el));
};

/* ---------- Compteurs animés ---------- */
const fmtNombre = (v, dec) => v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const animerCompteur = el => {
  const cible = parseFloat(el.dataset.count || "0");
  const dec = parseInt(el.dataset.decimals || "0", 10);
  const suf = el.dataset.suffix || "";
  if (REDUCE) { el.textContent = fmtNombre(cible, dec) + suf; return; }
  const dur = 1500, t0 = performance.now();
  const pas = n => {
    const p = Math.min(1, (n - t0) / dur);
    el.textContent = fmtNombre(cible * (1 - Math.pow(1 - p, 3)), dec) + suf;
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
};
const initCounters = () => {
  const els = $$("[data-count]");
  if (!els.length) return;
  if (REDUCE || !("IntersectionObserver" in window)) { els.forEach(animerCompteur); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { animerCompteur(e.target); io.unobserve(e.target); }
    }
  }, { threshold: .4 });
  els.forEach(el => io.observe(el));
};

/* ---------- Effet ripple sur les boutons ---------- */
d.addEventListener("pointerdown", e => {
  if (REDUCE) return;
  const host = e.target.closest(".btn");
  if (!host || host.disabled) return;
  const r = host.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.3;
  const sp = d.createElement("span");
  sp.className = "ripple";
  sp.style.width = sp.style.height = size + "px";
  sp.style.left = e.clientX - r.left - size / 2 + "px";
  sp.style.top = e.clientY - r.top - size / 2 + "px";
  host.appendChild(sp);
  sp.addEventListener("animationend", () => sp.remove(), { once: true });
});

/* ---------- Bouton magnétique + inclinaison (délégation, throttlée rAF) ---------- */
if (!REDUCE && FINE) {
  let mag = null, magRaf = 0, tilt = null, tiltRaf = 0;

  const resetMag = () => {
    if (mag) { const inner = mag.querySelector(".btn__label"); if (inner) inner.style.transform = ""; mag.classList.remove("is-mag"); }
    mag = null;
  };
  const resetTilt = () => {
    if (tilt) { tilt.style.transform = ""; tilt.classList.remove("is-tilting"); }
    tilt = null;
  };

  d.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;

    /* Magnétique */
    const m = e.target.closest("[data-magnetic]");
    if (m !== mag) { resetMag(); mag = m; if (mag) mag.classList.add("is-mag"); }
    if (mag && !magRaf) {
      const r = mag.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      magRaf = requestAnimationFrame(() => {
        magRaf = 0;
        if (!mag) return;
        const inner = mag.querySelector(".btn__label");
        if (inner) inner.style.transform = `translate(${(nx * 10).toFixed(1)}px, ${(ny * 7).toFixed(1)}px)`;
      });
    }

    /* Inclinaison */
    const t = e.target.closest("[data-tilt]");
    if (t !== tilt) { resetTilt(); tilt = t; if (tilt) tilt.classList.add("is-tilting"); }
    if (tilt && !tiltRaf) {
      const r = tilt.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        if (tilt) tilt.style.transform = `perspective(950px) rotateX(${(-ny * 4.5).toFixed(2)}deg) rotateY(${(nx * 5.5).toFixed(2)}deg)`;
      });
    }
  }, { passive: true });

  /* Sortie complète du document */
  d.addEventListener("pointerout", e => {
    if (!e.relatedTarget) { resetMag(); resetTilt(); }
  });
}

/* ---------- Menu mobile : refermer après navigation ---------- */
$$(".nav__list a").forEach(a => a.addEventListener("click", () => {
  const c = d.getElementById("nav-toggle");
  if (c) c.checked = false;
}));

/* ---------- Ombre d'en-tête au défilement (sentinelle + IO) ---------- */
const sent = d.querySelector(".sentinelle");
if (sent && "IntersectionObserver" in window) {
  new IntersectionObserver(([e]) => {
    d.body.classList.toggle("is-scrolled", !e.isIntersecting);
  }, { threshold: 0 }).observe(sent);
}

/* ---------- Année automatique ---------- */
$$(".js-year").forEach(el => el.textContent = new Date().getFullYear());

initReveals();
initCounters();
})();