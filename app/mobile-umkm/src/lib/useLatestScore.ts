// src/lib/useLatestScore.ts
// ScoreContext cuma nyimpen hasil Sinkronisasi AI di memory (React state),
// jadi hilang kalau halaman di-refresh. Hook ini ambil baris terakhir dari
// tabel `scores` di Supabase supaya Profil.tsx tetap bisa nampilin data
// lengkap walau ScoreContext masih kosong (misal user baru buka app lagi).

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export type LatestScore = {
  id: string;
  umkm_id: string;
  fintrust_score: number;
  risk_level: string;
  breakdown: {
    riwayatTransaksi?: number;
    lamaUsaha?: number;
    stabilitasPendapatan?: number;
  } | null;
  xai_narrative: string | null;
  created_at: string;
};

export function useLatestScore(umkmProfileId: string | undefined) {
  const [score, setScore] = useState<LatestScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!umkmProfileId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    supabase
      .from('scores')
      .select('*')
      .eq('umkm_id', umkmProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setScore(data as LatestScore | null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [umkmProfileId]);

  return { score, loading };
}