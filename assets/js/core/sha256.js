/* SHA-256 sinkron (tanpa dependensi) — dipakai untuk rantai hash ledger.
   Sinkron agar dapat berjalan juga saat index.html dibuka langsung dari file://. */
(function (R) {
  'use strict';
  var H0 = [], K = [];
  (function init() {
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) >>> 0; }
    var n = 2, found = 0;
    while (found < 64) {
      var prime = true;
      for (var f = 2; f * f <= n; f++) if (n % f === 0) { prime = false; break; }
      if (prime) {
        if (found < 8) H0[found] = frac(Math.pow(n, 1 / 2));
        K[found] = frac(Math.pow(n, 1 / 3));
        found++;
      }
      n++;
    }
  })();

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  R.sha256 = function (str) {
    var bytes = new TextEncoder().encode(String(str));
    var l = bytes.length;
    var total = (((l + 9) + 63) >> 6) << 6;
    var buf = new Uint8Array(total);
    buf.set(bytes);
    buf[l] = 0x80;
    var dv = new DataView(buf.buffer);
    var bitLen = l * 8;
    dv.setUint32(total - 4, bitLen >>> 0);
    dv.setUint32(total - 8, Math.floor(bitLen / 4294967296));
    var h = H0.slice();
    var w = new Uint32Array(64);
    for (var i = 0; i < total; i += 64) {
      for (var t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
      for (t = 16; t < 64; t++) {
        var a15 = w[t - 15], a2 = w[t - 2];
        var s0 = rotr(a15, 7) ^ rotr(a15, 18) ^ (a15 >>> 3);
        var s1 = rotr(a2, 17) ^ rotr(a2, 19) ^ (a2 >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + h[i].toString(16)).slice(-8);
    return out;
  };
})(window.REVEAL = window.REVEAL || {});
