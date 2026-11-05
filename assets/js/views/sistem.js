/* Tampilan sistem: Rantai Ledger (verifikasi integritas) dan Ringkasan Publik (masyarakat & investor). */
(function (R) {
  'use strict';
  var esc = R.esc, ic = R.icon;
  R.ui.chainFilter = R.ui.chainFilter || 'aktivitas';
  R.ui.chainLimit = R.ui.chainLimit || 40;

  R.VIEWS['rantai'] = {
    page: 'rantai',
    render: function () {
      var st = R.store, integ = st.integrity;
      var status = integ.ok
        ? '<div class="integrity ok">' + ic('shield', 'ico-xl') + '<div><b>Rantai utuh</b><p>' + R.int(integ.count) + ' catatan diverifikasi ulang dari catatan pertama. Setiap catatan memuat sidik digital (SHA-256) catatan sebelumnya, sehingga perubahan diam-diam pada satu catatan memutus seluruh rantai sesudahnya.</p><div class="mono small">Hash terakhir · ' + esc(integ.head) + '</div></div></div>'
        : '<div class="integrity bad">' + ic('alert', 'ico-xl') + '<div><b>Rantai rusak pada catatan #' + integ.brokenAt + '</b><p>' + esc(integ.reason) + '. Isi catatan diubah langsung di basis data tanpa melalui alur koreksi. Hash yang tersimpan tidak lagi cocok dengan isinya, dan semua catatan sesudahnya tidak dapat dipercaya sampai rantai dipulihkan.</p>' +
          '<div class="mono small">Tersimpan · ' + esc(R.short(integ.expected, 32)) + '…<br>Dihitung ulang · ' + esc(R.short(integ.actual, 32)) + '…</div></div></div>';
      var tamper = !R.can('chain.tamper') ? '<p class="fine">Simulasi uji integritas hanya dapat dijalankan oleh Komite Pengarah.</p>' : st.tamper
        ? '<button class="btn btn-primary" data-action="restore" data-tour="restore">' + ic('reset') + 'Pulihkan rantai</button>'
        : '<button class="btn btn-danger" data-action="tamper" data-tour="tamper">' + ic('alert') + 'Simulasikan manipulasi data</button>';

      var events = st.events.slice().reverse();
      if (R.ui.chainFilter === 'aktivitas') events = events.filter(function (e) { return !(e.type === 'ENTRY_RECORDED' && e.p.kind === 'batch') && !(e.type === 'ENTRY_DECIDED' && e.seq <= st.seedCount) && !(e.type === 'ENTRY_RECORDED' && e.p.kind === 'inventory' && e.seq <= st.seedCount); });
      var total = events.length;
      events = events.slice(0, R.ui.chainLimit);
      var broken = integ.ok ? Infinity : integ.brokenAt;
      var list = events.map(function (e) {
        var bad = e.seq >= broken;
        return '<li class="blk ' + (bad ? 'blk-bad' : '') + (st.tamper && st.tamper.seq === e.seq ? ' blk-tampered' : '') + '">' +
          '<div class="blk-seq">#' + e.seq + '</div><div class="blk-main"><p>' + esc(R.describe(e)) + '</p><small>' + esc(R.whoFull(e.actor)) + ' · ' + R.dt(e.t) + '</small></div>' +
          '<div class="blk-hash"><span title="Hash catatan">' + ic(bad ? 'x' : 'chain') + '<span class="mono">' + R.short(e.hash, 10) + '</span></span><span class="muted mono" title="Hash catatan sebelumnya">← ' + R.short(e.prev, 10) + '</span></div></li>';
      }).join('');
      var more = total > R.ui.chainLimit ? '<button class="btn btn-ghost btn-block" data-action="chain-more">Tampilkan ' + Math.min(40, total - R.ui.chainLimit) + ' catatan lagi (' + (total - R.ui.chainLimit) + ' tersisa)</button>' : '';
      var chips = '<div class="chips">' + [['aktivitas', 'Aktivitas tata kelola'], ['semua', 'Semua catatan']].map(function (f) { return '<button class="chip ' + (R.ui.chainFilter === f[0] ? 'on' : '') + '" data-action="chain-filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>';

      return R.pageHead({ eyebrow: 'Sistem · dikelola OJK', title: 'Rantai ledger', lead: 'Catatan lama tidak pernah dihapus. Rantai hash membuat setiap perubahan di luar alur resmi langsung terlihat oleh penyedia assurance dan pengawas.', right: R.addon('Rantai hash anti-ubah') }) +
        '<div class="split"><div class="stack">' + R.card('Daftar catatan', chips + '<ol class="chain">' + list + '</ol>' + more) + '</div>' +
        '<div class="stack">' + R.card('Status integritas', status + '<div class="btn-row">' + tamper + '</div>', { id: 'integrity-card' }) +
        R.card('Cara kerja', '<ol class="howto"><li>Setiap tindakan (kiriman SISPEK, koreksi, persetujuan, temuan, kesimpulan) ditambahkan sebagai catatan baru.</li><li>Sidik digital catatan dihitung dari isinya ditambah sidik catatan sebelumnya.</li><li>Verifikasi menghitung ulang seluruh rantai. Satu angka yang diubah diam-diam memutus rantai sejak titik itu.</li><li>Pada sistem produksi, hash terakhir ditambatkan berkala ke pengawas sehingga penulisan ulang seluruh rantai juga terdeteksi.</li></ol>') + '</div></div>';
    }
  };

  R.VIEWS['publik'] = {
    page: 'publik',
    render: function () {
      var S = R.store.S, c = S.conclusion;
      var head = R.pageHead({ eyebrow: 'Ringkasan publik · untuk investor dan masyarakat sekitar industri', title: 'Emisi terverifikasi ' + R.ENTITY.name, lead: 'Ringkasan ini terbit otomatis setelah penyedia assurance independen menyelesaikan pemeriksaan, sehingga angka yang dipublikasikan sama dengan angka yang diperiksa.' });
      var steps = [
        ['Data dipantau CEMS dan masuk ledger', true],
        ['Laporan disetujui Direksi dan ditelaah Komite', !!S.report.steps.ditelaah_komite],
        ['Laporan dikirim ke penyedia assurance', !!S.report.steps.dikirim],
        ['Kesimpulan assurance diterbitkan', !!c && !S.stale]
      ];
      var prog = '<ol class="progress">' + steps.map(function (s) { return '<li class="' + (s[1] ? 'done' : '') + '">' + ic(s[1] ? 'check' : 'clock') + esc(s[0]) + '</li>'; }).join('') + '</ol>';
      if (!c || S.stale) {
        return head + R.card('Belum ada ringkasan terverifikasi untuk periode 2028', '<p class="muted">' + (S.stale ? 'Angka emiten sedang disajikan kembali setelah koreksi. Ringkasan akan diperbarui setelah pemeriksaan ulang selesai.' : 'Pemeriksaan independen masih berjalan.') + '</p>' + prog, { id: 'public-card' });
      }
      var snap = S.report.snapshot, t = R.CONCLUSIONS[c.type];
      var max = Math.max(snap.K1, snap.K2, snap.GRK);
      var bars = ['K1', 'K2', 'GRK'].map(function (k) {
        return '<div class="hbar"><span class="hbar-l">' + R.SOURCES[k].label + '</span><span class="hbar-t"><span style="width:' + (snap[k] / max * 100) + '%"></span></span><span class="hbar-v">' + R.num(snap[k], 0) + ' t</span></div>';
      }).join('');
      var plain = c.level === 'limited'
        ? 'Pemeriksa independen tidak menemukan hal yang menunjukkan angka ini salah secara material (tingkat keyakinan terbatas).'
        : 'Pemeriksa independen menyatakan angka ini disajikan secara wajar dalam semua hal yang material (tingkat keyakinan memadai).';
      if (c.type !== 'unmodified') plain = 'Pemeriksa independen memberi kesimpulan "' + t.label.toLowerCase() + '". Bacalah laporan assurance lengkap untuk memahami pengecualiannya.';
      var tr = R.int(Math.round(snap.total / 10));
      return head + '<div class="split"><div class="stack">' +
        R.card('', '<div class="hero-num"><div class="eyebrow">Emisi GRK Scope 1 · tahun 2028</div><div class="big-num">' + tr + ' <small>tCO₂e</small></div>' + R.badge(t.label + ' · ' + (c.level === 'limited' ? 'limited' : 'reasonable') + ' assurance', t.tone, 'shield') + '<p>' + esc(plain) + '</p></div>' + bars, { id: 'public-card' }) +
        R.card('Apa artinya bagi masyarakat?', '<ul class="bullets"><li>Angka berasal dari alat pemantau di cerobong yang terhubung ke sistem pemerintah (SISPEK), bukan diisi manual.</li><li>Setiap koreksi angka memiliki alasan dan disetujui orang berbeda; nilai lama tetap tersimpan.</li><li>Pemeriksa independen menelusuri angka sampai ke alat ukurnya sebelum ringkasan ini terbit.</li></ul>') +
        '</div><div class="stack">' + R.card('Jejak verifikasi', '<dl class="kv"><dt>Pemeriksa</dt><dd>' + esc(R.PROVIDER.name) + '</dd><dt>Standar</dt><dd>ISSA 5000 · PSPK 2</dd><dt>Kode kesimpulan</dt><dd class="mono">' + c.code + '</dd><dt>Diterbitkan</dt><dd>' + R.dt(c.at) + '</dd><dt>Sidik laporan</dt><dd class="mono">' + R.short(c.snapshotHash, 20) + '…</dd></dl>' + prog) + '</div></div>';
    }
  };

  var A = R.handlers;
  A['tamper'] = function () {
    if (!R.run(function () { R.need('chain.tamper'); })) return;
    var seq = R.store.simulateTamper();
    R.toast('Nilai awal LDG-28-K1-004128 diubah langsung di basis data (68,2 → 60,0). Verifikasi rantai mendeteksinya di catatan #' + seq + '.', 'bad');
  };
  A['restore'] = function () { if (!R.run(function () { R.need('chain.tamper'); })) return; R.store.restoreTamper(); R.toast('Rantai dipulihkan dari salinan cadangan yang tervalidasi.', 'ok'); };
  A['chain-filter'] = function (d) { R.ui.chainFilter = d.f; R.ui.chainLimit = 40; R.render(); };
  A['chain-more'] = function () { R.ui.chainLimit += 40; R.render(); };
})(window.REVEAL = window.REVEAL || {});
