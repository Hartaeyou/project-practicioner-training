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