document.addEventListener('DOMContentLoaded', () => {

  /* ============ PRELOADER ============ */
  const preloader = document.getElementById('preloader');
  const isMobile = window.matchMedia('(max-width:768px)').matches;
  const video = document.getElementById(isMobile ? 'preloader-mobile' : 'preloader-desktop');

  const alreadySeen = sessionStorage.getItem('hf_preloader_seen');

  if (alreadySeen) {
    preloader.style.display = 'none';
  } else {
    document.body.classList.add('preloader-active');
    video.play().catch(() => {});
    requestAnimationFrame(() => preloader.classList.add('visible'));

    const endPreloader = () => {
      preloader.classList.add('fade-out');
      sessionStorage.setItem('hf_preloader_seen', '1');
      setTimeout(() => {
        preloader.style.display = 'none';
        document.body.classList.remove('preloader-active');
      }, 1000);
    };

    video.addEventListener('ended', endPreloader);
    setTimeout(endPreloader, 8000);
  }

  /* ============ NAV: smooth scroll + active state ============ */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById(link.dataset.target).scrollIntoView({ behavior: 'smooth' });
    });
  });

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === entry.target.id));
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => navObserver.observe(s));

  /* ============ MISSION: sentence-by-sentence fade in (replays each visit) ============ */
  const missionLines = document.querySelectorAll('.mission-line');
  const missionContainer = document.querySelector('.mission-inner');
  let missionTimeouts = [];

  function playMissionReveal() {
    missionTimeouts.forEach(t => clearTimeout(t));
    missionTimeouts = [];
    missionLines.forEach(line => line.classList.remove('visible'));
    missionLines.forEach((line, i) => {
      missionTimeouts.push(setTimeout(() => line.classList.add('visible'), i * 700));
    });
  }

  if (missionContainer) {
    const missionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playMissionReveal();
        } else {
          missionTimeouts.forEach(t => clearTimeout(t));
          missionLines.forEach(line => line.classList.remove('visible'));
        }
      });
    }, { threshold: 0.4 });
    missionObserver.observe(missionContainer);
  }

  /* ============ CONTACT: fade in once, first time it's scrolled to ============ */
  const contactContainer = document.querySelector('.contact-inner');
  if (contactContainer) {
    const contactObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          contactContainer.classList.add('visible');
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    contactObserver.observe(contactContainer);
  }

  /* ============ PROJECTS: accordion ============ */
  const items = document.querySelectorAll('.accordion-item');
  const touchDevice = window.matchMedia('(hover: none)').matches;

  function expand(item) {
    items.forEach(i => i.classList.remove('expanded'));
    item.classList.add('expanded');
    const vid = item.querySelector('.accordion-video');
    vid.currentTime = 0;
    vid.play().catch(() => {});
  }
  function collapse(item) {
    item.classList.remove('expanded');
    item.querySelector('.accordion-video').pause();
  }

  items.forEach(item => {
    if (touchDevice) {
      item.addEventListener('click', () => {
        item.classList.contains('expanded') ? collapse(item) : expand(item);
      });
    } else {
      item.addEventListener('mouseenter', () => expand(item));
      item.addEventListener('mouseleave', () => collapse(item));
    }
  });

  /* ============ LANGUAGE TOGGLE (EN / FR) with fade transition ============ */
  const langToggle = document.getElementById('lang-toggle');
  const translatable = document.querySelectorAll('[data-en]');
  const placeholders = document.querySelectorAll('[data-en-ph]');
  const langImages = document.querySelectorAll('.lang-img');

  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
    translatable.forEach(el => { el.textContent = el.dataset[lang]; });
    placeholders.forEach(el => { el.placeholder = el.dataset[lang + 'Ph']; });
    langImages.forEach(img => { img.src = img.dataset[lang + 'Src']; });
    langToggle.textContent = lang === 'en' ? langToggle.dataset.en : langToggle.dataset.fr;
    localStorage.setItem('hf_lang', lang);
  }

  langToggle.addEventListener('click', () => {
    document.body.classList.add('fade-transition');
    setTimeout(() => {
      const current = document.documentElement.getAttribute('data-lang');
      applyLang(current === 'en' ? 'fr' : 'en');
      document.body.classList.remove('fade-transition');
    }, 400);
  });

  const savedLang = localStorage.getItem('hf_lang');
  if (savedLang) applyLang(savedLang);

});
