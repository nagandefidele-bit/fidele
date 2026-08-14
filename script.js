// --- ARRIÈRE-PLAN DYNAMIQUE (Effet Particules / Réseau fluides) ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const numberOfParticles = 45;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }
    draw() {
        ctx.fillStyle = 'rgba(51, 124, 207, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();

        // Relier les particules proches par des lignes subtiles
        for (let j = i; j < particlesArray.length; j++) {
            const dx = particlesArray[i].x - particlesArray[j].x;
            const dy = particlesArray[i].y - particlesArray[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                ctx.strokeStyle = `rgba(51, 124, 207, ${0.15 * (1 - distance / 120)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();


// --- GESTION DES NAVIGATION ET VUES DU SITE ---
function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active-section');
    });
    document.getElementById(sectionId).classList.add('active-section');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    // Met en surbrillance si le lien correspond
    event && event.target && event.target.classList.add('active');
}


// --- DONNÉES SIMULÉES DE DÉMONSTRATION ---
let mesDemandes = [
    { code: 'PARAKOU-2026-9402', type: 'Certificat de scolarité', date: '10/08/2026', statut: 'Prêt', classeStatut: 'ready' },
    { code: 'PARAKOU-2026-1148', type: 'Relevé de notes', date: '12/08/2026', statut: 'En cours', classeStatut: 'processing' }
];

// Suivi rapide anonyme
function rechercherDossier() {
    const input = document.getElementById('tracking-input').value.trim();
    const resultDiv = document.getElementById('tracking-result');
    if (input !== "") {
        resultDiv.classList.remove('hidden');
    } else {
        alert("Veuillez entrer un code de suivi valide.");
    }
}

// Connexion Étudiant
function connecterEtudiant(e) {
    e.preventDefault();
    const matricule = document.getElementById('matricule').value;
    
    // Simulation simple de connexion réussie
    document.getElementById('user-name').innerText = "Étudiant (" + matricule + ")";
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active-section'));
    document.getElementById('dashboard').classList.add('active-section');
    
    chargerTableauDeBord();
}

function deconnecter() {
    switchSection('accueil');
}

// Charger le tableau de bord
function chargerTableauDeBord() {
    const tbody = document.getElementById('demandes-list');
    tbody.innerHTML = "";

    mesDemandes.forEach(d => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${d.code}</strong></td>
            <td>${d.type}</td>
            <td>${d.date}</td>
            <td><span class="badge ${d.classeStatut}">${d.statut}</span></td>
            <td>
                ${d.statut === 'Prêt' ? '<button class="btn primary" style="padding:5px 10px; font-size:0.8rem;"><i class="fa-solid fa-download"></i> PDF</button>' : '<span style="color:var(--text-muted); font-size:0.85rem;">Aucune action</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal Nouvelle Demande
function ouvrirModalDemande() {
    document.getElementById('modal-demande').style.display = 'flex';
}

function fermerModalDemande() {
    document.getElementById('modal-demande').style.display = 'none';
}

// Soumission d'une nouvelle demande
function soumettreDemande(e) {
    e.preventDefault();
    const typeActe = document.getElementById('type-acte').value;
    const randomCode = 'PARAKOU-2026-' + Math.floor(1000 + Math.random() * 9000);

    // Ajout dans la liste locale
    mesDemandes.unshift({
        code: randomCode,
        type: typeActe,
        date: new Date().toLocaleDateString(),
        statut: 'En attente',
        classeStatut: 'pending'
    });

    fermerModalDemande();
    chargerTableauDeBord();
    alert("Demande soumise avec succès !\nVotre code de suivi unique est : " + randomCode);
}