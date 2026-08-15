/* ==========================================================================
   UP-GAA — Logique métier (données de démonstration en mémoire uniquement)
   Aucun localStorage/sessionStorage. Chaque page démarre avec le jeu
   d'essai, enrichi pendant la session par les actions de l'utilisateur.
   ========================================================================== */
(() => {
"use strict";

const UP = (window.UP = window.UP || {});

/* ---------- Utilitaires ---------- */
UP.$  = (s, r = document) => r.querySelector(s);
UP.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
UP.esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const dLong  = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const dCourt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
UP.fmtDate = d => dLong.format(d);
UP.fmtDT   = d => dCourt.format(d).replace(",", " à");

/* ---------- Référentiels ---------- */
UP.STATUSES = {
  deposee:     { label: "Déposée",       color: "var(--st-dep)", aide: "Votre demande a été reçue par le guichet." },
  instruction: { label: "En instruction",color: "var(--st-ins)", aide: "La scolarité vérifie vos pièces et votre parcours." },
  signature:   { label: "Signé",         color: "var(--st-sig)", aide: "L'acte est signé par l'autorité compétente." },
  disponible:  { label: "Disponible",    color: "var(--st-dis)", aide: "Présentez votre code au guichet de retrait." },
  rejetee:     { label: "Rejetée",       color: "var(--st-rej)", aide: "Consultez le motif dans l'historique." }
};
UP.PIPELINE = ["deposee", "instruction", "signature", "disponible"];

UP.ACTES = {
  releve:      { label: "Relevé de notes",         prefix: "RN", delai: "72 h",        pieces: ["Pièce d'identité (CNI ou passeport)", "Quittance d'inscription de l'année en cours"] },
  attestation: { label: "Attestation de réussite", prefix: "AR", delai: "5 jours ouvrés", pieces: ["Pièce d'identité (CNI ou passeport)", "Dernier relevé de notes"] },
  diplome:     { label: "Diplôme / Duplicata",     prefix: "DI", delai: "15 jours ouvrés", pieces: ["Pièce d'identité (CNI ou passeport)", "Attestation de réussite · (Duplicata) déclaration de perte"] },
  certificat:  { label: "Certificat de scolarité", prefix: "CS", delai: "24 h",        pieces: ["Pièce d'identité (CNI ou passeport)", "Justificatif d'inscription (année en cours)"] }
};

/* ---------- Base de démonstration (en mémoire) ---------- */
const D = (y, m, d, h = 9, mi = 0) => new Date(y, m - 1, d, h, mi);
const mk = (code, acte, nom, matricule, filiere, creee, hist) => ({
  id: code, code, acte,
  etudiant: { nom, matricule, filiere },
  creee,
  historique: hist.map(([st, at, note]) => ({ st, at, note }))
});

UP.db = [
  mk("UP-2026-CS-7730", "certificat", "U. TOSSOU", "2025-LET-0655", "Licence 1 — Lettres modernes", D(2026,8,16,8,5), [
    ["deposee", D(2026,8,16,8,5), "Déposée via le guichet numérique."]]),
  mk("UP-2026-RN-4040", "releve", "B. AGONKAN", "2023-ECO-0402", "Licence 2 — Économie du développement", D(2026,8,15,17,26), [
    ["deposee", D(2026,8,15,17,26), "Déposée via le guichet numérique."],
    ["instruction", D(2026,8,16,8,50), "Transmise au service de la scolarité."]]),
  mk("UP-2026-RN-4035", "releve", "E. AHOUANSOU", "2023-INF-0147", "Licence 2 — Informatique de Gestion", D(2026,8,14,8,47), [
    ["deposee", D(2026,8,14,8,47), "Déposée via le guichet numérique."],
    ["instruction", D(2026,8,14,16,20), "Transmise au service de la scolarité."]]),
  mk("UP-2026-RN-4021", "releve", "R. GBAGUIDI", "2022-MTH-0311", "Licence 3 — Mathématiques", D(2026,8,12,9,14), [
    ["deposee", D(2026,8,12,9,14), "Déposée via le guichet numérique."],
    ["instruction", D(2026,8,13,10,30), "Vérification des pièces en cours."]]),
  mk("UP-2026-DI-1057", "diplome", "F. N'GOBI", "2020-AGR-0143", "Master 2 — Agronomie", D(2026,8,9,11,12), [
    ["deposee", D(2026,8,9,11,12), "Déposée via le guichet numérique."],
    ["instruction", D(2026,8,12,9,40), "Pièces validées, dossier transmis à la signature."],
    ["signature", D(2026,8,15,17,10), "Signé par le Chef de service scolarité."]]),
  mk("UP-2026-CS-7714", "certificat", "S. HOUNKPATIN", "2024-DRT-0876", "Licence 1 — Droit privé", D(2026,8,10,14,33), [
    ["deposee", D(2026,8,10,14,33), "Déposée via le guichet numérique."],
    ["rejetee", D(2026,8,11,9,5), "Pièce d'identité illisible — merci de redéposer une copie nette."]]),
  mk("UP-2026-AR-3990", "attestation", "J. KPODAR", "2022-INF-0299", "Licence 3 — Informatique", D(2026,8,6,10,22), [
    ["deposee", D(2026,8,6,10,22), "Déposée via le guichet numérique."],
    ["instruction", D(2026,8,7,9,10), "Parcours vérifié."],
    ["signature", D(2026,8,10,14,2), "Signé par le Doyen de la faculté."],
    ["disponible", D(2026,8,11,15,45), "Retrait au guichet 2, sur présentation du code."]]),
  mk("UP-2026-AR-3988", "attestation", "E. AHOUANSOU", "2023-INF-0147", "Licence 2 — Informatique de Gestion", D(2026,8,4,9,12), [
    ["deposee", D(2026,8,4,9,12), "Déposée via le guichet numérique."],
    ["instruction", D(2026,8,4,15,40), "Vérification des pièces et du parcours."],
    ["signature", D(2026,8,7,11,5), "Signé par le service de la scolarité."],
    ["disponible", D(2026,8,8,10,2), "Retrait au guichet 2, sur présentation du code."]]),
  mk("UP-2026-DI-1042", "diplome", "M. YAYA", "2021-ECO-0522", "Master 1 — Économie du développement", D(2026,8,1,8,20), [
    ["deposee", D(2026,8,1,8,20), "Déposée via le guichet numérique."]]),
  mk("UP-2026-CS-7721", "certificat", "E. AHOUANSOU", "2023-INF-0147", "Licence 2 — Informatique de Gestion", D(2026,7,28,10,5), [
    ["deposee", D(2026,7,28,10,5), "Déposée via le guichet numérique."],
    ["instruction", D(2026,7,28,15,30), "Pièces validées."],
    ["signature", D(2026,7,29,8,40), "Signé par le service de la scolarité."],
    ["disponible", D(2026,7,29,9,0), "Retiré le 30/07 au guichet 2."]])
];

UP.byCode = code => UP.db.find(d => d.code.toLowerCase() === String(code).trim().toLowerCase());
UP.statut = d => d.historique[d.historique.length - 1].st;
UP.changerStatut = (d, st, note) =>
  d.historique.push({ st, at: new Date(), note: note || "Statut mis à jour par le bureau des actes." });

/* ---------- Session étudiante (en mémoire) ---------- */
UP.student = {
  nom: "Espérance AHOUANSOU", matricule: "2023-INF-0147",
  filiere: "Licence 2 — Informatique de Gestion", email: "esperance.ahouansou@etu.univ-parakou.bj"
};
UP.session = null;

/* ---------- Toasts ---------- */
UP.toast = (msg, type = "info", dur = 4600) => {
  let zone = UP.$("#toasts");
  if (!zone) { zone = document.createElement("div"); zone.id = "toasts"; zone.className = "toasts"; zone.setAttribute("role", "status"); document.body.appendChild(zone); }
  const icon = { ok: "✓", err: "✕", info: "•" }[type] || "•";
  const t = document.createElement("p");
  t.className = `toast toast--${type}`;
  t.innerHTML = `<b aria-hidden="true">${icon}</b><span>${UP.esc(msg)}</span>`;
  zone.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("is-in")));
  setTimeout(() => {
    t.classList.remove("is-in");
    t.addEventListener("transitionend", () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 700);
  }, dur);
};

/* ---------- États de chargement des boutons ---------- */
UP.busy = btn => {
  if (!btn || btn.dataset.busy) return;
  btn.dataset.busy = "1"; btn.classList.add("is-busy"); btn.setAttribute("aria-busy", "true");
  const s = document.createElement("span"); s.className = "btn__spinner"; s.setAttribute("aria-hidden", "true");
  btn.insertBefore(s, btn.firstChild);
};
UP.idle = btn => {
  if (!btn) return;
  delete btn.dataset.busy; btn.classList.remove("is-busy"); btn.removeAttribute("aria-busy");
  const s = btn.querySelector(".btn__spinner"); if (s) s.remove();
};

/* ---------- Copier avec retour visuel ---------- */
UP.copier = async (texte, btn) => {
  let ok = false;
  try { await navigator.clipboard.writeText(texte); ok = true; }
  catch (_) {
    const ta = document.createElement("textarea");
    ta.value = texte; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand("copy"); } catch (__) {}
    ta.remove();
  }
  if (btn) {
    const lab = btn.querySelector(".js-copy-txt") || btn;
    if (btn.dataset.copierLabel === undefined) btn.dataset.copierLabel = lab.textContent;
    btn.classList.toggle("is-ok", ok);
    lab.textContent = ok ? "Copié ✓" : btn.dataset.copierLabel;
    setTimeout(() => { btn.classList.remove("is-ok"); lab.textContent = btn.dataset.copierLabel; }, 2200);
  }
  UP.toast(ok ? "Code copié dans le presse-papiers." : "Copie impossible — sélectionnez le code manuellement.", ok ? "ok" : "err");
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-copier]");
  if (b) { e.preventDefault(); UP.copier(b.dataset.copier, b); }
});

/* ---------- Génération de code & création de demande ---------- */
UP.genCode = acte => {
  const p = (UP.ACTES[acte] || {}).prefix || "GN";
  return `UP-2026-${p}-${Math.floor(1000 + Math.random() * 9000)}`;
};
UP.creerDemande = ({ acte, etudiant }) => {
  const d = {
    id: "", code: UP.genCode(acte), acte, etudiant,
    creee: new Date(),
    historique: [{ st: "deposee", at: new Date(), note: "Déposée via le guichet numérique." }]
  };
  d.id = d.code;
  UP.db.unshift(d);
  return d;
};

/* ---------- Rendus partagés ---------- */
UP.tamponHTML = (st, extra = "") =>
  `<span class="tampon tampon--${st} ${extra}">${UP.STATUSES[st].label}</span>`;

UP.talonHTML = (d, { grand = false } = {}) => {
  const a = UP.ACTES[d.acte] || { label: "Acte", delai: "—" };
  return `
  <article class="talon ${grand ? "talon--xl" : ""}" data-tilt>
    <div class="talon__body">
      <p class="talon__meta">Université de Parakou · Bureau des actes</p>
      <strong class="talon__titre">${UP.esc(a.label)}</strong>
      <dl class="talon__dl">
        <div><dt>Étudiant·e</dt><dd>${UP.esc(d.etudiant.nom)}</dd></div>
        <div><dt>Matricule</dt><dd class="mono">${UP.esc(d.etudiant.matricule)}</dd></div>
        <div><dt>Déposée le</dt><dd>${UP.fmtDT(d.creee)}</dd></div>
        <div><dt>Délai indicatif</dt><dd>${a.delai}</dd></div>
      </dl>
    </div>
    <div class="talon__perf" aria-hidden="true"></div>
    <div class="talon__stub">
      <span class="talon__meta">Code de suivi</span>
      <strong class="talon__code">${UP.esc(d.code)}</strong>
      <div class="talon__bars" aria-hidden="true"></div>
      <button type="button" class="btn btn--ghost btn--sm js-copy" data-copier="${UP.esc(d.code)}"><span class="js-copy-txt">Copier le code</span></button>
    </div>
    ${UP.tamponHTML(UP.statut(d), "talon__tampon")}
  </article>`;
};

UP.chronoHTML = d => `
  <ol class="chrono">` + d.historique.map((h, i) => {
    const s = UP.STATUSES[h.st];
    const cur = i === d.historique.length - 1 ? "is-current" : "";
    return `<li class="${cur}" style="--stc:${s.color}">
      <time datetime="${h.at.toISOString()}">${UP.fmtDT(h.at)}</time>
      <strong>${s.label}</strong>${h.note ? `<p>${UP.esc(h.note)}</p>` : ""}
    </li>`;
  }).join("") + `</ol>`;

/* Petite animation de compteur réutilisable (stats back-office) */
UP.animerNombre = (el, cible, duree = 900) => {
  const fmt = v => Math.round(v).toLocaleString("fr-FR");
  if (document.documentElement.classList.contains("reduce") || !duree) { el.textContent = fmt(cible); return; }
  const t0 = performance.now();
  const pas = n => {
    const p = Math.min(1, (n - t0) / duree);
    el.textContent = fmt(cible * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
};

/* ==========================================================================
   Initialisation par page
   ========================================================================== */
const page = document.body.dataset.page;

/* ---------- Page : Suivi ---------- */
function initSuivi() {
  const form = UP.$("#suivi-form"), input = UP.$("#suivi-code"), out = UP.$("#suivi-out");
  if (!form || !out) return;
  const btn = form.querySelector("button[type=submit]");

  const chercher = raw => {
    const code = String(raw || "").trim();
    if (!code) { UP.toast("Saisissez un code de suivi.", "err"); return; }
    UP.busy(btn);
    setTimeout(() => {
      UP.idle(btn);
      const d = UP.byCode(code);
      d ? rendreResultat(d) : rendreErreur(code);
    }, 550);
  };

  const rendreResultat = d => {
    const a = UP.ACTES[d.acte];
    out.innerHTML = `
      <div class="suivi-res">
        <div class="fade-in">${UP.talonHTML(d, { grand: true })}</div>
        <section class="panel fade-in fade-in-d1">
          <h2 class="panel__titre">Historique du traitement</h2>
          ${UP.chronoHTML(d)}
          <p class="hint" style="margin:1rem 0 0">${UP.STATUSES[UP.statut(d)].aide}</p>
        </section>
        <div class="suivi-res__actions fade-in fade-in-d1">
          <a class="btn btn--wa" rel="noopener" target="_blank"
             href="https://wa.me/2290197441234?text=${encodeURIComponent("Bonjour, question sur ma demande " + d.code + " (" + a.label + ").")}">
            <span class="btn__label">Poser une question (WhatsApp)</span></a>
          <a class="btn btn--ghost" href="nouvelle-demande.html">Nouvelle demande</a>
        </div>
      </div>`;
  };

  const rendreErreur = code => {
    out.innerHTML = `
      <div class="panel panel--err shake fade-in" role="alert">
        <h2 class="panel__titre">Aucune demande trouvée</h2>
        <p>Aucun dossier ne correspond à <span class="mono">${UP.esc(code.toUpperCase())}</span>. Vérifiez le format <span class="mono">UP-2026-XX-0000</span> et l'orthographe du code.</p>
        <p class="hint">En démonstration, utilisez l'un des codes proposés au-dessus du champ de recherche.</p>
      </div>`;
    UP.toast("Code introuvable dans le registre.", "err");
  };

  form.addEventListener("submit", e => { e.preventDefault(); chercher(input.value); });
  UP.$$(".chip[data-code]").forEach(c =>
    c.addEventListener("click", () => { input.value = c.dataset.code; chercher(c.dataset.code); input.focus(); }));

  /* Préremplissage via ?code= */
  const q = new URL(location.href).searchParams.get("code");
  if (q) { input.value = q; chercher(q); }
}

/* ---------- Page : Nouvelle demande ---------- */
function initDemande() {
  const form = UP.$("#fd");
  if (!form) return;
  const steps = UP.$$(".fdem__step", form);
  const stepsLi = UP.$$(".steps li");
  let cur = 0;

  /* Préselection via ?acte= */
  const q = new URL(location.href).searchParams.get("acte");
  if (q && form.elements.acte) {
    const r = form.querySelector(`input[name="acte"][value="${q}"]`);
    if (r) r.checked = true;
  }

  const majSteps = () => stepsLi.forEach((li, k) => {
    li.classList.toggle("is-done", k < cur);
    li.classList.toggle("is-now", k === cur);
    li.querySelector(".st-n").textContent = k < cur ? "✓" : k + 1;
  });

  const afficher = i => {
    cur = i;
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    majSteps();
    const h = steps[i].querySelector("h2");
    if (h) h.focus({ preventScroll: true });
    form.scrollIntoView({ block: "start", behavior: document.documentElement.classList.contains("reduce") ? "auto" : "smooth" });
  };

  /* Validation d'une étape : retour par champ */
  const valider = i => {
    if (i === 0) {
      if (!form.acte.value) {
        UP.toast("Choisissez d'abord un type d'acte.", "err");
        const zone = steps[0].querySelector(".actes-choice");
        zone.classList.remove("shake"); void zone.offsetWidth; zone.classList.add("shake");
        return false;
      }
      return true;
    }
    let ok = true, premier = null;
    UP.$$("input,select", steps[i]).forEach(el => {
      const champ = UP.$(".field__err", el.closest(".field") || el.parentElement);
      const f = el.closest(".field");
      if (!el.checkValidity()) {
        ok = false; f && f.classList.add("is-err");
        if (champ) champ.textContent = el.validationMessage || "Champ requis.";
        premier = premier || el;
      } else { f && f.classList.remove("is-err"); if (champ) champ.textContent = ""; }
    });
    if (!ok) { UP.toast("Merci de compléter les champs signalés.", "err"); premier && premier.focus(); }
    return ok;
  };
  form.addEventListener("input", e => {
    const f = e.target.closest(".field");
    if (f) { f.classList.remove("is-err"); const er = UP.$(".field__err", f); if (er) er.textContent = ""; }
  });

  /* Étiquettes des pièces selon l'acte choisi */
  const majPieces = () => {
    const a = UP.ACTES[form.acte.value];
    if (!a) return;
    UP.$("#p0-label").textContent = a.pieces[0] || "Pièce d'identité (CNI ou passeport)";
    UP.$("#p1-label").textContent = a.pieces[1] || "Justificatif d'inscription (année en cours)";
  };

  /* Récapitulatif */
  const recap = UP.$("#recap");
  const majRecap = () => {
    const a = UP.ACTES[form.acte.value] || { label: "—", delai: "—" };
    const fichiers = UP.$$('input[type="file"]', form)
      .map(f => f.files[0] ? f.files[0].name : null).filter(Boolean);
    const ligne = (k, v) => `<div><dt>${k}</dt><dd>${UP.esc(v)}</dd></div>`;
    recap.innerHTML =
      ligne("Acte demandé", `${a.label} (${UP.esc(form.acte.value.toUpperCase().slice(0, 2))})`) +
      ligne("Délai indicatif", a.delai) +
      ligne("Matricule", form.matricule.value) +
      ligne("Nom & prénom", `${form.prenom.value} ${form.nom.value.toUpperCase()}`) +
      ligne("Courriel", form.email.value) +
      ligne("Téléphone", form.tel.value) +
      ligne("Parcours", `${form.niveau.value} — ${form.filiere.value}`) +
      ligne("Exemplaires", form.exemplaires.value) +
      ligne("Pièces jointes", fichiers.length ? fichiers.join(" · ") : "Aucune fournie (démonstration)");
  };

  /* Noms des fichiers sélectionnés */
  form.addEventListener("change", e => {
    if (e.target.type === "file") {
      const p = e.target.closest(".piece"), info = p && p.querySelector(".piece__file");
      if (info) {
        const f = e.target.files[0];
        if (f) { info.hidden = false; info.textContent = `✓ ${f.name} · ${(f.size / 1024).toFixed(0)} Ko`; }
        else info.hidden = true;
      }
    }
  });

  /* Navigation */
  UP.$$(".js-next", form).forEach(b => b.addEventListener("click", () => {
    if (!valider(cur)) return;
    if (cur === 2) majPieces();
    if (cur + 1 === 3) majRecap();
    afficher(cur + 1);
  }));
  UP.$$(".js-prev", form).forEach(b => b.addEventListener("click", () => afficher(Math.max(0, cur - 1))));

  /* Soumission : génération du code */
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!valider(cur)) return;
    const consent = UP.$("#f-consent");
    if (consent && !consent.checked) { UP.toast("Merci de certifier l'exactitude des informations.", "err"); consent.focus(); return; }
    const btn = form.querySelector('button[type="submit"]');
    UP.busy(btn);
    setTimeout(() => {
      UP.idle(btn);
      const d = UP.creerDemande({
        acte: form.acte.value,
        etudiant: {
          nom: `${form.prenom.value.trim()} ${form.nom.value.trim().toUpperCase()}`,
          matricule: form.matricule.value.trim().toUpperCase(),
          filiere: `${form.niveau.value} — ${form.filiere.value}`
        }
      });
      form.hidden = true;
      stepsLi.forEach((li, k) => { li.classList.add("is-done"); li.classList.remove("is-now"); li.querySelector(".st-n").textContent = "✓"; });
      const ok = UP.$("#fd-ok");
      ok.hidden = false;
      ok.innerHTML = `
        <div class="fdem-ok__intro fade-in">
          <h2>Demande enregistrée ✓</h2>
          <p style="margin:0">Votre demande a été déposée auprès du bureau des actes. Conservez précieusement le code ci-dessous&nbsp;: il est indispensable pour suivre votre dossier et retirer votre acte.</p>
        </div>
        <div class="fade-in fade-in-d1">${UP.talonHTML(d, { grand: true })}</div>
        <section class="panel fade-in fade-in-d1">
          <h3 class="panel__titre">Première étape</h3>
          ${UP.chronoHTML(d)}
        </section>
        <div class="fdem-ok__actions fade-in fade-in-d1">
          <a class="btn btn--gold" href="suivi.html?code=${encodeURIComponent(d.code)}" data-magnetic><span class="btn__label">Suivre cette demande</span></a>
          <a class="btn btn--ghost" href="index.html">Retour à l'accueil</a>
        </div>`;
      window.scrollTo({ top: 0, behavior: document.documentElement.classList.contains("reduce") ? "auto" : "smooth" });
      UP.toast("Votre demande a bien été déposée.", "ok");
    }, 1400);
  });
}

/* ---------- Page : Connexion ---------- */
function initConnexion() {
  const tabs = UP.$$('.tabs [role="tab"]');
  if (!tabs.length) return;
  const activer = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on);
      const p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.classList.toggle("is-active", on);
    });
  };
  tabs.forEach(t => {
    t.addEventListener("click", e => { e.preventDefault(); activer(t); });
    t.addEventListener("keydown", e => {
      const i = tabs.indexOf(t);
      if (e.key === "ArrowRight") { e.preventDefault(); const n = tabs[(i + 1) % tabs.length]; n.focus(); activer(n); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); const n = tabs[(i - 1 + tabs.length) % tabs.length]; n.focus(); activer(n); }
    });
  });

  const conclure = src => {
    UP.session = { ...UP.student, src };
    UP.toast(`Bienvenue, ${UP.student.nom}.`, "ok");
    setTimeout(() => { location.href = "tableau-bord.html"; }, 600);
  };

  /* Matricule + mot de passe */
  const f1 = UP.$("#form-mdp");
  if (f1) f1.addEventListener("submit", e => {
    e.preventDefault();
    const btn = f1.querySelector('button[type="submit"]');
    UP.busy(btn);
    setTimeout(() => {
      const m = UP.$("#c-matricule").value.trim().toUpperCase();
      const p = UP.$("#c-pwd").value;
      if (m === UP.student.matricule && p === "parakou2026") { conclure("mot de passe"); }
      else {
        UP.idle(btn);
        f1.classList.remove("shake"); void f1.offsetWidth; f1.classList.add("shake");
        UP.toast("Identifiants incorrects — utilisez les accès de démonstration.", "err");
      }
    }, 1100);
  });
  const fill = UP.$("#btn-fill");
  if (fill) fill.addEventListener("click", () => {
    UP.$("#c-matricule").value = UP.student.matricule;
    UP.$("#c-pwd").value = "parakou2026";
    UP.toast("Identifiants de démonstration renseignés.", "info");
  });

  /* Lien magique */
  const f2 = UP.$("#form-magic");
  if (f2) f2.addEventListener("submit", e => {
    e.preventDefault();
    const email = UP.$("#c-email");
    if (!email.checkValidity()) { UP.toast("Adresse électronique invalide.", "err"); email.focus(); return; }
    const btn = f2.querySelector('button[type="submit"]');
    UP.busy(btn);
    setTimeout(() => {
      UP.idle(btn);
      f2.hidden = true;
      const ok = UP.$(".magic-ok");
      UP.$("#magic-recap").textContent = `Un lien à usage unique a été envoyé à ${email.value} (simulation). Il expire dans 15 minutes.`;
      ok.hidden = false;
      ok.classList.add("fade-in");
      UP.toast("Lien magique envoyé (simulation).", "ok");
    }, 1400);
  });
  const open = UP.$("#magic-open");
  if (open) open.addEventListener("click", () => {
    UP.busy(open);
    setTimeout(() => conclure("lien magique"), 900);
  });
}

/* ---------- Page : Tableau de bord ---------- */
function initDash() {
  const list = UP.$("#dash-list");
  if (!list) return;
  if (!UP.session) UP.session = { ...UP.student, src: "démonstration" };
  const nojs = UP.$("#dash-nojs"); if (nojs) nojs.hidden = true;

  /* Identité */
  UP.$("#dash-nom").textContent = UP.session.nom;
  UP.$("#dash-nom2").textContent = UP.session.nom;
  UP.$("#dash-matricule").textContent = UP.session.matricule;
  UP.$("#dash-filiere").textContent = UP.session.filiere;
  const ava = UP.$("#dash-ava");
  if (ava) ava.textContent = UP.session.nom.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const rendre = () => {
    const mine = UP.db
      .filter(d => d.etudiant.matricule === UP.session.matricule)
      .sort((a, b) => b.creee - a.creee);

    /* Puces de synthèse */
    const compte = st => mine.filter(d => UP.statut(d) === st).length;
    UP.$("#chip-total").textContent = mine.length;
    UP.$("#chip-disponible").textContent = compte("disponible");
    UP.$("#chip-instruction").textContent = compte("instruction");
    UP.$("#chip-deposee").textContent = compte("deposee");

    list.innerHTML = mine.length ? mine.map(d => {
      const a = UP.ACTES[d.acte];
      return `
      <article class="talon talon--row fade-in" data-tilt>
        <div class="talon__body">
          <p class="talon__meta">${UP.esc(a.label)} · ${a.prefix}</p>
          <strong class="talon__code">${UP.esc(d.code)}</strong>
          <p class="talon__sub">Déposée le ${UP.fmtDate(d.creee)} · ${UP.STATUSES[UP.statut(d)].label}</p>
        </div>
        <div class="talon__perf" aria-hidden="true"></div>
        <div class="talon__stub">
          ${UP.tamponHTML(UP.statut(d))}
          <a class="btn btn--ghost btn--sm" href="suivi.html?code=${encodeURIComponent(d.code)}">Suivre</a>
        </div>
      </article>`;
    }).join("") : `<p class="panel">Aucune demande pour le moment. <a href="nouvelle-demande.html">Déposez votre première demande</a>.</p>`;
  };

  rendre();
  const refresh = UP.$("#btn-refresh");
  if (refresh) refresh.addEventListener("click", () => {
    UP.busy(refresh);
    setTimeout(() => { UP.idle(refresh); rendre(); UP.toast("Liste actualisée.", "info"); }, 700);
  });
}

/* ---------- Page : Back-office ---------- */
function initBO() {
  const gate = UP.$("#bo-gate");
  const app = UP.$("#bo-app");
  const nojs = UP.$("#bo-nojs");
  if (!gate || !app) return;
  if (nojs) nojs.hidden = true;

  const etat = { q: "", st: "", acte: "" };
  const ouverts = new Set();

  const filtrer = () => UP.db
    .filter(d => !etat.st || UP.statut(d) === etat.st)
    .filter(d => !etat.acte || d.acte === etat.acte)
    .filter(d => {
      if (!etat.q) return true;
      const q = etat.q.toLowerCase();
      return d.code.toLowerCase().includes(q) || d.etudiant.nom.toLowerCase().includes(q);
    })
    .sort((a, b) => b.creee - a.creee);

  /* Statistiques */
  const statsBox = UP.$("#bo-stats");
  const rendreStats = () => {
    const compte = st => UP.db.filter(d => UP.statut(d) === st).length;
    const bloc = (cle, tone) => `
      <div class="bo-stat" style="--tone:${UP.STATUSES[cle].color}">
        <b data-st="${cle}">${compte(cle)}</b><small>${UP.STATUSES[cle].label}</small>
      </div>`;
    statsBox.innerHTML =
      `<div class="bo-stat" style="--tone:var(--gold)"><b data-st="total">${UP.db.length}</b><small>Demandes au registre</small></div>` +
      Object.keys(UP.STATUSES).map(cle => bloc(cle)).join("");
  };
  const majStats = () => {
    const compte = st => UP.db.filter(d => UP.statut(d) === st).length;
    UP.$$(".bo-stat b", statsBox).forEach(b => {
      const v = b.dataset.st === "total" ? UP.db.length : compte(b.dataset.st);
      if (b.textContent !== String(v)) {
        UP.animerNombre(b, v, 500);
        b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
      }
    });
  };

  /* Lignes du registre */
  const tbody = UP.$("#bo-tbody");
  const options = cur => Object.entries(UP.STATUSES)
    .map(([k, v]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${v.label}</option>`).join("");

  const rendreRows = () => {
    const rows = filtrer();
    UP.$("#bo-count").textContent = `${rows.length} demande${rows.length > 1 ? "s" : ""} affichée${rows.length > 1 ? "s" : ""} sur ${UP.db.length}`;
    tbody.innerHTML = rows.map(d => {
      const st = UP.statut(d), a = UP.ACTES[d.acte];
      const open = ouverts.has(d.id);
      return `
      <tr class="bo-row ${open ? "is-open" : ""}" data-id="${UP.esc(d.id)}">
        <td class="mono">${UP.esc(d.code)}</td>
        <td class="bo-etudiant">${UP.esc(d.etudiant.nom)}<small>${UP.esc(d.etudiant.matricule)}</small></td>
        <td>${UP.esc(a.label)}</td>
        <td class="mono">${UP.fmtDate(d.creee)}</td>
        <td><select class="sel sel--${st}" data-code="${UP.esc(d.code)}" aria-label="Statut de ${UP.esc(d.code)}">${options(st)}</select></td>
        <td><button type="button" class="btn btn--ghost btn--sm bo-more" aria-expanded="${open}">${open ? "Fermer" : "Détail"}</button></td>
      </tr>
      <tr class="bo-detail" data-det="${UP.esc(d.id)}" ${open ? "" : "hidden"}>
        <td colspan="6">
          <div class="bo-detail__grid">
            <div>
              <h3 class="panel__titre">Historique — ${UP.esc(d.code)}</h3>
              ${UP.chronoHTML(d)}
            </div>
            <div>
              <h3 class="panel__titre">Dossier</h3>
              <p class="hint">Parcours&nbsp;: ${UP.esc(d.etudiant.filiere)}</p>
              <p class="hint">Délai indicatif annoncé&nbsp;: ${a.delai}</p>
              <button type="button" class="btn btn--ghost btn--sm js-copy" data-copier="${UP.esc(d.code)}"><span class="js-copy-txt">Copier le code</span></button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join("");
  };

  /* Interactions du tableau (délégation) */
  tbody.addEventListener("click", e => {
    const b = e.target.closest(".bo-more");
    if (!b) return;
    const tr = b.closest("tr");
    const id = tr.dataset.id;
    const det = tbody.querySelector(`[data-det="${CSS.escape(id)}"]`);
    const ouvrir = det.hidden;
    det.hidden = !ouvrir;
    b.setAttribute("aria-expanded", ouvrir);
    b.textContent = ouvrir ? "Fermer" : "Détail";
    tr.classList.toggle("is-open", ouvrir);
    ouvrir ? ouverts.add(id) : ouverts.delete(id);
  });

  tbody.addEventListener("change", e => {
    const sel = e.target.closest(".sel");
    if (!sel) return;
    const d = UP.byCode(sel.dataset.code);
    if (!d) return;
    UP.changerStatut(d, sel.value);
    UP.toast(`${d.code} → ${UP.STATUSES[sel.value].label}`, "ok");
    rendreRows();
    majStats();
    const tr = tbody.querySelector(`[data-id="${CSS.escape(d.id)}"]`);
    if (tr) { tr.classList.remove("flash"); void tr.offsetWidth; tr.classList.add("flash"); }
  });

  /* Barre d'outils */
  let qRaf = 0;
  UP.$("#bo-q").addEventListener("input", e => {
    etat.q = e.target.value;
    if (!qRaf) qRaf = requestAnimationFrame(() => { qRaf = 0; rendreRows(); });
  });
  UP.$("#bo-fst").addEventListener("change", e => { etat.st = e.target.value; rendreRows(); });
  UP.$("#bo-facte").addEventListener("change", e => { etat.acte = e.target.value; rendreRows(); });

  /* Export CSV réel */
  UP.$("#bo-export").addEventListener("click", () => {
    const btn = UP.$("#bo-export");
    UP.busy(btn);
    setTimeout(() => {
      const lignes = [["code", "acte", "etudiant", "matricule", "deposee_le", "statut"].join(";")];
      UP.db.forEach(d => lignes.push([
        d.code, UP.ACTES[d.acte].label, d.etudiant.nom, d.etudiant.matricule,
        UP.fmtDT(d.creee), UP.STATUSES[UP.statut(d)].label
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")));
      const blob = new Blob(["\ufeff" + lignes.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "registre-actes-up.csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      UP.idle(btn);
      UP.toast("Registre exporté au format CSV.", "ok");
    }, 900);
  });

  /* Porte d'accès */
  UP.$("#bo-gate-form").addEventListener("submit", e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    UP.busy(btn);
    setTimeout(() => {
      if (UP.$("#bo-code").value.trim().toUpperCase() === "UP-AGENT") {
        gate.hidden = true;
        app.hidden = false;
        app.classList.add("fade-in");
        rendreStats(); rendreRows();
        UP.toast("Bienvenue, agent de démonstration.", "ok");
      } else {
        UP.idle(btn);
        const p = UP.$(".bo-gate");
        p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake");
        UP.toast("Code agent incorrect.", "err");
      }
    }, 800);
  });
}

/* ---------- Aiguillage ---------- */
({ accueil: () => {}, demande: initDemande, suivi: initSuivi,
   connexion: initConnexion, tableau: initDash, backoffice: initBO }[page] || (() => {}))();

})();