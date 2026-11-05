/* Autentikasi demo dan kontrol akses berbasis peran.
   Setiap akun hanya melihat halaman dan menjalankan tindakan sesuai kewenangannya. */
(function (R) {
  'use strict';
  var KEY = 'reveal-session-v1';
  R.DEMO_PASSWORD = 'reveal2026';

  /* Halaman aplikasi (rute) */
  R.PAGES = {
    ledger: { label: 'Ledger emisi', sub: 'Data CEMS dan inventarisasi GRK', icon: 'factory' },
    laporan: { label: 'Laporan PSPK 1 & 2', sub: 'Metrik, persetujuan, tindak lanjut', icon: 'doc' },
    assurance: { label: 'Penugasan assurance', sub: 'Penelusuran dan kesimpulan', icon: 'search' },
    pembiayaan: { label: 'Verifikasi prasyarat', sub: 'Pendanaan berlabel hijau', icon: 'bank' },
    pengawasan: { label: 'Pengawasan', sub: 'Fase, indikator, sektor', icon: 'gauge' },
    rantai: { label: 'Rantai ledger', sub: 'Verifikasi integritas', icon: 'chain' },
    publik: { label: 'Ringkasan publik', sub: 'Untuk investor dan masyarakat', icon: 'globe' }
  };

  /* Akun demo. id akun = id persona di ledger. Domain .demo menandakan data fiktif. */
  var EMITEN = 'PT Karsa Semen Mandiri Tbk';
  R.ACCOUNTS = {
    rina: { email: 'rina@karsa.demo', org: EMITEN, orgType: 'Emiten', unit: 'Operator data CEMS',
      caps: ['ledger.view', 'ledger.propose', 'ledger.record', 'report.view'], pages: ['ledger', 'laporan', 'publik'] },
    dimas: { email: 'dimas@karsa.demo', org: EMITEN, orgType: 'Emiten', unit: 'Pengendalian Internal',
      caps: ['ledger.view', 'ledger.decide', 'report.view', 'report.step.ditelaah'], pages: ['ledger', 'laporan', 'publik'] },
    lestari: { email: 'lestari@karsa.demo', org: EMITEN, orgType: 'Emiten', unit: 'Divisi Keberlanjutan',
      caps: ['report.view', 'report.step.disusun', 'report.step.dikirim', 'report.restate', 'finding.respond', 'consent.set', 'ledger.view'], pages: ['laporan', 'ledger', 'publik'] },
    santoso: { email: 'santoso@karsa.demo', org: EMITEN, orgType: 'Emiten', unit: 'Direksi · Direktur Keuangan',
      caps: ['report.view', 'report.step.disetujui_direksi', 'finding.respond', 'consent.set', 'ledger.view'], pages: ['laporan', 'ledger', 'publik'] },
    komite: { email: 'komite@karsa.demo', org: EMITEN, orgType: 'Emiten', unit: 'Organ pendukung Dewan Komisaris',
      caps: ['report.view', 'report.step.ditelaah_komite', 'ledger.view'], pages: ['laporan', 'ledger', 'publik'] },
    wiratama: { email: 'wiratama@pradana.demo', org: 'KAP Pradana Wiratama dan Rekan', orgType: 'Penyedia assurance', unit: 'Rekan penanggung jawab',
      caps: ['assurance.work', 'chain.view'], pages: ['assurance', 'rantai', 'publik'] },
    siregar: { email: 'siregar@banklestari.demo', org: 'Bank Lestari Nusantara', orgType: 'Lembaga pembiayaan', unit: 'Unit Pembiayaan Berkelanjutan',
      caps: ['financing.work'], pages: ['pembiayaan', 'publik'] },
    ojk: { email: 'sekretariat@komite-reveal.demo', org: 'Komite Pengarah Lintas Lembaga', orgType: 'Regulator · OJK & KLH', unit: 'Komite Pengarah · OJK bersama KLH',
      caps: ['oversight.view', 'phase.set', 'chain.view', 'chain.tamper'], pages: ['pengawasan', 'rantai', 'publik'] }
  };
  Object.keys(R.ACCOUNTS).forEach(function (id) { R.ACCOUNTS[id].id = id; R.ACCOUNTS[id].name = R.PERSONAS[id].name; });

  R.ORG_GROUPS = [
    { label: 'Emiten · ' + EMITEN, ids: ['rina', 'dimas', 'lestari', 'santoso', 'komite'] },
    { label: 'Penyedia assurance', ids: ['wiratama'] },
    { label: 'Lembaga pembiayaan', ids: ['siregar'] },
    { label: 'Regulator', ids: ['ojk'] }
  ];

  /* Uraian hak akses yang ditampilkan ke pengguna */
  R.CAP_LABELS = {
    'ledger.view': 'Melihat ledger emisi',
    'ledger.propose': 'Mengajukan koreksi berjustifikasi',
    'ledger.record': 'Mencatat data inventarisasi GRK',
    'ledger.decide': 'Menyetujui atau menolak koreksi dan entri',
    'report.view': 'Melihat laporan PSPK 1 & 2',
    'report.step.disusun': 'Menyusun laporan',
    'report.step.ditelaah': 'Menelaah laporan (pengendalian internal)',
    'report.step.disetujui_direksi': 'Menyetujui laporan atas nama Direksi',
    'report.step.ditelaah_komite': 'Menelaah laporan atas nama Komite',
    'report.step.dikirim': 'Mengirim laporan ke penyedia assurance',
    'report.restate': 'Membuka penyajian kembali laporan',
    'finding.respond': 'Menanggapi temuan assurance',
    'consent.set': 'Memberi atau mencabut akses lembaga pembiayaan',
    'assurance.work': 'Menelusuri, mencatat temuan, menerbitkan kesimpulan',
    'chain.view': 'Memverifikasi rantai ledger',
    'financing.work': 'Meminta akses dan menilai prasyarat pembiayaan',
    'oversight.view': 'Mengawasi fase, indikator, dan sektor',
    'phase.set': 'Menetapkan fase implementasi',
    'chain.tamper': 'Menjalankan simulasi uji integritas'
  };

  var session = { user: null };
  try { var s = JSON.parse(window.localStorage.getItem(KEY) || 'null'); if (s && R.ACCOUNTS[s.user]) session.user = s.user; } catch (e) {}
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify({ user: session.user })); } catch (e) {} }

  R.me = function () { return session.user ? R.ACCOUNTS[session.user] : null; };
  R.meId = function () { return session.user; };
  R.can = function (cap) { var a = R.me(); return !!a && a.caps.indexOf(cap) >= 0; };
  R.canPage = function (page) { var a = R.me(); return page === 'publik' || (!!a && a.pages.indexOf(page) >= 0); };
  R.home = function () { var a = R.me(); return a ? a.pages[0] : 'login'; };
  R.need = function (cap) {
    if (R.can(cap)) return;
    var a = R.me();
    throw new R.RuleError('Akses ditolak: akun ' + (a ? a.name + ' (' + a.unit + ')' : 'tamu') + ' tidak berwenang untuk "' + (R.CAP_LABELS[cap] || cap).toLowerCase() + '".');
  };
  R.loginAs = function (id) { if (!R.ACCOUNTS[id]) return false; session.user = id; save(); return true; };
  R.logout = function () { session.user = null; save(); };
  R.authenticate = function (email, password) {
    var e = String(email || '').trim().toLowerCase();
    var id = Object.keys(R.ACCOUNTS).filter(function (k) { return R.ACCOUNTS[k].email === e; })[0];
    if (!e) return { field: 'email', error: 'Masukkan email akun Anda.' };
    if (!id) return { field: 'email', error: 'Email tidak terdaftar. Gunakan salah satu akun demo di bawah.' };
    if (password !== R.DEMO_PASSWORD) return { field: 'password', error: 'Kata sandi tidak sesuai. Kata sandi demo: ' + R.DEMO_PASSWORD };
    return { id: id };
  };
  R.initials = function (name) { return name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };
})(window.REVEAL = window.REVEAL || {});
