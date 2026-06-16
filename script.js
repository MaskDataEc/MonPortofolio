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
        const imageUrl = project.image ? project.image : 'https://via.placeholder.com/500x300';

        const projectHTML = `
            <div class="project-card reveal active">
                <img src="${imageUrl}" alt="${project.title}" class="project-img">
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-desc">${project.description}</p>
                    <div class="project-tech">
                        ${techArray.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${project.githubLink ? `<a href="${project.githubLink}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Code</a>` : ''}
                        ${project.demoLink ? `<a href="${project.demoLink}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Démo</a>` : ''}
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
document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
    e.target.reset();
});
