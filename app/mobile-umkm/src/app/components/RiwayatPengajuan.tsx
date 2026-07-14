// src/app/components/RiwayatPengajuan.tsx
// Riwayat pengajuan pinjaman UMKM ke pendana — dibaca dari tabel `applications`,
// lender-nya di-lookup dari data yang sama dipakai Pendana.tsx (useLenders),
// jadi gak perlu query join terpisah.
//
// Catatan Supabase: tabel `applications` idealnya punya kolom `status`
// (text, default 'diajukan') supaya badge status di bawah ini akurat.
// Kalau kolom `status` belum ada, semua pengajuan akan tampil sebagai
// "Menunggu Diproses" (fallback default).

import { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle2, XCircle, FileClock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useLenders, formatRupiah, Lender } from '../../lib/useLenders';
import { supabase } from '../../lib/supabaseClient';

type Application = {
  id: string;
  lender_id: string;
  score_id: string | null;
  nominal_diajukan: number;
  status: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  diajukan: { label: 'Menunggu Diproses', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  diproses: { label: 'Sedang Diverifikasi', color: 'text-blue-700', bg: 'bg-blue-50', icon: FileClock },
  disetujui: { label: 'Disetujui', color: 'text-[#10B981]', bg: 'bg-green-50', icon: CheckCircle2 },
  ditolak: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
};

function statusInfo(status: string | null) {
  return STATUS_CONFIG[status ?? 'diajukan'] ?? STATUS_CONFIG.diajukan;
}

function lenderFor(lenders: Lender[], id: string): Lender | undefined {
  return lenders.find((l) => l.id === id);
}

export function RiwayatPengajuan() {
  const { umkmProfile } = useAuth();
  const { lenders } = useLenders();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!umkmProfile) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');

    supabase
      .from('applications')
      .select('*')
      .eq('umkm_id', umkmProfile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setApplications((data ?? []) as Application[]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [umkmProfile]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#1D4ED8] animate-spin" />
      </div>
    );
  }

  if (!umkmProfile) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm text-gray-500">
          Lengkapi Sinkronisasi AI di tab Profil dulu sebelum mengajukan pinjaman.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-4">{error}</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <FileClock className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-900 font-semibold mb-1">Belum Ada Pengajuan</p>
        <p className="text-sm text-gray-500">Pengajuan pinjaman yang Anda kirim akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      {applications.map((app) => {
        const lender = lenderFor(lenders, app.lender_id);
        const info = statusInfo(app.status);
        const StatusIcon = info.icon;
        return (
          <div key={app.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{lender?.logo ?? '🏦'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{lender?.nama ?? 'Pendana'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(app.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${info.bg} ${info.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {info.label}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Nominal Diajukan</p>
              <p className="font-semibold text-gray-900">{formatRupiah(app.nominal_diajukan)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}