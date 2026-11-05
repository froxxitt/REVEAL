/* Halaman Ledger emisi (emiten): koreksi berjustifikasi, prinsip empat mata, inventarisasi GRK.
   Tindakan yang tampil menyesuaikan hak akses akun yang masuk. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  R.VIEWS = R.VIEWS || {};
  R.ui.opFilter = R.ui.opFilter || 'semua';
  R.ui.selected = R.ui.selected || 'LDG-28-K1-004128';

  var FILTERS = [
    ['semua', 'Semua'], ['tindakan', 'Perlu tindakan'], ['K1', 'CEMS Kiln 1'], ['K2', 'CEMS Kiln 2'], ['GRK', 'Inventarisasi GRK'], ['rekap', 'Rekap bulanan']
  ];

  function rank(en) {
    if (en.status === 'koreksi_diajukan' || en.status === 'menunggu') return 0;
    if (en.kind === 'hourly') return 1;
    if (en.kind === 'inventory') return 2;
    return 3;
  }

  function rows(S) {
    var f = R.ui.opFilter;
    var list = S.order.map(function (c) { return S.entries[c]; }).filter(function (en) {
      if (f === 'tindakan') return en.status === 'koreksi_diajukan' || en.status === 'menunggu';
      if (f === 'rekap') return en.kind === 'batch';
      if (f === 'K1' || f === 'K2') return en.src === f && en.kind !== 'batch';
      if (f === 'GRK') return en.src === 'GRK';
      return en.kind !== 'batch';
    });
    list.sort(function (a, b) { return rank(a) - rank(b) || (a.time < b.time ? 1 : a.time > b.time ? -1 : 0); });
    if (!list.length) return '<tr><td colspan="6" class="empty">Tidak ada entri pada filter ini.</td></tr>';
    return list.map(function (en) {
      var when = en.kind === 'hourly' ? R.dt(en.time) : R.monthLabel(en.time);
      var val = en.status === 'koreksi_diajukan'
        ? R.num(en.v) + ' <span class="muted">→ ' + R.num(en.revisions[en.revisions.length - 1].v) + '</span>'
        : R.num(en.v);
      var src = en.src === 'GRK' ? 'Inventarisasi GRK' : R.SOURCES[en.src].feed;
      var search = (en.code + ' ' + src + ' ' + en.param + ' ' + when).toLowerCase();
      return '<tr class="row-click ' + (R.ui.selected === en.code ? 'is-selected' : '') + '" data-action="select-entry" data-code="' + esc(en.code) + '" data-search="' + esc(search) + '" tabindex="0">' +
        '<td class="mono">' + esc(en.code) + '</td><td>' + esc(when) + '</td><td>' + esc(src) + '</td><td>' + esc(en.param) + '</td>' +
        '<td class="num">' + val + ' <small class="muted">' + esc(en.unit) + '</small></td><td>' + R.statusBadge(en) + '</td></tr>';
    }).join('') + (f === 'semua' ? '<tr><td colspan="6" class="empty"><button class="linkish" data-action="op-filter" data-f="rekap">' + ic('layers') + 'Lihat 24 rekap jam-an bulanan dari SISPEK</button></td></tr>' : '');
  }

  function waitingFor(label) {
    return '<div class="await">' + ic('clock') + '<div><b>Menunggu ' + esc(label) + '</b><small>Hanya Pengendalian Internal yang berwenang memutuskan.</small></div>' +
      '<button class="btn btn-ghost btn-sm" data-action="switch-account" data-id="dimas">Ganti ke akun Dimas P.</button></div>';
  }

  function detail(S) {
    var en = S.entries[R.ui.selected];
    if (!en) return R.card('Jejak perubahan', '<p class="muted">Pilih entri di tabel untuk melihat jejaknya.</p>', { cls: 'sticky', id: 'entry-detail' });
    var me = R.meId();
    var body = '<div class="detail-code mono">' + esc(en.code) + '</div>' +
      '<dl class="kv"><dt>Sumber</dt><dd>' + esc(en.src === 'GRK' ? 'Inventarisasi GRK' : R.SOURCES[en.src].feed) + '</dd>' +
      '<dt>Parameter</dt><dd>' + esc(en.param) + '</dd>' +
      '<dt>Waktu data</dt><dd>' + (en.kind === 'hourly' ? R.dt(en.time) : R.monthLabel(en.time)) + '</dd>';
    if (en.kind === 'batch') {
      body += '<dt>Entri jam-an</dt><dd>' + R.int(en.hours) + '</dd><dt>Jam substitusi</dt><dd>' + en.substHours + (en.undoc ? ' <span class="warn-text">(' + en.undoc + ' tanpa dokumentasi metode)</span>' : '') + '</dd><dt>Entri terkoreksi</dt><dd>' + en.corrected + '</dd>';
    }
    if (en.kind === 'inventory') {
      body += '<dt>Data aktivitas</dt><dd>' + R.int(en.activity) + ' liter</dd><dt>Faktor emisi</dt><dd>' + String(en.factor).replace('.', ',') + ' kgCO₂e/liter</dd><dt>Dokumen</dt><dd>' + esc(en.doc) + '</dd>' +
        '<dt>Dicatat</dt><dd>' + esc(R.who(en.recordedBy)) + ', ' + R.dt(en.recordedAt) + '</dd>' +
        (en.decidedBy ? '<dt>' + (en.decision === 'approve' ? 'Disetujui' : 'Ditolak') + '</dt><dd>' + esc(R.who(en.decidedBy)) + ', ' + R.dt(en.decidedAt) + '</dd>' : '');
    }
    if (en.subst && en.note) body += '<dt>Metode substitusi</dt><dd>' + esc(en.note) + '</dd>';
    body += '</dl>';

    if (en.kind === 'batch') {
      body += '<p class="note">' + ic('info') + 'Rekap bulanan merangkum entri jam-an dari SISPEK. Prototipe menampilkan rinciannya hanya untuk sampel 14–15 Mar 2028.</p>';
    } else {
      body += '<h3 class="sub-h">Riwayat nilai</h3>' + R.revisionList(en, {
        decide: function (r) {
          if (R.can('ledger.decide')) {
            return '<div class="decide"><div class="btn-row"><button class="btn btn-ok" data-action="decide-correction" data-decision="approve" data-code="' + esc(en.code) + '" data-tour="approve-correction">' + ic('check') + 'Setujui koreksi</button>' +
              '<button class="btn btn-ghost" data-action="decide-correction" data-decision="reject" data-code="' + esc(en.code) + '">Tolak</button></div></div>';
          }
          return (r.by === me ? '<p class="hint">' + ic('info') + 'Anda pengaju koreksi ini. Prinsip empat mata: persetujuan harus oleh pihak lain.</p>' : '') + waitingFor('persetujuan koreksi');
        }
      });
      if (en.status === 'menunggu') {
        body += R.can('ledger.decide')
          ? '<div class="decide"><div class="btn-row"><button class="btn btn-ok" data-action="decide-entry" data-decision="approve" data-code="' + esc(en.code) + '" data-tour="approve-entry">' + ic('check') + 'Setujui entri</button>' +
            '<button class="btn btn-ghost" data-action="decide-entry" data-decision="reject" data-code="' + esc(en.code) + '">Tolak</button></div></div>'
          : (en.recordedBy === me ? '<p class="hint">' + ic('info') + 'Anda pencatat entri ini. Persetujuan harus oleh pihak lain.</p>' : '') + waitingFor('persetujuan entri');
      }
      var canCorrect = R.can('ledger.propose') && (en.kind === 'hourly' || en.status === 'diterima' || en.status === 'dikoreksi') && ['koreksi_diajukan', 'menunggu', 'ditolak'].indexOf(en.status) < 0;
      if (canCorrect) body += '<button class="btn btn-outline btn-block" data-action="open-correction" data-code="' + esc(en.code) + '">' + ic('edit') + 'Ajukan koreksi atas entri ini</button>';
    }
    body += '<p class="fine">Entri tidak dapat dihapus. Revisi lama tetap terbaca oleh penyedia assurance dan OJK. Pengaju koreksi tidak dapat menyetujui koreksinya sendiri.</p>';
    return R.card('Jejak perubahan', body, { cls: 'sticky', id: 'entry-detail' });
  }

  R.VIEWS['ledger'] = {
    page: 'ledger',
    render: function () {
      var S = R.store.S, m = S.metrics;
      var roleNote = R.can('ledger.decide') ? R.badge('Akses: penyetuju (checker)', 'info', 'shield')
        : R.can('ledger.propose') ? R.badge('Akses: pencatat & pengaju koreksi (maker)', 'info', 'edit')
          : R.badge('Akses: lihat saja', 'neutral', 'eye');

      var tiles = '<div class="tiles">' +
        R.tile('Kelengkapan data jam-an', R.pct(m.completeness), R.int(m.hoursTotal - m.hoursSubst) + ' dari ' + R.int(m.hoursTotal) + ' jam · 2 kiln') +
        R.tile('Entri dikoreksi', R.int(m.correctedTotal), 'Semua berjustifikasi, disetujui pihak lain') +
        R.tile('Jam dengan data substitusi', R.int(m.hoursSubst), 'Metode wajib didokumentasikan') +
        R.tile('Menunggu persetujuan', R.int(m.pending), m.pending ? 'Angka belum final untuk laporan' : 'Semua entri sudah final', m.pending ? 'warn' : 'ok') +
        '</div>';

      var chips = '<div class="chips" role="group" aria-label="Filter entri">' + FILTERS.map(function (f) {
        var n = f[0] === 'tindakan' ? m.pending : null;
        return '<button class="chip ' + (R.ui.opFilter === f[0] ? 'on' : '') + '" data-action="op-filter" data-f="' + f[0] + '" aria-pressed="' + (R.ui.opFilter === f[0]) + '">' + f[1] + (n ? ' <span class="chip-n">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>';

      var table = R.card('Entri ledger',
        '<div class="toolbar">' + chips + '<label class="search">' + ic('search') + '<input type="search" id="op-search" placeholder="Cari kode atau sumber" aria-label="Cari entri"></label></div>' +
        '<div class="table-wrap"><table class="table" id="op-table"><thead><tr><th>Kode entri</th><th>Waktu</th><th>Sumber</th><th>Parameter</th><th class="num">Nilai</th><th>Status</th></tr></thead><tbody>' + rows(S) + '</tbody></table></div>',
        { right: R.can('ledger.record') ? '<button class="btn btn-outline" data-action="open-inventory">' + ic('plus') + 'Tambah data inventarisasi GRK</button>' : '', id: 'ledger-table' });

      return R.pageHead({
        eyebrow: R.ENTITY.name + ' · periode 2028',
        title: 'Ledger emisi',
        lead: 'Data CEMS masuk otomatis dari SISPEK. Setiap perubahan dicatat sebagai revisi baru beserta alasan, bukti, dan penyetujunya.',
        right: roleNote
      }) + tiles + '<div class="split">' + table + detail(S) + '</div>';
    },
    after: function () {
      var input = document.getElementById('op-search');
      if (!input) return;
      input.value = R.ui.opSearch || '';
      var apply = function () {
        var q = input.value.trim().toLowerCase(); R.ui.opSearch = input.value;
        document.querySelectorAll('#op-table tbody tr[data-search]').forEach(function (tr) { tr.hidden = q && tr.dataset.search.indexOf(q) < 0; });
      };
      input.addEventListener('input', apply); apply();
    }
  };

  /* ---------- Aksi ---------- */
  var A = R.handlers = R.handlers || {};
  A['op-filter'] = function (d) { R.ui.opFilter = d.f; R.render(); };
  A['select-entry'] = function (d) {
    R.ui.selected = d.code; R.render();
    if (window.innerWidth < 1100) { var el = document.getElementById('entry-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  A['decide-correction'] = function (d) {
    R.run(function () { R.need('ledger.decide'); R.actions.decideCorrection(R.meId(), d.code, d.decision); },
      d.decision === 'approve' ? 'Koreksi disetujui dan dicatat sebagai revisi baru. Nilai awal tetap tersimpan.' : 'Koreksi ditolak; catatan penolakan tersimpan di ledger.');
  };
  A['decide-entry'] = function (d) {
    R.run(function () { R.need('ledger.decide'); R.actions.decideEntry(R.meId(), d.code, d.decision); },
      d.decision === 'approve' ? 'Entri inventarisasi disetujui dan dihitung dalam metrik.' : 'Entri ditolak; catatan penolakan tersimpan.');
  };
  A['show-evidence'] = function (d) {
    var en = R.store.S.entries[d.code]; var r = en.revisions[+d.rev - 1];
    R.modal.open({
      eyebrow: 'Dokumen pendukung · ' + en.code, title: r.file,
      body: '<div class="evidence"><div class="evidence-icon">' + ic('file') + '</div><dl class="kv"><dt>Jenis</dt><dd>' + esc(r.evidence) + '</dd><dt>Diunggah</dt><dd>' + esc(R.who(r.by)) + ', ' + R.dt(r.at) + '</dd><dt>Sidik digital</dt><dd class="mono">' + R.short(R.sha256(en.code + r.file + r.at), 24) + '…</dd></dl>' +
        '<p class="muted">Dalam prototipe, isi dokumen tidak disertakan. Pada sistem produksi, dokumen disimpan di penyimpanan bukti dan sidik digitalnya dicatat di ledger sehingga perubahan dokumen dapat dideteksi.</p></div>',
      footer: '<button class="btn" data-action="modal-close">Tutup</button>'
    });
  };
  A['open-correction'] = function (d) {
    if (!R.run(function () { R.need('ledger.propose'); })) return;
    var en = R.store.S.entries[d.code];
    R.modal.open({
      eyebrow: 'Ajukan koreksi · ' + en.code, title: 'Koreksi berjustifikasi',
      body: '<form id="f-corr" data-form="correction" data-code="' + esc(en.code) + '" class="form" novalidate>' +
        '<p class="muted">Pengaju: <b>' + esc(R.whoFull(R.meId())) + '</b>. Koreksi baru berlaku setelah disetujui Pengendalian Internal.</p>' +
        '<div class="grid2"><label class="field"><span>Nilai berlaku</span><input value="' + R.num(en.v) + ' ' + esc(en.unit) + '" disabled></label>' +
        '<label class="field"><span>Nilai baru (' + esc(en.unit) + ')</span><input name="v" type="number" step="0.1" min="0" required inputmode="decimal" value="' + (en.v / 10) + '"></label></div>' +
        '<label class="field"><span>Alasan koreksi</span><textarea name="reason" rows="3" required minlength="20" placeholder="Contoh: faktor kalibrasi analyzer dikoreksi setelah uji akurasi relatif…"></textarea><small class="help">Minimal 20 karakter. Alasan ini dibaca penyedia assurance.</small></label>' +
        '<div class="grid2"><label class="field"><span>Dokumen pendukung</span><select name="evidence" required><option value="">Pilih jenis dokumen</option><option>Berita acara kalibrasi</option><option>Laporan uji akurasi relatif (RATA)</option><option>Catatan gangguan alat</option><option>Rekap faktur bahan bakar</option><option>Dokumen lainnya</option></select></label>' +
        '<label class="field"><span>Nama berkas</span><input name="file" placeholder="mis. BA-KAL-K2-2028-08.pdf"></label></div>' +
        '</form>',
      footer: '<button class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-primary" type="submit" form="f-corr">' + ic('send') + 'Ajukan koreksi</button>'
    });
  };
  A['open-inventory'] = function () {
    if (!R.run(function () { R.need('ledger.record'); })) return;
    var months = R.MON.map(function (m, i) { return '<option value="2028-' + R.pad(i + 1, 2) + '">' + R.MONL[i] + ' 2028</option>'; }).join('');
    var srcs = Object.keys(R.FUEL).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
    R.modal.open({
      eyebrow: 'Inventarisasi GRK · sumber yang tidak dipantau CEMS', title: 'Tambah data inventarisasi',
      body: '<form id="f-inv" data-form="inventory" class="form" novalidate>' +
        '<p class="muted">Pencatat: <b>' + esc(R.whoFull(R.meId())) + '</b>. Entri dihitung dalam metrik setelah disetujui Pengendalian Internal.</p>' +
        '<div class="grid2"><label class="field"><span>Periode</span><select name="month">' + months + '</select></label>' +
        '<label class="field"><span>Sumber emisi</span><select name="label" id="inv-label">' + srcs + '</select></label></div>' +
        '<div class="grid2"><label class="field"><span>Data aktivitas (liter)</span><input name="activity" id="inv-act" type="number" min="0" step="1" required placeholder="mis. 125000"></label>' +
        '<label class="field"><span>Faktor emisi (kgCO₂e/liter)</span><input name="factor" id="inv-f" type="number" min="0" step="0.01" required value="2.68"></label></div>' +
        '<div class="calc" id="inv-calc">Emisi terhitung: <b>—</b></div>' +
        '<label class="field"><span>Dokumen sumber</span><input name="doc" required placeholder="mis. Rekap faktur BBM Mar 2028"></label>' +
        '</form>',
      footer: '<button class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-primary" type="submit" form="f-inv">' + ic('plus') + 'Catat ke ledger</button>',
      onOpen: function (root) {
        var lab = root.querySelector('#inv-label'), act = root.querySelector('#inv-act'), f = root.querySelector('#inv-f'), out = root.querySelector('#inv-calc b');
        function calc() { var a = +act.value, k = +f.value; out.textContent = a > 0 && k > 0 ? R.num(Math.round(a * k / 100)) + ' tCO₂e' : '—'; }
        lab.addEventListener('change', function () { f.value = R.FUEL[lab.value]; calc(); });
        act.addEventListener('input', calc); f.addEventListener('input', calc);
      }
    });
  };

  var F = R.forms = R.forms || {};
  F.correction = function (form, data) {
    var code = form.dataset.code;
    R.run(function () { R.need('ledger.propose'); R.actions.proposeCorrection(R.meId(), code, data.v, data.reason, data.evidence, data.file); R.modal.close(); R.ui.selected = code; },
      'Koreksi diajukan. Menunggu persetujuan Pengendalian Internal.');
  };
  F.inventory = function (form, data) {
    R.run(function () { R.need('ledger.record'); var e = R.actions.recordInventory(R.meId(), data); R.modal.close(); R.ui.selected = e.p.code; R.ui.opFilter = 'semua'; },
      'Data inventarisasi dicatat dan menunggu persetujuan.');
  };
})(window.REVEAL = window.REVEAL || {});
