/* Mode Juri: tur terpandu "Satu angka, lima peran".
   Setiap langkah masuk dengan akun peran yang berwenang, menyorot elemen nyata,
   dan tombol "Lakukan untuk saya" menjalankan aksi sebenarnya di ledger. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  var A = R.actions;
  function S() { return R.store.S; }
  function silent(fn) { try { fn(); } catch (e) { if (!(e instanceof R.RuleError)) throw e; } }

  var STEPS = [
    { as: 'rina', route: 'ledger', sel: '[data-code="LDG-28-K1-004128"].row-click', title: 'Satu angka: CO₂ Kiln 1, 14 Mar 2028 pukul 11.00',
      body: 'Masuk sebagai <b>Rina H., operator data CEMS</b>. SISPEK mengirim <b>68,2 t/jam</b>. Rina mengajukan koreksi menjadi <b>71,9 t/jam</b> dengan berita acara kalibrasi. Nilai lama tidak dihapus.',
      prep: function () { R.ui.opFilter = 'semua'; R.ui.selected = 'LDG-28-K1-004128'; } },
    { as: 'rina', route: 'ledger', sel: '#entry-detail', title: 'Rina tidak berwenang menyetujui koreksinya sendiri',
      body: 'Akun operator tidak memiliki tombol persetujuan. Bila dipaksa lewat sistem, aturan empat mata tetap menolak.',
      action: 'Coba setujui sebagai Rina', run: function () {
        try { A.decideCorrection('rina', 'LDG-28-K1-004128', 'approve'); } catch (e) { R.toast(e.message, 'bad'); }
      }, done: function () { return false; } },
    { as: 'dimas', route: 'ledger', sel: '[data-tour="approve-correction"], #entry-detail', title: 'Dimas P. (Pengendalian Internal) menyetujui',
      body: 'Akun penyetuju memiliki tombol yang tidak dimiliki operator. Koreksi menjadi revisi 2; revisi 1 (68,2) terkunci dan tetap dapat dibaca.',
      prep: function () { R.ui.selected = 'LDG-28-K1-004128'; },
      action: 'Setujui koreksi', run: function () { silent(function () { A.decideCorrection('dimas', 'LDG-28-K1-004128', 'approve'); }); },
      done: function () { return S().entries['LDG-28-K1-004128'].status === 'dikoreksi'; } },
    { as: 'dimas', route: 'ledger', sel: '[data-tour="approve-entry"], #entry-detail', title: 'Sumber di luar CEMS ikut diverifikasi',
      body: 'Solar alat berat Januari dihitung dari data aktivitas × faktor emisi, lalu disetujui pihak kedua sebelum masuk metrik.',
      prep: function () { R.ui.selected = 'LDG-28-GRK-000214'; },
      action: 'Setujui entri inventarisasi', run: function () { silent(function () { A.decideEntry('dimas', 'LDG-28-GRK-000214', 'approve'); }); },
      done: function () { return S().entries['LDG-28-GRK-000214'].status === 'diterima'; } },
    { as: 'lestari', route: 'laporan', sel: '#metrics-card', title: 'Divisi Keberlanjutan: laporan membaca dari ledger',
      body: 'Masuk sebagai <b>A. Lestari</b>. Total Scope 1 kini <b>1.202.040,0 tCO₂e</b>; setiap baris menunjuk ke kode ledger dan bisa ditelusuri sampai CEMS.',
      prep: function () { R.ui.kbTab = 'metrik'; } },
    { as: 'santoso', route: 'laporan', sel: '#report-flow', title: 'Direksi menyetujui laporan',
      body: 'Akun <b>H. Santoso (Direktur Keuangan)</b> hanya dapat menjalankan langkah persetujuan Direksi, dan hanya bila tidak ada entri yang menunggu.',
      prep: function () { R.ui.kbTab = 'metrik'; },
      action: 'Setujui sebagai Direksi', run: function () { silent(function () { A.advanceReport('santoso'); }); },
      done: function () { return !!S().report.steps.disetujui_direksi; } },
    { as: 'komite', route: 'laporan', sel: '#report-flow', title: 'Komite Keberlanjutan menelaah',
      body: 'Organ pendukung Dewan Komisaris menelaah informasi emisi, sesuai PUGKI 2021.',
      action: 'Selesaikan telaah Komite', run: function () { silent(function () { A.advanceReport('komite'); }); },
      done: function () { return !!S().report.steps.ditelaah_komite; } },
    { as: 'lestari', route: 'laporan', sel: '#report-flow', title: 'Laporan dikirim ke penyedia assurance',
      body: 'Snapshot angka beserta sidik digitalnya dikunci di ledger saat dikirim.',
      action: 'Kirim ke penyedia assurance', run: function () { silent(function () { A.advanceReport('lestari'); }); },
      done: function () { return !!S().report.steps.dikirim; } },
    { as: 'wiratama', route: 'assurance', sel: '#trace-card', title: 'Penyedia assurance menelusuri angka ke sumbernya',
      body: 'Masuk sebagai <b>S. Wiratama</b>. Akun KAP hanya melihat penugasan, rantai ledger, dan ringkasan publik. Penelusuran: PSPK 2 → ledger → SISPEK → CEMS.' },
    { as: 'wiratama', route: 'assurance', sel: '#samples-card', title: 'Uji sampel: koreksi, substitusi, inventarisasi',
      body: 'Sistem memeriksa: nilai awal cocok dengan SISPEK, koreksi berbukti, pengaju ≠ penyetuju, metode substitusi terdokumentasi.',
      action: 'Telusuri semua sampel', run: function () {
        silent(function () { S().engagement.samples.forEach(function (c) { if (!S().engagement.tests[c]) A.testSample(c, 'sesuai'); }); });
      }, done: function () { var eg = S().engagement; return eg && eg.samples.every(function (c) { return eg.tests[c]; }); } },
    { as: 'wiratama', route: 'assurance', sel: '#analytics-card', title: 'Prosedur analitis menemukan dua hal',
      body: 'Jam substitusi Kiln 2 yang belum terdokumentasi dan faktor emisi solar yang belum diperbarui dicatat sebagai temuan tidak material.',
      action: 'Catat kedua temuan', run: function () {
        R.analytics(S()).forEach(function (a) { if (!a.info) silent(function () { A.recordFinding({ title: a.title, detail: a.detail, materiality: a.materiality, key: a.key }); }); });
      }, done: function () { return S().findingOrder.length >= 2; } },
    { as: 'lestari', route: 'laporan', sel: '#findings-mgmt', title: 'Manajemen menindaklanjuti temuan',
      body: 'Kembali ke akun emiten. Kesimpulan tidak dapat diterbitkan selama ada temuan yang belum ditanggapi.',
      action: 'Kirim tanggapan manajemen', run: function () {
        silent(function () {
          S().findingOrder.forEach(function (id) {
            var f = S().findings[id];
            if (!f.response && f.version === S().report.version) A.respondFinding('lestari', id, f.key === 'A1' ? 'Dokumentasi metode substitusi untuk jam terkait telah dilengkapi dan diunggah ke ledger.' : 'Faktor emisi solar diperbarui mulai periode 2029; dampak 2028 tidak material dan diungkapkan sebagai keterbatasan.');
          });
        });
      }, done: function () { var fs = S().findingOrder.map(function (i) { return S().findings[i]; }); return fs.length && fs.every(function (f) { return f.response; }); } },
    { as: 'wiratama', route: 'assurance', sel: '#conclusion-card', title: 'Kesimpulan ISSA 5000 diterbitkan',
      body: 'Fase 2 memakai limited assurance dengan bentuk kesimpulan negatif, ditautkan ke sidik digital versi laporan yang diperiksa.',
      prep: function () { R.ui.concl = { type: 'unmodified', basis: [] }; },
      action: 'Terbitkan kesimpulan', run: function () { silent(function () { A.issueConclusion('unmodified', S().phase === 3 ? 'reasonable' : 'limited', []); }); },
      done: function () { return !!S().conclusion; } },
    { as: 'siregar', route: 'pembiayaan', sel: '#application-card', title: 'Bank belum dapat melihat ledger emiten',
      body: 'Masuk sebagai <b>R. Siregar, Bank Lestari Nusantara</b>. Ledger emiten tertutup sampai emiten memberi izin. Bank mengajukan permintaan akses.',
      action: 'Minta akses ke emiten', run: function () { silent(function () { A.requestConsent(); }); },
      done: function () { var c = S().consent.status; return c === 'diminta' || c === 'diberikan'; } },
    { as: 'lestari', route: 'laporan', sel: '#consent-card', title: 'Emiten memberi akses terbatas',
      body: 'Yang dibuka hanya informasi relevan dengan pengajuan. Data jam-an mentah tetap tertutup.',
      action: 'Berikan akses', run: function () { silent(function () { if (S().consent.status !== 'diberikan') A.setConsent(true, 'lestari'); }); },
      done: function () { return S().consent.status === 'diberikan'; } },
    { as: 'siregar', route: 'pembiayaan', sel: '#application-card', title: 'Bank memeriksa prasyarat pendanaan hijau',
      body: 'Kriteria terbuka dievaluasi dari ledger. Prasyarat membuka akses pengajuan; kelayakan proyek dan keuangan tetap dinilai bank.',
      action: 'Catat hasil pemeriksaan', run: function () { silent(function () { A.runFinancingCheck(); }); },
      done: function () { return S().checks.length > 0; } },
    { as: 'ojk', route: 'pengawasan', sel: '#sector-card', title: 'OJK melihat dampaknya di tingkat sektor',
      body: 'Masuk sebagai <b>Komite Pengarah</b>. Baris sektor semen bertambah. Hanya akun ini yang dapat menetapkan fase; aturan sistem ikut berubah.' },
    { as: 'ojk', route: 'rantai', sel: '#integrity-card', title: 'Bagaimana jika angka diubah diam-diam?',
      body: 'Simulasikan pengubahan langsung di basis data: nilai awal 68,2 diganti 60,0 tanpa melalui alur koreksi. Rantai hash langsung putus.',
      action: 'Simulasikan manipulasi', run: function () { R.store.simulateTamper(); },
      done: function () { return !!R.store.tamper; } },
    { as: 'ojk', route: 'rantai', sel: '#integrity-card', title: 'Pulihkan rantai',
      body: 'Inti REVEAL: <b>setiap klaim emisi ditopang bukti yang dapat diperiksa</b>, dan setiap perubahan meninggalkan jejak.',
      action: 'Pulihkan rantai', run: function () { R.store.restoreTamper(); },
      done: function () { return !R.store.tamper; } },
    { as: null, route: 'publik', sel: '#public-card', title: 'Ringkasan untuk masyarakat, tanpa login',
      body: 'Angka yang dipublikasikan adalah angka yang telah diperiksa, lengkap dengan jenis kesimpulan dan sidik laporan. Tur selesai; silakan masuk dengan akun mana pun untuk menjelajah.' }
  ];

  var tour = { active: false, i: 0 };
  R.tour = tour;

  tour.start = function () {
    if (!R.store.integrity.ok) R.store.restoreTamper();
    tour.active = true; tour.i = 0; document.body.classList.add('touring'); tour.go();
  };
  tour.stop = function () {
    tour.active = false; document.body.classList.remove('touring');
    var el = document.getElementById('tour'); if (el) el.remove();
    document.querySelectorAll('.tour-target').forEach(function (n) { n.classList.remove('tour-target'); });
  };
  tour.go = function () {
    var s = STEPS[tour.i];
    if (s.as === null) { if (R.me()) R.logout(); }
    else if (R.meId() !== s.as) { R.loginAs(s.as); }
    if (s.prep) s.prep();
    var target = '#/' + s.route;
    if (location.hash !== target) location.hash = target; else R.render();
    window.scrollTo(0, 0);
    setTimeout(tour.focus, 60);
  };
  tour.focus = function () {
    var s = STEPS[tour.i];
    document.querySelectorAll('.tour-target').forEach(function (n) { n.classList.remove('tour-target'); });
    var el = null;
    s.sel.split(',').some(function (q) { el = document.querySelector(q.trim()); return !!el; });
    if (el) { el.classList.add('tour-target'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
  tour.sync = function () {
    if (!tour.active) return;
    var s = STEPS[tour.i];
    var done = s.done ? s.done() : false;
    var who = s.as ? R.ACCOUNTS[s.as] : null;
    var html = '<div class="tour-card" role="dialog" aria-live="polite" aria-label="Mode Juri">' +
      '<div class="tour-top"><span class="tour-k">Mode Juri · ' + (tour.i + 1) + '/' + STEPS.length + '</span><button class="icon-btn" data-action="tour-stop" aria-label="Keluar dari Mode Juri">' + ic('x') + '</button></div>' +
      '<div class="tour-bar"><span style="width:' + ((tour.i + 1) / STEPS.length * 100) + '%"></span></div>' +
      '<div class="tour-who">' + (who ? '<span class="avatar avatar-sm" aria-hidden="true">' + esc(R.initials(who.name)) + '</span>' + esc(who.name) + ' · ' + esc(who.unit) : ic('globe') + 'Pengunjung tanpa login') + '</div>' +
      '<h3>' + esc(s.title) + '</h3><p>' + s.body + '</p>' +
      '<div class="tour-actions">' +
      (tour.i > 0 ? '<button class="btn btn-ghost btn-sm" data-action="tour-prev">' + ic('arrowL') + 'Kembali</button>' : '<span></span>') +
      '<div class="btn-row">' +
      (s.action ? (done ? R.badge('Selesai', 'ok', 'check') : '<button class="btn btn-outline btn-sm" data-action="tour-do">' + ic('play') + esc(s.action) + '</button>') : '') +
      (tour.i < STEPS.length - 1 ? '<button class="btn btn-primary btn-sm" data-action="tour-next">Lanjut' + ic('arrow') + '</button>' : '<button class="btn btn-primary btn-sm" data-action="tour-stop">Selesai</button>') +
      '</div></div></div>';
    var el = document.getElementById('tour');
    if (!el) { el = document.createElement('div'); el.id = 'tour'; document.body.appendChild(el); }
    el.innerHTML = html;
    setTimeout(tour.focus, 40);
  };

  var H = R.handlers;
  H['tour-start'] = function () { tour.start(); };
  H['tour-stop'] = function () { tour.stop(); };
  H['tour-next'] = function () { if (tour.i < STEPS.length - 1) { tour.i++; tour.go(); } };
  H['tour-prev'] = function () { if (tour.i > 0) { tour.i--; tour.go(); } };
  H['tour-do'] = function () { STEPS[tour.i].run(); R.render(); };
  R.TOUR_STEPS = STEPS;
})(window.REVEAL = window.REVEAL || {});
