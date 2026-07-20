import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { LoanOffer } from '../../../lib/ScoreContext';

// ============================================================
// STEP 4 — Hasil & Lender
// ============================================================
export function StepHasil({
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
        {score.lenders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Belum ada pendana yang cocok dengan skor Anda saat ini.
          </p>
        ) : (
          score.lenders.map((lender) => (
            <div key={lender.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="font-semibold text-[#0F1D3E] text-sm">{lender.nama}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Bunga: {lender.bunga}</span>
                <span>Limit: {lender.limit}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}