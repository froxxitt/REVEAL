/* Utilitas umum: escaping, format angka/tanggal Indonesia, ikon. */
(function (R) {
  'use strict';

  R.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* Semua nilai emisi disimpan dalam satuan persepuluhan (integer) agar bebas galat pembulatan. */
  R.toTenths = function (x) { return Math.round(Number(x) * 10); };
  R.num = function (tenths, dec) {
    dec = dec == null ? 1 : dec;
    return (tenths / 10).toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };
  R.int = function (n) { return Number(n).toLocaleString('id-ID'); };
  R.pct = function (x, dec) {
    return (x * 100).toLocaleString('id-ID', { minimumFractionDigits: dec == null ? 1 : dec, maximumFractionDigits: dec == null ? 1 : dec }) + '%';
  };
  R.signed = function (tenths) {
    var s = R.num(Math.abs(tenths));
    return (tenths > 0 ? '+' : tenths < 0 ? '−' : '±') + s;
  };

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var MONL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  R.MON = MON; R.MONL = MONL;

  /* Waktu simulasi disimpan sebagai 'YYYY-MM-DDTHH:MM' (tanpa zona waktu). */
  function parts(t) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(t || '');
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] == null ? null : +m[4], mi: m[5] == null ? null : +m[5] };
  }
  R.date = function (t) { var p = parts(t); return p ? p.d + ' ' + MON[p.mo - 1] + ' ' + p.y : ''; };
  R.dt = function (t) {
    var p = parts(t); if (!p) return '';
    var s = p.d + ' ' + MON[p.mo - 1] + ' ' + p.y;
    if (p.h != null) s += ', ' + String(p.h).padStart(2, '0') + '.' + String(p.mi).padStart(2, '0');
    return s;
  };
  R.monthLabel = function (t) { var p = parts(t); return p ? MON[p.mo - 1] + ' ' + p.y : ''; };
  R.addMinutes = function (t, min) {
    var d = new Date(t + ':00Z');
    d = new Date(d.getTime() + min * 60000);
    return d.toISOString().slice(0, 16);
  };
  R.pad = function (n, w) { return String(n).padStart(w, '0'); };
  R.short = function (hash, n) { return hash ? hash.slice(0, n || 10) : '—'; };

  /* Ikon garis sederhana (inline SVG). */
  var P = {
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/>',
    unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 017.6-1.7"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    factory: '<path d="M3 21V11l5 3V11l5 3V7l3-4h2v18z"/><path d="M3 21h18"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    bank: '<path d="M3 9.5L12 4l9 5.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    chain: '<rect x="2.5" y="8.5" width="9" height="7" rx="3.5"/><rect x="12.5" y="8.5" width="9" height="7" rx="3.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.6 3.3-5.5 6.5-5.5s5.8 1.9 6.5 5.5"/><path d="M15.5 4.8a3.4 3.4 0 010 6.4M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
    gauge: '<path d="M4 17a8 8 0 1116 0"/><path d="M12 17l4-5"/>',
    play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
    reset: '<path d="M4 12a8 8 0 102.4-5.7"/><path d="M4 4v4.5h4.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15"/>',
    layers: '<path d="M12 3.5l9 5-9 5-9-5z"/><path d="M3 13.5l9 5 9-5"/>',
    logout: '<path d="M14 4h4.5A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5H14"/><path d="M10 16l-4-4 4-4M6 12h10"/>'
  };
  R.icon = function (name, cls) {
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };
})(window.REVEAL = window.REVEAL || {});
