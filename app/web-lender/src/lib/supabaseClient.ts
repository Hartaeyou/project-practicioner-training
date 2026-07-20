// src/lib/supabaseClient.ts
// File ini sama persis dengan versi mobile — pakai .env yang sama
// (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY), karena kedua project
// sama-sama dibangun di atas Vite.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env vars belum diisi. Cek file .env di root project (lihat .env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);