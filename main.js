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

  /* ---------- Floating WhatsApp: reveal after meaningful scroll ---------- */
  const waFloat = document.querySelector('.wa-float');
  if (waFloat) {
    let waTicking = false;
    const updateWaFloat = () => {
      if (waTicking) return;
      waTicking = true;
      window.requestAnimationFrame(() => {
        waFloat.classList.toggle('is-visible', window.scrollY > 180);
        waTicking = false;
      });
    };
    window.addEventListener('scroll', updateWaFloat, { passive: true });
    updateWaFloat();
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

  /* ---------- Hero: video plays smoothly, words appear on scroll ---------- */
  const heroScroll = document.getElementById('heroScroll');
  const heroVideo = document.getElementById('heroVideo');
  const heroWords = document.querySelectorAll('.hero-word');

  if (heroVideo) {
    const showVideo = () => heroVideo.classList.add('is-ready');
    ['loadeddata', 'canplay', 'playing'].forEach(eventName => {
      heroVideo.addEventListener(eventName, showVideo, { once: true });
    });
    if (heroVideo.readyState >= 2) showVideo();
    heroVideo.play().then(showVideo).catch(()=>{});
  }

  if (heroScroll && heroWords.length && !prefersReducedMotion) {
    // Precisão sempre visível (threshold 0); demais aparecem gradual até ~90%
    const wordThresholds = [0, 0.30, 0.60, 0.90];
    let ticking = false;
    const onHeroScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = heroScroll.getBoundingClientRect();
        const total = Math.max(1, rect.height - window.innerHeight);
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / total));
        heroWords.forEach((w, i) => {
          w.classList.toggle('in', progress >= wordThresholds[i]);
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
    // First frame: ensure "Precisão" is already visible
    heroWords[0]?.classList.add('in');
  } else if (heroWords.length) {
    heroWords.forEach(w => w.classList.add('in'));
  }

  /* ---------- Timeline observer ---------- */
  const timeline = document.getElementById('processTimeline');
  if (timeline) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      timeline.classList.add('in-view');
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            timeline.classList.add('in-view');
            io.unobserve(timeline);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
      io.observe(timeline);
    }
  }

  /* ---------- Home 3: scroll motion em três planos ---------- */
  const home3Depth = document.getElementById('home3Depth');
  if (home3Depth && !prefersReducedMotion) {
    let home3Frame = 0;
    const updateHome3Depth = () => {
      home3Frame = 0;
      if (window.innerWidth <= 767) {
        home3Depth.style.setProperty('--home3-scene-y', '0px');
        home3Depth.style.setProperty('--home3-equipment-y', '0px');
        home3Depth.style.setProperty('--home3-copy-y', '0px');
        return;
      }
      const rect = home3Depth.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      const sceneDepth = 0.13;
      const equipmentDepth = 0.4;
      const copyDepth = -0.1;
      home3Depth.style.setProperty('--home3-scene-y', `${(progress * rect.height * sceneDepth).toFixed(2)}px`);
      home3Depth.style.setProperty('--home3-equipment-y', `${(progress * rect.height * equipmentDepth).toFixed(2)}px`);
      home3Depth.style.setProperty('--home3-copy-y', `${(progress * rect.height * copyDepth).toFixed(2)}px`);
    };
    const queueHome3Depth = () => {
      if (!home3Frame) home3Frame = requestAnimationFrame(updateHome3Depth);
    };
    window.addEventListener('scroll', queueHome3Depth, { passive:true });
    window.addEventListener('resize', queueHome3Depth, { passive:true });
    queueHome3Depth();
  }

})();
