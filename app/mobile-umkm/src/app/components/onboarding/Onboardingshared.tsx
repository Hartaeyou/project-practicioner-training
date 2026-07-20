import { motion } from 'motion/react';
import { Building2, Wallet, Link2, BarChart3, CheckCircle2, Upload } from 'lucide-react';

export const steps = [
  { label: 'Profil & Dana', icon: Building2 },
  { label: 'Omzet', icon: Wallet },
  { label: 'Rantai Pasok', icon: Link2 },
  { label: 'Hasil', icon: BarChart3 },
];

export function StepIndicator({ current }: { current: number }) {
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

export function FieldInput({
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

// Generic upload tile — dipakai di Omzet mode Manual (bukti pendukung
// opsional). Bukan yang buat KTP/selfie (lihat OnboardingKyc.tsx).
// Bukan juga yang buat nota supplier (lihat SupplierForm.tsx — NotaBulanUpload
// mendukung banyak file sekaligus).
export function UploadTile({
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