# REVEAL · Prototipe Assurance Ledger

**Reporting and Emission Verification through Assurance Ledger**
Prototipe web untuk esai *REVEAL: Assurance Ledger Terintegrasi untuk Memperkuat Integritas Pelaporan Emisi Korporasi*.
Tim IAP Tampil Lagi (Muhammad Najatullah Siddiq & Aiyas Rizki), FEB Universitas Syiah Kuala. Essay Competition Telkom Accounting Fair 2026.

> Prototipe konsep. Seluruh entitas, orang, dan angka bersifat ilustratif. Ini bukan sistem resmi OJK, KLH, IAPI, atau lembaga mana pun.

---

## Menjalankan

Tidak perlu instalasi atau proses build.

- **Cara tercepat:** buka `index.html` langsung di browser (Chrome, Edge, Firefox, atau Safari).
- **Lewat server lokal** (disarankan saat presentasi):
  ```bash
  # pilih salah satu
  python3 -m http.server 8000      # lalu buka http://localhost:8000
  npx serve .                      # lalu buka alamat yang ditampilkan
  ```

Font dimuat dari Google Fonts. Jika tidak ada internet, tampilan tetap berjalan dengan font sistem.

## Hosting

Situs ini statis: unggah seluruh folder apa adanya.

| Layanan | Langkah |
|---|---|
| **Netlify** | Seret folder ke app.netlify.com/drop |
| **Vercel** | `npx vercel` di folder ini (framework: *Other*, tanpa build command) |
| **GitHub Pages** | Push ke repo → Settings → Pages → branch `main`, folder `/root` |

Navigasi memakai hash (`#/peran/operator`), jadi tidak perlu pengaturan *rewrite* di server.

## Login dan hak akses

Buka situs → **Masuk** (`#/login`). Semua akun demo memakai kata sandi **`reveal2026`**. Di halaman login, akun juga bisa dipilih dengan sekali klik. Setelah masuk, menu di sidebar dan tombol tindakan hanya muncul sesuai kewenangan akun. Membuka halaman di luar kewenangan menampilkan **Akses ditolak**.

| Akun (email) | Unit | Halaman | Tindakan yang diizinkan |
|---|---|---|---|
| rina@karsa.demo | Operator data CEMS | Ledger, Laporan (lihat), Publik | Mengajukan koreksi, mencatat inventarisasi GRK |
| dimas@karsa.demo | Pengendalian Internal | Ledger, Laporan, Publik | Menyetujui/menolak koreksi & entri; telaah internal laporan |
| lestari@karsa.demo | Divisi Keberlanjutan | Laporan, Ledger (lihat), Publik | Menyusun & mengirim laporan, penyajian kembali, menanggapi temuan, izin akses bank |
| santoso@karsa.demo | Direksi · Direktur Keuangan | Laporan, Ledger (lihat), Publik | Persetujuan Direksi, menanggapi temuan, izin akses bank |
| komite@karsa.demo | Komite Keberlanjutan | Laporan, Ledger (lihat), Publik | Telaah Komite |
| wiratama@pradana.demo | KAP · rekan penanggung jawab | Penugasan assurance, Rantai, Publik | Uji sampel, temuan, kesimpulan ISSA 5000 |
| siregar@banklestari.demo | Bank · pembiayaan berkelanjutan | Verifikasi prasyarat, Publik | Meminta akses, menilai prasyarat |
| sekretariat@komite-reveal.demo | Komite Pengarah (OJK & KLH) | Pengawasan, Rantai, Publik | Menetapkan fase, simulasi uji integritas |

Ringkasan publik (`#/publik`) dapat dibuka tanpa login. Hak akses diatur di `assets/js/core/auth.js`. Aturan inti (empat mata, urutan persetujuan laporan) juga ditegakkan di lapisan ledger (`store.js`), sehingga tetap berlaku walaupun tombol dipanggil langsung.

**Mode Juri** (20 langkah) berpindah akun otomatis di setiap langkah, mulai dari Rina sampai pengunjung publik. Setiap langkah punya tombol *Lakukan untuk saya*. Tombol **Reset** mengembalikan data demo ke kondisi awal.

### Angka kunci (konsisten dengan Lampiran 8 esai)

- Kiln 1 612.450,0 · Kiln 2 548.210,0 · sumber lain 41.380,0 → **Total Scope 1 1.202.040,0 tCO₂e** (setelah koreksi dan persetujuan)
- 17.568 jam data (2 kiln) · 156 jam substitusi · kelengkapan 99,1% · 37 entri dikoreksi
- Sebelum persetujuan: total 1.198.624,3 dan 2 entri menunggu. Laporan tidak dapat dikirim sampai angka final.

## Konsep esai vs inovasi tambahan

**Dari esai:** assurance ledger append-only (koreksi tanpa menghapus catatan lama) · alur CEMS–SISPEK → PSPK 1 & 2 → ISSA 5000 → pembiayaan bersyarat · pemisahan tugas sesuai PUGKI 2021 · akses lembaga pembiayaan terbatas atas persetujuan emiten · tiga fase (limited → reasonable) · ringkasan publik · lima peran.

**Tambahan pada prototipe:** rantai hash SHA-256 dengan simulasi manipulasi · aturan fase yang dieksekusi sistem · deteksi otomatis kebutuhan penyajian kembali (terinspirasi kasus Telkom dalam esai) · prosedur analitis otomatis · Mode Juri.

## Arsitektur

```
index.html
assets/
  css/styles.css            identitas cokelat-emas mengikuti deck
  js/core/sha256.js         SHA-256 sinkron (tanpa dependensi)
  js/core/util.js           format angka/tanggal Indonesia, ikon SVG
  js/core/seed.js           data simulasi (emiten, persona, SISPEK, fase)
  js/core/auth.js           akun demo, hak akses per peran, sesi
  js/core/store.js          LEDGER: log peristiwa append-only + rantai hash,
                            penurunan status, aturan tata kelola (RuleError)
  js/ui/components.js       modal, toast, lencana, penelusuran 4 lompatan
  js/views/*.js             beranda + 5 ruang kerja + rantai + publik
  js/tour.js                Mode Juri
  js/app.js                 router hash, cangkang, delegasi event
```

- **Event sourcing.** Satu-satunya sumber kebenaran adalah log peristiwa (`ENTRY_RECORDED`, `CORRECTION_PROPOSED`, `CORRECTION_DECIDED`, `REPORT_STEP`, `CONCLUSION_ISSUED`, `CONSENT_SET`, `FINANCING_CHECKED`, `PHASE_SET`, dll.). Seluruh tampilan diturunkan dari log ini, sehingga setiap angka punya jejak.
- **Aturan tata kelola** ada di `R.actions` (store.js), bukan di tampilan. Contoh: pengaju tidak dapat menyetujui koreksinya sendiri; laporan tidak dapat disetujui Direksi atau dikirim bila ada entri menunggu; kesimpulan hanya terbit setelah semua sampel diuji dan temuan ditanggapi; fase 3 mewajibkan reasonable assurance.
- **Nilai emisi** disimpan sebagai integer persepuluhan agar bebas galat pembulatan.
- **Penyimpanan:** `localStorage` peramban (kunci `reveal-prototype-v1`). Demo bertahan saat halaman dimuat ulang.
- Tanpa framework dan tanpa build. Skrip klasik, sehingga berjalan juga dari `file://`.

## Kebutuhan untuk sistem produksi (belum diimplementasikan)

Bagian berikut disimulasikan di browser. Implementasi nyata memerlukan:

1. **Integrasi SISPEK (KLH):** API atau protokol pertukaran data CEMS jam-an. Saat ini kiriman SISPEK disimulasikan di `seed.js`.
2. **Backend & basis data append-only:** misalnya PostgreSQL dengan tabel hanya-tambah atau penyimpanan WORM; hash dihitung di server dan *checkpoint* ditambatkan berkala ke OJK.
3. **Autentikasi sungguhan:** prototipe memakai akun demo di browser. Produksi memerlukan login di server (SSO lembaga, MFA), sesi aman, dan pemeriksaan hak akses di backend.
4. **Penyimpanan dokumen bukti** (berita acara kalibrasi, faktur BBM) dengan sidik digital tercatat di ledger, serta tanda tangan elektronik untuk persetujuan Direksi dan kesimpulan assurance.
5. **Manajemen persetujuan akses** yang dapat diaudit untuk lembaga pembiayaan (cakupan, masa berlaku, pencabutan).
6. **Pencadangan dan pemulihan** rantai tervalidasi (pada prototipe tombol *Pulihkan rantai* memakai salinan di memori).

## Sumber data dalam esai yang dirujuk di beranda

Net Zero Tracker (2025); IFAC, AICPA & CIMA (2026); OJK (2017) POJK 51/POJK.03/2017; Telkom Indonesia (2026) Laporan Keberlanjutan 2025; KLHK (2021) Permen LHK 13/2021; IAI (2025) PSPK 1 & 2; IAASB (2024) ISSA 5000; KNKG (2021) PUGKI.
