// src/lib/useLenders.ts
// Satu sumber data lender, dipakai OnboardingWizard (rekomendasi hasil skor)
// dan Pendana.tsx (daftar buat "Ajukan Sekarang"). Sebelumnya dua tempat ini
// masing-masing punya data hardcoded sendiri yang gak nyambung.

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export type Lender = {
  id: string;
  nama: string;
  tipe: 'bank' | 'fintech' | 'koperasi';
  limit_plafon: number;
  bunga_rate: string;
  logo: string;
};

export function useLenders() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from('lenders')
      .select('*')
      .order('nama', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setLenders((data ?? []) as Lender[]);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { lenders, loading, error };
}

export function formatRupiah(n: number): string {
  if (n >= 1_000_000) return `Rp ${Math.round(n / 1_000_000)} Juta`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}