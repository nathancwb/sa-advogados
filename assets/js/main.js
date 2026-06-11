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
            if(window.scrollY <= 50) {
                header.style.backgroundColor = 'transparent';
                header.classList.remove('scrolled');
            }
        }
    }));

    // Also close menu when clicking dropdown items
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item') && navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (navToggle) {
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('ri-menu-4-line');
                    icon.classList.remove('ri-close-line');
                }
            }
            if(window.scrollY <= 50) {
                header.style.backgroundColor = 'transparent';
                header.classList.remove('scrolled');
            }
        }
    });

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

    // Stagger text on Hero section (só existe na home — protege contra null nas páginas internas)
    setTimeout(() => {
        document.querySelectorAll('.hero .subtitle, .hero .title, .hero .description').forEach(el => {
            el.style.opacity = '1';
        });
    }, 300);

    // --- 4. PARALLAX EFFECT ON IMAGES (throttled via requestAnimationFrame) ---
    const paralaxImages = document.querySelectorAll('.paralax-img');

    if (paralaxImages.length) {
        let parallaxTicking = false;
        window.addEventListener('scroll', () => {
            if (parallaxTicking) return;
            parallaxTicking = true;
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                paralaxImages.forEach(img => {
                    img.style.transform = `translateY(${scrollY * 0.3}px)`;
                });
                parallaxTicking = false;
            });
        }, { passive: true });
    }

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



    // --- 7. CONTACT FORM SUBMISSION ---
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');

    if (contactForm && formFeedback) {
        // Número de destino do escritório (mesmo do CTA do WhatsApp)
        const WHATSAPP_NUMBER = '5548991381200';

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const submitBtn = contactForm.querySelector('.form-submit');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Abrindo WhatsApp... <i class="ri-loader-4-line ri-spin"></i>';
            submitBtn.disabled = true;

            // Monta a mensagem com os dados do formulário
            const data = new FormData(contactForm);
            const linhas = [
                '*Novo contato pelo site — SA Advogados*',
                '',
                `*Nome:* ${data.get('name') || ''}`,
                `*E-mail:* ${data.get('email') || ''}`,
                `*Telefone:* ${data.get('phone') || ''}`,
                `*Área de interesse:* ${data.get('area') || ''}`,
                '',
                `*Mensagem:*`,
                `${data.get('message') || ''}`
            ];
            const texto = encodeURIComponent(linhas.join('\n'));
            const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${texto}`;

            // Abre o WhatsApp (nova aba) para o lead chegar de fato ao escritório
            window.open(waUrl, '_blank', 'noopener');

            formFeedback.innerHTML = 'Tudo certo! Abrimos o WhatsApp com a sua mensagem pronta — é só tocar em enviar. Se não abrir, fale conosco pelo (48) 99138-1200.';
            formFeedback.className = 'form-feedback success';

            contactForm.reset();
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;

            setTimeout(() => {
                formFeedback.innerHTML = '';
                formFeedback.className = 'form-feedback';
            }, 8000);
        });
    }

});
