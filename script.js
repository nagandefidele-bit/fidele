/* ==========================================================================
   Portail des actes académiques — logique front-end de démonstration
   Aucune donnée n'est persistée côté serveur : ce fichier simule, en mémoire,
   les échanges qu'une vraie API backend prendrait en charge en production.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Référentiel des types d'actes                                          */
/* ---------------------------------------------------------------------- */
const TYPES_ACTES = {
  releve: {
    label: "Relevé de notes",
    delai: "3 à 5 jours ouvrés",
    pieces: ["Carte d'étudiant (recto-verso)", "Reçu de paiement des frais de scolarité"],
    tarif: "2 000 FCFA"
  },
  attestation: {
    label: "Attestation de réussite",
    delai: "3 à 5 jours ouvrés",
    pieces: ["Carte d'étudiant (recto-verso)", "Reçu de paiement des frais de scolarité"],
    tarif: "2 000 FCFA"
  },
  duplicata: {
    label: "Diplôme / Duplicata",
    delai: "10 à 15 jours ouvrés",
    pieces: ["Pièce d'identité (CNI/passeport)", "Déclaration de perte ou justificatif", "Reçu de paiement"],
    tarif: "10 000 FCFA"
  },
  scolarite: {
    label: "Certificat de scolarité",
    delai: "48 heures",
    pieces: ["Carte d'étudiant (recto-verso)"],
    tarif: "1 000 FCFA"
  }
};

/* ---------------------------------------------------------------------- */
/* Jeu de données de démonstration (en mémoire uniquement)                */
/* ---------------------------------------------------------------------- */
const DEMANDES_DEMO = [
  {
    code: "FAC-2026-000452",
    type: "releve",
    etudiant: "Damien K.",
    matricule: "20211045",
    filiere: "Sciences économiques",
    statut: "en_traitement",
    historique: [
      { etape: "Demande reçue", date: "10 août 2026 — 09:14", fait: true },
      { etape: "Vérification du dossier", date: "11 août 2026 — 08:40", fait: true },
      { etape: "Édition du document", date: "En cours", fait: false, current: true },
      { etape: "Document prêt / notification", date: "—", fait: false },
    ]
  },
  {
    code: "FAC-2026-000398",
    type: "scolarite",
    etudiant: "Nafissath A.",
    matricule: "20220783",
    filiere: "Droit",
    statut: "prete",
    historique: [
      { etape: "Demande reçue", date: "9 août 2026 — 15:02", fait: true },
      { etape: "Vérification du dossier", date: "9 août 2026 — 16:20", fait: true },
      { etape: "Édition du document", date: "10 août 2026 — 09:05", fait: true },
      { etape: "Document prêt / notification", date: "10 août 2026 — 09:06", fait: true, current: true },
    ]
  },
  {
    code: "FAC-2026-000411",
    type: "duplicata",
    etudiant: "Espoir T.",
    matricule: "20190219",
    filiere: "Sciences de gestion",
    statut: "rejetee",
    motif: "Pièce d'identité illisible. Merci de soumettre une nouvelle photo de votre CNI.",
    historique: [
      { etape: "Demande reçue", date: "8 août 2026 — 11:30", fait: true },
      { etape: "Vérification du dossier", date: "9 août 2026 — 10:12", fait: true, current: true },
      { etape: "Dossier rejeté", date: "9 août 2026 — 10:12", fait: true, rejet: true },
    ]
  },
  {
    code: "FAC-2026-000377",
    type: "attestation",
    etudiant: "Chimène G.",
    matricule: "20201122",
    filiere: "Sciences économiques",
    statut: "retiree",
    historique: [
      { etape: "Demande reçue", date: "2 août 2026", fait: true },
      { etape: "Vérification du dossier", date: "3 août 2026", fait: true },
      { etape: "Édition du document", date: "4 août 2026", fait: true },
      { etape: "Document prêt", date: "4 août 2026", fait: true },
      { etape: "Retiré par l'étudiant", date: "6 août 2026 — 14:20", fait: true, current: true },
    ]
  }
];

const STATUTS = {
  recue:         { label: "Reçue",         badge: "badge-recue" },
  en_traitement: { label: "En traitement", badge: "badge-en-cours" },
  prete:         { label: "Prête",         badge: "badge-prete" },
  rejetee:       { label: "Rejetée",       badge: "badge-rejetee" },
  retiree:       { label: "Retirée",       badge: "badge-retiree" }
};

/* ---------------------------------------------------------------------- */
/* Utilitaires                                                             */
/* ---------------------------------------------------------------------- */
function genererCodeSuivi(){
  const n = Math.floor(100000 + Math.random() * 899999);
  return `FAC-2026-${n}`;
}

function badgeHTML(statutKey){
  const s = STATUTS[statutKey] || STATUTS.recue;
  return `<span class="badge ${s.badge}">${s.label}</span>`;
}

/* ---------------------------------------------------------------------- */
/* Navigation mobile                                                      */
/* ---------------------------------------------------------------------- */
function initNav(){
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if(!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* ---------------------------------------------------------------------- */
/* PAGE : Suivi d'une demande (suivi.html)                                */
/* ---------------------------------------------------------------------- */
function initSuivi(){
  const form = document.getElementById("track-form");
  if(!form) return;
  const input = document.getElementById("track-code");
  const result = document.getElementById("track-result");
  const errorBox = document.getElementById("track-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    const demande = DEMANDES_DEMO.find(d => d.code === code);

    errorBox.hidden = true;
    result.hidden = true;

    if(!demande){
      errorBox.hidden = false;
      errorBox.textContent = "Aucune demande ne correspond à ce code. Vérifiez la saisie (ex. FAC-2026-000452) ou contactez la scolarité.";
      return;
    }
    afficherResultatSuivi(demande, result);
  });
}

function afficherResultatSuivi(demande, container){
  const type = TYPES_ACTES[demande.type];
  const lignes = demande.historique.map(h => `
    <li class="${h.fait ? 'done' : ''} ${h.current ? 'current' : ''}">
      <span class="tdot"></span>
      <div>
        <h5>${h.etape}</h5>
        <span class="t-date">${h.date}</span>
      </div>
    </li>
  `).join("");

  const motif = demande.motif
    ? `<div class="alert alert-error mt-32"><strong>Motif du rejet :</strong>&nbsp;${demande.motif}</div>`
    : "";

  const telecharger = demande.statut === "prete"
    ? `<a href="#" class="btn btn-primary btn-block mt-32" onclick="alert('Démonstration : en production, ce bouton télécharge le PDF signé de votre ${type.label.toLowerCase()}.'); return false;">Télécharger le document (PDF)</a>`
    : "";

  container.hidden = false;
  container.innerHTML = `
    <div class="ticket status-card">
      <span class="ticket__notch ticket__notch--left"></span>
      <span class="ticket__notch ticket__notch--right"></span>
      <div class="status-card__top">
        <div>
          <span class="eyebrow">${type.label}</span>
          <div class="status-code">${demande.code}</div>
          <p class="small" style="margin-top:6px;">${demande.etudiant} — Matricule ${demande.matricule} — ${demande.filiere}</p>
        </div>
        ${badgeHTML(demande.statut)}
      </div>
      <div class="perf-line" style="margin:20px 0 0;"></div>
      <div class="status-card__body">
        <ul class="timeline">${lignes}</ul>
        ${motif}
        ${telecharger}
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------------------------------------------------------------------- */
/* PAGE : Nouvelle demande (nouvelle-demande.html)                        */
/* ---------------------------------------------------------------------- */
function initNouvelleDemande(){
  const wizard = document.getElementById("wizard");
  if(!wizard) return;

  let step = 1;
  const totalSteps = 4;
  const stepEls = wizard.querySelectorAll(".form-step");
  const stepperEls = document.querySelectorAll(".stepper .step");
  const typeCards = document.querySelectorAll(".type-card");
  const uploadInput = document.getElementById("upload-input");
  const fileListEl = document.getElementById("file-list");
  const recapBox = document.getElementById("recap-box");
  const codeOut = document.getElementById("generated-code");
  let selectedType = null;
  let files = [];

  function goTo(n){
    step = n;
    stepEls.forEach(el => el.classList.toggle("active", Number(el.dataset.step) === step));
    stepperEls.forEach(el => {
      const idx = Number(el.dataset.n);
      el.classList.toggle("active", idx === step);
      el.classList.toggle("done", idx < step);
    });
    window.scrollTo({ top: wizard.offsetTop - 100, behavior: "smooth" });
  }

  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      if(step === 1 && !selectedType){
        alert("Veuillez sélectionner un type d'acte pour continuer.");
        return;
      }
      if(step === 2){
        const requis = wizard.querySelectorAll('[data-step="2"] input[required], [data-step="2"] select[required]');
        for(const f of requis){ if(!f.value){ f.reportValidity(); return; } }
      }
      if(step === 3 && files.length === 0){
        alert("Veuillez téléverser au moins une pièce justificative.");
        return;
      }
      if(step === 3) buildRecap();
      if(step < totalSteps) goTo(step + 1);
    });
  });
  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => { if(step > 1) goTo(step - 1); });
  });

  typeCards.forEach(card => {
    card.addEventListener("click", () => {
      typeCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedType = card.dataset.type;
      const info = TYPES_ACTES[selectedType];
      const piecesBox = document.getElementById("pieces-requises");
      if(piecesBox){
        piecesBox.innerHTML = `
          <div class="alert alert-info">
            <div>
              <strong>Pièces requises pour « ${info.label} »</strong>
              <ul style="margin:8px 0 0;padding-left:18px;">
                ${info.pieces.map(p => `<li>${p}</li>`).join("")}
              </ul>
              <p class="small" style="margin:8px 0 0;">Délai estimé : ${info.delai} · Frais : ${info.tarif}</p>
            </div>
          </div>`;
      }
    });
  });

  if(uploadInput){
    uploadInput.addEventListener("change", () => {
      Array.from(uploadInput.files).forEach(f => files.push(f.name));
      renderFiles();
      uploadInput.value = "";
    });
  }
  function renderFiles(){
    fileListEl.innerHTML = files.map((name, i) => `
      <li>
        <span>📎 ${name}</span>
        <button type="button" data-i="${i}" aria-label="Retirer ce fichier">Retirer</button>
      </li>
    `).join("");
    fileListEl.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => { files.splice(Number(b.dataset.i), 1); renderFiles(); });
    });
  }

  function buildRecap(){
    const info = TYPES_ACTES[selectedType];
    const nom = document.getElementById("f-nom").value;
    const matricule = document.getElementById("f-matricule").value;
    const filiere = document.getElementById("f-filiere").value;
    const annee = document.getElementById("f-annee").value;
    recapBox.innerHTML = `
      <div class="perf-line" style="margin-bottom:18px;"></div>
      <dl class="recap-list">
        <div class="acte-row"><div><h4>Type d'acte</h4><p>${info.label}</p></div><span class="acte-meta">${info.tarif}</span></div>
        <div class="acte-row"><div><h4>Étudiant</h4><p>${nom} — Matricule ${matricule}</p></div></div>
        <div class="acte-row"><div><h4>Filière / Année</h4><p>${filiere} — ${annee}</p></div></div>
        <div class="acte-row"><div><h4>Pièces jointes</h4><p>${files.length} fichier(s) : ${files.join(", ")}</p></div></div>
      </dl>
    `;
  }

  const finalForm = document.getElementById("final-submit");
  if(finalForm){
    finalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = genererCodeSuivi();
      codeOut.textContent = code;
      goTo(5); // écran de confirmation (hors stepper)
      document.querySelectorAll(".stepper .step").forEach(el => el.classList.add("done"));
    });
  }
}

/* ---------------------------------------------------------------------- */
/* PAGE : Connexion (connexion.html)                                      */
/* ---------------------------------------------------------------------- */
function initConnexion(){
  const tabs = document.querySelectorAll(".auth-tabs button");
  const panels = document.querySelectorAll(".auth-panel");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      panels.forEach(p => p.hidden = p.dataset.panel !== tab.dataset.tab);
    });
  });

  const loginForm = document.getElementById("login-form");
  if(loginForm){
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      window.location.href = "tableau-bord.html";
    });
  }
  const magicForm = document.getElementById("magic-form");
  if(magicForm){
    magicForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const box = document.getElementById("magic-confirm");
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth" });
    });
  }
}

/* ---------------------------------------------------------------------- */
/* PAGE : Tableau de bord étudiant (tableau-bord.html)                    */
/* ---------------------------------------------------------------------- */
function initDashboard(){
  const list = document.getElementById("dash-list");
  if(!list) return;
  list.innerHTML = DEMANDES_DEMO.map(d => {
    const type = TYPES_ACTES[d.type];
    return `
      <div class="dash-item">
        <div>
          <h4>${type.label}</h4>
          <span class="meta">${d.code} · Déposée le ${d.historique[0].date}</span>
        </div>
        <div style="text-align:right;">
          ${badgeHTML(d.statut)}
          <div style="margin-top:8px;">
            <a class="btn btn-ghost btn-sm" href="suivi.html">Voir le suivi</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* ---------------------------------------------------------------------- */
/* PAGE : Back-office agent (back-office.html)                            */
/* ---------------------------------------------------------------------- */
function initBackOffice(){
  const tbody = document.getElementById("bo-tbody");
  if(!tbody) return;

  let data = JSON.parse(JSON.stringify(DEMANDES_DEMO)); // copie de travail en mémoire

  function render(){
    const filterStatut = document.getElementById("bo-filter-statut").value;
    const filterType = document.getElementById("bo-filter-type").value;
    const search = document.getElementById("bo-search").value.trim().toLowerCase();

    const rows = data.filter(d => {
      if(filterStatut && d.statut !== filterStatut) return false;
      if(filterType && d.type !== filterType) return false;
      if(search && !(d.code.toLowerCase().includes(search) || d.etudiant.toLowerCase().includes(search) || d.matricule.includes(search))) return false;
      return true;
    });

    tbody.innerHTML = rows.map((d, i) => `
      <tr>
        <td class="code">${d.code}</td>
        <td>${d.etudiant}<br><span class="small">${d.matricule}</span></td>
        <td>${TYPES_ACTES[d.type].label}</td>
        <td>${badgeHTML(d.statut)}</td>
        <td>${d.historique[0].date}</td>
        <td>
          <select class="bo-status-select" data-code="${d.code}">
            ${Object.entries(STATUTS).map(([k, v]) => `<option value="${k}" ${k === d.statut ? "selected" : ""}>${v.label}</option>`).join("")}
          </select>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6"><div class="empty">Aucune demande ne correspond à ces filtres.</div></td></tr>`;

    updateStats();

    tbody.querySelectorAll(".bo-status-select").forEach(sel => {
      sel.addEventListener("change", () => {
        const demande = data.find(d => d.code === sel.dataset.code);
        demande.statut = sel.value;
        render();
      });
    });
  }

  function updateStats(){
    document.getElementById("stat-total").textContent = data.length;
    document.getElementById("stat-recue").textContent = data.filter(d => d.statut === "recue" || d.statut === "en_traitement").length;
    document.getElementById("stat-prete").textContent = data.filter(d => d.statut === "prete").length;
    document.getElementById("stat-rejetee").textContent = data.filter(d => d.statut === "rejetee").length;
  }

  ["bo-filter-statut", "bo-filter-type", "bo-search"].forEach(id => {
    document.getElementById(id).addEventListener("input", render);
  });

  render();
}

/* ---------------------------------------------------------------------- */
/* Initialisation globale                                                 */
/* ---------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initSuivi();
  initNouvelleDemande();
  initConnexion();
  initDashboard();
  initBackOffice();

  // Année dynamique dans le pied de page
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});