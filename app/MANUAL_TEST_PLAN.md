# Skenario Pengujian Manual — FinTrust AI (mobile-umkm + web-lender)

Cara pakai: jalankan tiap skenario berurutan (banyak yang saling bergantung — status pengajuan dari satu skenario dipakai skenario lain). Kalau ada yang gagal, catat ID skenarionya (mis. `TC-UMKM-07`) waktu melapor supaya gampang saya lacak.

## Prasyarat — jalankan dulu sebelum mulai testing

Beberapa skenario di bawah **akan gagal bukan karena bug**, kalau SQL berikut belum dijalankan di Supabase (semuanya juga ada di komentar `mobile-umkm/src/lib/supabaseClient.ts`, bagian C & D):

- [ ] Kolom `lenders.min_fintrust_score` + policy UPDATE `lenders` (bagian C)
- [ ] Kolom `lender_profiles.notification_prefs` + `lender_profiles.system_prefs` + policy UPDATE `profiles` & `lender_profiles` (bagian D)
- [ ] Kolom `business_relations.sync_id` + `scores.profil_snapshot` (dari sesi sebelumnya — snapshot per-sinkronisasi)

Siapkan juga data akun berikut sebelum mulai:
- Minimal **2 akun UMKM** berbeda (buat cek isolasi data & aturan satu-pengajuan-aktif)
- Minimal **2 akun lender berbeda institusi** (buat cek celah keamanan yang sudah diperbaiki)
- Kredensial untuk masuk ke Supabase Table Editor (buat verifikasi beberapa skenario yang tidak kelihatan cuma dari UI)

---

## A. Sisi UMKM (`mobile-umkm`)

### A1. Registrasi & Sinkronisasi AI dasar

- [ ] **TC-UMKM-01** — Registrasi akun UMKM baru, isi sektor usaha (pilih dari dropdown: Perdagangan/Kuliner/Jasa/Manufaktur/Pertanian/Lainnya). *Expected:* akun dan `umkm_profiles` baru berhasil dibuat, langsung bisa login.
- [ ] **TC-UMKM-02** — Jalankan "Sinkronisasi AI" lengkap, pilih jalur **Catat Manual** untuk omzet (isi nominal, frekuensi, upload foto bukti). *Expected:* skor keluar di akhir, tidak ada error.
- [ ] **TC-UMKM-03** — Di step Rantai Pasok, tambah minimal 2 supplier (nama, bahan suplai, cara bayar, rating, upload minimal 1 foto nota per supplier). *Expected:* tiap supplier berhasil tersimpan (cek tidak ada pesan error tersembunyi di layar).
- [ ] **TC-UMKM-04** — Selesaikan sampai skor akhir tampil. *Expected:* daftar "pendana yang cocok" di halaman hasil TIDAK kosong (asumsi belum ada lender yang pasang ambang skor tinggi) dan skor yang tampil bukan angka placeholder `78`.

### A2. Cari & Ajukan Pendana (`Pendana.tsx`)

- [ ] **TC-UMKM-05** — Buka tab "Cari Pendana" **sebelum** Sinkronisasi AI pernah dilakukan (pakai akun UMKM baru yang belum sync). *Expected:* muncul ajakan "Selesaikan Sinkronisasi AI Dulu", bukan daftar lender atau skor palsu.
- [ ] **TC-UMKM-06** — Refresh halaman "Cari Pendana" untuk UMKM yang **sudah** sinkronisasi. *Expected:* tidak sempat "kedip" nampilin ajakan sinkronisasi sebelum daftar aslinya muncul.
- [ ] **TC-UMKM-07** — (Setelah `TC-LENDER-06` di bawah — set ambang skor lender tertentu lebih tinggi dari skor UMKM ini) — buka tab "Cari Pendana". *Expected:* lender itu **tidak muncul** di daftar/filter kategori manapun.
- [ ] **TC-UMKM-08** — Ajukan pinjaman ke satu lender sampai selesai (step 1-4, termasuk upload NPWP/Surat Izin/Rekening Koran). *Expected:* status "Sukses", pengajuan baru muncul di tab "Riwayat Pengajuan" dengan status menunggu/diajukan.
- [ ] **TC-UMKM-09** — Segera setelah `TC-UMKM-08`, coba klik "Ajukan Sekarang" di lender lain (lender yang berbeda). *Expected:* **diblokir** — muncul pesan "Pengajuan Masih Diproses" menyebut nama lender yang pengajuannya masih menunggu, bukan daftar lender biasa.
- [ ] **TC-UMKM-10** — Dari Beranda, klik "Ajukan" di kartu "Rekomendasi Pendana" (jalur deep-link, bukan dari tab Cari Pendana langsung) selagi masih ada pengajuan pending dari `TC-UMKM-08`. *Expected:* tetap diblokir sama seperti TC-UMKM-09 (modal tidak terbuka).
- [ ] **TC-UMKM-11** — (Setelah lender approve/reject pengajuan itu di `TC-LENDER-04`/`TC-LENDER-05`) — buka lagi tab "Cari Pendana". *Expected:* gerbang terbuka lagi, bisa mengajukan ke lender manapun termasuk yang sama.

### A3. Beranda

- [ ] **TC-UMKM-12** — Cek kartu "Rekomendasi Pendana" di Beranda untuk UMKM yang skornya di bawah ambang beberapa lender. *Expected:* lender yang tidak memenuhi ambang tidak direkomendasikan (kalau sudah pernah sinkronisasi).
- [ ] **TC-UMKM-13** — Cek kartu ini untuk UMKM yang **belum pernah** sinkronisasi. *Expected:* tetap tampil daftar (tidak difilter skor, sesuai desain — beda dari tab Cari Pendana yang gate penuh).

---

## B. Sisi Lender (`web-lender`)

### B1. Login & isolasi data (celah keamanan yang sudah diperbaiki)

- [ ] **TC-LENDER-01** — Login sebagai Lender A, buka "Wawasan Data Alternatif", catat satu `id` pengajuan yang tampil di daftar.
- [ ] **TC-LENDER-02** — Login sebagai Lender B (institusi berbeda), coba akses URL `/wawasan-data/<id-dari-TC-LENDER-01>` secara langsung (ketik manual di address bar). *Expected:* **ditolak** dengan pesan error ("Data pengajuan kosong, terblokir RLS, atau ID tidak cocok"), BUKAN menampilkan data pengajuan milik Lender A.
- [ ] **TC-LENDER-03** — Ulangi TC-LENDER-02 tapi untuk URL `/analisis-jaringan/<id>` dan `/pengaturan` → cek juga tidak ada cara Lender B melihat data institusi Lender A.

### B2. Review Pengajuan (`DataInsightsDetail.tsx`)

- [ ] **TC-LENDER-04** — Buka detail pengajuan dari `TC-UMKM-08`, cek tab "Verifikasi Dokumen" (KTP, selfie, NPWP dst. tampil) dan tab "Analisis Usaha" (data supplier + tombol "Foto Nota" per baris berfungsi buka galeri foto yang benar untuk supplier itu).
- [ ] **TC-LENDER-05** — Di tab "Analisis Usaha", cek kartu "Bukti Omzet Manual" muncul (karena `TC-UMKM-02` pakai jalur manual) dengan nominal/frekuensi/foto bukti yang sesuai yang diisi UMKM.
- [ ] **TC-LENDER-06** — Klik "Setujui" pada pengajuan ini. *Expected:* status berubah, kembali ke daftar antrean.
- [ ] **TC-LENDER-07 (kritis — cek data beku)** — Minta UMKM (akun dari TC-UMKM-08) sinkronisasi AI **ulang** dengan data yang jelas berbeda (KTP baru/supplier baru/omzet beda). Setelah itu, buka LAGI detail pengajuan yang sudah disetujui di TC-LENDER-06. *Expected:* data yang tampil **tetap sama seperti sebelum resync** (KTP lama, supplier lama, dst.) — TIDAK ikut berubah mengikuti sinkronisasi baru.
- [ ] **TC-LENDER-08** — Klik "Lihat Visualisasi Jaringan" dari tab Analisis Usaha pengajuan ini. *Expected:* nama node tengah = nama UMKM, node satelit = supplier asli (bukan "Pemasok A" dkk.), skor per-node masuk akal dibanding data `cara_bayar`/`rating` supplier di tabel.
- [ ] **TC-LENDER-09** — Ajukan pengajuan baru dari UMKM yang pakai jalur **B2B** (bukan supplier manual) saat Sinkronisasi AI, lalu buka Analisis Jaringan untuk pengajuan itu. *Expected:* tampil pesan kosong menyebut nama platform B2B, bukan grafik kosong/rusak.

### B3. Dasbor Utama (`MainDashboard.tsx`)

- [ ] **TC-LENDER-10** — Buka Dasbor Utama, bandingkan angka "UMKM Mengajukan" dan "Total Pinjaman Disetujui" dengan hitung manual dari daftar di "Wawasan Data Alternatif" untuk lender yang sama. *Expected:* angka cocok.
- [ ] **TC-LENDER-11** — Cek chart "Distribusi Risiko" dan "Sektor Industri" tidak nge-crash / tampil pesan kosong yang wajar kalau lender ini belum punya pengajuan berskor sama sekali (pakai akun lender baru yang belum ada pengajuan masuk).
- [ ] **TC-LENDER-12** — Klik salah satu baris di tabel "Aplikasi Pinjaman Terbaru". *Expected:* langsung pindah ke halaman detail pengajuan yang benar.

### B4. Pengaturan (`Settings.tsx`)

- [ ] **TC-LENDER-13** — Isi & simpan card "Profil Pengguna" (nama, jabatan). Refresh halaman. *Expected:* nilai yang disimpan tetap muncul (bukan balik ke kosong/default).
- [ ] **TC-LENDER-14** — Ulangi untuk card "Notifikasi", "Sistem", dan "Profil Institusi Pendana" — masing-masing simpan lalu refresh, cek datanya benar-benar persisten.
- [ ] **TC-LENDER-15** — Set "Ambang Skor FinTrust" ke angka tertentu (mis. 70), simpan, refresh — cek nilainya tetap. Lalu **hapus isinya** (kosongkan) dan simpan lagi. *Expected:* setelah dikosongkan, lender ini menerima UMKM skor berapa pun lagi (cek balik ke `TC-UMKM-07` dengan UMKM yang tadinya terblokir — sekarang harus muncul).
- [ ] **TC-LENDER-16** — Coba isi ambang skor dengan nilai di luar 0-100 (mis. `150` atau `-5`). *Expected:* ditolak dengan pesan validasi, tidak tersimpan.
- [ ] **TC-LENDER-17** — Kalau salah satu card gagal simpan: baca pesan errornya. *Expected:* pesan error jelas menyebut kemungkinan penyebab (kolom belum dibuat / RLS belum diatur), BUKAN pesan "berhasil" padahal sebenarnya tidak tersimpan.

---

## Ringkasan lapor defect

Kalau ada yang gagal, kasih tahu saya dengan format: **ID skenario** + **apa yang terjadi** (vs yang diharapkan) + **akun/data yang dipakai** waktu itu (biar saya bisa reproduksi). Screenshot kalau ada bantu banget terutama buat masalah tampilan.
