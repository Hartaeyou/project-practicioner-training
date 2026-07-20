import { useEffect, useState } from 'react';
import { User, Bell, Database, Building2, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatThousands } from '@/lib/format';

type Message = { type: 'error' | 'success'; text: string } | null;

function ProfilPenggunaCard() {
  const { lenderProfile } = useAuth();
  const [namaLengkap, setNamaLengkap] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!lenderProfile) return;
    setNamaLengkap(lenderProfile.fullName ?? '');
    setJabatan(lenderProfile.jabatan ?? '');
    setIsLoading(false);
  }, [lenderProfile]);

  const handleSave = async () => {
    if (!lenderProfile) return;
    setIsSaving(true);
    setMessage(null);

    // Dua tabel terpisah (profiles + lender_profiles) — .select() setelah
    // .update() WAJIB di keduanya, sama seperti FintrustThresholdCard di
    // bawah: tanpa itu, RLS yang diam-diam memblokir baris kelihatan sukses
    // padahal 0 baris berubah.
    const [profileRes, lenderProfileRes] = await Promise.all([
      supabase.from('profiles').update({ full_name: namaLengkap }).eq('id', lenderProfile.id).select('id'),
      supabase
        .from('lender_profiles')
        .update({ jabatan })
        .eq('profile_id', lenderProfile.id)
        .select('profile_id'),
    ]);
    setIsSaving(false);

    if (profileRes.error) console.error('Gagal menyimpan nama lengkap:', profileRes.error);
    if (lenderProfileRes.error) console.error('Gagal menyimpan jabatan:', lenderProfileRes.error);

    const gagal: string[] = [];
    if (profileRes.error || !profileRes.data?.length) gagal.push('Nama Lengkap');
    if (lenderProfileRes.error || !lenderProfileRes.data?.length) gagal.push('Jabatan');

    if (gagal.length > 0) {
      setMessage({
        type: 'error',
        text: `Gagal menyimpan (${gagal.join(', ')}) — kemungkinan besar policy RLS UPDATE untuk tabel profiles/lender_profiles belum ada (lihat bagian D di mobile-umkm/src/lib/supabaseClient.ts).`,
      });
    } else {
      setMessage({ type: 'success', text: 'Profil berhasil disimpan.' });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Profil Pengguna</h3>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              value={lenderProfile?.email ?? ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Hubungi admin untuk mengubah email (butuh verifikasi ulang lewat Supabase Auth).
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Jabatan</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {message && (
            <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      )}
    </div>
  );
}

const NOTIFICATION_ITEMS: { key: string; label: string; default: boolean }[] = [
  { key: 'aplikasi_pinjaman_baru', label: 'Aplikasi pinjaman baru', default: true },
  { key: 'persetujuan_otomatis', label: 'Persetujuan otomatis', default: true },
  { key: 'peringatan_risiko_tinggi', label: 'Peringatan risiko tinggi', default: true },
  { key: 'laporan_harian', label: 'Laporan harian', default: false },
  { key: 'update_sistem', label: 'Update sistem', default: true },
];

function NotifikasiCard() {
  const { lenderProfile } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!lenderProfile) return;
    const fetchPrefs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lender_profiles')
        .select('notification_prefs')
        .eq('profile_id', lenderProfile.id)
        .maybeSingle();

      const defaults = Object.fromEntries(NOTIFICATION_ITEMS.map((i) => [i.key, i.default]));
      if (error) {
        console.error('Gagal memuat preferensi notifikasi:', error);
        setMessage({
          type: 'error',
          text:
            'Gagal memuat data: ' +
            error.message +
            ' (kemungkinan kolom notification_prefs belum dibuat — lihat bagian D di mobile-umkm/src/lib/supabaseClient.ts).',
        });
        setPrefs(defaults);
      } else {
        setPrefs({ ...defaults, ...(data?.notification_prefs ?? {}) });
      }
      setIsLoading(false);
    };
    fetchPrefs();
  }, [lenderProfile]);

  const handleSave = async () => {
    if (!lenderProfile) return;
    setIsSaving(true);
    setMessage(null);
    const { data, error } = await supabase
      .from('lender_profiles')
      .update({ notification_prefs: prefs })
      .eq('profile_id', lenderProfile.id)
      .select('profile_id');
    setIsSaving(false);

    if (error) {
      console.error('Gagal menyimpan preferensi notifikasi:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else if (!data || data.length === 0) {
      setMessage({
        type: 'error',
        text: 'Tidak tersimpan: kemungkinan besar policy RLS UPDATE untuk tabel lender_profiles belum ada (lihat bagian D di mobile-umkm/src/lib/supabaseClient.ts).',
      });
    } else {
      setMessage({ type: 'success', text: 'Preferensi notifikasi berhasil disimpan.' });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {NOTIFICATION_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                checked={prefs[item.key] ?? item.default}
                onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          ))}
          <p className="text-xs text-gray-400">
            Preferensi ini tersimpan, tapi belum ada sistem pengiriman notifikasi yang membacanya.
          </p>
          {message && (
            <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Notifikasi'}
          </button>
        </div>
      )}
    </div>
  );
}

const BAHASA_OPTIONS = ['Bahasa Indonesia', 'English'];
const ZONA_WAKTU_OPTIONS = ['WIB (GMT+7)', 'WITA (GMT+8)', 'WIT (GMT+9)'];
const MATA_UANG_OPTIONS = ['IDR (Rupiah)', 'USD (Dollar)'];

type SystemPrefs = { bahasa: string; zona_waktu: string; format_mata_uang: string };
const DEFAULT_SYSTEM_PREFS: SystemPrefs = {
  bahasa: BAHASA_OPTIONS[0],
  zona_waktu: ZONA_WAKTU_OPTIONS[0],
  format_mata_uang: MATA_UANG_OPTIONS[0],
};

function SistemCard() {
  const { lenderProfile } = useAuth();
  const [prefs, setPrefs] = useState<SystemPrefs>(DEFAULT_SYSTEM_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!lenderProfile) return;
    const fetchPrefs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lender_profiles')
        .select('system_prefs')
        .eq('profile_id', lenderProfile.id)
        .maybeSingle();

      if (error) {
        console.error('Gagal memuat preferensi sistem:', error);
        setMessage({
          type: 'error',
          text:
            'Gagal memuat data: ' +
            error.message +
            ' (kemungkinan kolom system_prefs belum dibuat — lihat bagian D di mobile-umkm/src/lib/supabaseClient.ts).',
        });
      } else if (data?.system_prefs) {
        setPrefs({ ...DEFAULT_SYSTEM_PREFS, ...data.system_prefs });
      }
      setIsLoading(false);
    };
    fetchPrefs();
  }, [lenderProfile]);

  const handleSave = async () => {
    if (!lenderProfile) return;
    setIsSaving(true);
    setMessage(null);
    const { data, error } = await supabase
      .from('lender_profiles')
      .update({ system_prefs: prefs })
      .eq('profile_id', lenderProfile.id)
      .select('profile_id');
    setIsSaving(false);

    if (error) {
      console.error('Gagal menyimpan preferensi sistem:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else if (!data || data.length === 0) {
      setMessage({
        type: 'error',
        text: 'Tidak tersimpan: kemungkinan besar policy RLS UPDATE untuk tabel lender_profiles belum ada (lihat bagian D di mobile-umkm/src/lib/supabaseClient.ts).',
      });
    } else {
      setMessage({ type: 'success', text: 'Preferensi sistem berhasil disimpan.' });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <Database className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Sistem</h3>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Bahasa</label>
            <select
              value={prefs.bahasa}
              onChange={(e) => setPrefs((p) => ({ ...p, bahasa: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BAHASA_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Zona Waktu</label>
            <select
              value={prefs.zona_waktu}
              onChange={(e) => setPrefs((p) => ({ ...p, zona_waktu: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ZONA_WAKTU_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Format Mata Uang</label>
            <select
              value={prefs.format_mata_uang}
              onChange={(e) => setPrefs((p) => ({ ...p, format_mata_uang: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MATA_UANG_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">
            Preferensi tersimpan, tapi belum diterapkan ke tampilan lain — seluruh aplikasi saat
            ini masih memakai Bahasa Indonesia &amp; format Rupiah secara tetap.
          </p>
          {message && (
            <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Sistem'}
          </button>
        </div>
      )}
    </div>
  );
}

const TIPE_OPTIONS: Array<'bank' | 'fintech' | 'koperasi'> = ['bank', 'fintech', 'koperasi'];
const TIPE_LABELS: Record<string, string> = { bank: 'Bank', fintech: 'Fintech', koperasi: 'Koperasi' };

function ProfilInstitusiCard() {
  const { lenderProfile } = useAuth();
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'bank' | 'fintech' | 'koperasi'>('bank');
  const [bungaRate, setBungaRate] = useState('');
  const [limitPlafon, setLimitPlafon] = useState('');
  const [logo, setLogo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!lenderProfile) return;
    const fetchLender = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lenders')
        .select('nama, tipe, bunga_rate, limit_plafon, logo')
        .eq('id', lenderProfile.lender.id)
        .maybeSingle();

      if (error) {
        console.error('Gagal memuat profil institusi:', error);
        setMessage({ type: 'error', text: 'Gagal memuat data: ' + error.message });
      } else if (data) {
        setNama(data.nama ?? '');
        setTipe((data.tipe as 'bank' | 'fintech' | 'koperasi') ?? 'bank');
        setBungaRate(data.bunga_rate ?? '');
        setLimitPlafon(data.limit_plafon != null ? String(data.limit_plafon) : '');
        setLogo(data.logo ?? '');
      }
      setIsLoading(false);
    };
    fetchLender();
  }, [lenderProfile]);

  const handleSave = async () => {
    if (!lenderProfile) return;

    const trimmedLimit = limitPlafon.trim();
    const parsedLimit = trimmedLimit === '' ? null : Number(trimmedLimit);
    if (parsedLimit !== null && (!Number.isFinite(parsedLimit) || parsedLimit < 0)) {
      setMessage({ type: 'error', text: 'Limit plafon harus berupa angka 0 atau lebih.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    // Tabel lenders sama dengan FintrustThresholdCard — policy RLS UPDATE-nya
    // dipakai bersama, tidak perlu policy baru khusus card ini.
    const { data, error } = await supabase
      .from('lenders')
      .update({ nama, tipe, bunga_rate: bungaRate, limit_plafon: parsedLimit, logo })
      .eq('id', lenderProfile.lender.id)
      .select('id');
    setIsSaving(false);

    if (error) {
      console.error('Gagal menyimpan profil institusi:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else if (!data || data.length === 0) {
      setMessage({
        type: 'error',
        text: 'Tidak tersimpan: kemungkinan besar policy RLS UPDATE untuk tabel lenders belum ada (lihat bagian C di mobile-umkm/src/lib/supabaseClient.ts).',
      });
    } else {
      setMessage({ type: 'success', text: 'Profil institusi berhasil disimpan.' });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-violet-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Profil Institusi Pendana</h3>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Nama Institusi</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Tipe</label>
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value as 'bank' | 'fintech' | 'koperasi')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {TIPE_LABELS[o]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Bunga</label>
              <input
                type="text"
                placeholder="cth. 1.5%/bulan"
                value={bungaRate}
                onChange={(e) => setBungaRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Limit Plafon (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(limitPlafon)}
                onChange={(e) => setLimitPlafon(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Logo (emoji/teks singkat)</label>
            <input
              type="text"
              maxLength={4}
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {message && (
            <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Profil Institusi'}
          </button>
        </div>
      )}
    </div>
  );
}

function FintrustThresholdCard() {
  const { lenderProfile } = useAuth();
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!lenderProfile) return;
    const fetchThreshold = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lenders')
        .select('min_fintrust_score')
        .eq('id', lenderProfile.lender.id)
        .maybeSingle();

      if (error) {
        console.error('Gagal memuat ambang skor FinTrust:', error);
        setMessage({
          type: 'error',
          text:
            'Gagal memuat data: ' +
            error.message +
            ' (kemungkinan kolom min_fintrust_score belum dibuat — lihat komentar bagian C di mobile-umkm/src/lib/supabaseClient.ts).',
        });
      } else if (data) {
        setValue(data.min_fintrust_score != null ? String(data.min_fintrust_score) : '');
      }
      setIsLoading(false);
    };
    fetchThreshold();
  }, [lenderProfile]);

  const handleSave = async () => {
    if (!lenderProfile) return;

    const trimmed = value.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 100)) {
      setMessage({ type: 'error', text: 'Ambang skor harus angka 0-100, atau kosongkan untuk tanpa ambang.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    // .select() setelah .update() WAJIB — tanpa ini, kalau RLS diam-diam
    // memblokir baris (policy UPDATE belum ada/tidak cocok), Supabase
    // mengembalikan error: null seolah sukses padahal 0 baris berubah.
    const { data, error } = await supabase
      .from('lenders')
      .update({ min_fintrust_score: parsed })
      .eq('id', lenderProfile.lender.id)
      .select('id');
    setIsSaving(false);

    if (error) {
      console.error('Gagal menyimpan ambang skor FinTrust:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else if (!data || data.length === 0) {
      console.error('Update lenders tidak mengubah baris apa pun — kemungkinan diblokir RLS.');
      setMessage({
        type: 'error',
        text: 'Tidak tersimpan: server menolak perubahan tanpa pesan error (kemungkinan besar policy RLS UPDATE untuk tabel lenders belum ada — lihat komentar bagian C di mobile-umkm/src/lib/supabaseClient.ts).',
      });
    } else {
      setMessage({ type: 'success', text: 'Ambang skor berhasil disimpan.' });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Ambang Skor FinTrust</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        UMKM dengan skor FinTrust di bawah ambang ini tidak akan melihat institusi Anda
        sebagai pilihan pendana. Kosongkan untuk menerima semua skor.
      </p>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Skor Minimum (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Tanpa ambang"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {message && (
            <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Ambang Skor'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola preferensi dan konfigurasi sistem</p>
      </div>

      {/* Settings Sections — tiap card mandiri: fetch, state, dan tombol
          simpan sendiri-sendiri (tidak ada lagi tombol "Simpan Perubahan"
          bersama di bawah, karena semua card di sini sekarang real). */}
      <div className="grid grid-cols-2 gap-6">
        <ProfilPenggunaCard />
        <NotifikasiCard />
        <SistemCard />
        <ProfilInstitusiCard />
        <FintrustThresholdCard />
      </div>
    </div>
  );
}
