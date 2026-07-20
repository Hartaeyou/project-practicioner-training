import { motion } from 'motion/react';
import { Wallet, FileSpreadsheet, Phone, ShieldCheck, Loader2, CheckCircle2, FileImage } from 'lucide-react';
import { FieldInput } from './Onboardingshared';
import { walletProviders } from './Onboardingtypes';

// ============================================================
// UPLOAD BUKTI OMZET MANUAL — file input real (foto nota/excel),
// upload ke bucket bukti-omzet. Pola sama seperti KtpUploadTile.
// ============================================================
function OmzetBuktiUpload({
  file,
  uploading,
  done,
  onSelect,
}: {
  file: File | null;
  uploading: boolean;
  done: boolean;
  onSelect: (f: File) => void;
}) {
  const inputId = 'omzet-bukti-upload-input';
  return (
    <label
      htmlFor={inputId}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors text-left ${
        done
          ? 'border-[#10B981] bg-green-50'
          : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {uploading ? (
        <Loader2 size={20} className="text-[#1D4ED8] animate-spin shrink-0" />
      ) : done ? (
        <CheckCircle2 size={20} className="text-[#10B981] shrink-0" />
      ) : (
        <FileImage size={20} className="text-gray-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Foto Catatan / File Excel (opsional)</p>
        <p className="text-xs text-gray-500 truncate">
          {uploading
            ? 'Mengunggah...'
            : done
            ? file?.name ?? 'Berhasil diunggah'
            : 'Ketuk untuk pilih foto atau file Excel'}
        </p>
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/*,application/pdf,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
    </label>
  );
}

// ============================================================
// STEP 2 — Omzet (validasi arus kas via e-wallet ATAU catat manual)
// ============================================================
export function StepOmzet({
  mode,
  setMode,
  subStep,
  provider,
  setProvider,
  phone,
  setPhone,
  otp,
  setOtp,
  otpError,
  onStart,
  onVerify,
  isVerifying,
  qrisFrek,
  qrisVol,
  manualOmzet,
  setManualOmzet,
  manualFrekuensi,
  setManualFrekuensi,
  manualBuktiFile,
  manualBuktiUploading,
  manualBuktiDone,
  onSelectBukti,
  manualConfirmed,
  onConfirmManual,
  manualSaving,
  manualError,
}: {
  mode: 'EWALLET' | 'MANUAL' | null;
  setMode: (m: 'EWALLET' | 'MANUAL') => void;
  subStep: 0 | 1 | 2;
  provider: string;
  setProvider: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  otpError: string;
  onStart: () => void;
  onVerify: () => void;
  isVerifying: boolean;
  qrisFrek: number;
  qrisVol: number;
  manualOmzet: string;
  setManualOmzet: (v: string) => void;
  manualFrekuensi: string;
  setManualFrekuensi: (v: string) => void;
  manualBuktiFile: File | null;
  manualBuktiUploading: boolean;
  manualBuktiDone: boolean;
  onSelectBukti: (f: File) => void;
  manualConfirmed: boolean;
  onConfirmManual: () => void;
  manualSaving: boolean;
  manualError: string;
}) {
  return (
    <div className="space-y-5 pb-2">
      <p className="text-[#0F1D3E] font-bold text-sm">Validasi Arus Kas</p>

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Bagaimana Anda mencatat transaksi usaha?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {/* TAKEDOWN SEMENTARA: opsi "Hubungkan E-Wallet Bisnis" dimatikan dulu
              dari UI atas permintaan — kode & alurnya (subStep 0/1/2 di bawah,
              state di OnboardingWizard.tsx) sengaja tidak dihapus supaya bisa
              diaktifkan lagi kapan saja tinggal buka komentar ini.
          <button
            onClick={() => setMode('EWALLET')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              mode === 'EWALLET' ? 'border-[#1D4ED8] bg-blue-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <Wallet size={18} className={mode === 'EWALLET' ? 'text-[#1D4ED8]' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${mode === 'EWALLET' ? 'text-[#1D4ED8]' : 'text-gray-600'}`}>
              Hubungkan E-Wallet Bisnis
            </span>
          </button>
          */}
          <button
            onClick={() => setMode('MANUAL')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              mode === 'MANUAL' ? 'border-[#1D4ED8] bg-blue-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={18} className={mode === 'MANUAL' ? 'text-[#1D4ED8]' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${mode === 'MANUAL' ? 'text-[#1D4ED8]' : 'text-gray-600'}`}>
              Catat Manual (Excel / Buku Kas)
            </span>
          </button>
        </div>
      </div>

      {mode === 'EWALLET' && subStep === 0 && (
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

      {mode === 'EWALLET' && subStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
            <ShieldCheck size={16} className="text-[#1D4ED8] shrink-0" />
            <p className="text-xs text-[#1D4ED8] font-medium">Autentikasi Keamanan OJK</p>
          </div>
          <FieldInput
            label="Nomor HP Terdaftar"
            icon={<Phone size={17} className="text-gray-400" />}
            value={phone}
            onChange={(v) => setPhone(v.replace(/[^\d]/g, ''))}
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
          <button
            onClick={onVerify}
            disabled={phone.length < 10 || otp.length < 4 || isVerifying}
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

      {mode === 'EWALLET' && subStep === 2 && (
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

      {mode === 'MANUAL' && !manualConfirmed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <FieldInput
            label="Rata-rata Omzet per Bulan (Juta Rupiah)"
            icon={<span className="text-gray-400 text-sm shrink-0">Rp</span>}
            value={manualOmzet}
            onChange={(v) => setManualOmzet(v.replace(/[^\d.]/g, ''))}
            placeholder="Contoh: 15"
            type="text"
          />
          <FieldInput
            label="Perkiraan Jumlah Transaksi per Bulan"
            icon={<span className="text-gray-400 text-sm shrink-0">#</span>}
            value={manualFrekuensi}
            onChange={(v) => setManualFrekuensi(v.replace(/[^\d]/g, ''))}
            placeholder="Contoh: 80"
            type="text"
          />
          <OmzetBuktiUpload
            file={manualBuktiFile}
            uploading={manualBuktiUploading}
            done={manualBuktiDone}
            onSelect={onSelectBukti}
          />
          {manualError && <p className="text-red-500 text-xs pl-1">{manualError}</p>}
          <button
            onClick={onConfirmManual}
            disabled={!manualOmzet || !manualFrekuensi || manualSaving}
            className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {manualSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              'Konfirmasi Data'
            )}
          </button>
        </motion.div>
      )}

      {mode === 'MANUAL' && manualConfirmed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
            <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
            <p className="text-xs text-[#10B981] font-medium">Data tercatat manual tersimpan</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Transaksi per Bulan</p>
              <p className="text-xl font-bold text-[#0F1D3E]">{manualFrekuensi}x</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Omzet per Bulan</p>
              <p className="text-xl font-bold text-[#0F1D3E]">Rp {manualOmzet} Juta</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}