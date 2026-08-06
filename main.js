(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: scroll shadow + compact mode ---------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          header.classList.toggle('scrolled', y > 24);
          header.classList.toggle('compact', y > 120);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (toggle && mobileMenu) {
    const setOpen = (open) => {
      mobileMenu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };
    toggle.addEventListener('click', () => setOpen(!mobileMenu.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) setOpen(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ---------- Counter animation ---------- */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const value = Math.round(target * easeOut(p));
        el.textContent = value + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(el => {
        el.textContent = el.dataset.countTo + (el.dataset.suffix || '');
      });
    } else {
      const co = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            co.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(el => co.observe(el));
    }
  }

  /* ---------- Hero scroll motion (video scrub + words) ---------- */
  const heroScroll = document.getElementById('heroScroll');
  const heroVideo = document.getElementById('heroVideo');
  const heroWords = document.querySelectorAll('.hero-word');

  if (heroScroll && heroVideo && !prefersReducedMotion) {
    heroVideo.pause();
    const wordThresholds = [0.05, 0.28, 0.52, 0.76];
    let vidReady = false;
    let scheduled = false;
    let latestProgress = 0;
    let smoothTarget = 0;
    let smoothCurrent = 0;

    const updateVideo = () => {
      // Ease toward target for smoother scrubbing
      smoothCurrent += (smoothTarget - smoothCurrent) * 0.18;
      if (vidReady && heroVideo.duration > 0) {
        const t = heroVideo.duration * smoothCurrent;
        if (Math.abs(heroVideo.currentTime - t) > 0.03) {
          try { heroVideo.currentTime = t; } catch(e){}
        }
      }
      if (Math.abs(smoothTarget - smoothCurrent) > 0.001) {
        requestAnimationFrame(updateVideo);
      } else {
        scheduled = false;
      }
    };

    const onHeroScroll = () => {
      const rect = heroScroll.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      latestProgress = progress;
      smoothTarget = progress;

      // Words toggle
      heroWords.forEach((w, i) => {
        w.classList.toggle('in', progress >= wordThresholds[i]);
      });

      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateVideo);
      }
    };

    heroVideo.addEventListener('loadedmetadata', () => {
      vidReady = true;
      onHeroScroll();
    });
    if (heroVideo.readyState >= 1) { vidReady = true; onHeroScroll(); }

    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  } else if (heroWords.length) {
    // Reduced motion: show all words
    heroWords.forEach(w => w.classList.add('in'));
  }

  /* ---------- Process timeline observer ---------- */
  const processGrid = document.querySelector('.process-grid');
  if (processGrid) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      processGrid.classList.add('in-view');
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            processGrid.classList.add('in-view');
            io.unobserve(processGrid);
          }
        });
      }, { threshold: 0.25 });
      io.observe(processGrid);
    }
  }
})();
