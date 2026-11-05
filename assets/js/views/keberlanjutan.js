/* Ruang kerja Divisi Keberlanjutan: laporan PSPK 1 & 2 yang setiap angkanya bertaut ke ledger. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  R.ui.kbTab = R.ui.kbTab || 'metrik';

  var TABS = [['tata-kelola', 'Tata kelola'], ['strategi', 'Strategi'], ['risiko', 'Manajemen risiko'], ['metrik', 'Metrik dan target · PSPK 2']];

  function metricsTable(S) {
    var m = S.metrics, snap = S.report.snapshot;
    function row(src) {
      var x = m[src], pend = x.pending;
      var link = '<button class="linkish mono" data-action="open-trace" data-src="' + src + '">' + R.SOURCES[src].ref + '</button><div class="cell-sub">' +
        (src === 'GRK' ? x.approved + ' entri' : R.int(x.entries) + ' entri jam-an') + '</div>';
      var status = pend ? R.badge(pend + ' entri menunggu', 'warn', 'clock') : R.badge('Tertaut 100%', 'ok', 'link');
      var cellSub = src === 'GRK' ? '' : '<div class="cell-sub">' + x.subst + ' jam substitusi</div>';
      var diff = snap && snap[src] !== x.v ? '<div class="cell-sub warn-text">Laporan terkirim: ' + R.num(snap[src]) + '</div>' : '';
      return '<tr><td><b>' + R.SOURCES[src].label + '</b></td><td class="num">' + R.num(x.v) + ' <small class="muted">tCO₂' + (src === 'GRK' ? 'e' : '') + '</small>' + diff + '</td><td>' + R.SOURCES[src].method + cellSub + '</td><td>' + link + '</td><td>' + status + '</td></tr>';
    }
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Metrik</th><th class="num">Nilai 2028</th><th>Metode</th><th>Rujukan ledger</th><th>Status tautan</th></tr></thead><tbody>' +
      row('K1') + row('K2') + row('GRK') +
      '<tr class="total"><td><b>Total Scope 1</b></td><td class="num"><b data-tour="scope1-total">' + R.num(m.total) + '</b> <small>tCO₂e</small></td><td colspan="3">' + (m.pending ? R.badge('Belum final · ' + m.pending + ' entri menunggu', 'warn', 'clock') : R.badge('Seluruh angka final dan tertaut', 'ok', 'check')) + '</td></tr>' +
      '</tbody></table></div>';
  }

  function disclosures(S) {
    var m = S.metrics;
    return '<div class="disc">' +
      '<div><h4>Metode pengukuran</h4><p>CO₂ dan laju alir gas buang diukur CEMS, dikirim jam-an ke SISPEK, lalu diteruskan otomatis ke ledger. Sumber lain dihitung dari data aktivitas × faktor emisi.</p></div>' +
      '<div><h4>Batas pelaporan</h4><p>Dua kiln dan sumber bahan bakar lain di pabrik utama. Scope 3 dan klaim offset di luar cakupan periode ini.</p></div>' +
      '<div><h4>Asumsi</h4><p>Jam tanpa data diisi metode substitusi yang ditetapkan dan didokumentasikan per kejadian.</p></div>' +
      '<div><h4>Keterbatasan data</h4><p>' + m.hoursSubst + ' jam (' + R.pct(m.hoursSubst / m.hoursTotal) + ') memakai data substitusi akibat gangguan analyzer dan jadwal kalibrasi.</p></div>' +
      '</div>';
  }

  function flow(S) {
    var st = S.report.steps, next = R.actions.nextReportStep();
    var items = R.REPORT_STEPS.map(function (s) {
      var done = st[s.id];
      var cls = done ? 'done' : (next && next.id === s.id ? 'current' : 'todo');
      var meta = done ? esc(R.who(done.by)) + ' · ' + R.dt(done.at) : (s.id === 'dikirim' ? R.PROVIDER.name : esc(R.whoFull(s.actor)));
      return '<li class="step step-' + cls + '"><span class="step-dot">' + (done ? ic('check') : '') + '</span><div><b>' + esc(s.label) + '</b><div class="step-meta">' + meta + '</div></div></li>';
    }).join('');
    var gate = [
      { ok: S.metrics.pending === 0, label: 'Semua angka bertaut ke ledger', detail: S.metrics.pending ? S.metrics.pending + ' entri belum disetujui' : 'Tidak ada entri menunggu' },
      { ok: !!(st.disusun && st.ditelaah && st.disusun.by !== st.ditelaah.by), label: 'Penyusun dan penelaah berbeda', detail: st.ditelaah ? R.who(st.disusun.by) + ' / ' + R.who(st.ditelaah.by) : 'Belum ditelaah' },
      { ok: !!st.disetujui_direksi, label: 'Persetujuan Direksi', detail: st.disetujui_direksi ? R.dt(st.disetujui_direksi.at) : 'Belum' },
      { ok: !!st.ditelaah_komite, label: 'Telaah Komite Keberlanjutan', detail: st.ditelaah_komite ? R.dt(st.ditelaah_komite.at) : 'Belum' }
    ].map(function (g) { return R.checkRow(g.ok ? 'ok' : 'warn', g.label, g.detail); }).join('');
    var mine = next && R.meId() === next.actor;
    var btn = next
      ? (mine ? '<button class="btn btn-primary btn-block" data-action="advance-report" data-tour="advance-report">' + ic(next.id === 'dikirim' ? 'send' : 'check') + esc(next.verb) + '</button><p class="fine center">Anda berwenang untuk langkah ini</p>'
        : '<div class="await">' + ic('clock') + '<div><b>Menunggu ' + esc(R.whoFull(next.actor)) + '</b><small>Langkah "' + esc(next.label) + '" hanya dapat dilakukan oleh akun tersebut.</small></div><button class="btn btn-ghost btn-sm" data-action="switch-account" data-id="' + next.actor + '">Ganti ke akun ' + esc(R.who(next.actor)) + '</button></div>')
      : '<div class="done-box">' + ic('check') + '<div><b>Terkirim ke ' + esc(R.PROVIDER.name) + '</b><div class="step-meta">LDG-28-RPT-v' + S.report.version + ' · snapshot ' + R.short(R.sha256(R.canon(S.report.snapshot)), 12) + '</div></div></div>';
    return R.card('Alur persetujuan laporan', '<ol class="steps">' + items + '</ol><h3 class="sub-h">Syarat kirim ke assurance</h3><ul class="checks">' + gate + '</ul>' + btn,
      { sub: 'Pemisahan tugas sesuai PUGKI 2021', id: 'report-flow' });
  }

  function findingsCard(S) {
    var fs = S.findingOrder.map(function (id) { return S.findings[id]; }).filter(function (f) { return f.version === S.report.version; });
    if (!fs.length) return '';
    var body = '<ul class="findings">' + fs.map(function (f) {
      return '<li><div class="f-head"><span class="mono">' + f.id + '</span>' + (f.materiality === 'material' ? R.badge('Material', 'bad') : R.badge('Tidak material', 'neutral')) + '</div><p>' + esc(f.title) + '</p>' +
        (f.response ? '<div class="f-resp">' + ic('check') + '<div><b>Tanggapan manajemen</b><p>' + esc(f.response.text) + '</p><small>' + esc(R.who(f.response.by)) + ' · ' + R.dt(f.response.at) + '</small></div></div>'
          : R.can('finding.respond') ? '<button class="btn btn-outline btn-sm" data-action="open-respond" data-id="' + f.id + '" data-tour="respond-finding">' + ic('edit') + 'Tanggapi temuan</button>' : R.badge('Menunggu tanggapan Divisi Keberlanjutan / Direksi', 'warn', 'clock')) + '</li>';
    }).join('') + '</ul>';
    return R.card('Tindak lanjut temuan assurance', body, { sub: 'Ditindaklanjuti Direksi dan dipantau Komite Keberlanjutan', id: 'findings-mgmt' });
  }

  function consentCard(S) {
    var c = S.consent, body;
    if (!R.can('consent.set')) return R.card('Akses lembaga pembiayaan', '<p class="muted">Status: <b>' + ({ none: 'belum ada permintaan', diminta: 'diminta ' + R.BANK.name, diberikan: 'diberikan ke ' + R.BANK.name, ditolak: 'ditolak', dicabut: 'dicabut' }[c.status]) + '</b>. Keputusan akses dipegang Divisi Keberlanjutan dan Direksi.</p>', { id: 'consent-card' });
    var scope = '<ul class="scope"><li>' + ic('eye') + 'Dibuka: total Scope 1 per sumber, laporan dan kesimpulan assurance, ringkasan riwayat koreksi</li><li>' + ic('lock') + 'Tertutup: data jam-an mentah dan dokumen internal lain</li></ul>';
    if (c.status === 'diberikan') {
      body = '<div class="done-box">' + ic('unlock') + '<div><b>Akses diberikan ke ' + esc(R.BANK.name) + '</b><div class="step-meta">' + esc(c.scope) + ' · ' + R.dt(c.at) + '</div></div></div>' + scope +
        '<button class="btn btn-ghost btn-sm" data-action="set-consent" data-v="0">Cabut akses</button>';
    } else {
      var head = c.status === 'diminta'
        ? '<p><b>' + esc(R.BANK.name) + '</b> meminta akses terbatas untuk pengajuan <b>' + esc(c.scope) + '</b> (' + R.dt(c.requestedAt) + ').</p>'
        : '<p>' + (c.status === 'dicabut' ? 'Akses sebelumnya telah dicabut. ' : c.status === 'ditolak' ? 'Permintaan terakhir ditolak. ' : '') + 'Lembaga pembiayaan hanya dapat menelusuri ledger setelah emiten memberi persetujuan.</p>';
      body = head + scope + '<div class="btn-row"><button class="btn btn-primary" data-action="set-consent" data-v="1" data-tour="grant-consent">' + ic('unlock') + 'Berikan akses ke ' + esc(R.BANK.name) + '</button>' +
        (c.status === 'diminta' ? '<button class="btn btn-ghost" data-action="set-consent" data-v="0">Tolak</button>' : '') + '</div>';
    }
    return R.card('Persetujuan akses lembaga pembiayaan', body, { id: 'consent-card', right: c.status === 'diminta' ? R.badge('Permintaan baru', 'warn', 'clock') : '' });
  }

  function conclusionCard(S) {
    var c = S.conclusion; if (!c) return '';
    var t = R.CONCLUSIONS[c.type];
    return R.card('Kesimpulan assurance diterima', '<div class="concl concl-' + t.tone + '"><div class="concl-type">' + R.badge(t.label, t.tone, 'shield') + ' ' + R.badge(c.level === 'limited' ? 'Limited assurance' : 'Reasonable assurance', 'neutral') + '</div><p>' + esc(c.text) + '</p><small class="mono">' + c.code + ' · ' + R.dt(c.at) + '</small></div>');
  }

  function staleBanner(S) {
    if (!S.stale) return '';
    var s = S.report.snapshot, m = S.metrics;
    var diffs = ['K1', 'K2', 'GRK'].filter(function (k) { return s[k] !== m[k].v; }).map(function (k) { return R.SOURCES[k].label + ' ' + R.num(s[k]) + ' → ' + R.num(m[k].v); }).join('; ');
    return '<div class="banner banner-warn">' + ic('alert') + '<div><b>Angka di ledger berubah setelah laporan versi ' + S.report.version + ' dikirim.</b> ' + esc(diffs) + '. Kesimpulan assurance atas versi ini tidak lagi berlaku untuk angka terkini, sama seperti kasus penyajian kembali data Scope 2 yang diungkap dalam esai.' +
      (R.can('report.restate') ? '<div class="btn-row"><button class="btn btn-primary btn-sm" data-action="restate">' + ic('reset') + 'Siapkan penyajian kembali (versi ' + (S.report.version + 1) + ')</button></div>' : '<p class="fine">Penyajian kembali dibuka oleh Divisi Keberlanjutan.</p>') + '</div></div>';
  }

  function otherTab(id) {
    var c = {
      'tata-kelola': ['Pengawasan atas informasi emisi', [
        'Dewan Komisaris membentuk Komite Keberlanjutan yang menelaah informasi emisi dan merekomendasikan penunjukan penyedia assurance.',
        'Direksi menetapkan penanggung jawab data: operator CEMS (pencatatan), pengendalian internal (persetujuan koreksi), Divisi Keberlanjutan (penyusunan laporan).',
        'Koreksi data memerlukan dua pihak berbeda; seluruh keputusan tercatat di ledger dan tidak dapat dihapus.']],
      'strategi': ['Strategi dan target iklim', [
        'Target penurunan intensitas emisi per ton klinker ditetapkan Direksi dan ditelaah Komite.',
        'Proyek pemanfaatan panas buang Kiln 1 menjadi prioritas pendanaan hijau periode 2029.',
        'Pembiayaan berkelanjutan diajukan dengan laporan assurance independen sebagai persyaratan bersama.']],
      'risiko': ['Manajemen risiko terkait iklim', [
        'Risiko transisi: kewajiban pengungkapan PSPK dan assurance bertahap sesuai rancangan regulator.',
        'Risiko data: ketergantungan pada mutu kalibrasi CEMS; dimitigasi dengan uji akurasi relatif dan dokumentasi substitusi.',
        'Risiko reputasi: klaim emisi tanpa bukti dapat dipersepsikan sebagai greenwashing.']]
    }[id];
    return R.card(c[0], '<ul class="bullets">' + c[1].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="fine">Ringkasan ilustratif pengungkapan PSPK 1. Fokus prototipe adalah metrik emisi pada PSPK 2.</p>');
  }

  R.VIEWS['laporan'] = {
    page: 'laporan',
    render: function () {
      var S = R.store.S;
      var statusBadge = S.report.steps.dikirim ? R.badge('Terkirim ke assurance · v' + S.report.version, 'ok', 'send')
        : S.report.steps.disetujui_direksi ? R.badge('Disetujui Direksi', 'info', 'check') : R.badge('Menunggu persetujuan Direksi', 'warn', 'clock');
      var tabs = '<div class="tabs" role="tablist">' + TABS.map(function (t) {
        return '<button class="tab ' + (R.ui.kbTab === t[0] ? 'on' : '') + '" role="tab" aria-selected="' + (R.ui.kbTab === t[0]) + '" data-action="kb-tab" data-t="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>';
      var main = R.ui.kbTab === 'metrik'
        ? R.card('Emisi GRK Scope 1 · cerobong dan sumber tidak bergerak', metricsTable(S), { sub: 'Setiap angka wajib bertaut ke entri ledger sebelum laporan bisa dikirim ke penyedia assurance.', id: 'metrics-card' }) +
          R.card('Pengungkapan pendukung', disclosures(S))
        : otherTab(R.ui.kbTab);
      var access = R.can('report.restate') ? 'Penyusun & pengirim' : R.can('report.step.disetujui_direksi') ? 'Direksi' : R.can('report.step.ditelaah_komite') ? 'Komite Keberlanjutan' : R.can('report.step.ditelaah') ? 'Penelaah internal' : 'Lihat saja';
      return R.pageHead({ eyebrow: R.ENTITY.name + ' · periode 2028', title: 'Laporan keberlanjutan PSPK 1 dan 2', right: '<div class="btn-row">' + R.badge('Akses: ' + access, 'info', 'shield') + statusBadge + '</div>' }) +
        staleBanner(S) + tabs +
        '<div class="split"><div class="stack">' + main + findingsCard(S) + conclusionCard(S) + '</div><div class="stack">' + flow(S) + consentCard(S) + '</div></div>';
    }
  };

  var A = R.handlers;
  A['kb-tab'] = function (d) { R.ui.kbTab = d.t; R.render(); };
  A['advance-report'] = function () {
    var next = R.actions.nextReportStep();
    R.run(function () { R.actions.advanceReport(R.meId()); }, next ? next.label + ' · tercatat di ledger.' : '');
  };
  A['restate'] = function () { R.run(function () { R.need('report.restate'); R.actions.restateReport(null, R.meId()); }, 'Versi laporan baru dibuka. Alur persetujuan dan assurance dimulai lagi; versi lama tetap tersimpan.'); };
  A['set-consent'] = function (d) {
    R.run(function () { R.need('consent.set'); R.actions.setConsent(d.v === '1', R.meId()); }, d.v === '1' ? 'Akses terbatas diberikan ke ' + R.BANK.name + '.' : 'Akses ditutup.');
  };
  A['open-trace'] = function (d) {
    var S = R.store.S;
    R.modal.open({
      wide: true, eyebrow: 'Telusuri angka ke sumbernya', title: R.SOURCES[d.src].label + ' · ' + R.num(S.metrics[d.src].v) + ' tCO₂' + (d.src === 'GRK' ? 'e' : ''),
      body: R.traceChain(S, d.src) + '<p class="muted">Setiap lompatan memakai catatan yang sama di ledger: laporan menunjuk ke entri, entri menunjuk ke kiriman SISPEK atau dokumen sumber, dan kiriman berasal dari alat yang terkalibrasi.</p>',
      footer: '<button class="btn" data-action="modal-close">Tutup</button>'
    });
  };
  A['open-respond'] = function (d) {
    var f = R.store.S.findings[d.id];
    var sugg = f.key === 'A1' ? 'Dokumentasi metode substitusi untuk jam terkait telah dilengkapi dan diunggah ke ledger; prosedur pengunggahan maksimal 3 hari diberlakukan.'
      : f.key === 'A2' ? 'Faktor emisi solar akan diperbarui ke acuan nasional terbaru mulai periode 2029; dampak periode 2028 tidak material dan diungkapkan sebagai keterbatasan.'
        : 'Temuan telah ditindaklanjuti dan bukti perbaikan diunggah ke ledger.';
    R.modal.open({
      eyebrow: 'Tanggapan manajemen · ' + f.id, title: f.title,
      body: '<form id="f-resp" data-form="respond" data-id="' + f.id + '" class="form"><label class="field"><span>Tanggapan dan rencana tindak lanjut</span><textarea name="text" rows="4" required>' + esc(sugg) + '</textarea></label><p class="fine">Disampaikan oleh ' + esc(R.whoFull(R.meId())) + '.</p></form>',
      footer: '<button class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-primary" type="submit" form="f-resp">' + ic('send') + 'Kirim tanggapan</button>'
    });
  };
  R.forms.respond = function (form, data) {
    R.run(function () { R.need('finding.respond'); R.actions.respondFinding(R.meId(), form.dataset.id, data.text); R.modal.close(); }, 'Tanggapan manajemen tercatat di ledger.');
  };
})(window.REVEAL = window.REVEAL || {});
