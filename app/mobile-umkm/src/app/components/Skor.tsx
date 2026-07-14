import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { useScore } from '../../lib/ScoreContext';

export function Skor() {
  const { result } = useScore();
  const score = result.skorAkhir;
  const maxScore = 100;
  const percentage = (score / maxScore) * 100;
  const riskLabel = score >= 70 ? 'Rendah' : score >= 50 ? 'Sedang' : 'Tinggi';

  const breakdownItems = [
    { label: 'Riwayat Transaksi', score: result.riwayatTransaksi, max: 100 },
    { label: 'Lama Usaha', score: result.lamaUsaha, max: 100 },
    { label: 'Stabilitas Pendapatan', score: result.stabilitasPendapatan, max: 100 },
  ];

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header with safe area */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900">Skor FinTrust</h1>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Circular Progress - Centerpiece */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-6">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              {/* Animated Progress Circle */}
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="#1D4ED8"
                strokeWidth="16"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 552.92', strokeDashoffset: 0 }}
                animate={{
                  strokeDasharray: `${(percentage / 100) * 552.92} 552.92`,
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            {/* Score in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-5xl text-gray-900"
              >
                {score}
              </motion.span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
          </div>

          {/* Risk Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
            <Shield className="w-5 h-5 text-[#10B981]" />
            <span className="text-sm font-semibold text-[#10B981]">
              Tingkat Risiko: {riskLabel}
            </span>
          </div>
        </div>

        {/* Breakdown Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-6">Rincian Skor</h3>
          <div className="space-y-6">
            {breakdownItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.score}/{item.max}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.score / item.max) * 100}%` }}
                    transition={{ delay: index * 0.2 + 0.3, duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-[#1D4ED8] rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            {result.completed ? (
              <>
                <strong>Tips:</strong> Tingkatkan skor Anda dengan menjaga konsistensi transaksi dan memperbarui data usaha secara berkala.
              </>
            ) : (
              <>
                <strong>Contoh skor.</strong> Selesaikan Sinkronisasi AI di tab Profil untuk melihat skor FinTrust berdasarkan data usaha Anda sendiri.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}