/* Kerangka aplikasi: router hash dengan penjaga akses, cangkang sesuai akun, delegasi event. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  var H = R.handlers = R.handlers || {};
  var F = R.forms = R.forms || {};

  /* Menjalankan aksi dan menampilkan pesan aturan bila ditolak */
  R.run = function (fn, okMsg) {
    try { fn(); if (okMsg) R.toast(okMsg, 'ok'); return true; }
    catch (e) {
      if (e instanceof R.RuleError) { R.toast(e.message, 'bad'); return false; }
      console.error(e); R.toast('Terjadi kesalahan tak terduga: ' + e.message, 'bad'); return false;
    }
  };

  var LEGACY = { 'peran/operator': 'ledger', 'peran/keberlanjutan': 'laporan', 'peran/assurance': 'assurance', 'peran/pembiayaan': 'pembiayaan', 'peran/ojk': 'pengawasan' };
  function route() { return location.hash.replace(/^#\/?/, '').replace(/\/$/, ''); }

  /* Jumlah tindakan menunggu untuk akun yang masuk, per halaman */
  function todo(page, S) {
    var n = 0, me = R.meId();
    if (page === 'ledger' && R.can('ledger.decide')) n = S.metrics.pending;
    if (page === 'laporan') {
      var next = R.actions.nextReportStep();
      if (next && next.actor === me && !S.metrics.pending) n++;
      if (R.can('finding.respond')) n += S.findingOrder.filter(function (id) { return !S.findings[id].response; }).length;
      if (R.can('consent.set') && S.consent.status === 'diminta') n++;
      if (R.can('report.restate') && S.stale) n++;
    }
    if (page === 'assurance' && S.engagement && !S.conclusion) n = 1;
    if (page === 'pembiayaan' && S.conclusion && S.consent.status === 'diberikan' && !S.checks.some(function (c) { return c.version === S.report.version && c.conclusion === S.conclusion.code; })) n = 1;
    if (page === 'rantai' && !R.store.integrity.ok) n = '!';
    return n;
  }

  function shell(page, content) {
    var S = R.store.S, integ = R.store.integrity, me = R.me();
    var nav = me.pages.map(function (k) {
      var pg = R.PAGES[k], n = todo(k, S), on = page === k;
      return '<a class="nav-item ' + (on ? 'on' : '') + '" href="#/' + k + '" ' + (on ? 'aria-current="page"' : '') + '>' + ic(pg.icon) + '<span><b>' + pg.label + '</b><small>' + pg.sub + '</small></span>' +
        (n ? '<i class="nav-n ' + (n === '!' ? 'nav-bad' : '') + '" aria-label="' + n + ' tindakan menunggu">' + n + '</i>' : '') + '</a>';
    }).join('');
    var caps = me.caps.map(function (c) { return '<li>' + ic('check') + esc(R.CAP_LABELS[c]) + '</li>'; }).join('');
    var ph = R.PHASES[S.phase];
    var banner = integ.ok ? '' : '<div class="banner banner-bad banner-top">' + ic('alert') + '<div><b>Integritas ledger rusak pada catatan #' + integ.brokenAt + '.</b> Penambahan catatan baru ditahan.' + (R.canPage('rantai') ? ' <a href="#/rantai">Buka Rantai ledger</a>' : ' Komite Pengarah telah diberi tahu.') + '</div></div>';
    var ctxLabel = me.orgType === 'Emiten' ? 'Periode pelaporan 2028' : 'Emiten percontohan · periode 2028';
    return '<div class="shell">' +
      '<aside class="sidebar" id="sidebar" aria-label="Navigasi">' +
      '<a class="brand" href="#/">' + R.logo() + '<span><b>REVEAL</b><small>Assurance Ledger</small></span></a>' +
      '<div class="org"><span class="org-type">' + esc(me.orgType) + '</span><b>' + esc(me.org) + '</b></div>' +
      '<div class="nav-label">Menu</div><nav class="nav">' + nav + '</nav>' +
      '<details class="caps"><summary>' + ic('shield') + 'Hak akses Anda <span>' + me.caps.length + '</span></summary><ul>' + caps + '</ul></details>' +
      '<div class="side-foot"><a href="#/" class="side-home">' + ic('arrowL') + 'Beranda</a><p>Prototipe konsep. Seluruh nama entitas, orang, dan angka bersifat ilustratif.</p></div>' +
      '</aside><div class="scrim" data-action="nav-close"></div>' +
      '<div class="main"><header class="topbar">' +
      '<button class="icon-btn menu-btn" data-action="nav-open" aria-label="Buka menu">' + ic('menu') + '</button>' +
      '<div class="ctx"><b>' + esc(R.ENTITY.name) + '</b><span>' + ctxLabel + '</span></div>' +
      '<span class="phase-chip" title="' + esc(ph.desc) + '">' + ic('layers') + esc(ph.label) + ' · ' + esc(ph.levelLabel) + '</span>' +
      '<span class="clock" title="Waktu simulasi">' + ic('clock') + R.dt(R.store.clock) + '</span>' +
      '<div class="top-actions"><button class="btn btn-gold btn-sm" data-action="tour-start" aria-label="Mode Demo">' + ic('play') + '<span>Mode Demo</span></button>' +
      '<button class="btn btn-ghost btn-sm" data-action="reset-demo" aria-label="Reset data demo" title="Kembalikan data demo ke kondisi awal">' + ic('reset') + '<span>Reset</span></button></div>' +
      '<div class="user" title="' + esc(me.email) + '"><span class="avatar" aria-hidden="true">' + esc(R.initials(me.name)) + '</span><span class="user-txt"><b>' + esc(me.name) + '</b><small>' + esc(me.unit) + '</small></span>' +
      '<button class="icon-btn" data-action="logout" aria-label="Keluar" title="Keluar">' + ic('logout') + '</button></div>' +
      '</header>' + banner + '<main class="view" id="view">' + content + '</main></div></div>';
  }

  function publicShell(content) {
    return '<header class="lp-nav"><a class="lp-brand" href="#/">' + R.logo() + '<span>REVEAL</span></a>' +
      '<a class="btn btn-gold btn-sm" href="#/login">' + ic('lock') + 'Masuk</a></header><main class="view view-public" id="view">' + content + '</main>';
  }

  var lastRoute = null;
  R.render = function () {
    var r = route(), root = document.getElementById('app');
    if (LEGACY[r]) { location.replace('#/' + LEGACY[r]); return; }
    var parts = r.split('/'), page = parts[0];
    var me = R.me();

    if (!r || r === 'beranda') {
      document.body.dataset.layout = 'landing';
      root.innerHTML = R.landing();
      document.title = 'REVEAL · Assurance Ledger Emisi Korporasi';
    } else if (page === 'login') {
      document.body.dataset.layout = 'login';
      root.innerHTML = R.loginPage(parts[1]);
      document.title = 'Masuk · REVEAL';
    } else if (!R.VIEWS[page]) {
      location.replace(me ? '#/' + R.home() : '#/'); return;
    } else if (!me && page !== 'publik') {
      R.ui.afterLogin = page;
      location.replace('#/login'); return;
    } else if (!me) {
      document.body.dataset.layout = 'public';
      root.innerHTML = publicShell(R.VIEWS.publik.render());
      document.title = 'Ringkasan publik · REVEAL';
    } else {
      document.body.dataset.layout = 'app';
      var y = window.scrollY, view = R.VIEWS[page];
      var content = R.canPage(page) ? view.render() : R.deniedPage(page);
      root.innerHTML = shell(page, content);
      if (R.canPage(page) && view.after) view.after();
      if (lastRoute === r) window.scrollTo(0, y);
      document.title = R.PAGES[page].label + ' · REVEAL';
    }
    if (lastRoute !== r) { window.scrollTo(0, 0); lastRoute = r; }
    if (R.tour) R.tour.sync();
  };

  /* ---------- Delegasi event ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) {
      if (e.target.closest('.nav-item')) document.body.classList.remove('nav-open');
      return;
    }
    var fn = H[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el.dataset, el, e);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('modal-root').classList.contains('open')) R.modal.close();
      document.body.classList.remove('nav-open');
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-action]')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('submit', function (e) {
    var form = e.target, name = form.dataset.form;
    if (!name || !F[name]) return;
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    F[name](form, data);
  });
  window.addEventListener('hashchange', function () { document.body.classList.remove('nav-open'); R.render(); });

  H['modal-close'] = function () { R.modal.close(); };
  H['skip'] = function () { var v = document.getElementById('view') || document.querySelector('.hero'); if (v) { v.setAttribute('tabindex', '-1'); v.focus(); } };
  H['nav-open'] = function () { document.body.classList.add('nav-open'); };
  H['nav-close'] = function () { document.body.classList.remove('nav-open'); };
  H['scroll-to'] = function (d) { var el = document.getElementById(d.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  H['reset-demo'] = function () {
    R.modal.open({
      eyebrow: 'Data demo', title: 'Kembalikan ke kondisi awal?',
      body: '<p>Semua tindakan selama demo akan dihapus dari penyimpanan browser ini, dan ledger kembali ke kondisi awal: satu koreksi dan satu entri inventarisasi menunggu persetujuan.</p><p class="fine">Pada sistem nyata, ledger tidak dapat di-reset. Tombol ini hanya ada di prototipe.</p>',
      footer: '<button class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-danger" data-action="reset-confirm">' + ic('reset') + 'Reset data demo</button>'
    });
  };
  H['reset-confirm'] = function () {
    R.modal.close(); if (R.tour.active) R.tour.stop();
    R.ui.selected = 'LDG-28-K1-004128'; R.ui.concl = { type: 'unmodified', basis: [] }; R.ui.conclLevel = 'limited'; R.ui.asSample = 'LDG-28-K1-004128';
    R.store.reset(); R.toast('Data demo dikembalikan ke kondisi awal.', 'info');
  };
  var startTour = H['tour-start'];
  H['tour-start'] = function () {
    if (R.store.events.length > R.store.seedCount) {
      R.modal.open({
        eyebrow: 'Mode Demo', title: 'Mulai dari awal?',
        body: '<p>Mode Demo mengajak Anda mengikuti satu angka emisi dari cerobong pabrik sampai ke bank dan masyarakat. Di setiap langkah, layar berpindah ke akun orang yang berwenang.</p><p>Sebelumnya sudah ada tindakan yang dijalankan. Agar ceritanya runtut, sebaiknya data dikembalikan ke kondisi awal dulu.</p>',
        footer: '<button class="btn btn-ghost" data-action="tour-noreset">Lanjut tanpa reset</button><button class="btn btn-primary" data-action="tour-reset">' + ic('reset') + 'Reset & mulai</button>'
      });
      return;
    }
    startTour();
  };
  H['tour-noreset'] = function () { R.modal.close(); startTour(); };
  H['tour-reset'] = function () { H['reset-confirm'](); startTour(); };

  R.store.subscribe(function () { R.render(); });
  R.store.init();
  if (!location.hash) history.replaceState(null, '', '#/');
  R.render();
})(window.REVEAL = window.REVEAL || {});
