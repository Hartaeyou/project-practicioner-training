// src/lib/supabaseClient.ts
// Taruh file ini di folder src/lib/ di KEDUA project (mobile-umkm & web-lender)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env vars belum diisi. Cek file .env di root project (lihat .env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// Contoh pemakaian:
// ============================================================
//
// 1. Register user baru (UMKM)
// const { data, error } = await supabase.auth.signUp({
//   email: 'umkm@contoh.com',
//   password: 'password123',
//   options: { data: { full_name: 'Toko Cahaya Mandiri', role: 'umkm' } }
// });
//
// 2. Login
// const { data, error } = await supabase.auth.signInWithPassword({
//   email: 'umkm@contoh.com',
//   password: 'password123'
// });
//
// 3. Ambil daftar lender (buat isi Pendana.tsx, ganti array hardcoded)
// const { data: lenders, error } = await supabase.from('lenders').select('*');
//
// 4. Ambil skor terakhir milik UMKM yang sedang login
// const { data: score, error } = await supabase
//   .from('scores')
//   .select('*')
//   .eq('umkm_id', umkmProfileId)
//   .order('created_at', { ascending: false })
//   .limit(1)
//   .single();
//
// 5. Kirim pengajuan pinjaman (dari modal di Pendana.tsx)
// const { error } = await supabase.from('applications').insert({
//   umkm_id: umkmProfileId,
//   lender_id: selectedProvider.id,
//   score_id: latestScoreId,
//   nominal_diajukan: 50000000,
//   dokumen: { ktp: 'https://...', npwp: 'https://...' },
//   status: 'diajukan'
// });
//
// ============================================================
// PERUBAHAN SKEMA yang dibutuhkan untuk fitur terbaru:
// ============================================================
//
// A. Tabel `applications` — tambah 2 kolom kalau belum ada:
//    - status        text   default 'diajukan'  (dipakai RiwayatPengajuan.tsx
//                                                 untuk badge: diajukan / diproses /
//                                                 disetujui / ditolak)
//    - dokumen        jsonb  nullable            (menyimpan URL dokumen yang
//                                                 diunggah user: { ktp, npwp,
//                                                 izin_usaha, rekening_koran })
//
//    SQL contoh:
//    alter table applications add column if not exists status text default 'diajukan';
//    alter table applications add column if not exists dokumen jsonb;
//
// B. Storage bucket baru: `dokumen-pengajuan`
//    Authentication > Storage > New bucket > nama: dokumen-pengajuan > Public bucket: ON
//    (dipakai Pendana.tsx untuk upload KTP/NPWP/Surat Izin/Rekening Koran saat
//    verifikasi dokumen di step 2 pengajuan pinjaman)
//
// C. Tabel `lenders` — tambah kolom ambang skor FinTrust minimum per lender
//    (dipakai Pendana.tsx/Beranda.tsx/OnboardingWizard.tsx buat cuma
//    menampilkan/merekomendasikan lender yang skor UMKM-nya memenuhi ambang,
//    dan web-lender/Settings.tsx buat lender atur ambangnya sendiri):
//    - min_fintrust_score  integer  nullable  (NULL = tanpa ambang, semua
//                                              skor lolos)
//
//    SQL:
//    alter table lenders add column if not exists min_fintrust_score integer
//      check (min_fintrust_score is null or min_fintrust_score between 0 and 100);
//
//    Ini juga write PERTAMA dari web-lender ke tabel manapun (sebelumnya app
//    itu cuma baca). Kalau update di Settings.tsx gagal dengan error
//    izin/RLS, jalankan policy ini juga (belum pernah dites langsung dari
//    sini, jadi cuma dijalankan kalau memang perlu):
//    create policy "Lenders can update own institution"
//    on lenders
//    for update
//    using (exists (select 1 from lender_profiles lp where lp.lender_id = lenders.id and lp.profile_id = auth.uid()))
//    with check (exists (select 1 from lender_profiles lp where lp.lender_id = lenders.id and lp.profile_id = auth.uid()));
//
// D. Halaman web-lender/Settings.tsx — card "Profil Pengguna" (edit
//    profiles.full_name + lender_profiles.jabatan), "Notifikasi", dan
//    "Sistem" butuh 2 kolom jsonb baru di `lender_profiles`, plus policy
//    UPDATE untuk `profiles` dan `lender_profiles` (belum ada sama sekali —
//    sebelum ini web-lender cuma pernah baca dua tabel itu, tidak pernah
//    nulis):
//    - lender_profiles.notification_prefs  jsonb  nullable
//    - lender_profiles.system_prefs        jsonb  nullable
//
//    SQL:
//    alter table lender_profiles add column if not exists notification_prefs jsonb;
//    alter table lender_profiles add column if not exists system_prefs jsonb;
//
//    Jalankan HANYA kalau simpan di Settings.tsx gagal dengan pesan
//    "kemungkinan RLS" (pola sama seperti policy lenders di bagian C):
//    create policy "Users can update own profile"
//    on profiles
//    for update
//    using (id = auth.uid())
//    with check (id = auth.uid());
//
//    create policy "Lenders can update own lender_profiles row"
//    on lender_profiles
//    for update
//    using (profile_id = auth.uid())
//    with check (profile_id = auth.uid());