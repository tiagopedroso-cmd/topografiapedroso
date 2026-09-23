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
          header.classList.toggle('compact', y > 120 && window.innerWidth < 768);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Empresa: título digitado na Hero ---------- */
  const companyHeroTyped = document.getElementById('companyHeroTyped');
  if (companyHeroTyped && !prefersReducedMotion) {
    const phrases = [
      'todos os detalhes!',
      'todas as necessidades!',
      'todos os solos!',
      'todos os trâmites!',
      'todos os processos!'
    ];
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let deleting = false;

    const typeHeroPhrase = () => {
      const phrase = phrases[phraseIndex];

      if (!deleting && charIndex === phrase.length) {
        deleting = true;
        window.setTimeout(typeHeroPhrase, 1650);
        return;
      }

      if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(typeHeroPhrase, 170);
        return;
      }

      charIndex += deleting ? -1 : 1;
      companyHeroTyped.textContent = phrases[phraseIndex].slice(0, charIndex);
      window.setTimeout(typeHeroPhrase, deleting ? 24 : 38);
    };

    window.setTimeout(typeHeroPhrase, 1650);
  }

  /* ---------- Serviços: transição contínua entre ciclos do vídeo ---------- */
  const servicesHeroBackground = document.querySelector('.services-hero-background');
  const servicesHeroVideos = servicesHeroBackground?.querySelectorAll('video');
  if (servicesHeroVideos?.length === 2) {
    let activeIndex = 0;
    let crossfading = false;
    const resumeVideo = video => {
      if (video.ended) video.currentTime = 0;
      if (video.paused) video.play().catch(() => {});
    };
    const crossfadeLoop = () => {
      if (crossfading) return;
      crossfading = true;
      const outgoing = servicesHeroVideos[activeIndex];
      const incoming = servicesHeroVideos[1 - activeIndex];
      incoming.currentTime = 0;
      incoming.play().then(() => {
        servicesHeroBackground.classList.add('is-crossfading');
        void servicesHeroBackground.offsetWidth;
        outgoing.classList.remove('is-active');
        incoming.classList.add('is-active');
        window.setTimeout(() => {
          activeIndex = 1 - activeIndex;
          outgoing.pause();
          outgoing.currentTime = 0;
          servicesHeroBackground.classList.remove('is-crossfading');
          crossfading = false;
        }, 850);
      }).catch(() => { crossfading = false; });
    };
    servicesHeroVideos.forEach((video, index) => {
      video.muted = true;
      video.loop = true;
      video.addEventListener('timeupdate', () => {
        if (index !== activeIndex || crossfading || !Number.isFinite(video.duration)) return;
        const overlap = Math.min(1.4, video.duration * .3);
        if (video.currentTime >= video.duration - overlap) crossfadeLoop();
      });
      video.addEventListener('ended', () => {
        if (index === activeIndex) resumeVideo(video);
      });
      video.addEventListener('pause', () => {
        if (index === activeIndex && !document.hidden) {
          window.setTimeout(() => {
            if (index === activeIndex) resumeVideo(video);
          }, 120);
        }
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) resumeVideo(servicesHeroVideos[activeIndex]);
    });
    resumeVideo(servicesHeroVideos[0]);
  }

  const servicesHeroCurrent = document.getElementById('servicesHeroCurrent');
  const servicesHeroNext = document.getElementById('servicesHeroNext');
  if (servicesHeroCurrent && servicesHeroNext) {
    const servicesHeroWindow = servicesHeroCurrent.parentElement;
    const phrases = ['obra.', 'regularização.', 'documentação.', 'usucapião.'];
    let phraseIndex = 0;
    window.setInterval(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      if (prefersReducedMotion) {
        servicesHeroCurrent.textContent = phrases[phraseIndex];
        return;
      }
      servicesHeroNext.textContent = phrases[phraseIndex];
      servicesHeroWindow.classList.add('is-changing');
      window.setTimeout(() => {
        servicesHeroCurrent.textContent = phrases[phraseIndex];
        servicesHeroWindow.classList.remove('is-changing');
        servicesHeroNext.textContent = '';
      }, 500);
    }, 3000);
  }

  /* ---------- Serviços: iniciar o mapa móvel pela base em Arujá ---------- */
  const areaMapViewport = document.querySelector('.services-area-map-viewport');
  if (areaMapViewport) {
    let areaMapPositioned = false;
    const positionAreaMap = () => {
      if (areaMapPositioned || window.innerWidth > 640) return;
      areaMapViewport.scrollLeft = Math.max(0, areaMapViewport.scrollWidth * .38 - areaMapViewport.clientWidth / 2);
      areaMapPositioned = true;
    };
    window.requestAnimationFrame(positionAreaMap);
    window.addEventListener('resize', positionAreaMap, { passive: true });
  }

  /* ---------- Floating WhatsApp: reveal after meaningful scroll ---------- */
  const waFloat = document.querySelector('.wa-float');
  if (waFloat) {
    let waTicking = false;
    const updateWaFloat = () => {
      if (waTicking) return;
      waTicking = true;
      window.requestAnimationFrame(() => {
        const isHomeMobile = document.body.classList.contains('home-page') && window.matchMedia('(max-width: 767px)').matches;
        waFloat.classList.toggle('is-visible', isHomeMobile || window.scrollY > 180);
        waTicking = false;
      });
    };
    window.addEventListener('scroll', updateWaFloat, { passive: true });
    window.addEventListener('resize', updateWaFloat, { passive: true });
    updateWaFloat();
  }

  /* Home mobile: toque ou pressão longa no endereço abre a rota */
  const addressRoute = document.querySelector('.home-page .address-mobile-route');
  if (addressRoute) {
    let routeHoldTimer = 0;
    let routeStartX = 0;
    let routeStartY = 0;
    const cancelRouteHold = () => {
      window.clearTimeout(routeHoldTimer);
      routeHoldTimer = 0;
    };
    addressRoute.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || !window.matchMedia('(max-width: 767px)').matches) return;
      routeStartX = event.clientX;
      routeStartY = event.clientY;
      routeHoldTimer = window.setTimeout(() => window.location.assign(addressRoute.href), 500);
    });
    addressRoute.addEventListener('pointermove', event => {
      if (Math.abs(event.clientX - routeStartX) > 12 || Math.abs(event.clientY - routeStartY) > 12) cancelRouteHold();
    });
    addressRoute.addEventListener('pointerup', cancelRouteHold);
    addressRoute.addEventListener('pointercancel', cancelRouteHold);
    addressRoute.addEventListener('contextmenu', event => {
      if (window.matchMedia('(max-width: 767px)').matches) event.preventDefault();
    });
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

  /* ---------- Empresa: profundidade da Hero em dois planos ---------- */
  const companyHeroDepth = document.getElementById('companyHeroDepth');
  if (companyHeroDepth && !prefersReducedMotion) {
    let companyHeroFrame = 0;
    const updateCompanyHeroDepth = () => {
      companyHeroFrame = 0;
      if (window.innerWidth <= 900) {
        companyHeroDepth.style.setProperty('--company-scene-y', '0px');
        companyHeroDepth.style.setProperty('--company-man-y', '0px');
        return;
      }
      const rect = companyHeroDepth.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      companyHeroDepth.style.setProperty('--company-scene-y', `${(progress * rect.height * 0.13).toFixed(2)}px`);
      companyHeroDepth.style.setProperty('--company-man-y', `${(progress * rect.height * 0.4).toFixed(2)}px`);
    };
    const queueCompanyHeroDepth = () => {
      if (!companyHeroFrame) companyHeroFrame = window.requestAnimationFrame(updateCompanyHeroDepth);
    };
    window.addEventListener('scroll', queueCompanyHeroDepth, { passive:true });
    window.addEventListener('resize', queueCompanyHeroDepth, { passive:true });
    queueCompanyHeroDepth();
  }

  /* ---------- Home: esteira contínua de serviços ---------- */
  const servicesLedger = document.querySelector('.home-3 .services-ledger');
  if (servicesLedger && !servicesLedger.dataset.marqueeReady) {
    servicesLedger.dataset.marqueeReady = 'true';
    const viewport = document.createElement('div');
    viewport.className = 'services-marquee-viewport';
    servicesLedger.parentNode.insertBefore(viewport, servicesLedger);
    viewport.appendChild(servicesLedger);

    const primaryGroup = document.createElement('div');
    primaryGroup.className = 'services-marquee-group';
    Array.from(servicesLedger.children).forEach(card => {
      card.classList.add('in');
      primaryGroup.appendChild(card);
    });

    const duplicateGroup = primaryGroup.cloneNode(true);
    duplicateGroup.setAttribute('aria-hidden', 'true');
    duplicateGroup.querySelectorAll('a,button').forEach(element => element.setAttribute('tabindex', '-1'));
    servicesLedger.append(primaryGroup, duplicateGroup);
    servicesLedger.classList.add('is-marquee-ready');

    let position = 0;
    let previousTime = performance.now();
    let pauseUntil = 0;
    let groupWidth = 1;
    let dragging = false;
    let dragged = false;
    let pointerStart = 0;
    let positionStart = 0;

    const measureMarquee = () => {
      const gap = parseFloat(getComputedStyle(servicesLedger).gap) || 0;
      groupWidth = primaryGroup.getBoundingClientRect().width + gap;
    };
    const wrapPosition = () => {
      while (position <= -groupWidth) position += groupWidth;
      while (position > 0) position -= groupWidth;
    };
    const renderMarquee = now => {
      const elapsed = Math.min(40, now - previousTime);
      previousTime = now;
      const speed = window.matchMedia('(max-width: 767px)').matches ? 0.065 : 0.026;
      if (!dragging && !prefersReducedMotion && now > pauseUntil) position -= elapsed * speed;
      wrapPosition();
      servicesLedger.style.transform = `translate3d(${position.toFixed(2)}px,0,0)`;
      requestAnimationFrame(renderMarquee);
    };

    viewport.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      dragged = false;
      pointerStart = event.clientX;
      positionStart = position;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointermove', event => {
      if (!dragging) return;
      const distance = event.clientX - pointerStart;
      dragged = dragged || Math.abs(distance) > 5;
      position = positionStart + distance;
      wrapPosition();
    });
    const endMarqueeDrag = event => {
      if (!dragging) return;
      dragging = false;
      pauseUntil = performance.now() + 1200;
      viewport.classList.remove('is-dragging');
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    };
    viewport.addEventListener('pointerup', endMarqueeDrag);
    viewport.addEventListener('pointercancel', endMarqueeDrag);
    viewport.addEventListener('click', event => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);
    viewport.addEventListener('wheel', event => {
      event.preventDefault();
      const wheelTravel = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      position -= wheelTravel * 0.48;
      pauseUntil = performance.now() + 900;
      wrapPosition();
    }, { passive:false });
    window.addEventListener('resize', measureMarquee, { passive:true });
    measureMarquee();
    requestAnimationFrame(renderMarquee);
  }

  /* ---------- Home 3: tilt 3D amortecido nos serviços ---------- */
  const home3ServiceCards = document.querySelectorAll('.home-3 .services-marquee-group:first-child .card');
  const supportsCardTilt = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (home3ServiceCards.length && supportsCardTilt && !prefersReducedMotion) {
    home3ServiceCards.forEach(card => {
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let velocityX = 0;
      let velocityY = 0;
      let frame = 0;

      const animateTilt = () => {
        const stiffness = 0.115;
        const damping = 0.72;
        velocityX = (velocityX + (targetX - currentX) * stiffness) * damping;
        velocityY = (velocityY + (targetY - currentY) * stiffness) * damping;
        currentX += velocityX;
        currentY += velocityY;
        card.style.setProperty('--tilt-x', `${currentX.toFixed(3)}deg`);
        card.style.setProperty('--tilt-y', `${currentY.toFixed(3)}deg`);
        const moving = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) + Math.abs(velocityX) + Math.abs(velocityY) > 0.01;
        if (moving) frame = requestAnimationFrame(animateTilt);
        else frame = 0;
      };
      const queueTilt = () => {
        if (!frame) frame = requestAnimationFrame(animateTilt);
      };

      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        targetX = y * -21;
        targetY = x * 21;
        card.style.setProperty('--tilt-lift', '-3px');
        queueTilt();
      }, { passive:true });
      card.addEventListener('pointerleave', () => {
        targetX = 0;
        targetY = 0;
        card.style.setProperty('--tilt-lift', '0px');
        queueTilt();
      }, { passive:true });
    });
  }

})();
