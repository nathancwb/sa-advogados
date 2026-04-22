/**
 * SA ADVOGADOS - Main JavaScript
 * Interações, Parallax e Animações de Scroll
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. HEADER SCROLL EFFECT ---
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. MOBILE NAV MENU ---
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if(navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if(navMenu.classList.contains('active')) {
                icon.classList.remove('ri-menu-4-line');
                icon.classList.add('ri-close-line');
                header.style.backgroundColor = '#ffffff';
                header.classList.add('scrolled');
            } else {
                icon.classList.add('ri-menu-4-line');
                icon.classList.remove('ri-close-line');
                if(window.scrollY <= 50) {
                    header.style.backgroundColor = 'transparent';
                    header.classList.remove('scrolled');
                }
            }
        });
    }

    // Close menu when clicking link (EXCEPT dropdown toggles)
    navLinks.forEach(n => n.addEventListener('click', (e) => {
        if(n.classList.contains('dropdown-toggle')) {
            e.preventDefault();
            const parent = n.closest('.dropdown');
            parent.classList.toggle('open');
            return;
        }

        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const icon = navToggle.querySelector('i');
            icon.classList.add('ri-menu-4-line');
            icon.classList.remove('ri-close-line');
        }
    }));

    // --- 3. SCROLL REVEAL ANIMATIONS (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToReveal = document.querySelectorAll('.fade-up');
    elementsToReveal.forEach(el => observer.observe(el));

    // Stagger text on Hero section
    setTimeout(() => {
        document.querySelector('.subtitle').style.opacity = '1';
        document.querySelector('.title').style.opacity = '1';
        document.querySelector('.description').style.opacity = '1';
    }, 300);

    // --- 4. PARALLAX EFFECT ON IMAGES ---
    const paralaxImages = document.querySelectorAll('.paralax-img');
    
    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        
        paralaxImages.forEach(img => {
            let speed = 0.3;
            img.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });

    // --- 5. EXPERTISE ACCORDION (Exclusive Open Option) ---
    const detailsElements = document.querySelectorAll('.expertise-item');
    detailsElements.forEach(targetDetail => {
        targetDetail.addEventListener("click", () => {
            detailsElements.forEach(detail => {
                if (detail !== targetDetail) {
                    detail.removeAttribute("open");
                }
            });
        });
    });

    // --- 6. CUSTOM MOUSE CURSOR (Optional subtle UI element) ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if(cursorDot && cursorOutline && window.innerWidth > 992) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows exactly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay using animate
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover effect for links
        const interactibles = document.querySelectorAll('a, button, summary');
        interactibles.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorOutline.style.backgroundColor = 'rgba(60, 60, 61, 0.1)';
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }

});
