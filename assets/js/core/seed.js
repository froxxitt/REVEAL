/* Data simulasi REVEAL.
   Semua entitas, orang, dan angka bersifat ILUSTRATIF (prototipe konsep esai TAF 2026). */
(function (R) {
  'use strict';
  var T = R.toTenths;

  R.ENTITY = {
    code: 'KSM', name: 'PT Karsa Semen Mandiri Tbk', sector: 'Semen', period: 2028,
    project: 'Obligasi hijau — Proyek pemanfaatan panas buang Kiln 1'
  };
  R.PROVIDER = { name: 'KAP Pradana Wiratama dan Rekan', partner: 'S. Wiratama' };
  R.BANK = { name: 'Bank Lestari Nusantara', unit: 'Unit Pembiayaan Berkelanjutan' };

  R.ROLES = {
    operator: { label: 'Operator CEMS', sub: 'Ledger emisi', icon: 'factory', org: 'PT Karsa Semen Mandiri Tbk' },
    keberlanjutan: { label: 'Divisi Keberlanjutan', sub: 'Laporan PSPK 1 dan 2', icon: 'doc', org: 'PT Karsa Semen Mandiri Tbk' },
    assurance: { label: 'Penyedia Assurance', sub: 'Penelusuran dan kesimpulan', icon: 'search', org: 'KAP Pradana Wiratama dan Rekan' },
    pembiayaan: { label: 'Lembaga Pembiayaan', sub: 'Verifikasi prasyarat', icon: 'bank', org: 'Bank Lestari Nusantara' },
    ojk: { label: 'OJK & Komite Pengarah', sub: 'Pengawasan lintas lembaga', icon: 'gauge', org: 'Komite Pengarah Lintas Lembaga' },
    system: { label: 'Sistem', sub: '', icon: 'layers', org: 'SISPEK (KLH)' }
  };

  R.PERSONAS = {
    sispek: { name: 'SISPEK (KLH)', title: 'Kiriman otomatis data CEMS', role: 'system' },
    rina: { name: 'Rina H.', title: 'Operator data CEMS', role: 'operator' },
    dimas: { name: 'Dimas P.', title: 'Pengendalian Internal', role: 'operator' },
    lestari: { name: 'A. Lestari', title: 'Divisi Keberlanjutan', role: 'keberlanjutan' },
    santoso: { name: 'H. Santoso', title: 'Direktur Keuangan (Direksi)', role: 'keberlanjutan' },
    komite: { name: 'Komite Keberlanjutan', title: 'Organ pendukung Dewan Komisaris', role: 'keberlanjutan' },
    wiratama: { name: 'S. Wiratama', title: 'Rekan penanggung jawab · praktisi bersertifikat', role: 'assurance' },
    siregar: { name: 'R. Siregar', title: 'Analis pembiayaan berkelanjutan', role: 'pembiayaan' },
    ojk: { name: 'Sekretariat Komite Pengarah', title: 'OJK bersama KLH, IAPI, lembaga pembiayaan', role: 'ojk' }
  };

  R.SOURCES = {
    K1: { label: 'Kiln 1', feed: 'CEMS Kiln 1 · SISPEK', method: 'Pengukuran langsung CEMS', ref: 'LDG-28-K1' },
    K2: { label: 'Kiln 2', feed: 'CEMS Kiln 2 · SISPEK', method: 'Pengukuran langsung CEMS', ref: 'LDG-28-K2' },
    GRK: { label: 'Bahan bakar sumber lain', feed: 'Inventarisasi GRK', method: 'Faktor emisi × data aktivitas', ref: 'LDG-28-GRK' }
  };

  R.CALIB = {
    K1: { devices: 'Analyzer CO₂ dan flow meter', last: '2028-03-13', test: 'Uji akurasi relatif (RATA)', next: '2029-03-13' },
    K2: { devices: 'Analyzer CO₂ dan flow meter', last: '2028-02-02', test: 'Uji akurasi relatif (RATA)', next: '2029-02-02' }
  };

  R.FUEL = {
    'Solar alat berat': 2.68, 'Solar genset darurat': 2.68, 'Solar pompa tambang kapur': 2.68,
    'Bensin kendaraan operasional': 2.31, 'LPG laboratorium': 1.51
  };

  /* "Basis data SISPEK" — sistem eksternal milik KLH, disimulasikan terpisah dari ledger.
     Penyedia assurance membandingkan nilai awal di ledger dengan kiriman ini. */
  R.SISPEK = {};

  R.REPORT_STEPS = [
    { id: 'disusun', label: 'Disusun', actor: 'lestari', verb: 'Tandai selesai disusun' },
    { id: 'ditelaah', label: 'Ditelaah pengendalian internal', actor: 'dimas', verb: 'Selesaikan telaah internal' },
    { id: 'disetujui_direksi', label: 'Disetujui Direksi', actor: 'santoso', verb: 'Setujui sebagai Direksi' },
    { id: 'ditelaah_komite', label: 'Ditelaah Komite Keberlanjutan', actor: 'komite', verb: 'Selesaikan telaah Komite' },
    { id: 'dikirim', label: 'Dikirim ke penyedia assurance', actor: 'lestari', verb: 'Kirim ke penyedia assurance' }
  ];

  R.PHASES = {
    1: { label: 'Fase 1 · 2027', name: 'Fondasi & percontohan', level: null, levelLabel: 'Percontohan',
      desc: 'Percontohan 5–10 emiten satu sektor wajib CEMS. Assurance dicatat dan dievaluasi, belum menjadi prasyarat wajib.' },
    2: { label: 'Fase 2 · 2028–2029', name: 'Perluasan · limited assurance', level: 'limited', levelLabel: 'Limited assurance',
      desc: 'Pengajuan pembiayaan wajib menyertakan laporan assurance independen, sekurang-kurangnya limited assurance.' },
    3: { label: 'Fase 3 · 2030+', name: 'Pendalaman · reasonable assurance', level: 'reasonable', levelLabel: 'Reasonable assurance',
      desc: 'Metrik emisi inti diarahkan ke reasonable assurance; perluasan sektor dan Scope 3 bertahap.' }
  };

  R.CONCLUSIONS = {
    unmodified: { label: 'Tanpa modifikasi', en: 'unmodified', tone: 'ok' },
    qualified: { label: 'Wajar dengan pengecualian', en: 'qualified', tone: 'warn' },
    adverse: { label: 'Tidak wajar', en: 'adverse', tone: 'bad' },
    disclaimer: { label: 'Tidak menyatakan kesimpulan', en: 'disclaimer', tone: 'bad' }
  };

  /* Data emiten lain — statis, untuk konteks pengawasan OJK dan antrean lembaga pembiayaan. */
  R.OTHER_APPLICATIONS = [
    { name: 'PT Pupuk Samudra Raya Tbk', sector: 'Pupuk', level: 'Limited', concl: 'Wajar dengan pengecualian, pada pengungkapan target', status: 'bersyarat', note: 'Tindak lanjut sampai periode 2029' },
    { name: 'PT Baja Lintas Timur Tbk', sector: 'Besi dan baja', level: 'Limited', concl: 'Tidak menyatakan kesimpulan', status: 'tidak', note: '' },
    { name: 'PT Kertas Mega Prima Tbk', sector: 'Pulp dan kertas', level: 'Belum ada', concl: 'Penugasan berjalan', status: 'belum', note: '' }
  ];
  R.SECTORS = [
    { sector: 'Semen', target: 6, reports: 5, assured: 4, eligible: 3, includesKSM: true },
    { sector: 'Pupuk', target: 4, reports: 4, assured: 3, eligible: 3 },
    { sector: 'Pulp dan kertas', target: 5, reports: 4, assured: 2, eligible: 2 },
    { sector: 'Besi dan baja', target: 4, reports: 3, assured: 1, eligible: 0 },
    { sector: 'Pembangkit listrik termal', target: 3, reports: 3, assured: 2, eligible: 2 }
  ];

  /* ---------- Pembangun event awal ---------- */
  R.buildSeed = function () {
    var ev = [];
    function push(t, type, actor, p) { ev.push({ t: t, type: type, actor: actor, p: p }); }
    var days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2028 tahun kabisat
    var factor = [0.98, 1.01, 1.0, 1.02, 0.99, 0.97, 1.01, 1.03, 1.0, 0.99, 1.0, 1.0];

    push('2028-01-02T08:00', 'PHASE_SET', 'ojk', { phase: 2, note: 'Komite pengarah menetapkan periode 2028 masuk Fase 2.' });

    var details = [
      { code: 'LDG-28-K1-004127', src: 'K1', time: '2028-03-14T10:00', v: 724 },
      { code: 'LDG-28-K1-004128', src: 'K1', time: '2028-03-14T11:00', v: 682 },
      { code: 'LDG-28-K1-004133', src: 'K1', time: '2028-03-14T16:00', v: 706, subst: true,
        note: 'Laju alir gas buang disubstitusi dengan rerata 3 jam sebelumnya akibat gangguan flow meter. Metode mengikuti SOP-CEMS-07.' },
      { code: 'LDG-28-K2-003981', src: 'K2', time: '2028-03-14T10:00', v: 641 },
      { code: 'LDG-28-K2-004097', src: 'K2', time: '2028-03-15T07:00', v: 638 }
    ];
    details.forEach(function (d) {
      R.SISPEK[d.code] = { v: d.v, at: d.time };
      push(d.time, 'ENTRY_RECORDED', 'sispek', {
        code: d.code, src: d.src, kind: 'hourly', time: d.time, param: 'CO₂ (laju massa)', unit: 't/jam',
        v: d.v, subst: !!d.subst, note: d.note || ''
      });
    });

    /* Rekap jam-an bulanan per kiln. Target setelah koreksi: Kiln 1 = 612.450,0 dan Kiln 2 = 548.210,0 tCO₂. */
    var plan = {
      K1: { batchTotal: 6124500 - (724 + 719 + 706), detailHours: [0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        subst: [12, 9, 14, 8, 11, 10, 9, 13, 7, 10, 9, 9], corr: [2, 1, 3, 1, 2, 2, 1, 2, 1, 2, 1, 2], undoc: [] },
      K2: { batchTotal: 5482100 - (641 + 638), detailHours: [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        subst: [3, 2, 4, 2, 3, 3, 2, 5, 3, 2, 3, 2], corr: [1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1], undoc: [0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 2, 0] }
    };
    ['K1', 'K2'].forEach(function (src, si) {
      var p = plan[src];
      var hours = days.map(function (d, i) { return d * 24 - p.detailHours[i]; });
      var weights = hours.map(function (h, i) { return h * factor[(i + si * 3) % 12]; });
      var wsum = weights.reduce(function (a, b) { return a + b; }, 0);
      var acc = 0;
      for (var i = 0; i < 12; i++) {
        var v = i < 11 ? Math.round(p.batchTotal * weights[i] / wsum) : p.batchTotal - acc;
        acc += v;
        var code = 'LDG-28-' + src + '-R' + R.pad(i + 1, 2);
        var month = '2028-' + R.pad(i + 1, 2) + '-01T00:00';
        var at = i < 11 ? '2028-' + R.pad(i + 2, 2) + '-01T01:00' : '2029-01-01T01:00';
        R.SISPEK[code] = { v: v, at: at };
        push(at, 'ENTRY_RECORDED', 'sispek', {
          code: code, src: src, kind: 'batch', time: month, param: 'Rekap CO₂ jam-an', unit: 'tCO₂',
          v: v, hours: hours[i], subst: p.subst[i], corrected: p.corr[i], undoc: p.undoc[i] || 0
        });
      }
    });

    /* Inventarisasi GRK: 20 entri disetujui (total 37.968,0) + 1 entri menunggu (3.412,0). */
    var solar = [3288.5, 3401.2, 3356.8, 3420.1, 3298.7, 3375.4, 3442.9, 3390.0, 3318.6, 3365.2, 3409.6].map(T);
    var solarSum = solar.reduce(function (a, b) { return a + b; }, 0);
    var rest = 379680 - solarSum;
    var others = [
      ['Solar genset darurat', '2028-03'], ['Solar genset darurat', '2028-06'], ['Solar genset darurat', '2028-09'], ['Solar genset darurat', '2028-12'],
      ['Bensin kendaraan operasional', '2028-06'], ['Bensin kendaraan operasional', '2028-12'],
      ['LPG laboratorium', '2028-12'], ['Solar pompa tambang kapur', '2028-06'], ['Solar pompa tambang kapur', '2028-12']
    ];
    var ow = [0.08, 0.07, 0.08, 0.09, 0.14, 0.15, 0.03, 0.18, 0.18];
    var owSum = ow.reduce(function (a, b) { return a + b; }, 0);
    var oacc = 0;
    var inv = [];
    solar.forEach(function (v, i) { inv.push({ label: 'Solar alat berat', month: '2028-' + R.pad(i + 2, 2), v: v }); });
    others.forEach(function (o, i) {
      var v = i < others.length - 1 ? Math.round(rest * ow[i] / owSum) : rest - oacc;
      oacc += v;
      inv.push({ label: o[0], month: o[1], v: v });
    });
    var n = 201;
    inv.forEach(function (it) {
      if (n === 214) n++;
      var code = 'LDG-28-GRK-' + R.pad(n++, 6);
      var mo = +it.month.slice(5, 7);
      var recAt = mo < 12 ? '2028-' + R.pad(mo + 1, 2) + '-05T09:' + R.pad(n % 50, 2) : '2029-01-05T09:' + R.pad(n % 50, 2);
      var apAt = R.addMinutes(recAt, 1440 + 70);
      var f = R.FUEL[it.label];
      var liters = Math.round(it.v * 100 / f); // v (persepuluh ton) → liter
      push(recAt, 'ENTRY_RECORDED', 'rina', {
        code: code, src: 'GRK', kind: 'inventory', time: it.month + '-01T00:00', param: it.label, unit: 'tCO₂e',
        v: it.v, activity: liters, factor: f, doc: 'Rekap faktur BBM ' + R.monthLabel(it.month + '-01')
      });
      push(apAt, 'ENTRY_DECIDED', 'dimas', { code: code, decision: 'approve', note: 'Sesuai rekap faktur dan faktor emisi.' });
    });

    /* Kondisi awal untuk demo: dua hal menunggu persetujuan pihak kedua (pengendalian internal). */
    push('2029-01-28T10:12', 'CORRECTION_PROPOSED', 'rina', {
      code: 'LDG-28-K1-004128', v: 719,
      reason: 'Koreksi faktor kalibrasi analyzer CO₂ Kiln 1 setelah uji akurasi relatif 13 Mar 2028; ditemukan saat rekonsiliasi akhir tahun.',
      evidence: 'Berita acara kalibrasi', file: 'BA-KAL-K1-2028-03.pdf'
    });
    var jan = 34120, f0 = R.FUEL['Solar alat berat'];
    push('2029-01-29T14:05', 'ENTRY_RECORDED', 'rina', {
      code: 'LDG-28-GRK-000214', src: 'GRK', kind: 'inventory', time: '2028-01-01T00:00', param: 'Solar alat berat', unit: 'tCO₂e',
      v: jan, activity: Math.round(jan * 100 / f0), factor: f0, doc: 'Rekap faktur BBM Jan 2028 (susulan dari vendor)'
    });
    push('2029-02-02T09:00', 'REPORT_STEP', 'lestari', { step: 'disusun', note: 'Draf metrik dan target PSPK 2 periode 2028.' });
    push('2029-02-09T15:30', 'REPORT_STEP', 'dimas', { step: 'ditelaah', note: '3 catatan telaah sudah diselesaikan.' });

    ev.sort(function (a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; });
    return ev;
  };

  R.CLOCK_START = '2029-02-10T08:30';
})(window.REVEAL = window.REVEAL || {});
