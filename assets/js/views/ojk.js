/* OJK & Komite Pengarah: pengawasan fase, indikator, cakupan sektor, mutu penyedia, dan aktivitas ledger. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;

  /* Uraian manusiawi setiap jenis catatan ledger (dipakai juga di Rantai Ledger) */
  R.describe = function (e) {
    var p = e.p;
    switch (e.type) {
      case 'PHASE_SET': return 'Menetapkan ' + R.PHASES[p.phase].label + ' (' + R.PHASES[p.phase].name + ')';
      case 'ENTRY_RECORDED':
        if (p.kind === 'batch') return 'Rekap jam-an ' + R.monthLabel(p.time) + ' ' + p.code + ' · ' + R.num(p.v) + ' tCO₂';
        if (p.kind === 'inventory') return 'Mencatat inventarisasi ' + p.code + ' · ' + p.param + ' ' + R.num(p.v) + ' tCO₂e';
        return 'Kiriman SISPEK ' + p.code + ' · ' + R.num(p.v) + ' ' + p.unit + (p.subst ? ' (substitusi)' : '');
      case 'ENTRY_DECIDED': return (p.decision === 'approve' ? 'Menyetujui' : 'Menolak') + ' entri ' + p.code;
      case 'CORRECTION_PROPOSED': return 'Mengajukan koreksi ' + p.code + ' → ' + R.num(p.v) + ' (' + p.evidence + ')';
      case 'CORRECTION_DECIDED': return (p.decision === 'approve' ? 'Menyetujui' : 'Menolak') + ' koreksi ' + p.code;
      case 'REPORT_STEP': var s = R.REPORT_STEPS.filter(function (x) { return x.id === p.step; })[0]; return 'Laporan PSPK: ' + (s ? s.label.toLowerCase() : p.step);
      case 'REPORT_RESTATED': return 'Membuka penyajian kembali laporan versi ' + p.version;
      case 'SAMPLE_ADDED': return 'Menambah sampel uji ' + p.code;
      case 'SAMPLE_TESTED': return 'Menelusuri sampel ' + p.code + ' · ' + (p.result === 'sesuai' ? 'sesuai' : 'tidak sesuai');
      case 'FINDING_RECORDED': return 'Mencatat temuan ' + p.id + ': ' + p.title;
      case 'FINDING_RESPONDED': return 'Menanggapi temuan ' + p.id;
      case 'CONCLUSION_ISSUED': return 'Menerbitkan kesimpulan ' + R.CONCLUSIONS[p.type].label.toLowerCase() + ' (' + p.level + ') ' + p.code;
      case 'CONSENT_REQUESTED': return 'Meminta akses ledger untuk ' + p.scope;
      case 'CONSENT_SET': return p.granted ? 'Memberi akses terbatas ke ' + R.BANK.name : 'Menutup akses ' + R.BANK.name;
      case 'FINANCING_CHECKED': return 'Mencatat hasil prasyarat: ' + R.FIN_RESULT[p.result].label;
    }
    return e.type;
  };

  function bar(label, value, threshold, sub, tone) {
    return '<div class="ind"><div class="ind-label">' + esc(label) + '</div><div class="ind-v">' + R.pct(value) + '</div>' +
      '<div class="meter" role="img" aria-label="' + esc(label) + ' ' + R.pct(value) + ', ambang ' + R.pct(threshold, 0) + '"><span class="meter-fill meter-' + tone + '" style="width:' + Math.min(100, value * 100) + '%"></span><span class="meter-th" style="left:' + threshold * 100 + '%"></span></div>' +
      '<div class="ind-sub">' + sub + '</div></div>';
  }

  R.VIEWS['pengawasan'] = {
    page: 'pengawasan',
    render: function () {
      var S = R.store.S, st = R.store, m = S.metrics;
      var phases = [1, 2, 3].map(function (k) {
        var ph = R.PHASES[k];
        var state = k < S.phase ? R.badge('Selesai', 'ok', 'check') : k === S.phase ? R.badge('Berjalan', 'info', 'clock') : R.badge('Belum dimulai', 'neutral');
        return '<div class="phase ' + (k === S.phase ? 'on' : '') + '"><div class="phase-head"><b>' + ph.label + '</b>' + state + '</div><p>' + esc(ph.desc) + '</p>' +
          (k !== S.phase ? '<button class="btn btn-ghost btn-sm" data-action="set-phase" data-p="' + k + '">Tetapkan fase ini</button>' : '') + '</div>';
      }).join('');

      var fs = S.findingOrder.map(function (id) { return S.findings[id]; });
      var baseF = 52, baseR = 47; // emiten lain (ilustratif)
      var follow = (baseR + fs.filter(function (f) { return f.response; }).length) / (baseF + fs.length);
      var inds = '<div class="inds">' +
        bar('Data SISPEK yang masuk ledger', 0.987, 0.97, R.icon('check') + ' Ambang 97% tercapai · ' + esc(R.ENTITY.name) + ' ' + R.pct(m.completeness), 'ok') +
        bar('Temuan assurance yang ditindaklanjuti', follow, 0.9, (follow >= 0.9 ? R.icon('check') + ' Ambang 90% tercapai' : R.icon('alert') + ' Di bawah ambang 90%'), follow >= 0.9 ? 'ok' : 'warn') +
        bar('Realisasi anggaran pengelolaan ledger', 0.84, 1, R.icon('clock') + ' Anggaran pengawasan 2028 · dipantau', 'warn') + '</div>';

      var ksmSent = S.report.steps.dikirim ? 1 : 0, ksmAssured = S.conclusion && !S.stale ? 1 : 0;
      var lastCheck = S.checks.length ? S.checks[S.checks.length - 1] : null;
      var ksmElig = lastCheck && (lastCheck.result === 'memenuhi' || lastCheck.result === 'bersyarat') && lastCheck.version === S.report.version && !S.stale ? 1 : 0;
      var tot = { t: 0, r: 0, a: 0, e: 0 };
      var rows = R.SECTORS.map(function (s) {
        var r = s.reports + (s.includesKSM ? ksmSent : 0), a = s.assured + (s.includesKSM ? ksmAssured : 0), e = s.eligible + (s.includesKSM ? ksmElig : 0);
        tot.t += s.target; tot.r += r; tot.a += a; tot.e += e;
        return '<tr><td>' + esc(s.sector) + (s.includesKSM ? ' <span class="cell-sub">termasuk ' + esc(R.ENTITY.name) + '</span>' : '') + '</td><td class="num">' + s.target + '</td><td class="num">' + r + '</td><td class="num">' + a + '</td><td class="num">' + e + '</td></tr>';
      }).join('');
      var sector = '<div class="table-wrap"><table class="table"><thead><tr><th>Sektor</th><th class="num">Sasaran</th><th class="num">Laporan masuk</th><th class="num">Ber-assurance</th><th class="num">Memenuhi prasyarat</th></tr></thead><tbody>' + rows +
        '<tr class="total"><td><b>Total</b></td><td class="num"><b>' + tot.t + '</b></td><td class="num"><b>' + tot.r + '</b></td><td class="num"><b>' + tot.a + '</b></td><td class="num"><b>' + tot.e + '</b></td></tr></tbody></table></div>';

      var integ = st.integrity;
      var integrity = integ.ok
        ? '<div class="done-box">' + ic('shield') + '<div><b>Rantai ledger utuh</b><div class="step-meta">' + R.int(integ.count) + ' catatan · hash terakhir <span class="mono">' + R.short(integ.head, 14) + '</span></div></div></div>'
        : '<div class="banner banner-bad">' + ic('alert') + '<div><b>Rantai rusak pada catatan #' + integ.brokenAt + '.</b> ' + esc(integ.reason) + '.</div></div>';

      var feed = st.events.slice(-9).reverse().map(function (e) {
        return '<li><span class="feed-role role-' + e.role + '">' + esc((R.ROLES[e.role] || R.ROLES.system).label) + '</span><div><p>' + esc(R.describe(e)) + '</p><small>' + esc(R.who(e.actor)) + ' · ' + R.dt(e.t) + ' · #' + e.seq + '</small></div></li>';
      }).join('');

      var iapi = '<dl class="kv"><dt>Praktisi bersertifikat aktif</dt><dd>38 <span class="muted">(peta IAPI)</span></dd><dt>Inspeksi mutu terjadwal</dt><dd>4 KAP</dd><dt>Kesimpulan tidak menyatakan</dt><dd>1</dd><dt>Evaluasi tahunan komite</dt><dd>Des 2028 · selesai</dd></dl>' +
        '<p class="note">' + ic('globe') + 'Ringkasan data terverifikasi tiap emiten dipublikasikan untuk investor dan masyarakat sekitar industri. <a href="#/publik">Lihat ringkasan publik</a></p>';

      return R.pageHead({
        eyebrow: 'Komite pengarah lintas lembaga · OJK, KLH, IAPI, lembaga pembiayaan',
        title: 'Pengawasan REVEAL',
        right: R.badge('SISPEK tersinkron ' + R.dt(st.clock), 'ok', 'reset')
      }) +
        R.card('Fase implementasi', '<div class="phases">' + phases + '</div><p class="fine">Mengubah fase mengubah aturan yang dijalankan sistem: tingkat keyakinan minimum di ruang kerja penyedia assurance dan prasyarat di lembaga pembiayaan. ' + R.addon('Aturan fase dapat dieksekusi') + '</p>', { id: 'phase-card' }) +
        R.card('Indikator keberlanjutan sistem', inds, { sub: 'Garis vertikal adalah ambang dari Fase 1 sebagai syarat peralihan fase' }) +
        '<div class="split"><div class="stack">' + R.card('Emiten wajib CEMS per sektor · periode 2028', sector, { sub: 'Kelompok sasaran tahap awal Fase 2 · baris semen bergerak mengikuti ledger emiten percontohan', id: 'sector-card' }) +
        R.card('Aktivitas ledger terbaru', '<ul class="feed">' + feed + '</ul>', { right: '<a class="btn btn-ghost btn-sm" href="#/rantai">' + ic('chain') + 'Rantai ledger</a>' }) + '</div>' +
        '<div class="stack">' + R.card('Integritas ledger', integrity + '<a class="btn btn-outline btn-block" href="#/rantai">' + ic('search') + 'Verifikasi rantai</a>', { id: 'integrity-card' }) +
        R.card('Kapasitas dan mutu penyedia · bersama IAPI', iapi) + '</div></div>';
    }
  };

  R.handlers['set-phase'] = function (d) {
    var p = +d.p;
    R.run(function () { R.need('phase.set'); R.actions.setPhase(p); }, R.PHASES[p].label + ' ditetapkan. Aturan sistem kini mengikuti fase ini.');
  };
})(window.REVEAL = window.REVEAL || {});
