// src/lib/AuthContext.tsx
// Auth context khusus untuk web-lender.
// Setelah login, otomatis narik data profiles + lender_profiles + lenders
// jadi satu objek `lenderProfile`, dan MENOLAK akses kalau role bukan 'lender'.
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
  } from 'react';
  import type { Session, User } from '@supabase/supabase-js';
  import { supabase } from './supabaseClient';
  
  export interface LenderProfile {
    id: string; // = profiles.id = auth.users.id
    email: string;
    fullName: string | null;
    role: string;
    jabatan: string | null;
    lender: {
      id: string;
      nama: string;
      tipe: string | null;
      logo: string | null;
    };
  }
  
  interface AuthContextValue {
    session: Session | null;
    user: User | null;
    lenderProfile: LenderProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
  }
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  // Ambil profiles + lender_profiles + lenders dalam satu query (nested select).
  // Kalau user login tapi role-nya bukan 'lender', atau belum ada baris
  // lender_profiles yang link ke institusi manapun, dianggap tidak valid.
  async function loadLenderProfile(userId: string): Promise<LenderProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        role,
        lender_profiles (
          jabatan,
          lenders ( id, nama, tipe, logo )
        )
      `
      )
      .eq('id', userId)
      .single();
  
    if (error || !data) {
      console.error('Gagal memuat profil lender:', error?.message);
      return null;
    }
  
    if (data.role !== 'lender') {
      return null;
    }
  
    // Supabase mengembalikan relasi nested sebagai array (meski 1-ke-1),
    // jadi ambil elemen pertama.
    const lenderProfileRow = Array.isArray(data.lender_profiles)
      ? data.lender_profiles[0]
      : data.lender_profiles;
  
    if (!lenderProfileRow || !lenderProfileRow.lenders) {
      // role sudah 'lender' tapi belum di-link ke institusi manapun
      // di tabel lender_profiles — anggap belum lengkap setup-nya.
      console.error('Akun lender belum terhubung ke institusi manapun (lender_profiles kosong).');
      return null;
    }
  
    const lenderRow = Array.isArray(lenderProfileRow.lenders)
      ? lenderProfileRow.lenders[0]
      : lenderProfileRow.lenders;
  
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      jabatan: lenderProfileRow.jabatan,
      lender: {
        id: lenderRow.id,
        nama: lenderRow.nama,
        tipe: lenderRow.tipe,
        logo: lenderRow.logo,
      },
    };
  }
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [lenderProfile, setLenderProfile] = useState<LenderProfile | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      let isMounted = true;
  
      async function init() {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(currentSession);
  
        if (currentSession?.user) {
          const profile = await loadLenderProfile(currentSession.user.id);
          if (isMounted) setLenderProfile(profile);
        }
        if (isMounted) setLoading(false);
      }
  
      init();
  
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const profile = await loadLenderProfile(newSession.user.id);
          setLenderProfile(profile);
        } else {
          setLenderProfile(null);
        }
      });
  
      return () => {
        isMounted = false;
        listener.subscription.unsubscribe();
      };
    }, []);
  
    async function signIn(email: string, password: string): Promise<{ error: string | null }> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
      if (error) {
        return { error: 'Email atau kata sandi tidak sesuai. Silakan coba lagi.' };
      }
  
      if (!data.user) {
        return { error: 'Terjadi kesalahan saat masuk. Silakan coba lagi.' };
      }
  
      const profile = await loadLenderProfile(data.user.id);
      if (!profile) {
        // Login berhasil di level Supabase Auth, tapi akun ini bukan
        // akun lender yang valid (role salah / belum di-link ke institusi) —
        // jadi langsung sign out lagi supaya tidak nyangkut di state "setengah login".
        await supabase.auth.signOut();
        return { error: 'Akun ini tidak memiliki akses sebagai lender.' };
      }
  
      setLenderProfile(profile);
      return { error: null };
    }
  
    async function signOut() {
      await supabase.auth.signOut();
      setLenderProfile(null);
    }
  
    const value: AuthContextValue = {
      session,
      user: session?.user ?? null,
      lenderProfile,
      loading,
      signIn,
      signOut,
    };
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
    }
    return ctx;
  }