document.addEventListener('DOMContentLoaded', () => {

  /* ============ PRELOADER (first visit + language switch) ============ */
  const preloader = document.getElementById('preloader');
  preloader.style.animation = 'none'; // script is running, so the CSS failsafe isn't needed
  const isMobile = window.matchMedia('(max-width:768px)').matches;
  const video = document.getElementById(isMobile ? 'preloader-mobile' : 'preloader-desktop');
  const reel = document.getElementById('demo-reel');

  let reelStarted = false;
  const bufferReel = () => {
    if (reel.preload !== 'auto') { reel.preload = 'auto'; reel.load(); }
  };
  const startReel = () => {
    if (reelStarted) return;
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
    entries.forEach(entry
