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

// --- 6. GESTION DYNAMIQUE DES PROJETS ---
// Base de données de tes projets (Facile à modifier !)
const projectsData = [
    {
        title: "Dashboard Ventes & Marketing",
        category: "data",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=500",
        desc: "Nettoyage de données et création d'un tableau de bord interactif pour suivre les KPI de l'entreprise.",
        tech: ["Python", "Pandas", "Matplotlib", "SQL"],
        github: "#",
        demo: "#"
    },
    {
        title: "Application Web de Gestion",
        category: "web",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500",
        desc: "Développement d'une interface web responsive pour la gestion interne d'un processus métier.",
        tech: ["HTML5", "CSS3", "JavaScript"],
        github: "#",
        demo: "#"
    },
    {
        title: "Analyse Économique Sectorielle",
        category: "sql",
        image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=500",
        desc: "Extraction, modélisation et optimisation de requêtes sur une large base de données relationnelle.",
        tech: ["PostgreSQL", "Data Viz", "Business Analysis"],
        github: "#",
        demo: "#"
    }
];

const projectsContainer = document.getElementById('projects-container');
const filterBtns = document.querySelectorAll('.filter-btn');

function displayProjects(filterType) {
    projectsContainer.innerHTML = ''; // Vide le conteneur
    
    const filteredProjects = filterType === 'all' 
        ? projectsData 
        : projectsData.filter(project => project.category === filterType);

    filteredProjects.forEach(project => {
        const projectHTML = `
            <div class="project-card reveal active">
                <img src="${project.image}" alt="${project.title}" class="project-img">
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-desc">${project.desc}</p>
                    <div class="project-tech">
                        ${project.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        <a href="${project.github}" target="_blank"><i class="fab fa-github"></i> Code</a>
                        <a href="${project.demo}" target="_blank"><i class="fas fa-external-link-alt"></i> Démo</a>
                    </div>
                </div>
            </div>
        `;
        projectsContainer.innerHTML += projectHTML;
    });
}

// Initialisation des projets
displayProjects('all');

// Filtrage au clic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Gérer la classe active
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Filtrer
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
