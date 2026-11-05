/* Komponen antarmuka bersama: modal, toast, lencana, kepala halaman, penelusuran angka. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  R.ui = R.ui || {};

  /* ---------- Toast ---------- */
  R.toast = function (msg, tone) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast toast-' + (tone || 'ok');
    el.setAttribute('role', tone === 'bad' ? 'alert' : 'status');
    el.innerHTML = ic(tone === 'bad' ? 'alert' : tone === 'info' ? 'info' : 'check') + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, tone === 'bad' ? 5200 : 3200);
    setTimeout(function () { el.remove(); }, tone === 'bad' ? 5600 : 3600);
  };

  /* ---------- Modal ---------- */
  var lastFocus = null;
  R.modal = {
    open: function (o) {
      var root = document.getElementById('modal-root');
      lastFocus = document.activeElement;
      root.innerHTML =
        '<div class="modal-backdrop" data-action="modal-close"></div>' +
        '<div class="modal ' + (o.wide ? 'modal-wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<header class="modal-head"><div><div class="eyebrow">' + esc(o.eyebrow || '') + '</div><h2 id="modal-title">' + esc(o.title) + '</h2></div>' +
        '<button class="icon-btn" data-action="modal-close" aria-label="Tutup">' + ic('x') + '</button></header>' +
        '<div class="modal-body">' + o.body + '</div>' +
        (o.footer ? '<footer class="modal-foot">' + o.footer + '</footer>' : '') +
        '</div>';
      root.classList.add('open');
      document.body.classList.add('modal-open');
      var first = root.querySelector('input, select, textarea, button.btn');
      if (first) setTimeout(function () { first.focus(); }, 30);
      if (o.onOpen) o.onOpen(root);
    },
    close: function () {
      var root = document.getElementById('modal-root');
      root.classList.remove('open'); root.innerHTML = '';
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    }
  };

  /* ---------- Lencana ---------- */
  R.badge = function (text, tone, icon) {
    return '<span class="badge badge-' + (tone || 'neutral') + '">' + (icon ? ic(icon) : '') + esc(text) + '</span>';
  };
  R.statusBadge = function (en) {
    switch (en.status) {
      case 'diterima': return R.badge('Diterima', 'ok', 'check');
      case 'dikoreksi':
        var cur = en.revisions.filter(function (r) { return r.status === 'berlaku'; })[0];
        return R.badge('Dikoreksi · rev ' + cur.rev, 'info', 'edit');
      case 'koreksi_diajukan': return R.badge('Koreksi diajukan', 'warn', 'clock');
      case 'substitusi': return R.badge('Substitusi', 'warn', 'alert');
      case 'menunggu': return R.badge('Menunggu persetujuan', 'warn', 'clock');
      case 'ditolak': return R.badge('Ditolak', 'bad', 'x');
      case 'rekap': return R.badge('Rekap · ' + R.int(en.hours) + ' jam', 'neutral', 'layers');
    }
    return '';
  };
  R.toneBadge = function (state) {
    return { ok: R.badge('Terpenuhi', 'ok', 'check'), warn: R.badge('Bersyarat', 'warn', 'alert'), fail: R.badge('Belum', 'bad', 'x'), info: R.badge('Info', 'info', 'info') }[state] || '';
  };
  R.checkRow = function (state, label, detail) {
    var icon = state === 'ok' ? 'check' : state === 'warn' ? 'alert' : state === 'info' ? 'info' : 'x';
    return '<li class="check check-' + state + '">' + ic(icon) + '<div><div class="check-label">' + esc(label) + '</div>' + (detail ? '<div class="check-detail">' + esc(detail) + '</div>' : '') + '</div></li>';
  };
  R.who = function (id) { var p = R.PERSONAS[id]; return p ? p.name : id; };
  R.whoFull = function (id) { var p = R.PERSONAS[id]; return p ? p.name + ' · ' + p.title : id; };

  R.pageHead = function (o) {
    return '<div class="page-head"><div><div class="eyebrow">' + esc(o.eyebrow) + '</div><h1>' + esc(o.title) + '</h1>' +
      (o.lead ? '<p class="lead">' + o.lead + '</p>' : '') + '</div>' + (o.right ? '<div class="page-head-right">' + o.right + '</div>' : '') + '</div>';
  };
  R.tile = function (label, value, sub, tone) {
    return '<div class="tile ' + (tone ? 'tile-' + tone : '') + '"><div class="tile-label">' + esc(label) + '</div><div class="tile-value">' + value + '</div>' + (sub ? '<div class="tile-sub">' + sub + '</div>' : '') + '</div>';
  };
  R.card = function (title, body, o) {
    o = o || {};
    return '<section class="card ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' +
      (title ? '<header class="card-head"><div><h2>' + title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.right || '') + '</header>' : '') +
      '<div class="card-body">' + body + '</div></section>';
  };
  R.addon = function (txt) { return '<span class="addon" title="Inovasi tambahan di luar rancangan esai">' + ic('plus') + esc(txt || 'Inovasi tambahan') + '</span>'; };

  /* ---------- Penelusuran angka ke sumber (4 lompatan) ---------- */
  R.sispekMatch = function (S, src) {
    var total = 0, match = 0;
    S.order.forEach(function (c) {
      var e = S.entries[c];
      if (e.src !== src || !R.SISPEK[c]) return;
      var n = e.kind === 'batch' ? e.hours : 1;
      total += n;
      if (R.SISPEK[c].v === e.orig) match += n;
    });
    return { total: total, match: match };
  };
  R.traceChain = function (S, src, o) {
    o = o || {};
    var m = S.metrics[src];
    var reported = S.report.snapshot ? S.report.snapshot[src] : m.v;
    var hop1 = '<div class="hop"><div class="hop-n">01 · Laporan PSPK 2</div><div class="hop-v">' + R.num(reported) + ' <small>tCO₂' + (src === 'GRK' ? 'e' : '') + '</small></div><div class="hop-s">Metrik Scope 1 · ' + esc(R.SOURCES[src].label) + (S.report.snapshot ? ' · versi ' + S.report.version : ' · draf') + '</div></div>';
    var hop2, hop3, hop4;
    if (src === 'GRK') {
      hop2 = '<div class="hop"><div class="hop-n">02 · Assurance ledger</div><div class="hop-v mono">LDG-28-GRK</div><div class="hop-s">' + m.approved + ' entri disetujui' + (m.pending ? ' · ' + m.pending + ' menunggu' : '') + '</div></div>';
      hop3 = '<div class="hop"><div class="hop-n">03 · Data aktivitas</div><div class="hop-v">Faktur BBM</div><div class="hop-s">Liter per sumber × faktor emisi tercatat di setiap entri</div></div>';
      hop4 = '<div class="hop"><div class="hop-n">04 · Faktor emisi</div><div class="hop-v">Acuan inventarisasi</div><div class="hop-s">Solar 2,68 · bensin 2,31 · LPG 1,51 kgCO₂e/liter (ilustratif)</div></div>';
    } else {
      var sm = R.sispekMatch(S, src);
      var c = R.CALIB[src];
      hop2 = '<div class="hop"><div class="hop-n">02 · Assurance ledger</div><div class="hop-v mono">LDG-28-' + src + '</div><div class="hop-s">' + R.int(m.entries) + ' entri jam-an · ' + m.corrected + ' dikoreksi · ' + m.subst + ' jam substitusi</div></div>';
      hop3 = '<div class="hop ' + (sm.match < sm.total ? 'hop-bad' : '') + '"><div class="hop-n">03 · SISPEK (KLH)</div><div class="hop-v">' + R.int(sm.match) + ' <small>/ ' + R.int(sm.total) + '</small></div><div class="hop-s">' + (sm.match < sm.total ? (sm.total - sm.match) + ' kiriman tidak cocok dengan nilai awal di ledger' : 'Kiriman jam-an cocok dengan nilai awal di ledger') + '</div></div>';
      hop4 = '<div class="hop"><div class="hop-n">04 · CEMS ' + esc(R.SOURCES[src].label) + '</div><div class="hop-v">' + esc(c.devices) + '</div><div class="hop-s">' + esc(c.test) + ' terakhir ' + R.date(c.last) + '</div></div>';
    }
    var arrow = '<div class="hop-arrow" aria-hidden="true">' + ic('arrow') + '</div>';
    return '<div class="trace' + (o.compact ? ' trace-compact' : '') + '">' + hop1 + arrow + hop2 + arrow + hop3 + arrow + hop4 + '</div>';
  };

  /* Riwayat revisi sebuah entri (nilai lama dicoret, tidak dihapus) */
  R.revisionList = function (en, o) {
    o = o || {};
    var unit = en.unit;
    return '<ol class="revs">' + en.revisions.map(function (r) {
      var cls = 'rev rev-' + r.status;
      var head = r.rev === 1 ? 'Revisi 1 · nilai awal' : 'Revisi ' + r.rev;
      var tag = { berlaku: R.badge('Berlaku', 'ok', 'check'), digantikan: R.badge('Terkunci', 'neutral', 'lock'), diajukan: R.badge('Menunggu keputusan', 'warn', 'clock'), ditolak: R.badge('Ditolak', 'bad', 'x') }[r.status];
      var body = '<div class="rev-v">' + (r.status === 'digantikan' || r.status === 'ditolak' ? '<s>' + R.num(r.v) + '</s>' : R.num(r.v)) + ' <small>' + esc(unit) + '</small></div>';
      var meta = r.rev === 1 ? esc(r.source) + ', ' + R.dt(r.at) : 'Diajukan ' + esc(R.who(r.by)) + ', ' + R.dt(r.at);
      var extra = '';
      if (r.reason) extra += '<p class="rev-reason"><b>Alasan:</b> ' + esc(r.reason) + '</p>';
      if (r.evidence) extra += '<button class="linkish" data-action="show-evidence" data-code="' + esc(en.code) + '" data-rev="' + r.rev + '">' + ic('file') + esc(r.evidence) + ' · ' + esc(r.file) + '</button>';
      if (r.decidedBy) extra += '<p class="rev-meta">' + (r.status === 'ditolak' ? 'Ditolak' : 'Disetujui') + ' ' + esc(R.whoFull(r.decidedBy)) + ', ' + R.dt(r.decidedAt) + '</p>';
      if (r.status === 'diajukan' && o.decide) extra += o.decide(r);
      return '<li class="' + cls + '"><div class="rev-head"><span>' + head + '</span>' + tag + '</div>' + body + '<p class="rev-meta">' + meta + '</p>' + extra + '</li>';
    }).join('') + '</ol>';
  };

  /* Pemeriksaan otomatis untuk satu sampel uji (dipakai penyedia assurance) */
  R.sampleChecks = function (S, en) {
    var out = [];
    if (en.kind === 'inventory') {
      out.push({ state: en.decidedBy && en.decidedBy !== en.recordedBy ? 'ok' : 'fail', label: 'Dicatat dan disetujui oleh pihak berbeda', detail: R.who(en.recordedBy) + ' → ' + (en.decidedBy ? R.who(en.decidedBy) : 'belum disetujui') });
      var recompute = Math.round(en.activity * en.factor / 100);
      out.push({ state: Math.abs(recompute - en.orig) <= 1 ? 'ok' : 'fail', label: 'Data aktivitas × faktor emisi = nilai tercatat', detail: R.int(en.activity) + ' liter × ' + String(en.factor).replace('.', ',') + ' kgCO₂e/liter = ' + R.num(recompute) + ' tCO₂e' });
      out.push({ state: en.doc ? 'ok' : 'fail', label: 'Dokumen sumber tersedia', detail: en.doc || '—' });
      out.push({ state: 'warn', label: 'Faktor emisi sesuai acuan nasional terbaru', detail: 'Faktor solar 2,68 kgCO₂e/liter belum diperbarui ke acuan terbaru; selisih ditaksir ±0,4% dari emisi sumber lain (tidak material).' });
    } else {
      var sp = R.SISPEK[en.code];
      out.push({ state: sp && sp.v === en.orig ? 'ok' : 'fail', label: 'Nilai awal di ledger sama dengan kiriman SISPEK', detail: 'Ledger ' + R.num(en.orig) + ' · SISPEK ' + (sp ? R.num(sp.v) : '—') + ' ' + en.unit });
      var corr = en.revisions.filter(function (r) { return r.rev > 1 && r.status !== 'ditolak'; });
      if (corr.length) {
        var r = corr[corr.length - 1];
        out.push({ state: r.evidence ? 'ok' : 'fail', label: 'Koreksi disertai alasan dan dokumen pendukung', detail: r.evidence + ' · ' + r.file });
        out.push({ state: r.decidedBy && r.decidedBy !== r.by ? 'ok' : 'fail', label: 'Pengaju dan penyetuju koreksi berbeda', detail: R.who(r.by) + ' → ' + (r.decidedBy ? R.who(r.decidedBy) : 'belum diputuskan') });
        out.push({ state: 'ok', label: 'Nilai awal tetap tersimpan', detail: 'Revisi 1 (' + R.num(en.orig) + ') terkunci dan dapat dibaca' });
        if (en.src === 'K1') out.push({ state: 'ok', label: 'Didukung kalibrasi alat di sumber', detail: R.CALIB.K1.test + ' ' + R.date(R.CALIB.K1.last) });
      }
      if (en.subst) out.push({ state: en.note ? 'ok' : 'fail', label: 'Metode substitusi terdokumentasi', detail: en.note || 'Tidak ada dokumentasi metode' });
    }
    return out;
  };

  /* Prosedur analitis: pola yang terdeteksi otomatis dari ledger */
  R.analytics = function (S) {
    var m = S.metrics, out = [];
    if (m.K2.undoc > 0) out.push({ key: 'A1', tone: 'warn', title: m.K2.undoc + ' dari ' + m.K2.subst + ' jam substitusi Kiln 2 belum disertai dokumentasi metode', detail: 'Ditemukan pada rekap Agustus dan November 2028.', materiality: 'tidak_material' });
    out.push({ key: 'A2', tone: 'warn', title: 'Faktor emisi solar alat berat belum diperbarui ke acuan nasional terbaru', detail: 'Selisih ditaksir ±0,4% dari emisi bahan bakar sumber lain.', materiality: 'tidak_material' });
    var avg1 = m.K1.v / m.K1.hours, avg2 = m.K2.v / m.K2.hours;
    out.push({ key: 'A3', tone: 'ok', title: 'Rerata emisi per jam Kiln 1 (' + R.num(Math.round(avg1)) + ' t/jam) dan Kiln 2 (' + R.num(Math.round(avg2)) + ' t/jam) konsisten dengan kapasitas produksi', detail: 'Tidak ada lonjakan di luar pola bulanan.', info: true });
    return out;
  };
})(window.REVEAL = window.REVEAL || {});
