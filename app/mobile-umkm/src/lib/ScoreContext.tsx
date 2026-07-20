// src/lib/ScoreContext.tsx
// Menyimpan hasil onboarding supaya Beranda, Skor, dan Pendana pakai data yang
// sama. `scoreId` diisi setelah OnboardingWizard berhasil insert ke Supabase,
// dipakai Pendana.tsx buat nge-link applications.score_id.
//
// FIX: sebelumnya state ini cuma hidup di memori React (useState) dan tidak
// pernah di-hydrate ulang dari Supabase. Akibatnya begitu halaman di-refresh
// atau provider ini remount, state balik ke `defaultResult` (skor 78 —
// itu cuma contoh/placeholder, bukan hasil perhitungan asli), padahal skor
// yang sebenarnya (mis. 61) sudah tersimpan di tabel `scores`.
// Sekarang begitu umkmProfile tersedia, kita fetch skor terakhir dari
// Supabase dan isi ulang context-nya.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

export type LoanOffer = {
  id: string;
  nama: string;
  bunga: string;
  limit: string;
};

export type ScoreResult = {
  completed: boolean;
  scoreId: string | null;
  skorAkhir: number;
  riwayatTransaksi: number;
  lamaUsaha: number;
  stabilitasPendapatan: number;
  statusKelayakan: 'Tinggi' | 'Perlu Verifikasi';
  namaUsaha: string;
  namaPemilik: string;
  danaDiajukan: number;
  omzetBulanan: number;
  frekuensiTransaksi: number;
  lenders: LoanOffer[];
};

const defaultResult: ScoreResult = {
  completed: false,
  scoreId: null,
  skorAkhir: 78, // contoh/placeholder — HANYA dipakai kalau completed: false
  riwayatTransaksi: 85,
  lamaUsaha: 72,
  stabilitasPendapatan: 78,
  statusKelayakan: 'Tinggi',
  namaUsaha: '',
  namaPemilik: '',
  danaDiajukan: 0,
  omzetBulanan: 0,
  frekuensiTransaksi: 0,
  lenders: [],
};

type ScoreContextType = {
  result: ScoreResult;
  setResult: (r: ScoreResult) => void;
  resetResult: () => void;
  isHydrating: boolean;
};

const ScoreContext = createContext<ScoreContextType>({
  result: defaultResult,
  setResult: () => {},
  resetResult: () => {},
  isHydrating: false,
});

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<ScoreResult>(defaultResult);
  const [isHydrating, setIsHydrating] = useState(false);
  const { umkmProfile, profile } = useAuth();

  // FIX: hydrate dari Supabase begitu umkmProfile tersedia, supaya skor
  // asli tidak "hilang" tiap kali halaman di-refresh.
  useEffect(() => {
    if (!umkmProfile) {
      // Logout / belum ada profil usaha (mis. akun baru saja dibuat) —
      // pastikan tidak ada sisa skor akun lain nyangkut di state.
      setResult(defaultResult);
      return;
    }
    let active = true;
    setIsHydrating(true);

    supabase
      .from('scores')
      .select('*')
      .eq('umkm_id', umkmProfile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) {
          setResult((prev) => ({
            ...prev,
            completed: true,
            scoreId: data.id,
            skorAkhir: data.fintrust_score,
            riwayatTransaksi: data.breakdown?.riwayatTransaksi ?? prev.riwayatTransaksi,
            lamaUsaha: data.breakdown?.lamaUsaha ?? prev.lamaUsaha,
            stabilitasPendapatan: data.breakdown?.stabilitasPendapatan ?? prev.stabilitasPendapatan,
            statusKelayakan: data.risk_level === 'rendah' ? 'Tinggi' : 'Perlu Verifikasi',
            namaUsaha: umkmProfile.nama_usaha ?? prev.namaUsaha,
            namaPemilik: profile?.full_name ?? prev.namaPemilik,
            // Catatan: kolom ini belum tentu ada di tabel `scores` kamu.
            // Kalau belum ditambahkan, nilainya akan tetap 0 (lihat SQL di bawah).
            danaDiajukan: data.dana_diajukan ?? prev.danaDiajukan,
            omzetBulanan: data.omzet_bulanan ?? prev.omzetBulanan,
            frekuensiTransaksi: data.frekuensi_transaksi ?? prev.frekuensiTransaksi,
          }));
        } else {
          // Tidak ada skor untuk umkm_id ini (mis. akun baru daftar di browser
          // yang sebelumnya login akun lain yang sudah punya skor). Tanpa ini,
          // `result` di state akan tetap membawa skor akun sebelumnya karena
          // ScoreProvider tidak remount saat ganti akun.
          setResult({
            ...defaultResult,
            namaUsaha: umkmProfile.nama_usaha ?? '',
            namaPemilik: profile?.full_name ?? '',
          });
        }
        setIsHydrating(false);
      });

    return () => {
      active = false;
    };
  }, [umkmProfile, profile]);

  return (
    <ScoreContext.Provider
      value={{ result, setResult, resetResult: () => setResult(defaultResult), isHydrating }}
    >
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  return useContext(ScoreContext);
}