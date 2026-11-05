/* Assurance ledger: log peristiwa append-only dengan rantai hash.
   Seluruh tampilan diturunkan (derive) dari log ini, sehingga setiap angka punya jejak. */
(function (R) {
  'use strict';
  var KEY = 'reveal-prototype-v1';
  var GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';

  function RuleError(msg) { this.message = msg; this.name = 'RuleError'; }
  RuleError.prototype = Object.create(Error.prototype);
  R.RuleError = RuleError;
  function fail(msg) { throw new RuleError(msg); }

  function canon(o) {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
    return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(o[k]); }).join(',') + '}';
  }
  R.canon = canon;
  function hashOf(prev, e) {
    return R.sha256(prev + '|' + canon({ seq: e.seq, t: e.t, type: e.type, actor: e.actor, role: e.role, p: e.p }));
  }

  /* ---------------- Penurunan status dari log ---------------- */
  function derive(events) {
    var S = {
      phase: 2, entries: {}, order: [],
      report: { version: 1, steps: {}, snapshot: null, sentSeq: null, history: [] },
      engagement: null, findings: {}, findingOrder: [], conclusions: [],
      consent: { status: 'none' }, checks: [], lastSeq: 0
    };
    events.forEach(function (e) { apply(S, e); S.lastSeq = e.seq; });
    S.metrics = metrics(S);
    S.stale = isStale(S);
    S.conclusion = currentConclusion(S);
    return S;
  }

  function entryStatus(en) {
    if (en.kind === 'inventory') {
      if (en.decision === 'reject') return 'ditolak';
      if (!en.decision) return 'menunggu';
    }
    if (en.revisions.some(function (r) { return r.status === 'diajukan'; })) return 'koreksi_diajukan';
    var cur = en.revisions.filter(function (r) { return r.status === 'berlaku'; })[0];
    if (cur && cur.rev > 1) return 'dikoreksi';
    if (en.subst) return 'substitusi';
    if (en.kind === 'batch') return 'rekap';
    return 'diterima';
  }

  function apply(S, e) {
    var p = e.p, en;
    switch (e.type) {
      case 'PHASE_SET': S.phase = p.phase; break;
      case 'ENTRY_RECORDED':
        en = {
          code: p.code, src: p.src, kind: p.kind, time: p.time, param: p.param, unit: p.unit,
          orig: p.v, v: p.v, subst: !!p.subst, note: p.note || '', hours: p.hours, substHours: p.subst, corrected: p.corrected,
          undoc: p.undoc || 0, activity: p.activity, factor: p.factor, doc: p.doc,
          recordedBy: e.actor, recordedAt: e.t, recordSeq: e.seq, decision: null,
          revisions: [{ rev: 1, v: p.v, by: e.actor, at: e.t, status: 'berlaku', seq: e.seq,
            source: e.actor === 'sispek' ? 'Diterima otomatis dari SISPEK' : 'Dicatat dari ' + (p.doc || 'dokumen sumber') }]
        };
        if (typeof en.substHours !== 'number') en.substHours = 0;
        S.entries[p.code] = en; S.order.push(p.code);
        break;
      case 'ENTRY_DECIDED':
        en = S.entries[p.code]; if (!en) break;
        en.decision = p.decision; en.decidedBy = e.actor; en.decidedAt = e.t; en.decisionNote = p.note || '';
        break;
      case 'CORRECTION_PROPOSED':
        en = S.entries[p.code]; if (!en) break;
        en.revisions.push({ rev: en.revisions.length + 1, v: p.v, by: e.actor, at: e.t, status: 'diajukan', reason: p.reason, evidence: p.evidence, file: p.file, seq: e.seq });
        break;
      case 'CORRECTION_DECIDED':
        en = S.entries[p.code]; if (!en) break;
        var pend = en.revisions.filter(function (r) { return r.status === 'diajukan'; })[0];
        if (!pend) break;
        if (p.decision === 'approve') {
          en.revisions.forEach(function (r) { if (r.status === 'berlaku') r.status = 'digantikan'; });
          pend.status = 'berlaku'; en.v = pend.v;
        } else pend.status = 'ditolak';
        pend.decidedBy = e.actor; pend.decidedAt = e.t; pend.decisionNote = p.note || '';
        break;
      case 'REPORT_STEP':
        S.report.steps[p.step] = { by: e.actor, at: e.t, note: p.note || '', seq: e.seq };
        if (p.step === 'dikirim') {
          S.report.snapshot = p.snapshot; S.report.sentSeq = e.seq; S.report.sentHash = e.prev;
          S.engagement = { version: S.report.version, openedAt: e.t, samples: ['LDG-28-K1-004128', 'LDG-28-K1-004133', 'LDG-28-GRK-000214'], tests: {} };
        }
        break;
      case 'REPORT_RESTATED':
        S.report.history.push({ version: S.report.version, snapshot: S.report.snapshot, steps: S.report.steps });
        S.report.version = p.version; S.report.steps = { disusun: { by: e.actor, at: e.t, note: p.reason, seq: e.seq } };
        S.report.snapshot = null; S.report.sentSeq = null; S.report.restatedReason = p.reason;
        S.engagement = null;
        break;
      case 'SAMPLE_ADDED':
        if (S.engagement && S.engagement.samples.indexOf(p.code) < 0) S.engagement.samples.push(p.code);
        break;
      case 'SAMPLE_TESTED':
        if (S.engagement) S.engagement.tests[p.code] = { result: p.result, note: p.note || '', at: e.t, by: e.actor };
        break;
      case 'FINDING_RECORDED':
        S.findings[p.id] = { id: p.id, title: p.title, detail: p.detail || '', materiality: p.materiality, key: p.key || null, version: S.report.version, at: e.t, by: e.actor, response: null };
        S.findingOrder.push(p.id);
        break;
      case 'FINDING_RESPONDED':
        if (S.findings[p.id]) S.findings[p.id].response = { text: p.text, by: e.actor, at: e.t };
        break;
      case 'CONCLUSION_ISSUED':
        S.conclusions.push({ code: p.code, type: p.type, level: p.level, basis: p.basis || [], text: p.text, version: p.version, snapshotHash: p.snapshotHash, at: e.t, by: e.actor, seq: e.seq });
        break;
      case 'CONSENT_REQUESTED':
        S.consent = { status: 'diminta', requestedAt: e.t, requestedBy: e.actor, scope: p.scope };
        break;
      case 'CONSENT_SET':
        S.consent = { status: p.granted ? 'diberikan' : (S.consent.status === 'diberikan' ? 'dicabut' : 'ditolak'), at: e.t, by: e.actor, scope: p.scope || S.consent.scope, requestedAt: S.consent.requestedAt };
        break;
      case 'FINANCING_CHECKED':
        S.checks.push({ result: p.result, criteria: p.criteria, at: e.t, by: e.actor, version: p.version, conclusion: p.conclusion, phase: p.phase, seq: e.seq });
        break;
    }
    if (en) en.status = entryStatus(en);
  }

  function metrics(S) {
    var m = {
      K1: { v: 0, hours: 0, subst: 0, corrected: 0, undoc: 0, pending: 0, entries: 0 },
      K2: { v: 0, hours: 0, subst: 0, corrected: 0, undoc: 0, pending: 0, entries: 0 },
      GRK: { v: 0, entries: 0, pending: 0, approved: 0 }
    };
    S.order.forEach(function (code) {
      var e = S.entries[code];
      var hasPend = e.revisions.some(function (r) { return r.status === 'diajukan'; });
      if (e.src === 'GRK') {
        m.GRK.entries++;
        if (e.status === 'menunggu' || hasPend) m.GRK.pending++;
        if (e.status === 'menunggu' || e.status === 'ditolak') return;
        m.GRK.approved++; m.GRK.v += e.v; return;
      }
      var k = m[e.src];
      if (hasPend) k.pending++;
      k.v += e.v;
      if (e.kind === 'batch') { k.hours += e.hours; k.subst += e.substHours; k.corrected += e.corrected; k.undoc += e.undoc; k.entries += e.hours; }
      else {
        k.hours += 1; k.entries += 1;
        if (e.subst) k.subst += 1;
        if (e.status === 'dikoreksi' || (hasPend && e.revisions.some(function (r) { return r.status === 'berlaku' && r.rev > 1; }))) k.corrected++;
      }
    });
    m.total = m.K1.v + m.K2.v + m.GRK.v;
    m.pending = m.K1.pending + m.K2.pending + m.GRK.pending;
    m.hoursTotal = m.K1.hours + m.K2.hours;
    m.hoursSubst = m.K1.subst + m.K2.subst;
    m.completeness = (m.hoursTotal - m.hoursSubst) / m.hoursTotal;
    m.correctedTotal = m.K1.corrected + m.K2.corrected;
    return m;
  }

  function isStale(S) {
    var s = S.report.snapshot; if (!s) return false;
    var m = S.metrics;
    return s.K1 !== m.K1.v || s.K2 !== m.K2.v || s.GRK !== m.GRK.v;
  }
  function currentConclusion(S) {
    var list = S.conclusions.filter(function (c) { return c.version === S.report.version; });
    return list.length ? list[list.length - 1] : null;
  }

  /* ---------------- Store ---------------- */
  var store = {
    events: [], S: null, clock: R.CLOCK_START, tamper: null, seedCount: 0, listeners: [],
    integrity: { ok: true, count: 0 },

    init: function () {
      var loaded = false;
      try {
        var raw = window.localStorage.getItem(KEY);
        if (raw) {
          var d = JSON.parse(raw);
          if (d && d.v === 1 && Array.isArray(d.events) && d.events.length) {
            this.events = d.events; this.clock = d.clock || R.CLOCK_START; this.tamper = d.tamper || null; this.seedCount = d.seedCount || 0;
            loaded = true;
          }
        }
      } catch (err) { loaded = false; }
      R.buildSeedSispekOnly();
      if (!loaded) this.reset(true);
      this.refresh();
    },

    reset: function (silent) {
      this.events = []; this.clock = R.CLOCK_START; this.tamper = null;
      var self = this;
      R.SISPEK = {};
      R.buildSeed().forEach(function (r) { self._append(r); });
      this.seedCount = this.events.length;
      this.save();
      if (!silent) this.refresh();
    },

    _append: function (r) {
      var prev = this.events.length ? this.events[this.events.length - 1].hash : GENESIS;
      var persona = R.PERSONAS[r.actor] || { role: 'system' };
      var e = { seq: this.events.length + 1, t: r.t, type: r.type, actor: r.actor, role: persona.role, p: r.p, prev: prev };
      e.hash = hashOf(prev, e);
      this.events.push(e);
      return e;
    },

    commit: function (type, actor, p) {
      var t = this.clock;
      var e = this._append({ t: t, type: type, actor: actor, p: p });
      this.clock = R.addMinutes(this.clock, 11 + (e.seq * 7) % 29);
      this.save();
      this.refresh();
      return e;
    },

    save: function () {
      try { window.localStorage.setItem(KEY, JSON.stringify({ v: 1, events: this.events, clock: this.clock, tamper: this.tamper, seedCount: this.seedCount })); } catch (err) { /* penyimpanan opsional */ }
    },

    refresh: function () {
      this.S = derive(this.events);
      this.integrity = this.verify();
      var self = this;
      this.listeners.forEach(function (fn) { fn(self.S); });
    },
    subscribe: function (fn) { this.listeners.push(fn); },

    verify: function () {
      var prev = GENESIS;
      for (var i = 0; i < this.events.length; i++) {
        var e = this.events[i];
        if (e.prev !== prev) return { ok: false, brokenAt: e.seq, reason: 'Tautan ke catatan sebelumnya tidak cocok', count: this.events.length };
        var h = hashOf(prev, e);
        if (h !== e.hash) return { ok: false, brokenAt: e.seq, reason: 'Isi catatan tidak cocok dengan hash yang tersimpan', count: this.events.length, expected: e.hash, actual: h };
        prev = e.hash;
      }
      return { ok: true, count: this.events.length, head: prev };
    },
    head: function () { return this.events.length ? this.events[this.events.length - 1].hash : GENESIS; },

    /* Simulasi manipulasi langsung pada basis data (melewati alur ledger) */
    simulateTamper: function () {
      if (this.tamper) return;
      var ev = this.events.filter(function (e) { return e.type === 'ENTRY_RECORDED' && e.p.code === 'LDG-28-K1-004128'; })[0];
      this.tamper = { seq: ev.seq, original: JSON.parse(JSON.stringify(ev.p)) };
      ev.p.v = 600;
      this.save(); this.refresh();
      return ev.seq;
    },
    restoreTamper: function () {
      if (!this.tamper) return;
      var t = this.tamper;
      var ev = this.events.filter(function (e) { return e.seq === t.seq; })[0];
      ev.p = t.original; this.tamper = null;
      this.save(); this.refresh();
    }
  };
  R.store = store;
  R.GENESIS = GENESIS;

  /* Pastikan "basis data SISPEK" tersedia meskipun log dimuat dari penyimpanan lokal. */
  R.buildSeedSispekOnly = function () { R.SISPEK = {}; R.buildSeed(); };

  /* ---------------- Aksi dengan aturan tata kelola ---------------- */
  function S() { return store.S; }
  function guardIntegrity() {
    if (!store.integrity.ok) fail('Integritas rantai ledger sedang rusak. Pulihkan rantai di menu Rantai Ledger sebelum menambah catatan baru.');
  }
  function pendingRev(en) { return en.revisions.filter(function (r) { return r.status === 'diajukan'; })[0]; }

  R.actions = {
    proposeCorrection: function (actor, code, newVal, reason, evidence, file) {
      guardIntegrity();
      var en = S().entries[code];
      if (!en) fail('Entri tidak ditemukan.');
      if (en.kind === 'batch') fail('Koreksi dilakukan pada entri jam-an, bukan pada rekap bulanan.');
      if (en.kind === 'inventory' && en.status !== 'diterima' && en.status !== 'dikoreksi') fail('Entri inventarisasi harus disetujui terlebih dahulu sebelum dapat dikoreksi.');
      if (pendingRev(en)) fail('Masih ada koreksi yang menunggu keputusan pada entri ini.');
      var v = R.toTenths(newVal);
      if (!isFinite(v) || v <= 0) fail('Nilai baru harus berupa angka positif.');
      if (v === en.v) fail('Nilai baru sama dengan nilai yang berlaku.');
      if (!reason || reason.trim().length < 20) fail('Alasan koreksi wajib dijelaskan (minimal 20 karakter).');
      if (!evidence) fail('Koreksi wajib disertai dokumen pendukung.');
      return store.commit('CORRECTION_PROPOSED', actor, { code: code, v: v, reason: reason.trim(), evidence: evidence, file: (file || '').trim() || 'lampiran.pdf' });
    },
    decideCorrection: function (actor, code, decision, note) {
      guardIntegrity();
      var en = S().entries[code]; var pr = en && pendingRev(en);
      if (!pr) fail('Tidak ada koreksi yang menunggu keputusan.');
      if (pr.by === actor) fail('Prinsip empat mata: ' + R.PERSONAS[actor].name + ' adalah pengaju koreksi ini sehingga tidak dapat menyetujui atau menolaknya sendiri.');
      if (actor !== 'dimas' && actor !== 'rina') fail('Hanya pengendalian internal emiten yang dapat memutuskan koreksi.');
      return store.commit('CORRECTION_DECIDED', actor, { code: code, decision: decision, note: note || '' });
    },
    recordInventory: function (actor, data) {
      guardIntegrity();
      if (!data.label || !R.FUEL[data.label]) fail('Pilih sumber emisi.');
      var act = Number(data.activity), f = Number(data.factor);
      if (!(act > 0)) fail('Data aktivitas (liter) harus diisi.');
      if (!(f > 0)) fail('Faktor emisi harus diisi.');
      if (!data.doc || data.doc.trim().length < 3) fail('Sebutkan dokumen sumber data aktivitas.');
      var max = 0;
      S().order.forEach(function (c) { var m = /GRK-(\d+)$/.exec(c); if (m) max = Math.max(max, +m[1]); });
      var code = 'LDG-28-GRK-' + R.pad(max + 1, 6);
      var v = Math.round(act * f / 100);
      return store.commit('ENTRY_RECORDED', actor, {
        code: code, src: 'GRK', kind: 'inventory', time: data.month + '-01T00:00', param: data.label, unit: 'tCO₂e',
        v: v, activity: act, factor: f, doc: data.doc.trim()
      });
    },
    decideEntry: function (actor, code, decision, note) {
      guardIntegrity();
      var en = S().entries[code];
      if (!en || en.status !== 'menunggu') fail('Entri ini tidak sedang menunggu persetujuan.');
      if (en.recordedBy === actor) fail('Prinsip empat mata: pencatat data (' + R.PERSONAS[actor].name + ') tidak dapat menyetujui catatannya sendiri.');
      return store.commit('ENTRY_DECIDED', actor, { code: code, decision: decision, note: note || '' });
    },

    nextReportStep: function () {
      var st = S().report.steps;
      for (var i = 0; i < R.REPORT_STEPS.length; i++) if (!st[R.REPORT_STEPS[i].id]) return R.REPORT_STEPS[i];
      return null;
    },
    reportGate: function (stepId) {
      var s = S(), issues = [];
      if (stepId === 'disetujui_direksi' || stepId === 'ditelaah_komite' || stepId === 'dikirim') {
        if (s.metrics.pending > 0) issues.push(s.metrics.pending + ' entri ledger masih menunggu persetujuan; angka belum final.');
      }
      return issues;
    },
    advanceReport: function (actor) {
      guardIntegrity();
      var s = S(), step = R.actions.nextReportStep();
      if (!step) fail('Laporan sudah dikirim ke penyedia assurance.');
      if (actor && actor !== step.actor) fail('Langkah "' + step.label + '" hanya dapat dilakukan oleh ' + R.PERSONAS[step.actor].name + ' (' + R.PERSONAS[step.actor].title + ').');
      var issues = R.actions.reportGate(step.id);
      if (issues.length) fail('Belum dapat dilanjutkan: ' + issues.join(' '));
      if (step.id === 'ditelaah' && s.report.steps.disusun && s.report.steps.disusun.by === step.actor) fail('Penyusun dan penelaah laporan harus berbeda.');
      var p = { step: step.id };
      if (step.id === 'dikirim') {
        var m = s.metrics;
        p.snapshot = { K1: m.K1.v, K2: m.K2.v, GRK: m.GRK.v, total: m.total, version: s.report.version };
        p.snapshotHash = R.sha256(R.canon(p.snapshot));
      }
      return store.commit('REPORT_STEP', step.actor, p);
    },
    restateReport: function (reason, actor) {
      guardIntegrity();
      var s = S();
      if (!s.stale) fail('Angka di ledger masih sama dengan laporan yang dikirim; penyajian kembali tidak diperlukan.');
      return store.commit('REPORT_RESTATED', actor || 'lestari', { version: s.report.version + 1, reason: reason || 'Penyajian kembali karena koreksi data setelah laporan dikirim.' });
    },

    addSample: function (code) {
      guardIntegrity();
      var s = S(); if (!s.engagement) fail('Belum ada penugasan assurance.');
      if (s.engagement.samples.indexOf(code) >= 0) fail('Entri sudah menjadi sampel.');
      return store.commit('SAMPLE_ADDED', 'wiratama', { code: code });
    },
    testSample: function (code, result, note) {
      guardIntegrity();
      var s = S(); if (!s.engagement) fail('Belum ada penugasan assurance.');
      if (s.conclusion) fail('Kesimpulan untuk versi laporan ini sudah diterbitkan.');
      return store.commit('SAMPLE_TESTED', 'wiratama', { code: code, result: result, note: note || '' });
    },
    recordFinding: function (f) {
      guardIntegrity();
      var s = S(); if (!s.engagement) fail('Belum ada penugasan assurance.');
      if (s.conclusion) fail('Kesimpulan untuk versi laporan ini sudah diterbitkan.');
      if (!f.title || f.title.trim().length < 10) fail('Uraian temuan terlalu singkat.');
      if (f.key && s.findingOrder.some(function (id) { return s.findings[id].key === f.key && s.findings[id].version === s.report.version; })) fail('Temuan ini sudah dicatat.');
      var id = 'T-' + R.pad(s.findingOrder.length + 1, 2);
      return store.commit('FINDING_RECORDED', 'wiratama', { id: id, title: f.title.trim(), detail: f.detail || '', materiality: f.materiality || 'tidak_material', key: f.key || null });
    },
    respondFinding: function (actor, id, text) {
      guardIntegrity();
      var f = S().findings[id];
      if (!f) fail('Temuan tidak ditemukan.');
      if (f.response) fail('Temuan sudah ditanggapi.');
      if (!text || text.trim().length < 15) fail('Tanggapan manajemen terlalu singkat.');
      return store.commit('FINDING_RESPONDED', actor, { id: id, text: text.trim() });
    },
    conclusionGate: function (type) {
      var s = S(), g = [];
      if (!s.engagement) return [{ ok: false, label: 'Laporan sudah dikirim ke penyedia assurance' }];
      var tested = s.engagement.samples.filter(function (c) { return s.engagement.tests[c]; }).length;
      g.push({ ok: tested === s.engagement.samples.length, label: 'Semua sampel ditelusuri ke sumber (' + tested + '/' + s.engagement.samples.length + ')' });
      var fs = s.findingOrder.map(function (id) { return s.findings[id]; }).filter(function (f) { return f.version === s.report.version; });
      var unresp = fs.filter(function (f) { return !f.response; }).length;
      g.push({ ok: unresp === 0, label: unresp ? unresp + ' temuan belum ditanggapi manajemen' : 'Semua temuan sudah ditanggapi manajemen (' + fs.length + ')' });
      var material = fs.filter(function (f) { return f.materiality === 'material'; }).length;
      if (type === 'unmodified') g.push({ ok: material === 0, label: material ? material + ' temuan material: kesimpulan tanpa modifikasi tidak dapat diterbitkan' : 'Tidak ada temuan material yang belum dikoreksi' });
      g.push({ ok: !s.stale, label: s.stale ? 'Angka di ledger berubah setelah laporan dikirim' : 'Angka laporan masih sama dengan ledger' });
      return g;
    },
    issueConclusion: function (type, level, basis) {
      guardIntegrity();
      var s = S();
      if (s.conclusion) fail('Kesimpulan untuk versi laporan ini sudah diterbitkan dan tidak dapat diubah.');
      var gate = R.actions.conclusionGate(type).filter(function (g) { return !g.ok; });
      if (gate.length) fail('Belum dapat diterbitkan: ' + gate.map(function (g) { return g.label; }).join('; ') + '.');
      if ((type === 'qualified' || type === 'adverse') && (!basis || !basis.length)) fail('Pilih temuan yang menjadi dasar modifikasi kesimpulan.');
      if (s.phase === 3 && level !== 'reasonable') fail('Fase 3 mensyaratkan reasonable assurance untuk metrik emisi inti.');
      var code = 'LDG-28-ASR-' + R.pad(store.events.length + 1, 6);
      return store.commit('CONCLUSION_ISSUED', 'wiratama', {
        code: code, type: type, level: level, basis: basis || [], version: s.report.version,
        snapshotHash: R.sha256(R.canon(s.report.snapshot)), text: R.conclusionText(type, level, basis, s)
      });
    },

    requestConsent: function () {
      guardIntegrity();
      var c = S().consent.status;
      if (c === 'diminta' || c === 'diberikan') fail(c === 'diberikan' ? 'Akses sudah diberikan.' : 'Permintaan akses sudah dikirim dan menunggu keputusan emiten.');
      return store.commit('CONSENT_REQUESTED', 'siregar', { scope: R.ENTITY.project });
    },
    setConsent: function (granted, actor) {
      guardIntegrity();
      return store.commit('CONSENT_SET', actor || 'lestari', { granted: !!granted, scope: R.ENTITY.project });
    },
    runFinancingCheck: function () {
      guardIntegrity();
      var ev = R.evaluateFinancing(S());
      if (ev.result === 'akses_ditutup') fail('Lembaga pembiayaan belum memperoleh persetujuan akses dari emiten.');
      return store.commit('FINANCING_CHECKED', 'siregar', {
        result: ev.result, version: S().report.version, phase: S().phase,
        conclusion: S().conclusion ? S().conclusion.code : null,
        criteria: ev.criteria.map(function (c) { return { label: c.label, state: c.state }; })
      });
    },
    setPhase: function (phase) {
      guardIntegrity();
      if (S().phase === phase) fail('Fase tersebut sudah berlaku.');
      return store.commit('PHASE_SET', 'ojk', { phase: phase, note: 'Ditetapkan komite pengarah setelah evaluasi tahunan.' });
    }
  };

  /* Teks kesimpulan mengikuti bentuk ISSA 5000: limited = bentuk negatif, reasonable = bentuk positif. */
  R.conclusionText = function (type, level, basis, s) {
    var subj = 'informasi emisi gas rumah kaca Scope 1 ' + R.ENTITY.name + ' untuk tahun yang berakhir 31 Desember 2028 (versi laporan ' + s.report.version + ')';
    var crit = 'sesuai dengan PSPK 2';
    var b = (basis || []).join(', ');
    if (type === 'disclaimer') return 'Kami tidak menyatakan kesimpulan atas ' + subj + '. Karena signifikansi hal yang dijelaskan dalam paragraf Basis untuk Tidak Menyatakan Kesimpulan' + (b ? ' (' + b + ')' : '') + ', kami tidak dapat memperoleh bukti yang cukup dan tepat sebagai basis kesimpulan.';
    if (level === 'reasonable') {
      if (type === 'unmodified') return 'Menurut opini kami, ' + subj + ' disusun, dalam semua hal yang material, ' + crit + '.';
      if (type === 'qualified') return 'Menurut opini kami, kecuali untuk dampak hal yang dijelaskan dalam paragraf Basis untuk Opini dengan Pengecualian (' + b + '), ' + subj + ' disusun, dalam semua hal yang material, ' + crit + '.';
      return 'Menurut opini kami, karena signifikansi hal yang dijelaskan dalam paragraf Basis untuk Opini Tidak Wajar (' + b + '), ' + subj + ' tidak disusun ' + crit + '.';
    }
    if (type === 'unmodified') return 'Berdasarkan prosedur yang kami laksanakan dan bukti yang kami peroleh, tidak ada hal yang menjadi perhatian kami yang menyebabkan kami yakin bahwa ' + subj + ' tidak disusun, dalam semua hal yang material, ' + crit + '.';
    if (type === 'qualified') return 'Berdasarkan prosedur yang kami laksanakan dan bukti yang kami peroleh, kecuali untuk dampak hal yang dijelaskan dalam paragraf Basis untuk Kesimpulan dengan Pengecualian (' + b + '), tidak ada hal yang menjadi perhatian kami yang menyebabkan kami yakin bahwa ' + subj + ' tidak disusun, dalam semua hal yang material, ' + crit + '.';
    return 'Karena signifikansi hal yang dijelaskan dalam paragraf Basis untuk Kesimpulan Tidak Wajar (' + b + '), ' + subj + ' tidak disusun, dalam semua hal yang material, ' + crit + '.';
  };

  /* Penilaian prasyarat pembiayaan — kriteria terbuka yang sama untuk setiap emiten. */
  R.evaluateFinancing = function (s) {
    var crit = [], ph = R.PHASES[s.phase];
    function add(label, state, detail) { crit.push({ label: label, state: state, detail: detail || '' }); }
    var consent = s.consent.status === 'diberikan';
    add('Akses ledger diberikan atas persetujuan emiten', consent ? 'ok' : 'fail', consent ? 'Persetujuan ' + R.date(s.consent.at) : 'Status: ' + ({ none: 'belum diminta', diminta: 'menunggu keputusan emiten', ditolak: 'ditolak emiten', dicabut: 'dicabut emiten' }[s.consent.status] || s.consent.status));
    if (!consent) return { result: 'akses_ditutup', criteria: crit };
    var sent = !!s.report.steps.dikirim;
    add('Laporan PSPK 1 dan 2 periode 2028 tersedia di ledger', sent ? 'ok' : 'fail', sent ? 'LDG-28-RPT-v' + s.report.version : 'Laporan versi ' + s.report.version + ' belum dikirim');
    var c = s.conclusion;
    var required = ph.level;
    if (!c) {
      add('Assurance ISSA 5000 oleh praktisi bersertifikat', required ? 'fail' : 'info', required ? 'Belum ada kesimpulan untuk versi laporan terkini' : 'Fase 1: assurance belum menjadi prasyarat wajib');
    } else {
      add('Assurance ISSA 5000 oleh praktisi bersertifikat', 'ok', R.PROVIDER.name);
      var lvlOk = !required || (required === 'limited') || (required === 'reasonable' && c.level === 'reasonable');
      add('Tingkat keyakinan sesuai fase (' + ph.label + ': ' + (required ? 'minimal ' + required : 'tidak disyaratkan') + ')', lvlOk ? 'ok' : 'fail', (c.level === 'limited' ? 'Limited' : 'Reasonable') + ' assurance');
      var t = c.type;
      add('Jenis kesimpulan memenuhi aturan', t === 'unmodified' ? 'ok' : t === 'qualified' ? 'warn' : 'fail', R.CONCLUSIONS[t].label);
      add('Cakupan memuat metrik emisi Scope 1', 'ok', 'Kiln 1, Kiln 2, sumber lain');
      add('Kesimpulan berlaku untuk versi laporan terkini', s.stale ? 'fail' : 'ok', s.stale ? 'Angka di ledger berubah setelah laporan dikirim' : 'Versi ' + c.version + ' · ' + c.code);
    }
    if (s.stale && !c) add('Angka laporan sama dengan ledger', 'fail', 'Perlu penyajian kembali');
    var states = crit.map(function (x) { return x.state; });
    var result;
    if (!sent || (!c && required)) result = 'belum';
    else if (states.indexOf('fail') >= 0) result = 'tidak';
    else if (states.indexOf('warn') >= 0) result = 'bersyarat';
    else result = c ? 'memenuhi' : 'percontohan';
    return { result: result, criteria: crit };
  };

  R.FIN_RESULT = {
    memenuhi: { label: 'Memenuhi prasyarat', tone: 'ok' },
    bersyarat: { label: 'Memenuhi bersyarat', tone: 'warn' },
    tidak: { label: 'Tidak memenuhi', tone: 'bad' },
    belum: { label: 'Belum dapat diperiksa', tone: 'neutral' },
    percontohan: { label: 'Percontohan · tercatat', tone: 'info' },
    akses_ditutup: { label: 'Akses belum diberikan', tone: 'neutral' }
  };
})(window.REVEAL = window.REVEAL || {});
