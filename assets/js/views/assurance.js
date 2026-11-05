/* Ruang kerja Penyedia Assurance: menelusuri angka ke sumber, mencatat temuan, menerbitkan kesimpulan ISSA 5000. */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  R.ui.asSrc = R.ui.asSrc || 'K1';
  R.ui.asSample = R.ui.asSample || 'LDG-28-K1-004128';
  R.ui.concl = R.ui.concl || { type: 'unmodified', basis: [] };

  function header(S) {
    var lvl = S.phase === 3 ? 'Wajar (reasonable)' : 'Terbatas (limited)';
    return '<div class="tiles">' +
      R.tile('Standar', 'ISSA 5000', 'Diadopsi sebagai SAKb 5000') +
      R.tile('Tingkat keyakinan', lvl, R.PHASES[S.phase].label) +
      R.tile('Cakupan', 'Emisi Scope 1', 'PSPK 2 · versi laporan ' + S.report.version) +
      R.tile('Independensi', ic('check') + ' Ditandatangani', 'Pernyataan independensi tim perikatan', 'ok') + '</div>';
  }

  function waiting(S) {
    var st = S.report.steps, next = R.actions.nextReportStep();
    return R.card('Belum ada laporan untuk diperiksa',
      '<div class="empty-state">' + ic('clock') + '<p>Penugasan dimulai setelah emiten mengirim laporan PSPK 2 melalui ledger. Status saat ini: <b>' + esc(next ? next.label : '') + '</b> menunggu tindakan ' + esc(next ? R.whoFull(next.actor) : '') + '.</p>' +
      (S.report.restatedReason ? '<p class="muted">Versi ' + S.report.version + ' sedang disiapkan sebagai penyajian kembali. Kesimpulan atas versi sebelumnya tetap tersimpan di ledger.</p>' : '') +
      '</div>');
  }

  function samples(S) {
    var eg = S.engagement;
    var list = eg.samples.map(function (code) {
      var en = S.entries[code], t = eg.tests[code];
      var st = t ? (t.result === 'sesuai' ? R.badge('Sesuai', 'ok', 'check') : R.badge('Tidak sesuai', 'bad', 'x')) : R.badge('Belum diuji', 'neutral');
      return '<button class="sample ' + (R.ui.asSample === code ? 'on' : '') + '" data-action="pick-sample" data-code="' + esc(code) + '"><span class="mono">' + esc(code) + '</span><span class="sample-sub">' + esc(en.param) + ' · ' + R.num(en.v) + ' ' + esc(en.unit) + '</span>' + st + '</button>';
    }).join('');
    var options = S.order.filter(function (c) { var e = S.entries[c]; return e.kind !== 'batch' && eg.samples.indexOf(c) < 0 && e.status !== 'menunggu' && e.status !== 'ditolak'; })
      .map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + ' · ' + esc(S.entries[c].param) + '</option>'; }).join('');

    var en = S.entries[R.ui.asSample] || S.entries[eg.samples[0]];
    var checks = R.sampleChecks(S, en);
    var t = eg.tests[en.code];
    var detail = '<div class="sample-detail"><div class="sd-head"><div><div class="eyebrow">Sampel uji</div><div class="mono big">' + esc(en.code) + '</div></div>' + R.statusBadge(en) + '</div>' +
      (en.revisions.length > 1 ? R.revisionList(en) : '') +
      '<ul class="checks">' + checks.map(function (c) { return R.checkRow(c.state, c.label, c.detail); }).join('') + '</ul>' +
      (t ? '<p class="fine">Disimpulkan <b>' + (t.result === 'sesuai' ? 'sesuai' : 'tidak sesuai') + '</b> oleh ' + esc(R.who(t.by)) + ' · ' + R.dt(t.at) + '</p>'
        : '<div class="btn-row"><button class="btn btn-ok" data-action="test-sample" data-r="sesuai" data-code="' + esc(en.code) + '" data-tour="test-sample">' + ic('check') + 'Tandai sesuai</button><button class="btn btn-ghost" data-action="test-sample" data-r="tidak_sesuai" data-code="' + esc(en.code) + '">Tidak sesuai</button></div>') +
      '</div>';
    var untested = eg.samples.filter(function (c) { return !eg.tests[c]; }).length;
    return R.card('Sampel uji · penelusuran entri',
      '<div class="samples-grid"><div class="samples">' + list +
      (options && !S.conclusion ? '<form class="add-sample" data-form="add-sample"><select name="code" aria-label="Tambah sampel">' + options + '</select><button class="btn btn-ghost btn-sm" type="submit">' + ic('plus') + 'Tambah</button></form>' : '') +
      '</div>' + detail + '</div>',
      { sub: 'Bandingkan nilai ledger dengan kiriman SISPEK, bukti koreksi, dan penyetujunya.', id: 'samples-card', right: untested && !S.conclusion ? R.badge(untested + ' belum diuji', 'warn') : R.badge('Semua sampel diuji', 'ok', 'check') });
  }

  function analytics(S) {
    var fs = S.findingOrder.map(function (id) { return S.findings[id]; }).filter(function (f) { return f.version === S.report.version; });
    var items = R.analytics(S).map(function (a) {
      var rec = fs.filter(function (f) { return f.key === a.key; })[0];
      var act = a.info ? R.badge('Tidak ada pengecualian', 'ok', 'check')
        : rec ? R.badge('Tercatat sebagai ' + rec.id, 'info', 'check')
          : S.conclusion ? '' : '<button class="btn btn-outline btn-sm" data-action="record-finding" data-key="' + a.key + '" data-tour="record-finding">' + ic('plus') + 'Catat sebagai temuan</button>';
      return '<li class="an an-' + a.tone + '">' + ic(a.tone === 'ok' ? 'check' : 'alert') + '<div><b>' + esc(a.title) + '</b><p>' + esc(a.detail) + '</p></div><div class="an-act">' + act + '</div></li>';
    }).join('');
    return R.card('Prosedur analitis', '<ul class="analytics">' + items + '</ul>', { sub: 'Pola yang terdeteksi otomatis dari riwayat ledger', id: 'analytics-card', right: S.conclusion ? '' : '<button class="btn btn-ghost btn-sm" data-action="manual-finding">' + ic('plus') + 'Temuan manual</button>' });
  }

  function findings(S) {
    var fs = S.findingOrder.map(function (id) { return S.findings[id]; }).filter(function (f) { return f.version === S.report.version; });
    if (!fs.length) return R.card('Temuan pemeriksaan', '<p class="muted">Belum ada temuan untuk versi laporan ini.</p>');
    return R.card('Temuan pemeriksaan', '<div class="table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Temuan</th><th>Materialitas</th><th>Tindak lanjut manajemen</th></tr></thead><tbody>' +
      fs.map(function (f) {
        return '<tr><td class="mono">' + f.id + '</td><td>' + esc(f.title) + '</td><td>' + (f.materiality === 'material' ? R.badge('Material', 'bad') : R.badge('Tidak material', 'neutral')) + '</td><td>' +
          (f.response ? R.badge('Ditanggapi', 'ok', 'check') + '<div class="cell-sub">' + esc(f.response.text) + '</div>' : R.badge('Menunggu tanggapan', 'warn', 'clock') + '<div class="cell-sub">Ditanggapi oleh Divisi Keberlanjutan</div>') + '</td></tr>';
      }).join('') + '</tbody></table></div>', { id: 'findings-card' });
  }

  function conclusion(S) {
    var c = S.conclusion;
    if (c) {
      var t = R.CONCLUSIONS[c.type];
      return R.card('Kesimpulan diterbitkan', '<div class="concl concl-' + t.tone + '"><div class="concl-type">' + R.badge(t.label, t.tone, 'shield') + ' ' + R.badge(c.level === 'limited' ? 'Limited assurance' : 'Reasonable assurance', 'neutral') + '</div><p>' + esc(c.text) + '</p>' +
        '<dl class="kv"><dt>Kode ledger</dt><dd class="mono">' + c.code + '</dd><dt>Tertaut ke</dt><dd class="mono">LDG-28-RPT-v' + c.version + ' · ' + R.short(c.snapshotHash, 16) + '</dd><dt>Diterbitkan</dt><dd>' + esc(R.whoFull(c.by)) + ', ' + R.dt(c.at) + '</dd></dl>' +
        (S.stale ? '<div class="banner banner-warn">' + ic('alert') + '<div>Angka di ledger telah berubah setelah kesimpulan ini. Kesimpulan tetap tercatat untuk versi ' + c.version + ', tetapi tidak berlaku untuk angka terkini.</div></div>' : '') +
        '<p class="fine">Kesimpulan bersifat final untuk versi laporan ini dan tidak dapat diubah. Revisi laporan akan membuka penugasan baru.</p></div>', { id: 'conclusion-card' });
    }
    var sel = R.ui.concl;
    var level = S.phase === 3 ? 'reasonable' : (R.ui.conclLevel || 'limited');
    var fs = S.findingOrder.map(function (id) { return S.findings[id]; }).filter(function (f) { return f.version === S.report.version; });
    var radios = Object.keys(R.CONCLUSIONS).map(function (k) {
      return '<label class="radio ' + (sel.type === k ? 'on' : '') + '"><input type="radio" name="ctype" value="' + k + '" ' + (sel.type === k ? 'checked' : '') + ' data-action="concl-type"> ' + R.CONCLUSIONS[k].label + ' <small>(' + R.CONCLUSIONS[k].en + ')</small></label>';
    }).join('');
    var basis = (sel.type === 'qualified' || sel.type === 'adverse' || sel.type === 'disclaimer') ?
      '<div class="field"><span>Dasar modifikasi</span>' + (fs.length ? fs.map(function (f) { return '<label class="check-inline"><input type="checkbox" data-action="concl-basis" value="' + f.id + '" ' + (sel.basis.indexOf(f.id) >= 0 ? 'checked' : '') + '> ' + f.id + ' · ' + esc(f.title) + '</label>'; }).join('') : '<p class="muted">Catat temuan terlebih dahulu.</p>') + '</div>' : '';
    var levelSel = '<div class="seg-row"><span>Tingkat keyakinan</span>' + ['limited', 'reasonable'].map(function (l) {
      var dis = S.phase === 3 && l === 'limited';
      return '<button class="seg seg-sm ' + (level === l ? 'on' : '') + '" data-action="concl-level" data-l="' + l + '" ' + (dis ? 'disabled title="Fase 3 mensyaratkan reasonable assurance"' : '') + '>' + (l === 'limited' ? 'Limited' : 'Reasonable') + '</button>';
    }).join('') + '</div>';
    var gate = R.actions.conclusionGate(sel.type);
    var ok = gate.every(function (g) { return g.ok; });
    var preview = R.conclusionText(sel.type, level, sel.basis, S);
    return R.card('Draf kesimpulan', '<p class="eyebrow">Pilih jenis kesimpulan sesuai ISSA 5000</p><div class="radios">' + radios + '</div>' + basis + levelSel +
      '<div class="preview">' + esc(preview) + '</div>' +
      '<ul class="checks">' + gate.map(function (g) { return R.checkRow(g.ok ? 'ok' : 'fail', g.label); }).join('') + '</ul>' +
      '<button class="btn btn-primary btn-block" data-action="issue-conclusion" ' + (ok ? '' : 'aria-disabled="true"') + ' data-tour="issue-conclusion">' + ic('shield') + 'Terbitkan kesimpulan ke ledger</button>',
      { id: 'conclusion-card' });
  }

  R.VIEWS['assurance'] = {
    page: 'assurance',
    render: function () {
      var S = R.store.S;
      var head = R.pageHead({
        eyebrow: R.PROVIDER.name + ' · klien ' + R.ENTITY.name + ', periode 2028',
        title: 'Penelusuran dan kesimpulan assurance',
        right: R.badge('Praktisi bersertifikat · ' + R.PROVIDER.partner, 'ok', 'shield')
      });
      if (!S.engagement) {
        var hist = S.conclusions.length ? R.card('Kesimpulan versi sebelumnya', S.conclusions.map(function (c) { return '<p><span class="mono">' + c.code + '</span> · versi ' + c.version + ' · ' + R.CONCLUSIONS[c.type].label + '</p>'; }).join('')) : '';
        return head + header(S) + waiting(S) + hist;
      }
      var srcTabs = '<div class="chips">' + ['K1', 'K2', 'GRK'].map(function (k) { return '<button class="chip ' + (R.ui.asSrc === k ? 'on' : '') + '" data-action="as-src" data-k="' + k + '">' + R.SOURCES[k].label + '</button>'; }).join('') + '</div>';
      return head + header(S) +
        R.card('Telusuri angka ke sumbernya', srcTabs + R.traceChain(S, R.ui.asSrc), { sub: 'Dari laporan PSPK 2 sampai alat ukur di cerobong', id: 'trace-card' }) +
        '<div class="split"><div class="stack">' + samples(S) + analytics(S) + findings(S) + '</div><div class="stack">' + conclusion(S) + '</div></div>';
    }
  };

  var A = R.handlers;
  A['as-src'] = function (d) { R.ui.asSrc = d.k; R.render(); };
  A['pick-sample'] = function (d) { R.ui.asSample = d.code; R.render(); };
  A['test-sample'] = function (d) {
    R.run(function () {
      R.need('assurance.work');
      R.actions.testSample(d.code, d.r);
      var eg = R.store.S.engagement, nxt = eg.samples.filter(function (c) { return !eg.tests[c]; })[0];
      if (nxt) R.ui.asSample = nxt;
    }, 'Hasil penelusuran sampel tercatat di ledger.');
  };
  A['record-finding'] = function (d) {
    var a = R.analytics(R.store.S).filter(function (x) { return x.key === d.key; })[0];
    R.run(function () { R.need('assurance.work'); R.actions.recordFinding({ title: a.title, detail: a.detail, materiality: a.materiality, key: a.key }); }, 'Temuan dicatat dan dikirim ke manajemen untuk ditanggapi.');
  };
  A['manual-finding'] = function () {
    R.modal.open({
      eyebrow: 'Temuan pemeriksaan', title: 'Catat temuan manual',
      body: '<form id="f-find" data-form="finding" class="form"><label class="field"><span>Uraian temuan</span><textarea name="title" rows="3" required minlength="10"></textarea></label>' +
        '<label class="field"><span>Materialitas</span><select name="materiality"><option value="tidak_material">Tidak material</option><option value="material">Material</option></select></label></form>',
      footer: '<button class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-primary" type="submit" form="f-find">Catat temuan</button>'
    });
  };
  R.forms.finding = function (form, data) { R.run(function () { R.need('assurance.work'); R.actions.recordFinding(data); R.modal.close(); }, 'Temuan dicatat.'); };
  R.forms['add-sample'] = function (form, data) { R.run(function () { R.need('assurance.work'); R.actions.addSample(data.code); R.ui.asSample = data.code; }, 'Sampel ditambahkan.'); };
  A['concl-type'] = function (d, el) { R.ui.concl.type = el.value; R.ui.concl.basis = []; R.render(); };
  A['concl-level'] = function (d) { R.ui.conclLevel = d.l; R.render(); };
  A['concl-basis'] = function (d, el) {
    var b = R.ui.concl.basis, i = b.indexOf(el.value);
    if (el.checked && i < 0) b.push(el.value); if (!el.checked && i >= 0) b.splice(i, 1);
    R.render();
  };
  A['issue-conclusion'] = function () {
    var S = R.store.S, level = S.phase === 3 ? 'reasonable' : (R.ui.conclLevel || 'limited');
    R.run(function () { R.need('assurance.work'); R.actions.issueConclusion(R.ui.concl.type, level, R.ui.concl.basis); }, 'Kesimpulan diterbitkan dan ditautkan ke versi laporan di ledger.');
  };
})(window.REVEAL = window.REVEAL || {});
