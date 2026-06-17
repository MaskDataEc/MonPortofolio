// --- 1. GESTION DU THEME (Dark/Light Mode) ---
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.documentElement;
const icon = themeToggleBtn.querySelector('i');

// Vérifie si un thème est déjà sauvegardé
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if(theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// --- 2. MENU MOBILE ---
const mobileBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = mobileBtn.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Fermer le menu quand on clique sur un lien
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileBtn.querySelector('i').classList.replace('fa-times', 'fa-bars');
    });
});

// --- 3. EFFET MACHINE A ECRIRE (Typing Effect) ---
const textArray = ["Full-Stack Analyst", "Data Analyst", "Développeur Python", "Spécialiste SQL", "Problem Solver"];
const typingText = document.querySelector(".typing-text");
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const currentText = textArray[textIndex];
    if (isDeleting) {
        typingText.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2000; // Pause à la fin du mot
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % textArray.length;
        typeSpeed = 500; // Pause avant le prochain mot
    }
    setTimeout(type, typeSpeed);
}
document.addEventListener("DOMContentLoaded", type);

// --- 4. ANIMATIONS AU SCROLL (Intersection Observer) ---
const revealElements = document.querySelectorAll('.reveal');

const revealOptions = {
    threshold: 0.1, // Déclenche quand 10% de l'élément est visible
    rootMargin: "0px 0px -50px 0px"
};

const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active');
        
        // Si c'est une carte de stat, on lance le compteur
        if (entry.target.classList.contains('stats-grid')) {
            startCounters();
        }
        
        observer.unobserve(entry.target); // Ne le joue qu'une fois
    });
}, revealOptions);

revealElements.forEach(el => revealOnScroll.observe(el));

// --- 5. COMPTEURS ANIMES ---
let countersStarted = false;
function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // Vitesse globale

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const inc = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target + (target > 10 ? '+' : '');
            }
        };
        updateCount();
    });
}

// --- 6. GESTION DYNAMIQUE DES PROJETS (VIA DECAP CMS JSON) ---

// Échappe le texte avant de l'injecter en HTML, pour éviter toute injection
// (XSS) si jamais une donnée du JSON contient des caractères HTML/JS.
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Valide qu'une URL est bien http(s) avant de l'utiliser dans un attribut href/src
// (évite les liens type javascript: ou data: injectés via le CMS).
function safeURL(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url, window.location.origin);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : '';
    } catch {
        // URL relative simple (ex: assets/uploads/xxx.png) sans schéma explicite
        return /^[a-zA-Z0-9_\-./%]+$/.test(url) ? url : '';
    }
}

const projectsContainer = document.getElementById('projects-container');
const filterBtns = document.querySelectorAll('.filter-btn');
let globalProjectsData = [];

async function fetchProjectsFromCMS() {
    try {
        // On va lire le fichier JSON généré par le CMS
        const response = await fetch('./data/projects.json');
        if (!response.ok) throw new Error("Fichier introuvable");
        
        const data = await response.json();
        
        // Le CMS stocke les projets dans le tableau "items"
        globalProjectsData = data.items || []; 
        displayProjects('all'); 
        
    } catch (error) {
        console.error("Erreur de chargement des projets :", error);
        projectsContainer.innerHTML = `<p style="text-align:center; width:100%;">Aucun projet à afficher pour le moment.</p>`;
    }
}

function displayProjects(filterType) {
    projectsContainer.innerHTML = ''; 
    
    const filteredProjects = filterType === 'all' 
        ? globalProjectsData 
        : globalProjectsData.filter(project => project.category === filterType);

    filteredProjects.forEach(project => {
        // Le CMS nous donne "Python, Pandas", on le transforme en tableau
        const techArray = project.tech ? project.tech.split(',').map(t => t.trim()) : [];
        const imageUrl = safeURL(project.image) || 'https://via.placeholder.com/500x300';
        const githubLink = safeURL(project.githubLink);
        const demoLink = safeURL(project.demoLink);

        const projectHTML = `
            <div class="project-card reveal active">
                <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(project.title)}" class="project-img" loading="lazy">
                <div class="project-content">
                    <h3 class="project-title">${escapeHTML(project.title)}</h3>
                    <p class="project-desc">${escapeHTML(project.description)}</p>
                    <div class="project-tech">
                        ${techArray.map(t => `<span class="tech-tag">${escapeHTML(t)}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${githubLink ? `<a href="${escapeHTML(githubLink)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Code</a>` : ''}
                        ${demoLink ? `<a href="${escapeHTML(demoLink)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Démo</a>` : ''}
                    </div>
                </div>
            </div>
        `;
        projectsContainer.innerHTML += projectHTML;
    });
}

// Initialisation
fetchProjectsFromCMS();

// Gestion des filtres
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        displayProjects(btn.getAttribute('data-filter'));
    });
});

// --- 7. BOUTON RETOUR EN HAUT ---
const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
});

backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// --- 8. PREVENIR LE RECHARGEMENT DU FORMULAIRE ---
// IMPORTANT : on cible le formulaire par sa structure, pas par un id qui n'existe pas.
// L'ancien code utilisait getElementById('contact-form'), un id absent du HTML,
// ce qui provoquait une erreur fatale et empêchait TOUT le code situé plus bas
// dans ce fichier de s'exécuter, dont le chargement des certifications ci-dessous.
const contactForm = document.querySelector('.contact-grid form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Envoi en cours...';
        }

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
                contactForm.reset();
            } else {
                alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de m'écrire directement par email.");
            }
        } catch (error) {
            console.error("Erreur d'envoi du formulaire :", error);
            alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de m'écrire directement par email.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });
}


// --- 9. GESTION DYNAMIQUE DES CERTIFICATIONS (VIA CMS) ---
const timelineContainer = document.getElementById('timeline-container');

async function fetchCertificationsFromCMS() {
    if(!timelineContainer) return;

    try {
        const response = await fetch('./data/certifications.json');
        if (!response.ok) throw new Error("Fichier certifications introuvable");
        
        const data = await response.json();
        const certifications = data.items || [];
        
        timelineContainer.innerHTML = ''; // On vide le conteneur

        certifications.forEach(cert => {
            // S'il y a un fichier (PDF ou image), on crée le bouton
            const proofUrl = safeURL(cert.proofFile);
            const proofButton = proofUrl ? `
                <a href="${escapeHTML(proofUrl)}" target="_blank" rel="noopener noreferrer" class="btn-cert">
                    <i class="fas fa-file-download"></i> Voir la preuve
                </a>
            ` : '';

            const certHTML = `
                <div class="timeline-item reveal active">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <h3>${escapeHTML(cert.title)}</h3>
                        <p class="date">${escapeHTML(cert.year)}</p>
                        <p>${escapeHTML(cert.description)}</p>
                        ${proofButton}
                    </div>
                </div>
            `;
            timelineContainer.innerHTML += certHTML;
        });
        
    } catch (error) {
        console.error("Erreur de chargement des certifications :", error);
        timelineContainer.innerHTML = `<p style="text-align:center;">Mise à jour du parcours en cours...</p>`;
    }
}

// On lance la fonction au démarrage
fetchCertificationsFromCMS();
