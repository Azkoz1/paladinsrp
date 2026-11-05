// Boutique PaladinsRP : catalogue et paiement via Tebex Headless
// Clé publique du webstore paladinsrp.tebex.store (publique, sans risque dans le code)
(function () {
  var TOKEN = '155i4-81eda73da31d5282fa146641c7071207f819b559';
  var API = 'https://headless.tebex.io/api';
  var CLE_PANIER = 'paladins_panier';
  var PAGE = location.origin + location.pathname;

  // Images et textes du site, par quantité de coins (les textes Tebex restent la référence en secours)
  var FICHES = {
    1500: {
      img: 'assets/img/boutique/coins-1500.webp',
      accroche: "Le coup de pouce idéal pour te faire plaisir sans y penser.",
      desc: "<p>Un premier pas dans la boutique. Assez pour personnaliser ta plaque, adopter un compagnon ou t'offrir un petit objet qui change tout dans tes scènes de RP.</p><ul><li>1 500 coins crédités sur ton compte en jeu</li><li>Parfait pour une personnalisation ou un animal</li><li>Ton soutien aide directement le serveur à évoluer</li></ul>"
    },
    2500: {
      img: 'assets/img/boutique/coins-2500.webp',
      accroche: "De quoi te démarquer en ville dès ce soir.",
      desc: "<p>Le pack pour ceux qui veulent marquer le coup : plaque sur mesure, numéro choisi et un compagnon à tes côtés. Ton personnage gagne en caractère, et ça se voit.</p><ul><li>2 500 coins crédités sur ton compte en jeu</li><li>Combine plusieurs articles de la boutique</li><li>Ton soutien aide directement le serveur à évoluer</li></ul>"
    },
    5500: {
      img: 'assets/img/boutique/coins-5500.webp',
      accroche: "Le choix préféré des habitants de Los Santos.",
      desc: "<p>Assez pour viser un véhicule exclusif et garder de la marge pour le reste. Avec 10 % de coins en plus par euro, c'est le pack le plus équilibré de la boutique.</p><ul><li>5 500 coins crédités sur ton compte en jeu</li><li>Bonus de 10 % par rapport au petit pack</li><li>De quoi débloquer un véhicule exclusif et plus encore</li></ul>"
    },
    10000: {
      img: 'assets/img/boutique/coins-10000.webp',
      accroche: "Pour ceux qui veulent tout. Et tout de suite.",
      desc: "<p>Le pack ultime. Véhicules exclusifs, packs, personnalisation : tu fais le tour de la boutique sans compter, avec le meilleur rapport coins par euro.</p><ul><li>10 000 coins crédités sur ton compte en jeu</li><li>Meilleure valeur : bonus de 18 % par rapport au petit pack</li><li>Le plus gros soutien au développement du serveur</li></ul>"
    }
  };
  // Affiché si l'API Tebex ne répond pas (les achats restent alors indisponibles)
  var SECOURS = [
    { id: 7779209, name: 'Paladins Coins x1500', base_price: 14.99, total_price: 17.99, discount: 0, currency: 'EUR' },
    { id: 7779210, name: 'Paladins Coins x2500', base_price: 24.99, total_price: 29.99, discount: 0, currency: 'EUR' },
    { id: 7779212, name: 'Paladins Coins x5500', base_price: 49.99, total_price: 59.99, discount: 0, currency: 'EUR' },
    { id: 7779213, name: 'Paladins Coins x10 000', base_price: 84.99, total_price: 101.99, discount: 0, currency: 'EUR' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var etat = { packs: [], panier: null, courant: null, horsLigne: false };

  function prix(v, devise) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise || 'EUR' }).format(v || 0);
  }
  function echap(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function qte(p) {
    var m = String(p.name).replace(/\s/g, '').match(/x(\d+)/i);
    return m ? Number(m[1]) : 0;
  }
  function fiche(p) { return FICHES[qte(p)] || {}; }
  // Prix hors taxes : base_price, réduit si une promo est active
  function prixHT(p) { return Math.max(0, (p.base_price || 0) - (p.discount || 0)); }

  var minuteur;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function api(chemin, options) {
    options = options || {};
    return fetch(API + chemin, {
      method: options.method || 'GET',
      body: options.body,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.detail || j.title || ('Erreur ' + r.status));
        return j.data !== undefined ? j.data : j;
      });
    });
  }

  // ---------- Catalogue ----------
  function squelette() {
    var h = '';
    for (var i = 0; i < 4; i++) h += '<article class="pack charge"><div class="pack-img"></div><div class="pack-corps"><div class="pack-qte">0000</div><p class="pack-accroche">.</p></div></article>';
    $('packs').innerHTML = h;
  }

  function chargerCatalogue() {
    squelette();
    return api('/accounts/' + TOKEN + '/categories?includePackages=1').then(function (cats) {
      etat.packs = [];
      cats.forEach(function (c) { (c.packages || []).forEach(function (p) { etat.packs.push(p); }); });
    }).catch(function () {
      etat.packs = SECOURS;
      etat.horsLigne = true;
      $('packsErreur').textContent = "La boutique est momentanément indisponible. Les prix sont affichés à titre indicatif, réessaie dans quelques minutes.";
      $('packsErreur').hidden = false;
    }).then(function () {
      etat.packs.sort(function (a, b) { return qte(a) - qte(b); });
      afficherPacks();
    });
  }

  function afficherPacks() {
    var base = etat.packs.length ? qte(etat.packs[0]) / prixHT(etat.packs[0]) : 0;
    var n = etat.packs.length;
    $('packs').innerHTML = etat.packs.map(function (p, i) {
      var f = fiche(p);
      var q = qte(p);
      var gain = base ? Math.round((q / prixHT(p) / base - 1) * 100) : 0;
      var badge = '';
      if (n > 2 && i === n - 2) badge = '<span class="badge">Le plus populaire</span>';
      if (n > 1 && i === n - 1) badge = '<span class="badge or">Meilleure valeur</span>';
      var img = f.img || p.image;
      return '<article class="pack' + (i === n - 2 ? ' vedette' : '') + '" data-pack="' + p.id + '" tabindex="0">' +
        '<div class="pack-img">' + badge + (gain >= 3 ? '<span class="bonus">+' + gain + ' % offerts</span>' : '') +
        (img ? '<img src="' + echap(img) + '" alt="Paladins Coins x' + q + '" loading="lazy">' : '') + '</div>' +
        '<div class="pack-corps"><div class="pack-qte">' + q.toLocaleString('fr-FR') + '<small>Paladins Coins</small></div>' +
        '<p class="pack-accroche">' + echap(f.accroche || '') + '</p>' +
        '<div class="pack-pied">' + blocPrix(p) +
        '<button class="btn btn-p" data-acheter="' + p.id + '">Acheter</button></div></div></article>';
    }).join('');
    animer();
  }

  function blocPrix(p) {
    var promo = p.discount > 0 ? '<s>' + prix(p.base_price, p.currency) + '</s>' : '';
    return '<div class="prix">' + promo + '<b>' + prix(prixHT(p), p.currency) + '</b><span>HT · TVA au paiement</span></div>';
  }

  function animer() {
    if (!window.gsap) return;
    gsap.fromTo('.pack', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' });
  }

  // ---------- Fiche ----------
  function ouvrirFiche(id) {
    var p = etat.packs.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    var f = fiche(p);
    etat.courant = p;
    $('ficheImg').src = f.img || p.image || '';
    $('ficheImg').alt = p.name;
    $('ficheSur').textContent = 'Pack de coins';
    $('ficheTitre').textContent = qte(p).toLocaleString('fr-FR') + ' coins';
    $('ficheDesc').innerHTML = f.desc || p.description || '';
    $('fichePrix').outerHTML = blocPrix(p).replace('class="prix"', 'class="prix" id="fichePrix"');
    $('fiche').hidden = false;
    document.body.style.overflow = 'hidden';
    if (window.gsap) gsap.fromTo('.fiche-panneau', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
  }

  function fermer() {
    $('fiche').hidden = true;
    $('panier').hidden = true;
    document.body.style.overflow = '';
  }

  // ---------- Panier ----------
  function lireCle() { try { return localStorage.getItem(CLE_PANIER); } catch (e) { return null; } }
  function ecrireCle(v) { try { v ? localStorage.setItem(CLE_PANIER, v) : localStorage.removeItem(CLE_PANIER); } catch (e) {} }

  function panier(creer) {
    var ident = lireCle();
    var existant = ident
      ? api('/accounts/' + TOKEN + '/baskets/' + ident).then(function (b) { return b.complete ? null : b; }).catch(function () { return null; })
      : Promise.resolve(null);
    return existant.then(function (b) {
      if (b) return b;
      ecrireCle(null);
      if (!creer) return null;
      return api('/accounts/' + TOKEN + '/baskets', {
        method: 'POST',
        body: JSON.stringify({ complete_url: PAGE + '?paye=1', cancel_url: PAGE, complete_auto_redirect: true })
      }).then(function (nb) { ecrireCle(nb.ident); return nb; });
    });
  }

  function ajouter(id) {
    if (etat.horsLigne) { toast('Boutique indisponible pour le moment, réessaie plus tard'); return; }
    panier(true).then(function (b) {
      if (!b.username) {
        var retour = PAGE + '?ajout=' + encodeURIComponent(id);
        return api('/accounts/' + TOKEN + '/baskets/' + b.ident + '/auth?returnUrl=' + encodeURIComponent(retour)).then(function (liens) {
          var l = [].concat(liens).flat().filter(function (x) { return x && x.url; });
          if (l.length) { toast('Connexion à ton compte Cfx.re…'); location.href = l[0].url; return; }
          throw new Error('Connexion Cfx.re indisponible');
        });
      }
      return api('/baskets/' + b.ident + '/packages', {
        method: 'POST',
        body: JSON.stringify({ package_id: Number(id), quantity: 1 })
      }).then(function (nb) {
        etat.panier = nb;
        afficherPanier();
        fermer();
        ouvrirPanier();
        toast('Ajouté au panier');
      });
    }).catch(function (e) { toast(e.message || "Impossible d'ajouter au panier"); });
  }

  function retirer(id) {
    api('/baskets/' + etat.panier.ident + '/packages/remove', {
      method: 'POST',
      body: JSON.stringify({ package_id: Number(id) })
    }).then(function (b) { etat.panier = b; afficherPanier(); })
      .catch(function (e) { toast(e.message || 'Erreur'); });
  }

  function afficherPanier() {
    var b = etat.panier;
    var items = (b && b.packages) || [];
    var nb = items.reduce(function (n, p) { return n + ((p.in_basket && p.in_basket.quantity) || 1); }, 0);
    $('panierNb').textContent = nb;
    $('panierNb').hidden = nb === 0;
    $('panierUser').hidden = !(b && b.username);
    if (b && b.username) $('panierUser').innerHTML = 'Connecté en tant que <strong>' + echap(b.username) + '</strong>';

    var devise = (b && b.currency) || 'EUR';
    $('panierItems').innerHTML = items.length ? items.map(function (p) {
      var c = etat.packs.find(function (x) { return String(x.id) === String(p.id); }) || p;
      var q = (p.in_basket && p.in_basket.quantity) || 1;
      var img = fiche(c).img || p.image || c.image;
      return '<div class="panier-item">' + (img ? '<img src="' + echap(img) + '" alt="">' : '<span></span>') +
        '<div><b>' + qte(c).toLocaleString('fr-FR') + ' coins</b><span>' + (q > 1 ? q + ' x ' : '') + prix(prixHT(c), devise) + ' HT</span></div>' +
        '<button data-retirer="' + p.id + '" aria-label="Retirer">&times;</button></div>';
    }).join('') : '<p class="panier-vide">Ton panier est vide.</p>';

    var ht = b ? Number(b.base_price || 0) - Number(b.discount || 0) : 0;
    var tva = b ? Number(b.sales_tax || 0) : 0;
    var ttc = b ? Number(b.total_price || 0) : 0;
    $('totHT').textContent = prix(ht, devise);
    $('totTVA').textContent = prix(tva, devise);
    $('totTTC').textContent = prix(ttc, devise);
    $('payer').disabled = items.length === 0;
    $('codeForm').hidden = items.length === 0;
    var codes = (b && b.coupons) || [];
    $('codesActifs').hidden = codes.length === 0;
    $('codesActifs').innerHTML = codes.map(function (c) {
      return 'Code ' + echap(c.code) + ' appliqué<button data-code-retirer="' + echap(c.code) + '">retirer</button>';
    }).join('<br>');
  }

  function appliquerCode(code) {
    if (!etat.panier || !code) return;
    api('/accounts/' + TOKEN + '/baskets/' + etat.panier.ident + '/coupons', { method: 'POST', body: JSON.stringify({ coupon_code: code }) })
      .then(function () { return api('/accounts/' + TOKEN + '/baskets/' + etat.panier.ident); })
      .then(function (b) { etat.panier = b; afficherPanier(); $('codeInput').value = ''; toast('Code promo appliqué'); })
      .catch(function (e) { toast(e.message || 'Code promo invalide'); });
  }

  function retirerCode(code) {
    api('/accounts/' + TOKEN + '/baskets/' + etat.panier.ident + '/coupons/remove', { method: 'POST', body: JSON.stringify({ coupon_code: code }) })
      .then(function () { return api('/accounts/' + TOKEN + '/baskets/' + etat.panier.ident); })
      .then(function (b) { etat.panier = b; afficherPanier(); })
      .catch(function (e) { toast(e.message || 'Erreur'); });
  }

  function ouvrirPanier() {
    afficherPanier();
    $('panier').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function payer() {
    var b = etat.panier;
    if (!b) return;
    if (window.Tebex && Tebex.checkout) {
      Tebex.checkout.init({ ident: b.ident, theme: 'dark', colors: [{ name: 'primary', color: '#8A00C2' }, { name: 'secondary', color: '#120E19' }] });
      Tebex.checkout.on('payment:complete', paye);
      fermer();
      Tebex.checkout.launch();
    } else if (b.links && b.links.checkout) {
      location.href = b.links.checkout;
    }
  }

  function paye() {
    ecrireCle(null);
    etat.panier = null;
    afficherPanier();
    toast('Merci pour ton soutien ! Tes coins arrivent sur ton compte en jeu.');
  }

  // ---------- Événements ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-acheter]');
    if (a) { e.stopPropagation(); ajouter(a.dataset.acheter); return; }
    var rc = e.target.closest('[data-code-retirer]');
    if (rc) { retirerCode(rc.dataset.codeRetirer); return; }
    var r = e.target.closest('[data-retirer]');
    if (r) { retirer(r.dataset.retirer); return; }
    var c = e.target.closest('[data-pack]');
    if (c) { ouvrirFiche(c.dataset.pack); return; }
    if (e.target.closest('[data-fermer]')) fermer();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fermer();
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-pack]')) ouvrirFiche(e.target.dataset.pack);
  });
  $('ficheAcheter').addEventListener('click', function () { if (etat.courant) ajouter(etat.courant.id); });
  $('panierBtn').addEventListener('click', ouvrirPanier);
  $('payer').addEventListener('click', payer);
  $('codeForm').addEventListener('submit', function (e) { e.preventDefault(); appliquerCode($('codeInput').value.trim()); });

  // ---------- Démarrage ----------
  chargerCatalogue().then(function () {
    if (etat.horsLigne) return;
    var params = new URLSearchParams(location.search);
    var ajout = params.get('ajout');
    var ok = params.get('paye');
    if (ajout || ok) history.replaceState(null, '', PAGE);
    if (ok) { paye(); return; }
    return panier(false).then(function (b) {
      etat.panier = b;
      afficherPanier();
      if (ajout && b && b.username) ajouter(ajout);
    });
  });
})();
