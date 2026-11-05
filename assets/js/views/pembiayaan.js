/* Ruang kerja Lembaga Pembiayaan: verifikasi prasyarat pendanaan hijau dengan akses terbatas atas persetujuan emiten. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;

  function rulesCard(S) {
    var ph = R.PHASES[S.phase];
    return R.card('Aturan jenis kesimpulan', '<p class="eyebrow">Kriteria terbuka · diumumkan sebelum fasilitas ditawarkan</p><ul class="rules">' +
      '<li>' + R.badge('Memenuhi', 'ok', 'check') + '<p>Kesimpulan tanpa modifikasi.</p></li>' +
      '<li>' + R.badge('Memenuhi bersyarat', 'warn', 'alert') + '<p>Wajar dengan pengecualian, selama pengecualian tidak menyangkut metrik emisi inti dan ada rencana tindak lanjut sampai periode berikutnya.</p></li>' +
      '<li>' + R.badge('Tidak memenuhi', 'bad', 'x') + '<p>Tidak wajar, atau tidak menyatakan kesimpulan.</p></li></ul>' +
      '<div class="phase-note"><b>' + esc(ph.label) + '</b><p>' + esc(ph.desc) + '</p></div>' +
      '<p class="fine">Contoh manfaat: sustainability-linked loan dapat memberi pengurangan margin bila target yang disepakati tercapai dan diverifikasi independen. Besaran manfaat ditetapkan masing-masing lembaga.</p>', { id: 'rules-card' });
  }

  function application(S) {
    var ev = R.evaluateFinancing(S);
    var r = R.FIN_RESULT[ev.result];
    var last = S.checks.length ? S.checks[S.checks.length - 1] : null;
    if (ev.result === 'akses_ditutup') {
      var c = S.consent.status;
      return R.card('Pengajuan obligasi hijau', '<div class="app-head"><div><div class="eyebrow">' + esc(R.ENTITY.name) + '</div><h3>' + esc(R.ENTITY.project) + '</h3></div>' + R.badge('Akses ledger tertutup', 'neutral', 'lock') + '</div>' +
        '<div class="locked">' + ic('lock', 'ico-xl') + '<div><b>Ledger emiten belum dapat ditelusuri.</b><p>Lembaga pembiayaan hanya melihat informasi yang relevan dengan pengajuan, setelah emiten memberi persetujuan.</p>' +
        (c === 'diminta' ? R.badge('Permintaan terkirim · menunggu keputusan emiten', 'warn', 'clock')
          : '<button class="btn btn-primary" data-action="request-consent" data-tour="request-consent">' + ic('send') + 'Minta akses ke emiten</button>') +
        '</div></div>', { id: 'application-card' });
    }
    var crit = '<ul class="checks">' + ev.criteria.map(function (c) { return R.checkRow(c.state, c.label, c.detail); }).join('') + '</ul>';
    var result = '<div class="verdict verdict-' + r.tone + '">' + ic(r.tone === 'ok' ? 'shield' : r.tone === 'bad' ? 'x' : 'clock') + '<div><b>' + r.label + '</b><small>' + (S.conclusion ? 'Berlaku sampai laporan periode 2029 terbit' : 'Dinilai dari isi ledger saat ini') + '</small></div></div>';
    var view = '<div class="access">' + ic('eye') + '<div><b>Yang dapat Anda lihat</b><p>Total Scope 1 per sumber · laporan dan kesimpulan assurance · ringkasan riwayat koreksi. Data jam-an mentah tertutup.</p></div></div>';
    var m = S.metrics;
    var figures = '<dl class="kv kv-tight"><dt>Total Scope 1 (laporan)</dt><dd>' + (S.report.snapshot ? R.num(S.report.snapshot.total) + ' tCO₂e' : '—') + '</dd><dt>Ringkasan koreksi</dt><dd>' + m.correctedTotal + ' entri dikoreksi, semuanya disetujui pihak berbeda</dd>' +
      (S.conclusion ? '<dt>Kesimpulan</dt><dd>' + R.CONCLUSIONS[S.conclusion.type].label + ' · ' + (S.conclusion.level === 'limited' ? 'limited' : 'reasonable') + '</dd>' : '') + '</dl>';
    return R.card('Pengajuan obligasi hijau',
      '<div class="app-head"><div><div class="eyebrow">' + esc(R.ENTITY.name) + '</div><h3>' + esc(R.ENTITY.project) + '</h3></div>' + result + '</div>' +
      crit + figures + view +
      '<div class="note">' + ic('info') + 'Prasyarat ini membuka akses pengajuan. Kelayakan proyek, kelayakan keuangan, dan persyaratan instrumen tetap dinilai terpisah oleh lembaga pembiayaan.</div>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="run-check" data-tour="run-check">' + ic('check') + 'Catat hasil pemeriksaan ke ledger</button>' +
      (last ? '<span class="fine">Terakhir dicatat: ' + R.FIN_RESULT[last.result].label + ' · ' + R.dt(last.at) + '</span>' : '') + '</div>',
      { id: 'application-card' });
  }

  function queue(S) {
    var ev = R.evaluateFinancing(S), r = R.FIN_RESULT[ev.result];
    var ksm = '<tr class="is-selected"><td><b>' + esc(R.ENTITY.name) + '</b></td><td>Semen</td><td>' + (S.conclusion ? (S.conclusion.level === 'limited' ? 'Limited' : 'Reasonable') : 'Belum ada') + '</td><td>' + (S.conclusion ? R.CONCLUSIONS[S.conclusion.type].label : S.engagement ? 'Penugasan berjalan' : 'Laporan belum dikirim') + '</td><td>' + R.badge(r.label, r.tone) + '</td></tr>';
    var others = R.OTHER_APPLICATIONS.map(function (a) {
      var rr = R.FIN_RESULT[a.status];
      return '<tr><td>' + esc(a.name) + '</td><td>' + esc(a.sector) + '</td><td>' + esc(a.level) + '</td><td>' + esc(a.concl) + '</td><td>' + R.badge(rr.label, rr.tone) + (a.note ? '<div class="cell-sub">' + esc(a.note) + '</div>' : '') + '</td></tr>';
    }).join('');
    return R.card('Pengajuan lain', '<div class="table-wrap"><table class="table"><thead><tr><th>Emiten</th><th>Sektor</th><th>Keyakinan</th><th>Kesimpulan</th><th>Status prasyarat</th></tr></thead><tbody>' + ksm + others + '</tbody></table></div>');
  }

  R.VIEWS['pembiayaan'] = {
    page: 'pembiayaan',
    render: function () {
      var S = R.store.S;
      return R.pageHead({
        eyebrow: R.BANK.unit + ' · ' + R.BANK.name,
        title: 'Verifikasi prasyarat pendanaan berlabel hijau',
        right: R.badge('Aturan prasyarat ' + R.PHASES[S.phase].label, 'info', 'info')
      }) + '<div class="split"><div class="stack">' + application(S) + queue(S) + '</div><div class="stack">' + rulesCard(S) + '</div></div>';
    }
  };

  var A = R.handlers;
  A['request-consent'] = function () { R.run(function () { R.need('financing.work'); R.actions.requestConsent(); }, 'Permintaan akses dikirim ke emiten. Divisi Keberlanjutan atau Direksi emiten yang memutuskan.'); };
  A['run-check'] = function () {
    R.run(function () { R.need('financing.work'); R.actions.runFinancingCheck(); }, 'Hasil pemeriksaan prasyarat dicatat di ledger.');
  };
})(window.REVEAL = window.REVEAL || {});
