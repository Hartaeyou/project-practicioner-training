// src/lib/ScoreContext.tsx
// Menyimpan hasil onboarding supaya Beranda, Skor, dan Pendana pakai data yang
// sama. `scoreId` diisi setelah OnboardingWizard berhasil insert ke Supabase,
// dipakai Pendana.tsx buat nge-link applications.score_id.

import { createContext, useContext, useState, ReactNode } from 'react';

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
  skorAkhir: 78,
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
};

const ScoreContext = createContext<ScoreContextType>({
  result: defaultResult,
  setResult: () => {},
  resetResult: () => {},
});

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<ScoreResult>(defaultResult);

  return (
    <ScoreContext.Provider
      value={{ result, setResult, resetResult: () => setResult(defaultResult) }}
    >
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  return useContext(ScoreContext);
}