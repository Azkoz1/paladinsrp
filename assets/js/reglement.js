(function () {
  var chapitres = Array.prototype.slice.call(document.querySelectorAll('.chap'));
  var regles = [];

  // Identifiant et bouton « lien » pour chaque règle (ex : #r6-14)
  chapitres.forEach(function (chap, ci) {
    var n = chap.querySelector('.chap-num');
    if (n) n.setAttribute('data-n', String(ci + 1).padStart(2, '0'));
    chap.querySelectorAll('.regles > li').forEach(function (li, ri) {
      var num = (ci + 1) + '.' + (ri + 1);
      li.id = 'r' + (ci + 1) + '-' + (ri + 1);
      li.setAttribute('data-num', num);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'regle-lien';
      b.textContent = 'Lien';
      b.setAttribute('aria-label', 'Copier le lien de la règle ' + num);
      b.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#' + li.id;
        history.replaceState(null, '', '#' + li.id);
        cibler(li);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () { b.textContent = 'Copié'; setTimeout(function () { b.textContent = 'Lien'; }, 1600); }, function () {});
        }
      });
      regles.push({ li: li, chap: chap, texte: li.textContent.toLowerCase(), html: li.innerHTML });
      li.appendChild(b);
    });
  });

  document.body.classList.add('js-num');

  function cibler(li) {
    document.querySelectorAll('.regles > li.cible').forEach(function (x) { x.classList.remove('cible'); });
    li.classList.add('cible');
  }

  // Lien direct vers une règle
  function suivreAncre() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    if (el && el.matches('.regles > li')) {
      cibler(el);
      el.scrollIntoView({ block: 'center' });
    }
  }
  window.addEventListener('hashchange', suivreAncre);
  setTimeout(suivreAncre, 60);

  // Sommaire actif
  var liens = Array.prototype.slice.call(document.querySelectorAll('.reg-sommaire a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        liens.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('on', on);
          if (on && window.matchMedia('(max-width:900px)').matches) a.parentNode.parentNode.scrollLeft = a.parentNode.offsetLeft - 20;
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    chapitres.forEach(function (c) { io.observe(c); });
  }

  // Recherche
  var champ = document.getElementById('reg-q');
  var resultat = document.getElementById('reg-resultat');
  var vide = document.getElementById('reg-vide');
  var blocs = document.querySelectorAll('.reg-corps .bloc');
  var minuteur = null;

  function echapper(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function surligner(node, re) {
    if (node.nodeType === 3) {
      if (!re.test(node.nodeValue)) return;
      re.lastIndex = 0;
      var span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }).replace(re, '<mark>$&</mark>');
      node.parentNode.replaceChild(span, node);
      return;
    }
    if (node.nodeType === 1 && node.tagName !== 'BUTTON') Array.prototype.slice.call(node.childNodes).forEach(function (n) { surligner(n, re); });
  }

  var notions = Array.prototype.slice.call(document.querySelectorAll('.lexique > div')).map(function (el) {
    return { el: el, html: el.innerHTML, texte: el.textContent.toLowerCase() };
  });

  function chercher() {
    var q = champ.value.trim().toLowerCase();
    var n = 0;
    regles.forEach(function (r) {
      var bouton = r.li.querySelector('.regle-lien');
      r.li.innerHTML = r.html;
      r.li.appendChild(bouton);
      var ok = !q || r.texte.indexOf(q) !== -1;
      r.li.classList.toggle('cache', !ok);
      if (ok && q) {
        n++;
        surligner(r.li, new RegExp(echapper(q), 'gi'));
      }
    });
    notions.forEach(function (d) {
      d.el.innerHTML = d.html;
      var ok = !q || d.texte.indexOf(q) !== -1;
      d.el.classList.toggle('cache', !ok);
      if (ok && q) { n++; surligner(d.el, new RegExp(echapper(q), 'gi')); }
    });
    blocs.forEach(function (b) { b.classList.toggle('bloc-cache', !!q); });
    document.body.classList.toggle('reg-cherche', !!q);
    chapitres.forEach(function (c) {
      var visibles = c.querySelectorAll('.regles > li:not(.cache), .lexique > div:not(.cache)').length;
      c.classList.toggle('cache', !!q && !visibles);
      c.querySelectorAll('h3').forEach(function (h) {
        var liste = h.nextElementSibling;
        while (liste && !liste.classList.contains('regles') && !liste.classList.contains('lexique')) liste = liste.nextElementSibling;
        h.classList.toggle('cache', !!q && (!liste || !liste.querySelector(':scope > li:not(.cache), :scope > div:not(.cache)')));
      });
    });
    resultat.textContent = q ? n + ' résultat' + (n > 1 ? 's' : '') : '';
    vide.hidden = !q || n > 0;
  }
  if (champ) {
    champ.addEventListener('input', function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(chercher, 140);
    });
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { champ.value = ''; chercher(); }
    });
  }
})();
