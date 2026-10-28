(() => {
  const root = document.documentElement;
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsapOk = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // ---------- Menu et nav (fonctionne meme sans GSAP) ----------
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav-burger');
  const fermerMenu = () => { document.body.classList.remove('menu-open'); burger && burger.setAttribute('aria-expanded', 'false'); };
  if (burger) {
    burger.addEventListener('click', () => {
      const ouvert = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(ouvert));
    });
    document.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', fermerMenu));
  }
  const majNav = () => nav && nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', majNav, { passive: true });
  majNav();

  const finChargement = () => document.body.classList.add('is-loaded');

  // ---------- Page reglement : sommaire actif ----------
  const liensRegles = document.querySelectorAll('.regles-nav a');
  if (liensRegles.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entrees => {
      entrees.forEach(e => {
        if (!e.isIntersecting) return;
        liensRegles.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.regle').forEach(s => obs.observe(s));
  }

  if (!gsapOk) {
    window.addEventListener('load', finChargement);
    setTimeout(finChargement, 2500);
    document.querySelectorAll('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
    document.querySelectorAll('.manifeste-text').forEach(el => el.style.opacity = 1);
    return;
  }

  root.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Scroll fluide ----------
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduit) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const cible = a.getAttribute('href');
        if (cible.length < 2 && cible !== '#') return;
        const el = cible === '#' ? document.body : document.querySelector(cible);
        if (!el) return;
        e.preventDefault();
        fermerMenu();
        lenis.scrollTo(el, { offset: -70 });
      });
    });
  }

  // ---------- Halo qui suit la souris ----------
  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(hover: hover)').matches) {
    const gx = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' });
    const gy = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' });
    window.addEventListener('mousemove', e => { gx(e.clientX); gy(e.clientY); });
  }

  // ---------- Titres decoupes en lignes ----------
  document.querySelectorAll('[data-split]').forEach(titre => {
    const lignes = titre.innerHTML.split(/<br\s*\/?>/i);
    titre.innerHTML = lignes.map(l => `<span class="line"><span>${l}</span></span>`).join('');
    gsap.from(titre.querySelectorAll('.line > span'), {
      yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12,
      scrollTrigger: { trigger: titre, start: 'top 85%' },
    });
  });

  document.querySelectorAll('.eyebrow, .lead, .manifeste-sub, .aussi-title, .notice').forEach(el => {
    gsap.from(el, { opacity: 0, y: 24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // ---------- HERO ----------
  const hero = document.querySelector('.hero');
  if (hero) {
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
    intro
      .from('.hero-halo', { scale: 0.3, opacity: 0, duration: 1.6 }, 0)
      .from('.hero-floor', { yPercent: 40, opacity: 0, duration: 1.6 }, 0.1)
      .from('.hero-logo', { scale: 0.6, opacity: 0, filter: 'blur(20px) drop-shadow(0 0 0 rgba(0,0,0,0))', duration: 1.4, clearProps: 'filter' }, 0.2)
      .from('.hero-ring', { scale: 0.5, opacity: 0, duration: 1.6 }, 0.3)
      .from('.hero-roleplay', { letterSpacing: '1.4em', opacity: 0, duration: 1.4 }, 0.55)
      .from('.hero-badge', { y: -20, opacity: 0, duration: 1 }, 0.6)
      .from('.hero-title', { y: 20, opacity: 0, duration: 1 }, 0.75)
      .from('.hero-cta .btn', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.85)
      .from('.hero-perso-g', { xPercent: -30, opacity: 0, duration: 1.6 }, 0.4)
      .from('.hero-perso-d', { xPercent: 30, opacity: 0, duration: 1.6 }, 0.5)
      .from('.nav', { y: -30, opacity: 0, duration: 1 }, 0.8)
      .from('.hero-scroll', { opacity: 0, duration: 1 }, 1.2);

    const lancer = () => { if (document.body.classList.contains('is-loaded')) return; finChargement(); intro.play(); };
    if (document.readyState === 'complete') setTimeout(lancer, 300);
    else window.addEventListener('load', () => setTimeout(lancer, 300));
    setTimeout(lancer, 3000);

    // parallaxe a la souris
    if (window.matchMedia('(hover: hover)').matches) {
      const couches = [...hero.querySelectorAll('[data-depth]')].map(el => ({
        x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }),
        d: parseFloat(el.dataset.depth),
      }));
      hero.addEventListener('mousemove', e => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        couches.forEach(c => { c.x(nx * -40 * c.d); c.y(ny * -24 * c.d); });
      });
    }

    // sortie du hero au scroll
    const sortie = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero-content', { yPercent: 35, opacity: 0, ease: 'none', scrollTrigger: sortie });
    gsap.to('.hero-perso-g', { yPercent: 18, ease: 'none', scrollTrigger: sortie });
    gsap.to('.hero-perso-d', { yPercent: 30, ease: 'none', scrollTrigger: sortie });
    gsap.to('.hero-bg', { yPercent: 25, ease: 'none', scrollTrigger: sortie });
  } else {
    if (document.readyState === 'complete') finChargement();
    else window.addEventListener('load', finChargement);
    setTimeout(finChargement, 2500);
    gsap.from('.page-hero .title .line > span', { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: 0.3 });
  }

  // ---------- Particules ----------
  document.querySelectorAll('.hero-particles').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, pts = [], visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const taille = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, w * h / 16000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.35 + 0.1, a: Math.random() * Math.PI * 2 }));
    };
    taille();
    window.addEventListener('resize', taille);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    gsap.ticker.add(() => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.y -= p.v; p.a += 0.02; p.x += Math.sin(p.a) * 0.25;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const al = 0.35 + Math.sin(p.a * 1.5) * 0.25;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 181, 253, ${al})`;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.9)'; ctx.shadowBlur = 8;
        ctx.fill();
      }
    });
  });

  // ---------- Manifeste : les mots s'allument ----------
  document.querySelectorAll('[data-words]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(m => `<span class="w">${m}</span>`).join(' ');
    gsap.to(el.querySelectorAll('.w'), {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    });
  });

  // ---------- Compteurs ----------
  document.querySelectorAll('[data-count]').forEach(el => {
    const fin = parseInt(el.dataset.count, 10);
    const o = { v: 0 };
    gsap.to(o, {
      v: fin, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => { el.textContent = Math.round(o.v); },
    });
  });
  gsap.from('.stat', { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  // ---------- Cartes ----------
  gsap.from('.card', { y: 70, opacity: 0, rotateX: -12, transformOrigin: '50% 0%', duration: 1.1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 82%' } });
  document.querySelectorAll('.card').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ---------- Exclusivites : defilement horizontal ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = document.querySelector('.exclus-track');
    const pin = document.querySelector('.exclus-pin');
    if (!track || !pin) return;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'center center', end: () => '+=' + distance(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    gsap.to('.exclus-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: pin, start: 'center center', end: () => '+=' + distance(), scrub: true } });
    track.querySelectorAll('.panel').forEach(p => {
      gsap.from(p.querySelectorAll('.panel-num, h3, p, li'), {
        x: 60, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 75%' },
      });
    });
  });
  mm.add('(max-width: 860px)', () => {
    document.querySelectorAll('.panel').forEach(p => {
      gsap.from(p, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%' } });
    });
  });

  gsap.from('.aussi-item', { y: 40, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.aussi-grid', start: 'top 85%' } });
  const front = document.querySelector('.frontiere img');
  if (front) gsap.fromTo(front, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: front, start: 'top bottom', end: 'bottom top', scrub: true } });

  // ---------- Destins ----------
  document.querySelectorAll('.destins-list li').forEach(li => {
    gsap.from(li.children, { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 90%' } });
  });

  // ---------- CTA ----------
  const ctaLogo = document.querySelector('.cta-logo');
  if (ctaLogo) gsap.from(ctaLogo, { scale: 0.4, opacity: 0, rotate: -20, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: ctaLogo, start: 'top 85%' } });
  gsap.from('.cta .hero-cta .btn', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.cta .hero-cta', start: 'top 92%' } });

  // ---------- Reglement ----------
  document.querySelectorAll('.regle li').forEach(li => {
    gsap.from(li, { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 92%' } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
