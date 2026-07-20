// src/lib/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'umkm' | 'lender';
  no_hp: string | null;
  pdp_consent: boolean;
};

export type UmkmProfile = {
  id: string;
  profile_id: string;
  nama_usaha: string;
  sektor: string | null;
  omzet_estimasi: string | null;
  alamat?: string | null;
  lama_usaha_bulan?: number | null;
  ktp_url?: string | null;
  selfie_url?: string | null;
  omzet_manual_juta_per_bulan?: number | null;
  omzet_manual_frekuensi_per_bulan?: number | null;
  omzet_manual_bukti_url?: string | null;
};

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  umkmProfile: UmkmProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  umkmProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [umkmProfile, setUmkmProfile] = useState<UmkmProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Gagal ambil profile:', profileError);
      setProfile(null);
    } else {
      setProfile(profileData as Profile);

      // Cek apakah ada data bisnis pending di localStorage (kasus email verification).
      // Ini terjadi saat user daftar dengan email verification aktif:
      // data bisnis disimpan dulu di localStorage, baru di-insert ke DB
      // setelah user login pertama kali dengan session yang sudah aktif.
      const email = (profileData as Profile).email;
      const pendingKey = `fintrust_pending_umkm_${email}`;
      const pendingRaw = localStorage.getItem(pendingKey);

      if (pendingRaw) {
        // Cek dulu apakah umkm_profiles sudah ada (hindari duplicate insert)
        const { data: existingUmkm } = await supabase
          .from('umkm_profiles')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle();

        if (!existingUmkm) {
          try {
            const pending = JSON.parse(pendingRaw);

            // Update no_hp & consent
            await supabase
              .from('profiles')
              .update({
                no_hp: pending.phone,
                pdp_consent: true,
                pdp_consent_at: new Date().toISOString(),
              })
              .eq('id', userId);

            // Insert umkm_profiles — sekarang session sudah aktif, RLS aman
            const { error: umkmError } = await supabase
              .from('umkm_profiles')
              .insert({
                profile_id: userId,
                nama_usaha: pending.businessName,
                sektor: pending.businessType,
                omzet_estimasi: pending.revenue,
              });

            if (!umkmError) {
              localStorage.removeItem(pendingKey);
              console.log('Profil usaha berhasil disimpan dari pending data.');
            } else {
              console.error('Gagal simpan pending umkm_profiles:', umkmError);
            }
          } catch (e) {
            console.error('Gagal parse pending data:', e);
          }
        } else {
          // umkm_profiles sudah ada, hapus pending yang tidak terpakai
          localStorage.removeItem(pendingKey);
        }
      }
    }

    // Ambil umkm_profiles (termasuk yang baru saja di-insert di atas)
    const { data: umkmData } = await supabase
      .from('umkm_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    setUmkmProfile(umkmData as UmkmProfile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setUmkmProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Dipanggil manual setelah Register.tsx selesai insert umkm_profiles,
  // supaya AuthContext langsung punya data terbaru tanpa nunggu refresh halaman.
  // Pakai getUser() (bukan state `session`) karena saat baru daftar, closure
  // submit() di Register.tsx masih terikat ke render lama dengan session null.
  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await loadProfile(data.user.id);
    }
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, umkmProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}