(function () {
  // Menu mobile
  var burger = document.querySelector('.burger');
  var liens = document.querySelector('.site-liens');
  if (burger) {
    burger.addEventListener('click', function () {
      var ouvert = liens.classList.toggle('ouvert');
      burger.setAttribute('aria-expanded', ouvert);
      burger.textContent = ouvert ? 'FERMER' : 'MENU';
    });
  }

  // Onglets des Cartes
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function choisir(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (window.gsap) gsap.fromTo('#' + tab.getAttribute('aria-controls'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { choisir(t); });
    t.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (j === null) return;
      e.preventDefault();
      var n = tabs[(j + tabs.length) % tabs.length];
      choisir(n);
      n.focus();
    });
  });

  // Agrandissement des affiches
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lightbox-img');
    var dernier = null;
    var fermer = function () { lb.hidden = true; if (dernier) dernier.focus(); };
    document.querySelectorAll('.poster').forEach(function (b) {
      b.addEventListener('click', function () {
        dernier = b;
        lbImg.src = b.getAttribute('data-src');
        lbImg.alt = b.querySelector('img').alt;
        lb.hidden = false;
        document.getElementById('lightbox-close').focus();
      });
    });
    lb.addEventListener('click', fermer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) fermer(); });
  }

  // Sommaire du lore
  var chap = Array.prototype.slice.call(document.querySelectorAll('.chapitres a'));
  if (chap.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        chap.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('on', on);
          if (on) a.parentNode.parentNode.scrollLeft = a.offsetLeft - 20;
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.lore section[id]').forEach(function (s) { io.observe(s); });
  }

  // Poussière au ralenti du hero
  var canvas = document.getElementById('poussiere');
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var pts = [];
    var w = 0, h = 0, visible = true;
    var dim = function () {
      var r = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * r; canvas.height = h * r;
      ctx.setTransform(r, 0, 0, r, 0, 0);
    };
    dim();
    window.addEventListener('resize', dim);
    for (var i = 0; i < 70; i++) {
      pts.push({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.7, v: 0.00004 + Math.random() * 0.00016, d: Math.random() * 6.28, a: 0.15 + Math.random() * 0.6 });
    }
    var dessiner = function (t) {
      ctx.clearRect(0, 0, w, h);
      pts.forEach(function (p) {
        if (!calme) {
          p.y -= p.v;
          if (p.y < -0.02) p.y = 1.02;
        }
        var x = (p.x + Math.sin(t / 9000 + p.d) * 0.012) * w;
        ctx.beginPath();
        ctx.arc(x, p.y * h, p.r, 0, 6.29);
        ctx.fillStyle = 'rgba(214,170,255,' + p.a + ')';
        ctx.fill();
      });
      if (!calme && visible) requestAnimationFrame(dessiner);
    };
    if ('IntersectionObserver' in window && !calme) {
      new IntersectionObserver(function (e) {
        var avant = visible;
        visible = e[0].isIntersecting;
        if (visible && !avant) requestAnimationFrame(dessiner);
      }).observe(canvas);
    }
    requestAnimationFrame(dessiner);
  }

  // Mouvement : sans GSAP, tout le contenu reste simplement affiché
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var LENT = 1.6;
  var ecranLarge = window.matchMedia('(min-width: 861px)').matches;

  // Hero : entrée au ralenti, puis sortie liée au défilement
  if (document.querySelector('.hero')) {
    gsap.timeline({ defaults: { ease: 'expo.out', duration: 2.2 } })
      .from('.hero-ligne', { scaleX: 0, duration: 2.8, ease: 'power3.inOut' }, 0)
      .from('.hero-lumiere', { opacity: 0, scale: 0.75, duration: 3.2, ease: 'power2.out' }, 0)
      .from('.hero-logo', { opacity: 0, scale: 0.9, y: 22 }, 0.35)
      .from('.hero .sur', { opacity: 0, y: 16 }, 0.6)
      .from('.hero h1 span, .hero h1 em', { opacity: 0, y: 50, stagger: 0.22 }, 0.7)
      .from('.hero .lead', { opacity: 0, y: 22 }, 1.25)
      .from('.hero .actions', { opacity: 0, y: 22 }, 1.45)
      .from('.defiler', { opacity: 0, duration: 1.6 }, 1.9);
    var sortie = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: LENT };
    gsap.to('.hero-c', { y: -90, opacity: 0, scale: 0.96, ease: 'none', scrollTrigger: sortie });
    gsap.to('.hero-lumiere', { scale: 1.3, ease: 'none', scrollTrigger: sortie });
    gsap.to('.hero-ligne', { y: 40, opacity: 0.25, ease: 'none', scrollTrigger: sortie });
  }

  // Manifeste : les mots s'allument un par un
  document.querySelectorAll('[data-mots]').forEach(function (bloc) {
    var html = '';
    bloc.childNodes.forEach(function (n) {
      var fort = n.nodeType === 1;
      n.textContent.split(/\s+/).filter(Boolean).forEach(function (mot) {
        html += '<span class="m' + (fort ? ' fort' : '') + '">' + mot + '</span> ';
      });
    });
    bloc.setAttribute('aria-label', bloc.textContent.replace(/\s+/g, ' ').trim());
    bloc.innerHTML = html;
    var mots = bloc.querySelectorAll('.m');
    var opts = { opacity: 0.12, stagger: 0.06, ease: 'none' };
    if (ecranLarge) {
      opts.scrollTrigger = { trigger: bloc.parentNode, start: 'top top', end: '+=140%', scrub: LENT, pin: true };
    } else {
      opts.scrollTrigger = { trigger: bloc, start: 'top 80%', end: 'bottom 45%', scrub: LENT };
    }
    gsap.from(mots, opts);
  });

  // Apparitions lentes
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    gsap.from(el, { opacity: 0, y: 44, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.utils.toArray('[data-rv-groupe]').forEach(function (g) {
    gsap.from(g.children, { opacity: 0, y: 44, duration: 1.8, stagger: 0.14, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 86%', once: true } });
  });

  // Images : dévoilement + léger recul
  gsap.utils.toArray('.sys-img').forEach(function (b) {
    var img = b.querySelector('img');
    gsap.from(b, { clipPath: 'inset(0 0 100% 0)', duration: 2, ease: 'expo.inOut', scrollTrigger: { trigger: b, start: 'top 85%', once: true } });
    gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: LENT } });
  });

  // Cartes : profondeur au défilement
  if (ecranLarge) {
    gsap.utils.toArray('.cartes-3 figure').forEach(function (f, i) {
      gsap.fromTo(f, { y: [120, 40, 170][i], rotation: [-4, 0, 4][i] }, { y: [-40, 0, -70][i], rotation: 0, ease: 'none', scrollTrigger: { trigger: '.cartes-3', start: 'top bottom', end: 'bottom 30%', scrub: LENT } });
    });
  }

  // Affiches : rail qui glisse lentement
  var rail = document.querySelector('.affiches-rail');
  if (rail) {
    gsap.to(rail, { x: function () { return Math.min(0, window.innerWidth - rail.scrollWidth); }, ease: 'none', scrollTrigger: { trigger: '.affiches', start: 'top bottom', end: 'bottom top', scrub: LENT, invalidateOnRefresh: true } });
  }

  // Lore : animation des blocs
  gsap.utils.toArray('.lore .sec-head').forEach(function (el) {
    gsap.from(el.children, { opacity: 0, y: 40, duration: 1.7, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });
  gsap.utils.toArray('.lore .timeline li, .lore .zone, .lore .event, .lore .paper, .lore .note, .lore .essentiel, .lore .eclipse, .lore .noire, .lore .loi').forEach(function (el) {
    gsap.from(el, { opacity: 0, y: 34, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.utils.toArray('.lore .grid, .lore .posters').forEach(function (g) {
    gsap.from(g.children, { opacity: 0, y: 34, duration: 1.5, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 88%', once: true } });
  });

  // Pages Bientôt et en-têtes
  var tete = document.querySelector('.bientot .c, .page-tete .c');
  if (tete) gsap.from(tete.children, { opacity: 0, y: 40, duration: 2, stagger: 0.16, ease: 'expo.out', delay: 0.1 });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
