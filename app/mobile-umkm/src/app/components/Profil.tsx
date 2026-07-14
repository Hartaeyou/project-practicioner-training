import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Mail, Phone, LogOut, User, Briefcase, Wallet, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { OnboardingWizard } from './onboarding/OnboardingWizard';
import { useAuth } from '../../lib/AuthContext';
import { useScore } from '../../lib/ScoreContext';
import { useLatestScore } from '../../lib/useLatestScore';

function DataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

export function Profil() {
  const { profile, umkmProfile, signOut } = useAuth();
  const { result } = useScore();
  const { score: latestScore, loading: loadingScore } = useLatestScore(umkmProfile?.id);
  const [showWizard, setShowWizard] = useState(false);

  // Kelengkapan profil dihitung dari data yang beneran ada, bukan angka tetap
  const fields = [profile?.full_name, profile?.no_hp, umkmProfile?.nama_usaha, umkmProfile?.sektor];
  const filled = fields.filter(Boolean).length;
  const profileCompletion = Math.round((filled / fields.length) * 100);

  // Prioritaskan hasil sesi yang lagi aktif (ScoreContext), fallback ke data
  // tersimpan terakhir dari Supabase kalau user baru buka app / refresh halaman.
  const hasLiveResult = result.completed;
  const hasPersistedScore = !!latestScore;
  const showScoreSection = hasLiveResult || hasPersistedScore;

  const skorAkhir = hasLiveResult ? result.skorAkhir : latestScore?.fintrust_score ?? 0;
  const riwayatTransaksi = hasLiveResult
    ? result.riwayatTransaksi
    : latestScore?.breakdown?.riwayatTransaksi ?? 0;
  const lamaUsaha = hasLiveResult ? result.lamaUsaha : latestScore?.breakdown?.lamaUsaha ?? 0;
  const stabilitasPendapatan = hasLiveResult
    ? result.stabilitasPendapatan
    : latestScore?.breakdown?.stabilitasPendapatan ?? 0;
  const lastSyncedAt = hasLiveResult
    ? 'Baru saja'
    : latestScore
    ? new Date(latestScore.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleSyncClick = () => setShowWizard(true);

  const handleWizardComplete = () => {
    setShowWizard(false);
    window.dispatchEvent(new CustomEvent('navigateToSkor'));
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header with safe area */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl text-gray-900">Profil Usaha</h1>
        <button
          onClick={signOut}
          className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Completion */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Kelengkapan Profil</h3>
            <span className="text-sm font-semibold text-[#1D4ED8]">{profileCompletion}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lengkapi profil untuk meningkatkan peluang pendanaan
          </p>
        </div>

        {/* Data Akun */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Data Akun</h3>
          <div className="space-y-3">
            <DataRow icon={<User className="w-4 h-4 text-[#1D4ED8]" />} label="Nama Lengkap" value={profile?.full_name ?? ''} />
            <DataRow icon={<Mail className="w-4 h-4 text-[#1D4ED8]" />} label="Email" value={profile?.email ?? ''} />
            <DataRow icon={<Phone className="w-4 h-4 text-[#1D4ED8]" />} label="Nomor HP" value={profile?.no_hp ?? ''} />
          </div>
        </div>

        {/* Data Usaha */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Data Usaha</h3>
          <div className="space-y-3">
            <DataRow icon={<Building2 className="w-4 h-4 text-[#1D4ED8]" />} label="Nama Usaha" value={umkmProfile?.nama_usaha ?? ''} />
            <DataRow icon={<Briefcase className="w-4 h-4 text-[#1D4ED8]" />} label="Sektor Usaha" value={umkmProfile?.sektor ?? ''} />
            <DataRow icon={<Wallet className="w-4 h-4 text-[#1D4ED8]" />} label="Omzet Bulanan (estimasi)" value={umkmProfile?.omzet_estimasi ?? ''} />
          </div>
        </div>

        {/* Hasil Sinkronisasi AI terakhir */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Skor FinTrust Terakhir</h3>
            {lastSyncedAt && (
              <span className="text-xs text-gray-400">Disinkron: {lastSyncedAt}</span>
            )}
          </div>

          {loadingScore && !hasLiveResult ? (
            <p className="text-sm text-gray-400">Memuat data...</p>
          ) : showScoreSection ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#1D4ED8]">{skorAkhir}</span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Riwayat</p>
                  <p className="text-sm font-semibold text-gray-900">{riwayatTransaksi}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Lama Usaha</p>
                  <p className="text-sm font-semibold text-gray-900">{lamaUsaha}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Stabilitas</p>
                  <p className="text-sm font-semibold text-gray-900">{stabilitasPendapatan}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Belum pernah disinkronkan. Hubungkan data usaha Anda untuk mendapatkan Skor FinTrust.
            </p>
          )}
        </div>

        {/* Info: cara update data */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <Info className="w-4 h-4 text-[#1D4ED8] mt-0.5 shrink-0" />
          <p className="text-xs text-blue-900 leading-relaxed">
            Data di atas bersifat baca-saja. Untuk memperbarui data usaha, omzet, atau skor Anda,
            lakukan <strong>Sinkronisasi Ulang</strong> di bawah — data lama akan digantikan hasil yang baru.
          </p>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSyncClick}
          className="w-full bg-[#1D4ED8] text-white py-4 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {showScoreSection ? 'Sinkronisasi Ulang' : 'Lanjutkan Sinkronisasi AI'}
        </button>
      </div>

      {/* Onboarding Wizard: Profil & Dana -> Omzet -> Rantai Pasok -> Hasil */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50"
          >
            <OnboardingWizard onComplete={handleWizardComplete} onBack={() => setShowWizard(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}