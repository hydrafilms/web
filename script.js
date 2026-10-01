document.addEventListener('DOMContentLoaded', () => {

  /* ============ PRELOADER (first visit + language switch) ============ */
  const preloader = document.getElementById('preloader');
  preloader.style.animation = 'none'; // script is running, so the CSS failsafe isn't needed
  const isMobile = window.matchMedia('(max-width:768px)').matches;
  const video = document.getElementById(isMobile ? 'preloader-mobile' : 'preloader-desktop');
  const reel = document.getElementById('demo-reel');

  let reelStarted = false;
  const bufferReel = () => {
    if (!reel) return;
    if (reel.preload !== 'auto') { reel.preload = 'auto'; reel.load(); }
  };
  const startReel = () => {
    if (!reel || reelStarted) return;
    reelStarted = true;
    bufferReel();
    reel.play().catch(() => {});
  };

  let running = false;

  function runPreloader({ fadeIn = false, onCovered, onDone } = {}) {
    running = true;
    let finished = false;
    let coveredDone = false;
    let timer;
    const listeners = new AbortController();

    const covered = () => {
      if (coveredDone) return;
      coveredDone = true;
      if (onCovered) onCovered();
    };

    preloader.classList.remove('visible');
    preloader.style.display = 'flex';
    if (fadeIn) {
      preloader.classList.add('fade-out');   // start transparent
      void preloader.offsetWidth;            // register it before fading in
      preloader.classList.remove('fade-out');
      setTimeout(covered, 1000);             // fully black after the 1s fade
    } else {
      preloader.classList.remove('fade-out');
      covered();
    }
    document.body.classList.add('preloader-active');

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      listeners.abort();
      covered();                             // make sure the language still switches
      preloader.classList.add('fade-out');
      if (onDone) onDone();
      setTimeout(() => {
        preloader.style.display = 'none';
        document.body.classList.remove('preloader-active');
        video.pause();
        running = false;
      }, 1000);
    };

    // If the trailer hasn't started within 12 seconds, skip it
    timer = setTimeout(finish, 12000);

    // Once it's actually playing, fade it in and allow its full length
    video.addEventListener('playing', () => {
      preloader.classList.add('visible');
      bufferReel();
      clearTimeout(timer);
      const length = isFinite(video.duration) ? video.duration : 15;
      timer = setTimeout(finish, (length + 2) * 1000);
    }, { once: true, signal: listeners.signal });

    video.addEventListener('ended', finish, { once: true, signal: listeners.signal });

    video.currentTime = 0;
    video.play().catch(finish);
  }

  if (sessionStorage.getItem('hf_preloader_seen')) {
    preloader.style.display = 'none';
    startReel();
  } else {
    runPreloader({
      onDone: () => {
        sessionStorage.setItem('hf_preloader_seen', '1');
        startReel();
      }
    });
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
    items.forEach(i => { if (i !== item) collapse(i); });
    item.classList.add('expanded');
    const vid = item.querySelector('.accordion-video');
    vid.currentTime = 0;
    vid.addEventListener('playing', () => {
      if (item.classList.contains('expanded')) item.classList.add('playing');
    }, { once: true });
    vid.play().catch(() => {});
  }
  function collapse(item) {
    item.classList.remove('expanded', 'playing');
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

  /* ============ LANGUAGE TOGGLE (EN / FR) with preloader ============ */
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
    if (running) return; // ignore clicks while the preloader is already playing
    runPreloader({
      fadeIn: true,
      onCovered: () => {
        const current = document.documentElement.getAttribute('data-lang');
        applyLang(current === 'en' ? 'fr' : 'en');
      }
    });
  });

  const savedLang = localStorage.getItem('hf_lang');
  if (savedLang) applyLang(savedLang);

});
