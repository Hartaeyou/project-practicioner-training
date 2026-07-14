// src/app/components/onboarding/OnboardingWizard.tsx
//
// Adaptasi dari requirement Streamlit (app.py) ketua tim.
// Alur: Profil & Dana -> Omzet -> Rantai Pasok -> Hasil & Lender
// Dipanggil dari Profil.tsx lewat tombol "Lanjutkan Sinkronisasi AI".
//
// PERUBAHAN:
// - Nama Pemilik & Nama Usaha TIDAK lagi diinput ulang di sini — diambil
//   otomatis dari data yang sudah disimpan waktu Register (AuthContext).
// - Hasil skor sekarang ditulis ke tabel `scores` Supabase, bukan cuma
//   disimpan di ScoreContext (memory).
// - Daftar lender di step "Hasil" diambil dari tabel `lenders` Supabase
//   (satu sumber yang sama dipakai Pendana.tsx), bukan array hardcoded lagi.

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Upload,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Wallet,
  Link2,
  BarChart3,
  ShieldCheck,
  Store,
  Receipt,
  X,
} from 'lucide-react';
import { useScore, LoanOffer } from '../../../lib/ScoreContext';
import { useAuth } from '../../../lib/AuthContext';
import { useLenders, formatRupiah } from '../../../lib/useLenders';
import { supabase } from '../../../lib/supabaseClient';

interface OnboardingWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

const steps = [
  { label: 'Profil & Dana', icon: Building2 },
  { label: 'Omzet', icon: Wallet },
  { label: 'Rantai Pasok', icon: Link2 },
  { label: 'Hasil', icon: BarChart3 },
];

const walletProviders = ['GoPay Business', 'OVO Merchant', 'DANA Bisnis', 'ShopeePay'];
const b2bPlatforms = ['Mitra Bukalapak', 'GudangAda', 'SRC', 'BukuWarung'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center relative">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                i < current
                  ? 'bg-[#10B981] text-white'
                  : i === current
                  ? 'bg-[#1D4ED8] text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-100 text-gray-400'
              }`}
              animate={i === current ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: i === current ? Infinity : 0 }}
            >
              {i < current ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
            </motion.div>
            <span
              className={`text-[9px] font-semibold mt-1 absolute -bottom-4 whitespace-nowrap ${
                i === current ? 'text-[#1D4ED8]' : i < current ? 'text-[#10B981]' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-1 h-0.5 rounded-full overflow-hidden bg-gray-100">
              <motion.div
                className="h-full bg-[#10B981] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: i < current ? '100%' : '0%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">{label}</label>
      <div
        className={`flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 transition-colors ${
          error ? 'border-red-400' : 'border-transparent focus-within:border-[#1D4ED8]'
        }`}
      >
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 pl-1">{error}</p>}
    </div>
  );
}

function UploadTile({
  label,
  done,
  onUpload,
}: {
  label: string;
  done: boolean;
  onUpload: () => void;
}) {
  return (
    <button
      onClick={onUpload}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors text-left ${
        done ? 'border-[#10B981] bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'
      }`}
    >
      {done ? (
        <CheckCircle2 size={20} className="text-[#10B981] shrink-0" />
      ) : (
        <Upload size={20} className="text-gray-400 shrink-0" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{done ? 'Berhasil diunggah' : 'Ketuk untuk unggah'}</p>
      </div>
    </button>
  );
}

// ============================================================
// STEP 1 — Profil & Dana
// (Nama Pemilik & Nama Usaha sekarang read-only, diambil dari akun)
// ============================================================
type ProfilForm = {
  dana: string;
  tujuanDana: string;
};

function StepProfilDana({
  namaPemilik,
  namaUsaha,
  form,
  onChange,
  errors,
  ktpDone,
  selfieDone,
  onUploadKtp,
  onUploadSelfie,
}: {
  namaPemilik: string;
  namaUsaha: string;
  form: ProfilForm;
  onChange: (k: keyof ProfilForm, v: string) => void;
  errors: Record<string, string>;
  ktpDone: boolean;
  selfieDone: boolean;
  onUploadKtp: () => void;
  onUploadSelfie: () => void;
}) {
  return (
    <div className="space-y-5 pb-2">
      <div>
        <p className="text-[#0F1D3E] font-bold text-sm mb-3">1. Data Diri & Usaha</p>
        {/* Read-only — sudah diisi waktu Register, jadi gak ditanya ulang */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama Pemilik</span>
            <span className="text-[#0F1D3E] font-semibold">{namaPemilik || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama Usaha</span>
            <span className="text-[#0F1D3E] font-semibold">{namaUsaha || '-'}</span>
          </div>
          <p className="text-[10px] text-blue-700/70 pt-1">
            Data dari akun Anda. Ubah lewat halaman Profil kalau ada yang salah.
          </p>
        </div>
      </div>

      <div>
        <p className="text-[#0F1D3E] font-bold text-sm mb-3">2. eKYC (Verifikasi Wajah)</p>
        <div className="grid grid-cols-1 gap-3">
          <UploadTile label="Unggah KTP" done={ktpDone} onUpload={onUploadKtp} />
          <UploadTile label="Upload Selfie Liveness" done={selfieDone} onUpload={onUploadSelfie} />
        </div>
        {errors.ekyc && <p className="text-red-500 text-xs mt-1 pl-1">{errors.ekyc}</p>}
      </div>

      <div>
        <p className="text-[#0F1D3E] font-bold text-sm mb-3">3. Rincian Pengajuan</p>
        <div className="space-y-4">
          <FieldInput
            label="Nominal Dana yang Dibutuhkan (Rp)"
            icon={<span className="text-gray-400 text-sm shrink-0">Rp</span>}
            value={form.dana}
            onChange={(v) => onChange('dana', v.replace(/[^\d]/g, ''))}
            placeholder="500.000"
            type="text"
            error={errors.dana}
          />
          <div>
            <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
              Tujuan Penggunaan Dana
            </label>
            <div
              className={`bg-gray-50 rounded-2xl border-2 transition-colors ${
                errors.tujuanDana ? 'border-red-400' : 'border-transparent focus-within:border-[#1D4ED8]'
              }`}
            >
              <textarea
                value={form.tujuanDana}
                onChange={(e) => onChange('tujuanDana', e.target.value)}
                placeholder="Misal: Menambah stok sembako menjelang lebaran..."
                rows={3}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
              />
            </div>
            {errors.tujuanDana && <p className="text-red-500 text-xs mt-1 pl-1">{errors.tujuanDana}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 2 — Omzet (validasi arus kas via e-wallet)
// ============================================================
function StepOmzet({
  subStep,
  provider,
  setProvider,
  otp,
  setOtp,
  otpError,
  onStart,
  onVerify,
  isVerifying,
  qrisFrek,
  qrisVol,
}: {
  subStep: 0 | 1 | 2;
  provider: string;
  setProvider: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  otpError: string;
  onStart: () => void;
  onVerify: () => void;
  isVerifying: boolean;
  qrisFrek: number;
  qrisVol: number;
}) {
  return (
    <div className="space-y-5 pb-2">
      <p className="text-[#0F1D3E] font-bold text-sm">Validasi Arus Kas</p>

      {subStep === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {walletProviders.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border-2 text-left transition-all ${
                    provider === p
                      ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
                      : 'border-gray-100 bg-gray-50 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onStart}
            disabled={!provider}
            className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Mulai Integrasi
          </button>
        </div>
      )}

      {subStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
            <ShieldCheck size={16} className="text-[#1D4ED8] shrink-0" />
            <p className="text-xs text-[#1D4ED8] font-medium">Autentikasi Keamanan OJK</p>
          </div>
          <FieldInput
            label="Nomor HP Terdaftar"
            icon={<Phone size={17} className="text-gray-400" />}
            value=""
            onChange={() => {}}
            placeholder="08xxxxxxxxxx"
            type="tel"
          />
          <FieldInput
            label="Masukkan 4 Digit OTP"
            icon={<ShieldCheck size={17} className="text-gray-400" />}
            value={otp}
            onChange={(v) => setOtp(v.replace(/[^\d]/g, '').slice(0, 4))}
            placeholder="••••"
            type="password"
            error={otpError}
          />
          <p className="text-xs text-gray-400 text-center">Gunakan OTP simulasi: 1234</p>
          <button
            onClick={onVerify}
            disabled={otp.length < 4 || isVerifying}
            className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Mengekstrak data transaksi...
              </>
            ) : (
              'Verifikasi & Hubungkan'
            )}
          </button>
        </div>
      )}

      {subStep === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
            <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
            <p className="text-xs text-[#10B981] font-medium">Terhubung dengan {provider}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Frekuensi Transaksi (30 Hari)</p>
              <p className="text-xl font-bold text-[#0F1D3E]">{qrisFrek}x</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Estimasi Omzet (30 Hari)</p>
              <p className="text-xl font-bold text-[#0F1D3E]">Rp {qrisVol} Juta</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// STEP 3 — Rantai Pasok
// ============================================================
function StepRantaiPasok({
  mode,
  setMode,
  b2bSubStep,
  platform,
  setPlatform,
  onLoginDistributor,
  onOtorisasi,
  isSyncing,
  jumlahSupplier,
  telatBayar,
  utilFiles,
  onUploadUtil,
  onAnalisisUtil,
  isAnalisisUtil,
  skorUtilitas,
}: {
  mode: 'B2B' | 'UTILITAS' | null;
  setMode: (m: 'B2B' | 'UTILITAS') => void;
  b2bSubStep: 0 | 1 | 2;
  platform: string;
  setPlatform: (v: string) => void;
  onLoginDistributor: () => void;
  onOtorisasi: () => void;
  isSyncing: boolean;
  jumlahSupplier: number;
  telatBayar: number;
  utilFiles: [boolean, boolean, boolean];
  onUploadUtil: (i: 0 | 1 | 2) => void;
  onAnalisisUtil: () => void;
  isAnalisisUtil: boolean;
  skorUtilitas: number | null;
}) {
  return (
    <div className="space-y-5 pb-2">
      <p className="text-[#0F1D3E] font-bold text-sm">Validasi Pengeluaran Kulakan</p>

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Bagaimana cara Anda kulakan barang?
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setMode('B2B')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              mode === 'B2B' ? 'border-[#1D4ED8] bg-blue-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <Store size={18} className={mode === 'B2B' ? 'text-[#1D4ED8]' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${mode === 'B2B' ? 'text-[#1D4ED8]' : 'text-gray-600'}`}>
              Aplikasi B2B Digital
            </span>
          </button>
          <button
            onClick={() => setMode('UTILITAS')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              mode === 'UTILITAS' ? 'border-[#1D4ED8] bg-blue-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <Receipt size={18} className={mode === 'UTILITAS' ? 'text-[#1D4ED8]' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${mode === 'UTILITAS' ? 'text-[#1D4ED8]' : 'text-gray-600'}`}>
              Tunai / Tradisional
            </span>
          </button>
        </div>
      </div>

      {mode === 'B2B' && (
        <AnimatePresence mode="wait">
          {b2bSubStep === 0 && (
            <motion.div key="b0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">Pilih Platform B2B</label>
                <div className="grid grid-cols-2 gap-2">
                  {b2bPlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border-2 transition-all ${
                        platform === p
                          ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
                          : 'border-gray-100 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={onLoginDistributor}
                disabled={!platform}
                className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Login ke Akun Distributor
              </button>
            </motion.div>
          )}

          {b2bSubStep === 1 && (
            <motion.div key="b1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <FieldInput label="Username" icon={<User size={17} className="text-gray-400" />} value="" onChange={() => {}} placeholder="Username distributor" />
              <FieldInput label="Password" icon={<ShieldCheck size={17} className="text-gray-400" />} value="" onChange={() => {}} placeholder="••••••" type="password" />
              <button
                onClick={onOtorisasi}
                disabled={isSyncing}
                className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-60 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sinkronisasi invoice...
                  </>
                ) : (
                  'Otorisasi Akses Faktur'
                )}
              </button>
            </motion.div>
          )}

          {b2bSubStep === 2 && (
            <motion.div key="b2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">Supplier Terhubung</p>
                <p className="text-xl font-bold text-[#0F1D3E]">{jumlahSupplier}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">Rata-rata Telat Bayar</p>
                <p className="text-xl font-bold text-[#0F1D3E]">{telatBayar} Hari</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {mode === 'UTILITAS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <UploadTile label="Bukti Utilitas Bulan 1" done={utilFiles[0]} onUpload={() => onUploadUtil(0)} />
            <UploadTile label="Bukti Utilitas Bulan 2" done={utilFiles[1]} onUpload={() => onUploadUtil(1)} />
            <UploadTile label="Bukti Utilitas Bulan 3" done={utilFiles[2]} onUpload={() => onUploadUtil(2)} />
          </div>
          {skorUtilitas === null ? (
            <button
              onClick={onAnalisisUtil}
              disabled={!utilFiles.every(Boolean) || isAnalisisUtil}
              className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {isAnalisisUtil ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Mengekstrak data...
                </>
              ) : (
                'Analisis Dokumen (OCR AI)'
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
              <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
              <p className="text-xs text-[#10B981] font-medium">Skor Disiplin Utilitas: {skorUtilitas}/100</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 4 — Hasil & Lender
// ============================================================
function StepHasil({
  isCalculating,
  onCalculate,
  score,
  lendersLoading,
}: {
  isCalculating: boolean;
  onCalculate: () => void;
  score: { total: number; lenders: LoanOffer[] } | null;
  lendersLoading: boolean;
}) {
  if (!score) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-6">
        <p className="text-sm text-gray-500 text-center px-4">
          Semua data sudah lengkap. Ketuk tombol di bawah untuk menjalankan mesin AI FinTrust.
        </p>
        <button
          onClick={onCalculate}
          disabled={isCalculating || lendersLoading}
          className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-60 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mesin AI sedang bekerja...
            </>
          ) : (
            'Hitung Skor Kelayakan 🚀'
          )}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-2">
      <div className="flex flex-col items-center">
        <span className="text-5xl font-extrabold text-[#10B981]">{score.total}/100</span>
        <span className="text-sm font-semibold text-gray-500 mt-1">
          STATUS: {score.total >= 70 ? 'LAYAK (LOW RISK)' : 'PERLU VERIFIKASI LANJUTAN'}
        </span>
      </div>
      <div className="space-y-3">
        {score.lenders.map((lender) => (
          <div key={lender.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="font-semibold text-[#0F1D3E] text-sm">{lender.nama}</p>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Bunga: {lender.bunga}</span>
              <span>Limit: {lender.limit}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// WIZARD UTAMA
// ============================================================
export function OnboardingWizard({ onComplete, onBack }: OnboardingWizardProps) {
  const { setResult } = useScore();
  const { profile, umkmProfile } = useAuth();
  const { lenders, loading: lendersLoading } = useLenders();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');

  const namaPemilik = profile?.full_name ?? '';
  const namaUsaha = umkmProfile?.nama_usaha ?? '';

  // Step 1 — Profil & Dana (nama pemilik/usaha sudah dari akun, gak diinput ulang)
  const [profilForm, setProfilForm] = useState<ProfilForm>({ dana: '', tujuanDana: '' });
  const [ktpDone, setKtpDone] = useState(false);
  const [selfieDone, setSelfieDone] = useState(false);

  // Step 2 — Omzet
  const [omzetSubStep, setOmzetSubStep] = useState<0 | 1 | 2>(0);
  const [walletProvider, setWalletProvider] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOmzet, setIsVerifyingOmzet] = useState(false);
  const [qrisFrek] = useState(345);
  const [qrisVol] = useState(28.5);

  // Step 3 — Rantai Pasok
  const [rantaiMode, setRantaiMode] = useState<'B2B' | 'UTILITAS' | null>(null);
  const [b2bSubStep, setB2bSubStep] = useState<0 | 1 | 2>(0);
  const [platform, setPlatform] = useState('');
  const [isSyncingB2b, setIsSyncingB2b] = useState(false);
  const [jumlahSupplier] = useState(4);
  const [telatBayar] = useState(1.5);
  const [utilFiles, setUtilFiles] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [isAnalisisUtil, setIsAnalisisUtil] = useState(false);
  const [skorUtilitas, setSkorUtilitas] = useState<number | null>(null);

  // Step 4 — Hasil
  const [isCalculating, setIsCalculating] = useState(false);
  const [finalScore, setFinalScore] = useState<{ total: number; lenders: LoanOffer[] } | null>(null);

  function validateStep0() {
    const e: Record<string, string> = {};
    if (!ktpDone || !selfieDone) e.ekyc = 'Unggah KTP dan selfie liveness terlebih dahulu';
    if (!profilForm.dana || Number(profilForm.dana) < 500000) e.dana = 'Minimal Rp 500.000';
    if (!profilForm.tujuanDana.trim()) e.tujuanDana = 'Tujuan penggunaan dana harus diisi';
    return e;
  }

  function goNext() {
    if (step === 0) {
      const e = validateStep0();
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
    }
    if (step === 1 && omzetSubStep !== 2) return;
    if (step === 2 && rantaiMode === 'B2B' && b2bSubStep !== 2) return;
    if (step === 2 && rantaiMode === 'UTILITAS' && skorUtilitas === null) return;
    if (step === 2 && rantaiMode === null) return;

    setErrors({});
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    if (step === 0) {
      onBack();
      return;
    }
    setStep((s) => s - 1);
  }

  function handleVerifyOtp() {
    if (otp !== '1234') {
      setOtpError('OTP salah, gunakan 1234');
      return;
    }
    setOtpError('');
    setIsVerifyingOmzet(true);
    setTimeout(() => {
      setIsVerifyingOmzet(false);
      setOmzetSubStep(2);
    }, 1200);
  }

  function handleOtorisasiB2b() {
    setIsSyncingB2b(true);
    setTimeout(() => {
      setIsSyncingB2b(false);
      setB2bSubStep(2);
    }, 1200);
  }

  function handleAnalisisUtilitas() {
    setIsAnalisisUtil(true);
    setTimeout(() => {
      setIsAnalisisUtil(false);
      setSkorUtilitas(85);
    }, 1200);
  }

  async function handleCalculate() {
    setIsCalculating(true);
    setSaveError('');

    // Skoring sederhana & transparan — gampang diganti ketua tim nanti
    // kalau model AI sesungguhnya sudah siap.
    const riwayatTransaksi = Math.min(100, Math.round((qrisFrek / 400) * 60 + (qrisVol / 40) * 40));
    const stabilitasPendapatan =
      rantaiMode === 'B2B'
        ? Math.max(40, Math.round(100 - telatBayar * 10))
        : skorUtilitas ?? 60;
    const lamaUsaha = 72; // belum ada input untuk ini di alur saat ini — placeholder

    const total = Math.round(riwayatTransaksi * 0.4 + lamaUsaha * 0.3 + stabilitasPendapatan * 0.3);
    const riskLevel = total >= 70 ? 'rendah' : total >= 50 ? 'menengah' : 'tinggi';
    const statusKelayakan: 'Tinggi' | 'Perlu Verifikasi' = total >= 70 ? 'Tinggi' : 'Perlu Verifikasi';

    // Rekomendasi lender dari Supabase (satu sumber sama dengan Pendana.tsx),
    // fallback ke array kosong kalau tabel belum sempat kebaca
    const lenderOffers: LoanOffer[] = lenders.slice(0, 3).map((l) => ({
      id: l.id,
      nama: l.nama,
      bunga: l.bunga_rate,
      limit: formatRupiah(l.limit_plafon),
    }));

    let scoreId: string | null = null;

    if (umkmProfile) {
      const { data: inserted, error } = await supabase
        .from('scores')
        .insert({
          umkm_id: umkmProfile.id,
          fintrust_score: total,
          risk_level: riskLevel,
          breakdown: { riwayatTransaksi, lamaUsaha, stabilitasPendapatan },
          xai_narrative: `Skor ${total}/100 dihitung dari riwayat transaksi (${riwayatTransaksi}), lama usaha (${lamaUsaha}), dan stabilitas pendapatan (${stabilitasPendapatan}).`,
        })
        .select()
        .single();

      if (error) {
        console.error('Gagal simpan skor ke Supabase:', error);
        setSaveError('Skor berhasil dihitung, tapi gagal tersimpan ke server. Coba lagi nanti.');
      } else {
        scoreId = inserted.id;
      }
    } else {
      setSaveError('Data profil usaha belum lengkap, skor belum bisa disimpan permanen.');
    }

    const result = { total, lenders: lenderOffers };
    setFinalScore(result);
    setIsCalculating(false);

    setResult({
      completed: true,
      scoreId,
      skorAkhir: total,
      riwayatTransaksi,
      lamaUsaha,
      stabilitasPendapatan,
      statusKelayakan,
      namaUsaha,
      namaPemilik,
      danaDiajukan: Number(profilForm.dana),
      omzetBulanan: qrisVol,
      frekuensiTransaksi: qrisFrek,
      lenders: lenderOffers,
    });
  }

  const canGoNext =
    step === 3
      ? finalScore !== null
      : step === 1
      ? omzetSubStep === 2
      : step === 2
      ? (rantaiMode === 'B2B' && b2bSubStep === 2) || (rantaiMode === 'UTILITAS' && skorUtilitas !== null)
      : true;

  return (
    <div
      className="relative h-[100dvh] min-h-screen w-full max-w-[393px] mx-auto overflow-hidden bg-white flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="relative z-10 pt-10 pb-2 px-6 flex items-center gap-3">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div>
          <p className="text-[#0F1D3E] font-extrabold text-lg leading-tight">Sinkronisasi AI</p>
          <p className="text-gray-500 text-xs">Langkah {step + 1} dari {steps.length}</p>
        </div>
        <button
          onClick={onBack}
          className="ml-auto w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="relative z-10 px-6 mt-3 mb-1">
        <StepIndicator current={step} />
      </div>

      <div className="relative z-10 px-6 flex-1 overflow-y-auto mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <StepProfilDana
                namaPemilik={namaPemilik}
                namaUsaha={namaUsaha}
                form={profilForm}
                onChange={(k, v) => setProfilForm((f) => ({ ...f, [k]: v }))}
                errors={errors}
                ktpDone={ktpDone}
                selfieDone={selfieDone}
                onUploadKtp={() => setKtpDone(true)}
                onUploadSelfie={() => setSelfieDone(true)}
              />
            )}
            {step === 1 && (
              <StepOmzet
                subStep={omzetSubStep}
                provider={walletProvider}
                setProvider={setWalletProvider}
                otp={otp}
                setOtp={setOtp}
                otpError={otpError}
                onStart={() => setOmzetSubStep(1)}
                onVerify={handleVerifyOtp}
                isVerifying={isVerifyingOmzet}
                qrisFrek={qrisFrek}
                qrisVol={qrisVol}
              />
            )}
            {step === 2 && (
              <StepRantaiPasok
                mode={rantaiMode}
                setMode={(m) => {
                  setRantaiMode(m);
                  setB2bSubStep(0);
                }}
                b2bSubStep={b2bSubStep}
                platform={platform}
                setPlatform={setPlatform}
                onLoginDistributor={() => setB2bSubStep(1)}
                onOtorisasi={handleOtorisasiB2b}
                isSyncing={isSyncingB2b}
                jumlahSupplier={jumlahSupplier}
                telatBayar={telatBayar}
                utilFiles={utilFiles}
                onUploadUtil={(i) =>
                  setUtilFiles((f) => {
                    const next = [...f] as [boolean, boolean, boolean];
                    next[i] = true;
                    return next;
                  })
                }
                onAnalisisUtil={handleAnalisisUtilitas}
                isAnalisisUtil={isAnalisisUtil}
                skorUtilitas={skorUtilitas}
              />
            )}
            {step === 3 && (
              <StepHasil
                isCalculating={isCalculating}
                onCalculate={handleCalculate}
                score={finalScore}
                lendersLoading={lendersLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {saveError && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4">
            {saveError}
          </p>
        )}
      </div>

      <div className="relative z-20 bg-white border-t border-gray-50 px-6 py-4 pb-8">
        {step < 3 ? (
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            Lanjutkan <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={onComplete}
            disabled={!finalScore}
            className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            Selesai, Lihat Skor Saya <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}