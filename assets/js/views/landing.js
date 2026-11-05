/* Beranda naratif: masalah → solusi → cara kerja → peran → roadmap. Gaya mengikuti deck REVEAL. */
(function (R) {
  'use strict';
  var ic = R.icon;

  R.landing = function () {
    var roles = [
      ['operator', 'Operator CEMS', 'rina', 'Mengelola data SISPEK; koreksi wajib berjustifikasi dan disetujui pihak lain.'],
      ['keberlanjutan', 'Divisi Keberlanjutan', 'lestari', 'Menyusun PSPK 2 dari ledger; disahkan Direksi, ditelaah Komite.'],
      ['assurance', 'Penyedia Assurance', 'wiratama', 'Menelusuri angka ke sumber, mencatat temuan, menerbitkan kesimpulan.'],
      ['pembiayaan', 'Lembaga Pembiayaan', 'siregar', 'Menilai prasyarat dana hijau atas izin emiten, dengan akses terbatas.'],
      ['ojk', 'OJK & Komite Pengarah', 'ojk', 'Mengawasi fase, indikator, cakupan sektor, dan mutu penyedia.']
    ];
    return '' +
      '<header class="lp-nav"><a class="lp-brand" href="#/">' + R.logo() + '<span>REVEAL</span></a>' +
      '<nav aria-label="Navigasi beranda"><a href="#/" data-action="scroll-to" data-id="masalah">Latar belakang</a><a href="#/" data-action="scroll-to" data-id="solusi">Solusi</a><a href="#/" data-action="scroll-to" data-id="cara-kerja">Cara kerja</a><a href="#/" data-action="scroll-to" data-id="implementasi">Implementasi</a></nav>' +
      '<a class="btn btn-gold btn-sm" href="#/login">' + ic('lock') + 'Masuk</a></header>' +

      '<section class="hero"><div class="hero-inner">' +
      '<p class="hero-kicker">Essay Competition · Telkom Accounting Fair 2026</p>' +
      '<h1 class="hero-title">REVEAL<span>:</span></h1>' +
      '<p class="hero-sub"><em>Assurance Ledger</em> Terintegrasi untuk Memperkuat Integritas Pelaporan Emisi Korporasi</p>' +
      '<p class="hero-acr"><b>R</b>eporting and <b>E</b>mission <b>V</b>erification through <b>A</b>ssurance <b>L</b>edger</p>' +
      '<div class="hero-cta"><button class="btn btn-gold btn-lg" data-action="tour-start">' + ic('play') + 'Mulai Mode Juri · ±3 menit</button><a class="btn btn-line btn-lg" href="#/login">' + ic('lock') + 'Masuk dengan akun peran</a></div>' +
      '<p class="hero-note">' + ic('info') + 'Prototipe konsep. Seluruh entitas, orang, dan angka bersifat ilustratif.</p>' +
      '</div><div class="hero-card" aria-hidden="true">' +
      '<div class="hc-title">Satu angka, satu jejak bukti</div>' +
      '<div class="hc-row"><span>Laporan PSPK 2 · Kiln 1</span><b>612.450,0 tCO₂</b></div>' +
      '<div class="hc-row"><span>Entri ledger LDG-28-K1-004128</span><b><s>68,2</s> → 71,9 t/jam</b></div>' +
      '<div class="hc-row"><span>Kiriman SISPEK (KLH)</span><b>68,2 t/jam · cocok</b></div>' +
      '<div class="hc-row"><span>CEMS Kiln 1</span><b>Kalibrasi 13 Mar 2028</b></div>' +
      '<div class="hc-foot">' + ic('shield') + 'Koreksi diajukan Rina H., disetujui Dimas P. Nilai awal tetap tersimpan.</div>' +
      '</div></section>' +

      '<section class="lp-sec" id="masalah"><div class="lp-head"><p class="kicker">Latar belakang</p><h2>Komitmen iklim sudah banyak, <span class="hl">bukti yang dapat diperiksa</span> belum</h2></div>' +
      '<div class="stats">' +
      '<div class="stat"><div class="stat-n">7%</div><p><b>90 dari 1.245</b> perusahaan publik bertarget net-zero di Forbes Global 2000 memenuhi seluruh kriteria minimum integritas.</p><small>Net Zero Tracker (2025)</small></div>' +
      '<div class="stat"><div class="stat-n">25/50</div><p>Seluruh 50 emiten terbesar Indonesia mengungkapkan informasi keberlanjutan, tetapi baru <b>separuh</b> memperoleh assurance.</p><small>IFAC, AICPA &amp; CIMA (2026)</small></div>' +
      '<div class="stat"><div class="stat-n">“jika ada”</div><p>Verifikasi independen masih dicantumkan sebagai <b>opsional</b> dalam Lampiran II POJK 51/2017.</p><small>OJK (2017)</small></div>' +
      '<div class="stat"><div class="stat-n">2,5% · 2,7%</div><p>Data Scope 2 Telkom 2023 dan 2024 <b>disajikan kembali</b> setelah temuan asurans independen.</p><small>Telkom Indonesia (2026)</small></div>' +
      '</div>' +
      '<div class="gaps"><p class="kicker">Empat celah akar masalah</p><div class="gap-grid">' +
      ['Regulasi|Verifikasi independen belum diwajibkan.', 'Proses teknis|Data emisi sulit ditelusuri ke sumbernya.', 'Pasar & insentif|Kredit karbon murah berkualitas rendah tetap diminati.', 'Tata kelola internal|Penanggung jawab data, pengawas, dan pengoreksi belum jelas.']
        .map(function (s, i) { var p = s.split('|'); return '<div class="gap"><span>0' + (i + 1) + '</span><b>' + p[0] + '</b><p>' + p[1] + '</p></div>'; }).join('') +
      '</div></div></section>' +

      '<section class="lp-sec lp-dark" id="solusi"><div class="lp-head"><p class="kicker">Solusi</p><h2>REVEAL tidak membangun instrumen baru. REVEAL <span class="hl">menghubungkan yang sudah ada</span> dalam satu jejak bukti.</h2></div>' +
      '<div class="ledger-diagram">' +
      '<div class="ld-node"><span>1 · Pantau</span><b>CEMS–SISPEK</b><p>Permen LHK 13/2021</p></div>' +
      '<div class="ld-node"><span>2 · Laporkan</span><b>PSPK 1 &amp; 2</b><p>Efektif 1 Jan 2027</p></div>' +
      '<div class="ld-core">' + ic('chain') + '<b>Assurance Ledger</b><p>Sumber data, metode, riwayat koreksi, dan hasil pemeriksaan. Catatan lama tidak pernah dihapus.</p></div>' +
      '<div class="ld-node"><span>3 · Periksa</span><b>ISSA 5000</b><p>Limited → reasonable</p></div>' +
      '<div class="ld-node"><span>4 · Danai</span><b>Pembiayaan bersyarat</b><p>Mengacu TKBI</p></div>' +
      '</div><p class="pillars">Berlandaskan empat pilar PUGKI 2021: <b>perilaku beretika</b>, <b>akuntabilitas</b>, <b>transparansi</b>, <b>keberlanjutan</b>.</p></section>' +

      '<section class="lp-sec" id="cara-kerja"><div class="lp-head"><p class="kicker">Cara kerja</p><h2>Lima peran, <span class="hl">satu ledger yang sama</span></h2><p>Setiap pengguna masuk dengan akunnya sendiri dan hanya melihat halaman serta tindakan sesuai kewenangannya. Tindakan satu peran langsung terlihat di peran lain.</p></div>' +
      '<div class="roles">' + roles.map(function (r, i) {
        return '<a class="role-card" href="#/login/' + r[2] + '"><span class="role-n">0' + (i + 1) + '</span>' + ic(R.ROLES[r[0]].icon) + '<b>' + r[1] + '</b><p>' + r[3] + '</p><span class="role-go">Masuk sebagai ' + R.esc(R.PERSONAS[r[2]].name) + ' ' + ic('arrow') + '</span></a>';
      }).join('') + '</div></section>' +

      '<section class="lp-sec lp-cream" id="implementasi"><div class="lp-head"><p class="kicker">Implementasi</p><h2>Diterapkan bertahap, <span class="hl">dari limited menuju reasonable assurance</span></h2></div>' +
      '<div class="roadmap">' + [1, 2, 3].map(function (k) { var p = R.PHASES[k]; return '<div class="rm rm-' + k + '"><span>' + p.label + '</span><b>' + p.name + '</b><p>' + p.desc + '</p></div>'; }).join('') + '</div>' +
      '<div class="origin"><div><p class="kicker">Konsep dari esai</p><ul><li>Assurance ledger append-only: koreksi tersimpan tanpa menghapus catatan lama</li><li>Alur CEMS → PSPK → ISSA 5000 → pembiayaan bersyarat</li><li>Pemisahan tugas penyusun, penelaah, Direksi, dan Komite</li><li>Akses lembaga pembiayaan terbatas atas persetujuan emiten</li><li>Tiga fase implementasi dan ringkasan publik untuk masyarakat</li></ul></div>' +
      '<div><p class="kicker">Inovasi tambahan pada prototipe</p><ul><li>Rantai hash anti-ubah dengan simulasi manipulasi data</li><li>Aturan fase yang dapat dieksekusi oleh sistem</li><li>Deteksi otomatis kebutuhan penyajian kembali setelah koreksi</li><li>Prosedur analitis otomatis untuk penyedia assurance</li><li>Mode Juri: tur terpandu satu angka melintasi lima peran</li></ul></div></div></section>' +

      '<footer class="lp-foot"><div><b>REVEAL</b> · Tim IAP Tampil Lagi · Muhammad Najatullah Siddiq &amp; Aiyas Rizki<br>Fakultas Ekonomi dan Bisnis, Universitas Syiah Kuala · Essay Competition Telkom Accounting Fair 2026</div>' +
      '<p>Prototipe konsep. Seluruh nama entitas, orang, dan angka bersifat ilustratif. Bukan sistem resmi OJK, KLH, IAPI, atau lembaga mana pun.</p></footer>';
  };

  R.logo = function () {
    return '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5l11 4.4v8c0 6.8-4.7 12.2-11 14.6C9.7 27.1 5 21.7 5 14.9v-8L16 2.5z" fill="var(--gold-500)"/><path d="M10.5 16l4 4 7-8" fill="none" stroke="var(--brown-900)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };
})(window.REVEAL = window.REVEAL || {});
