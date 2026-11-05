/* Halaman masuk dan halaman akses ditolak. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;

  function accountBtn(id, selected) {
    var a = R.ACCOUNTS[id];
    return '<button type="button" class="acct ' + (selected === id ? 'on' : '') + '" data-action="demo-login" data-id="' + id + '" data-tour="acct-' + id + '">' +
      '<span class="avatar" aria-hidden="true">' + esc(R.initials(a.name)) + '</span>' +
      '<span class="acct-txt"><b>' + esc(a.name) + '</b><small>' + esc(a.unit) + '</small></span>' +
      '<span class="acct-home">' + esc(R.PAGES[a.pages[0]].label) + ic('arrow') + '</span></button>';
  }

  R.loginPage = function (pre) {
    var a = pre && R.ACCOUNTS[pre];
    var groups = R.ORG_GROUPS.map(function (g) {
      return '<div class="acct-group"><div class="acct-group-label">' + esc(g.label) + '</div><div class="acct-list">' + g.ids.map(function (id) { return accountBtn(id, pre); }).join('') + '</div></div>';
    }).join('');
    var access = [
      ['factory', 'Emiten', 'Ledger emisi dan laporan PSPK. Tindakan dibagi: pencatat, penyetuju, penyusun, Direksi, Komite.'],
      ['search', 'Penyedia assurance', 'Penelusuran angka ke sumber, temuan, dan kesimpulan ISSA 5000.'],
      ['bank', 'Lembaga pembiayaan', 'Prasyarat pendanaan hijau, hanya setelah emiten memberi izin akses.'],
      ['gauge', 'OJK & Komite Pengarah', 'Fase, indikator, cakupan sektor, dan integritas rantai ledger.']
    ].map(function (x) { return '<li>' + ic(x[0]) + '<div><b>' + x[1] + '</b><p>' + x[2] + '</p></div></li>'; }).join('');

    return '<div class="login">' +
      '<aside class="login-brand">' +
      '<a class="login-logo" href="#/">' + R.logo() + '<span>REVEAL</span></a>' +
      '<div class="login-pitch"><p class="hero-kicker">Assurance Ledger</p><h2>Satu jejak bukti.<br>Akses sesuai <span>kewenangan</span>.</h2>' +
      '<p>Setiap pihak masuk dengan akunnya sendiri. Halaman dan tindakan yang tersedia mengikuti peran, sehingga pemisahan tugas dalam esai ditegakkan oleh sistem.</p>' +
      '<ul class="login-access">' + access + '</ul></div>' +
      '<p class="login-disc">' + ic('info') + 'Prototipe konsep. Seluruh akun, entitas, dan angka bersifat ilustratif.</p>' +
      '</aside>' +
      '<main class="login-main" id="view"><div class="login-card">' +
      '<a class="login-back" href="#/">' + ic('arrowL') + 'Beranda</a>' +
      '<h1>Masuk ke REVEAL</h1><p class="lead">Gunakan email akun lembaga Anda. Halaman setelah masuk menyesuaikan hak akses akun.</p>' +
      '<form class="form" data-form="login" id="f-login" novalidate>' +
      '<label class="field" for="lg-email"><span>Email</span><input id="lg-email" name="email" type="email" autocomplete="username" inputmode="email" required value="' + (a ? esc(a.email) : '') + '" aria-describedby="lg-email-err"><small class="field-err" id="lg-email-err" role="alert"></small></label>' +
      '<label class="field" for="lg-pw"><span>Kata sandi</span><span class="pw"><input id="lg-pw" name="password" type="password" autocomplete="current-password" required value="' + (a ? R.DEMO_PASSWORD : '') + '" aria-describedby="lg-pw-err"><button type="button" class="pw-toggle" data-action="pw-toggle" aria-pressed="false" aria-label="Tampilkan kata sandi">' + ic('eye') + '</button></span><small class="field-err" id="lg-pw-err" role="alert"></small></label>' +
      '<button class="btn btn-primary btn-lg btn-block" type="submit">' + ic('lock') + 'Masuk</button>' +
      '</form>' +
      '<div class="demo-head"><h2>Akun demo</h2><span>Kata sandi semua akun: <code>' + R.DEMO_PASSWORD + '</code></span></div>' +
      '<p class="fine">Klik salah satu akun untuk langsung masuk.</p>' + groups +
      '<div class="login-links"><a href="#/publik">' + ic('globe') + 'Lihat ringkasan publik tanpa masuk</a><button class="linkish" data-action="tour-start">' + ic('play') + 'Mulai Mode Juri</button></div>' +
      '</div></main></div>';
  };

  R.deniedPage = function (page) {
    var me = R.me(), p = R.PAGES[page];
    var who = Object.keys(R.ACCOUNTS).filter(function (id) { return R.ACCOUNTS[id].pages.indexOf(page) >= 0; })
      .map(function (id) { return '<li><b>' + esc(R.ACCOUNTS[id].name) + '</b> · ' + esc(R.ACCOUNTS[id].unit) + ' <span class="muted">(' + esc(R.ACCOUNTS[id].orgType) + ')</span></li>'; }).join('');
    return '<div class="denied">' + ic('lock', 'ico-xl') + '<h1>Akses ditolak</h1>' +
      '<p>Halaman <b>' + esc(p.label) + '</b> tidak termasuk kewenangan akun <b>' + esc(me.name) + '</b> (' + esc(me.unit) + ', ' + esc(me.org) + ').</p>' +
      '<div class="card"><div class="card-body"><p class="eyebrow">Halaman ini diperuntukkan bagi</p><ul class="denied-list">' + who + '</ul></div></div>' +
      '<div class="btn-row"><a class="btn btn-primary" href="#/' + R.home() + '">' + ic('arrowL') + 'Kembali ke ' + esc(R.PAGES[R.home()].label) + '</a><button class="btn btn-ghost" data-action="logout">Ganti akun</button></div>' +
      '<p class="fine">Pembatasan ini menjalankan prinsip akses terbatas dalam esai: setiap pihak hanya membuka informasi yang relevan dengan perannya.</p></div>';
  };

  /* ---------- Aksi ---------- */
  var H = R.handlers = R.handlers || {};
  R.forms = R.forms || {};
  function setErr(id, msg) {
    var el = document.getElementById(id + '-err'), input = document.getElementById(id);
    if (el) el.textContent = msg || '';
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function enter(id) {
    R.loginAs(id);
    var a = R.ACCOUNTS[id], target = R.ui.afterLogin;
    R.ui.afterLogin = null;
    R.toast('Selamat datang, ' + a.name + '. Anda masuk sebagai ' + a.unit + '.', 'info');
    location.hash = '#/' + (target && R.canPage(target) ? target : a.pages[0]);
  }
  R.forms.login = function (form, data) {
    setErr('lg-email'); setErr('lg-pw');
    var r = R.authenticate(data.email, data.password);
    if (r.error) {
      var id = r.field === 'email' ? 'lg-email' : 'lg-pw';
      setErr(id, r.error); document.getElementById(id).focus(); return;
    }
    enter(r.id);
  };
  H['demo-login'] = function (d) { enter(d.id); };
  H['pw-toggle'] = function (d, el) {
    var input = document.getElementById('lg-pw'), show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    el.setAttribute('aria-pressed', String(show));
    el.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  };
  H['logout'] = function () {
    var a = R.me(); R.logout();
    if (R.tour && R.tour.active) R.tour.stop();
    R.toast(a ? a.name + ' telah keluar.' : 'Anda telah keluar.', 'info');
    location.hash = '#/login';
  };
  H['switch-account'] = function (d) {
    var cur = location.hash.replace(/^#\/?/, '');
    R.loginAs(d.id);
    var a = R.ACCOUNTS[d.id];
    R.toast('Beralih ke akun ' + a.name + ' (' + a.unit + ').', 'info');
    if (R.canPage(cur)) R.render(); else location.hash = '#/' + a.pages[0];
  };
})(window.REVEAL = window.REVEAL || {});
