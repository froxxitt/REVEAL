/* Mode Demo: tur terpandu "Mengikuti satu angka emisi".
   Setiap langkah masuk dengan akun orang yang berwenang, menyorot bagian layar yang dibahas,
   dan tombol ▶ menjalankan tindakan sungguhan di catatan bersama (ledger).
   Bahasa penjelasan sengaja dibuat sederhana untuk audiens umum. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  var A = R.actions;
  function S() { return R.store.S; }
  function silent(fn) { try { fn(); } catch (e) { if (!(e instanceof R.RuleError)) throw e; } }

  /* Sebutan peran dalam bahasa sehari-hari */
  var PLAIN = {
    rina: 'Petugas pencatat data emisi perusahaan',
    dimas: 'Bagian pengawasan internal perusahaan',
    lestari: 'Divisi Keberlanjutan perusahaan',
    santoso: 'Direksi perusahaan',
    komite: 'Komite yang mewakili Dewan Komisaris',
    wiratama: 'Pemeriksa independen (kantor akuntan publik)',
    siregar: 'Bank pemberi pendanaan hijau',
    ojk: 'Pengawas (OJK bersama kementerian)'
  };

  var STEPS = [
    { as: 'rina', route: 'ledger', sel: '', title: 'Selamat datang di Mode Demo',
      body: 'Kita akan mengikuti <b>satu angka emisi</b> dari cerobong pabrik sampai ke laporan, pemeriksa, bank, dan masyarakat. Di setiap langkah, layar berpindah ke akun orang yang memang berwenang.',
      point: 'Tekan tombol bertanda ▶ untuk menjalankan tindakannya, lalu tekan <b>Lanjut</b>.' },
    { as: 'rina', route: 'ledger', sel: '[data-code="LDG-28-K1-004128"].row-click', title: 'Satu angka dari cerobong pabrik',
      body: 'Alat ukur di cerobong Kiln 1 mencatat <b>68,2 ton CO₂ per jam</b> pada 14 Maret 2028. Belakangan diketahui alat itu perlu disetel ulang, jadi Rina mengusulkan angkanya diperbaiki menjadi <b>71,9</b>, lengkap dengan berita acara kalibrasi.',
      point: 'Angka lama tidak dihapus. Setiap usulan perbaikan wajib disertai alasan dan bukti.',
      prep: function () { R.ui.opFilter = 'semua'; R.ui.selected = 'LDG-28-K1-004128'; } },
    { as: 'rina', route: 'ledger', sel: '#entry-detail', title: 'Bolehkah Rina menyetujui usulannya sendiri?',
      body: 'Tidak. Akun Rina memang tidak punya tombol "Setujui". Kalaupun dicoba, sistem tetap menolak.',
      point: 'Orang yang mengusulkan perubahan tidak boleh sekaligus menyetujuinya. Ini mencegah angka diubah sepihak.',
      action: 'Coba setujui sebagai Rina', run: function () {
        try { A.decideCorrection('rina', 'LDG-28-K1-004128', 'approve'); }
        catch (e) { R.toast('Ditolak sistem: yang mengusulkan perubahan tidak boleh menyetujuinya sendiri.', 'bad'); }
      }, done: function () { return false; } },
    { as: 'dimas', route: 'ledger', sel: '[data-tour="approve-correction"], #entry-detail', title: 'Orang kedua memeriksa dan menyetujui',
      body: 'Sekarang kita masuk sebagai Dimas dari bagian pengawasan internal. Ia mengecek bukti kalibrasinya, lalu menyetujui perbaikan.',
      point: 'Angka baru berlaku, tetapi angka lama tetap tersimpan dan bisa dilihat pemeriksa maupun pengawas.',
      prep: function () { R.ui.selected = 'LDG-28-K1-004128'; },
      action: 'Setujui perbaikan', run: function () { silent(function () { A.decideCorrection('dimas', 'LDG-28-K1-004128', 'approve'); }); },
      done: function () { return S().entries['LDG-28-K1-004128'].status === 'dikoreksi'; } },
    { as: 'dimas', route: 'ledger', sel: '[data-tour="approve-entry"], #entry-detail', title: 'Emisi dari luar cerobong juga dicatat',
      body: 'Tidak semua emisi keluar dari cerobong. Solar untuk alat berat dihitung dari jumlah liter yang dipakai. Catatan ini juga harus disetujui orang kedua sebelum ikut dihitung.',
      point: 'Semua sumber emisi melewati aturan pemeriksaan yang sama.',
      prep: function () { R.ui.selected = 'LDG-28-GRK-000214'; },
      action: 'Setujui catatan solar', run: function () { silent(function () { A.decideEntry('dimas', 'LDG-28-GRK-000214', 'approve'); }); },
      done: function () { return S().entries['LDG-28-GRK-000214'].status === 'diterima'; } },
    { as: 'lestari', route: 'laporan', sel: '#metrics-card', title: 'Angka masuk ke laporan keberlanjutan',
      body: 'Lestari dari Divisi Keberlanjutan menyusun laporan tahunan. Angkanya diambil langsung dari catatan tadi, tidak diketik ulang. Total emisi perusahaan kini <b>1.202.040 ton CO₂</b>.',
      point: 'Setiap angka di laporan bisa ditelusuri kembali sampai ke alat ukurnya.',
      prep: function () { R.ui.kbTab = 'metrik'; } },
    { as: 'santoso', route: 'laporan', sel: '#report-flow', title: 'Direksi menyetujui laporan',
      body: 'Santoso mewakili Direksi. Laporan baru bisa disetujui kalau tidak ada lagi angka yang menunggu pemeriksaan.',
      point: 'Direksi ikut bertanggung jawab atas angka emisi, sama seperti atas laporan keuangan.',
      prep: function () { R.ui.kbTab = 'metrik'; },
      action: 'Setujui sebagai Direksi', run: function () { silent(function () { A.advanceReport('santoso'); }); },
      done: function () { return !!S().report.steps.disetujui_direksi; } },
    { as: 'komite', route: 'laporan', sel: '#report-flow', title: 'Komite membaca ulang laporan',
      body: 'Komite Keberlanjutan, yang mewakili Dewan Komisaris, menelaah laporan sekali lagi sebelum dikirim ke pemeriksa.',
      point: 'Ada lapisan pengawasan tambahan di dalam perusahaan.',
      action: 'Selesaikan telaah Komite', run: function () { silent(function () { A.advanceReport('komite'); }); },
      done: function () { return !!S().report.steps.ditelaah_komite; } },
    { as: 'lestari', route: 'laporan', sel: '#report-flow', title: 'Laporan dikirim ke pemeriksa independen',
      body: 'Saat dikirim, isi laporan dikunci. Kalau nanti ada angka yang berubah, sistem langsung tahu bahwa laporan yang diperiksa sudah tidak sama lagi.',
      point: 'Yang diperiksa adalah versi laporan yang pasti, bukan angka yang bisa berubah-ubah.',
      action: 'Kirim ke pemeriksa', run: function () { silent(function () { A.advanceReport('lestari'); }); },
      done: function () { return !!S().report.steps.dikirim; } },
    { as: 'wiratama', route: 'assurance', sel: '#trace-card', title: 'Pemeriksa menelusuri angka ke sumbernya',
      body: 'Wiratama adalah akuntan publik independen. Ia mengikuti angka dari laporan, ke catatan perusahaan, ke data yang diterima pemerintah, sampai ke alat ukur di cerobong.',
      point: 'Pemeriksa tidak sekadar membaca laporan. Ia memeriksa buktinya satu per satu.' },
    { as: 'wiratama', route: 'assurance', sel: '#samples-card', title: 'Memeriksa beberapa catatan sebagai contoh',
      body: 'Pemeriksa memilih beberapa catatan, termasuk angka yang tadi diperbaiki. Sistem membantu mengecek: apakah angka awalnya sama dengan data pemerintah, apakah buktinya ada, dan apakah pengusul serta penyetujunya orang yang berbeda.',
      point: 'Pemeriksaan jadi lebih cepat karena semua bukti sudah tersusun di satu tempat.',
      action: 'Periksa semua contoh', run: function () {
        silent(function () { S().engagement.samples.forEach(function (c) { if (!S().engagement.tests[c]) A.testSample(c, 'sesuai'); }); });
      }, done: function () { var eg = S().engagement; return eg && eg.samples.every(function (c) { return eg.tests[c]; }); } },
    { as: 'wiratama', route: 'assurance', sel: '#analytics-card', title: 'Pemeriksa menemukan dua catatan kecil',
      body: 'Ada beberapa jam data pengganti di Kiln 2 yang belum dijelaskan cara hitungnya, dan angka acuan untuk menghitung emisi solar yang belum diperbarui. Keduanya kecil, tetapi tetap dicatat.',
      point: 'Temuan kecil tidak disembunyikan. Semuanya dicatat dan wajib dijawab perusahaan.',
      action: 'Catat kedua temuan', run: function () {
        R.analytics(S()).forEach(function (a) { if (!a.info) silent(function () { A.recordFinding({ title: a.title, detail: a.detail, materiality: a.materiality, key: a.key }); }); });
      }, done: function () { return S().findingOrder.length >= 2; } },
    { as: 'lestari', route: 'laporan', sel: '#findings-mgmt', title: 'Perusahaan menjawab temuan',
      body: 'Kembali ke perusahaan. Lestari menjelaskan apa yang sudah dan akan diperbaiki.',
      point: 'Pemeriksa belum boleh memberi kesimpulan sebelum semua temuan dijawab.',
      action: 'Kirim jawaban perusahaan', run: function () {
        silent(function () {
          S().findingOrder.forEach(function (id) {
            var f = S().findings[id];
            if (!f.response && f.version === S().report.version) A.respondFinding('lestari', id, f.key === 'A1' ? 'Dokumentasi metode substitusi untuk jam terkait telah dilengkapi dan diunggah ke ledger.' : 'Faktor emisi solar diperbarui mulai periode 2029; dampak 2028 tidak material dan diungkapkan sebagai keterbatasan.');
          });
        });
      }, done: function () { var fs = S().findingOrder.map(function (i) { return S().findings[i]; }); return fs.length && fs.every(function (f) { return f.response; }); } },
    { as: 'wiratama', route: 'assurance', sel: '#conclusion-card', title: 'Pemeriksa memberi kesimpulan',
      body: 'Kesimpulannya: <b>tidak ditemukan hal yang membuat angka emisi ini keliru secara berarti</b>. Kesimpulan mengikuti standar pemeriksaan internasional (ISSA 5000) dan melekat pada versi laporan yang diperiksa.',
      point: 'Angka emisi kini punya "cap" dari pihak independen, bukan hanya pengakuan perusahaan sendiri.',
      prep: function () { R.ui.concl = { type: 'unmodified', basis: [] }; },
      action: 'Terbitkan kesimpulan', run: function () { silent(function () { A.issueConclusion('unmodified', S().phase === 3 ? 'reasonable' : 'limited', []); }); },
      done: function () { return !!S().conclusion; } },
    { as: 'siregar', route: 'pembiayaan', sel: '#application-card', title: 'Bank ingin melihat datanya, tetapi belum boleh',
      body: 'Siregar dari bank sedang menilai pengajuan obligasi hijau perusahaan. Ia tidak bisa melihat data perusahaan sebelum diberi izin, jadi ia mengajukan permintaan.',
      point: 'Data perusahaan tidak terbuka begitu saja untuk pihak luar.',
      action: 'Minta izin akses', run: function () { silent(function () { A.requestConsent(); }); },
      done: function () { var c = S().consent.status; return c === 'diminta' || c === 'diberikan'; } },
    { as: 'lestari', route: 'laporan', sel: '#consent-card', title: 'Perusahaan memberi izin terbatas',
      body: 'Bank hanya diberi akses ke yang ia perlukan: total emisi, laporan, dan kesimpulan pemeriksa. Data rinci per jam tetap tertutup.',
      point: 'Perusahaan tetap memegang kendali atas datanya sendiri.',
      action: 'Beri izin akses', run: function () { silent(function () { if (S().consent.status !== 'diberikan') A.setConsent(true, 'lestari'); }); },
      done: function () { return S().consent.status === 'diberikan'; } },
    { as: 'siregar', route: 'pembiayaan', sel: '#application-card', title: 'Bank mengecek syarat pendanaan hijau',
      body: 'Daftar syaratnya terbuka dan sama untuk semua perusahaan. Hasilnya: <b>memenuhi syarat</b>. Keputusan memberi pendanaan tetap di tangan bank.',
      point: 'Perusahaan yang angka emisinya terbukti dapat dipercaya lebih mudah mendapat pendanaan hijau.',
      action: 'Cek syarat pendanaan', run: function () { silent(function () { A.runFinancingCheck(); }); },
      done: function () { return S().checks.length > 0; } },
    { as: 'ojk', route: 'pengawasan', sel: '#sector-card', title: 'OJK memantau gambaran besarnya',
      body: 'OJK bersama lembaga lain melihat perkembangan di semua sektor: berapa perusahaan yang sudah melapor, sudah diperiksa, dan memenuhi syarat. Baris sektor semen ikut bertambah karena perusahaan tadi.',
      point: 'Pengawas bisa menilai apakah sistem berjalan dan kapan aturan bisa diperketat secara bertahap.' },
    { as: 'ojk', route: 'rantai', sel: '#integrity-card', title: 'Bagaimana kalau ada yang mengubah angka diam-diam?',
      body: 'Tekan tombol di bawah untuk berpura-pura mengganti angka 68,2 menjadi 60,0 langsung di database, tanpa lewat prosedur perbaikan.',
      point: 'Setiap catatan punya "segel digital" yang tersambung ke catatan sebelumnya. Satu perubahan diam-diam membuat segelnya rusak dan langsung ketahuan.',
      action: 'Ubah angka diam-diam', run: function () { R.store.simulateTamper(); },
      done: function () { return !!R.store.tamper; } },
    { as: 'ojk', route: 'rantai', sel: '#integrity-card', title: 'Memulihkan catatan',
      body: 'Catatan dikembalikan dari cadangan yang masih utuh, dan segelnya kembali tersambung.',
      point: 'Inti REVEAL: <b>setiap angka emisi punya bukti, dan setiap perubahan meninggalkan jejak</b>.',
      action: 'Pulihkan catatan', run: function () { R.store.restoreTamper(); },
      done: function () { return !R.store.tamper; } },
    { as: null, route: 'publik', sel: '#public-card', title: 'Masyarakat bisa melihat hasilnya',
      body: 'Tanpa perlu login, masyarakat dan investor bisa melihat total emisi yang sudah diperiksa beserta kesimpulan pemeriksanya.',
      point: 'Demo selesai. Silakan masuk dengan akun mana pun untuk mencoba sendiri.' }
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
    if (!s.sel) return;
    var el = null;
    s.sel.split(',').some(function (q) { el = document.querySelector(q.trim()); return !!el; });
    if (el) { el.classList.add('tour-target'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
  tour.sync = function () {
    if (!tour.active) return;
    var s = STEPS[tour.i];
    var done = s.done ? s.done() : false;
    var who = s.as ? R.ACCOUNTS[s.as] : null;
    var html = '<div class="tour-card" role="dialog" aria-live="polite" aria-label="Mode Demo">' +
      '<div class="tour-top"><span class="tour-k">Mode Demo · ' + (tour.i + 1) + '/' + STEPS.length + '</span><button class="icon-btn" data-action="tour-stop" aria-label="Keluar dari Mode Demo">' + ic('x') + '</button></div>' +
      '<div class="tour-bar"><span style="width:' + ((tour.i + 1) / STEPS.length * 100) + '%"></span></div>' +
      '<div class="tour-who">' + (who ? '<span class="avatar avatar-sm" aria-hidden="true">' + esc(R.initials(who.name)) + '</span><span><b>' + esc(who.name) + '</b> · ' + esc(PLAIN[s.as]) + '</span>' : ic('globe') + '<span>Masyarakat umum, tanpa login</span>') + '</div>' +
      '<h3>' + esc(s.title) + '</h3><p>' + s.body + '</p>' +
      (s.point ? '<div class="tour-point">' + ic('info') + '<span>' + s.point + '</span></div>' : '') +
      '<div class="tour-actions">' +
      (tour.i > 0 ? '<button class="btn btn-ghost btn-sm" data-action="tour-prev">' + ic('arrowL') + 'Kembali</button>' : '<span></span>') +
      '<div class="btn-row">' +
      (s.action ? (done ? R.badge('Sudah dijalankan', 'ok', 'check') : '<button class="btn btn-outline btn-sm" data-action="tour-do">' + ic('play') + esc(s.action) + '</button>') : '') +
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
