import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle2, MapPin, Phone, Mail, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';

const qrisData = [
  { id: 'jan', month: 'Jan', volume: 45000 },
  { id: 'feb', month: 'Feb', volume: 52000 },
  { id: 'mar', month: 'Mar', volume: 48000 },
  { id: 'apr', month: 'Apr', volume: 61000 },
  { id: 'mei', month: 'Mei', volume: 58000 },
  { id: 'jun', month: 'Jun', volume: 67000 },
];

const marketplaceData = [
  { id: 'tokopedia', platform: 'Tokopedia', sales: 28000 },
  { id: 'shopee', platform: 'Shopee', sales: 35000 },
  { id: 'bukalapak', platform: 'Bukalapak', sales: 18000 },
  { id: 'lazada', platform: 'Lazada', sales: 22000 },
];

const cashFlowData = [
  { id: 'w1', week: 'W1', inflow: 15000, outflow: 12000 },
  { id: 'w2', week: 'W2', inflow: 18000, outflow: 14000 },
  { id: 'w3', week: 'W3', inflow: 22000, outflow: 16000 },
  { id: 'w4', week: 'W4', inflow: 19000, outflow: 15000 },
];

export default function DataInsightsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    setShowSuccessModal(true);
    toast.success('Pinjaman berhasil disetujui!', {
      description: 'Notifikasi telah dikirim ke Toko Cahaya Mandiri',
    });
    setTimeout(() => {
      navigate('/wawasan-data');
    }, 2000);
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }
    setShowRejectModal(false);
    toast.error('Pinjaman ditolak', {
      description: 'Notifikasi telah dikirim ke pemohon',
    });
    setTimeout(() => {
      navigate('/wawasan-data');
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Profile and Action Buttons */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Wawasan Data</h1>
          <p className="text-sm text-gray-500 mt-1">Analisis mendalam berbasis data transaksi digital</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRejectClick}
            className="px-6 py-2.5 bg-[#EF4444] text-white rounded-lg font-semibold hover:bg-[#DC2626] hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Tolak
          </button>
          <button
            onClick={handleApprove}
            className="px-6 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Setujui Pinjaman
          </button>
        </div>
      </div>

      {/* Business Profile Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1D4ED8] to-[#10B981] rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            TCM
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Toko Cahaya Mandiri</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Jl. Raya Kemang No. 45, Jakarta Selatan</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>contact@cahayamandiri.id</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Bergabung sejak 2019</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Jumlah Pinjaman</p>
            <p className="text-3xl font-bold text-gray-900">Rp 75 Juta</p>
          </div>
        </div>
      </div>

      {/* AI Recommendation Panel */}
      <div className="bg-gradient-to-br from-[#1D4ED8]/5 to-[#10B981]/5 rounded-xl p-6 border-2 border-[#10B981]/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rekomendasi AI</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 mb-1">Tingkat Keyakinan AI</p>
                <p className="text-2xl font-bold text-emerald-600">Tinggi</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[92%]"></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 mb-1">Probabilitas Risiko</p>
                <p className="text-2xl font-bold text-emerald-600">Rendah</p>
                <p className="text-xs text-gray-500 mt-1">8.5% kemungkinan gagal bayar</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Prediksi Pertumbuhan</p>
                <p className="text-2xl font-bold text-blue-600">+18%</p>
                <p className="text-xs text-gray-500 mt-1">6 bulan ke depan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* QRIS Volume */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Volume Transaksi QRIS</h3>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">+15.2%</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qrisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Volume']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Line key="qris-volume" type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">Rata-rata Rp 55.167/bulan</p>
        </div>

        {/* Marketplace Performance */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Performa Penjualan Marketplace</h3>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">4 Platform</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={marketplaceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="platform" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Penjualan']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar key="marketplace-sales" dataKey="sales" fill="#1D4ED8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">Total Rp 103.000 di semua platform</p>
        </div>

        {/* Cash Flow Stability */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Stabilitas Arus Kas</h3>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">Stabil</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Area key="inflow-area" type="monotone" dataKey="inflow" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Masuk" />
              <Area key="outflow-area" type="monotone" dataKey="outflow" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Keluar" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">Rasio positif 1.28x</p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pinjaman Disetujui</h3>
              <p className="text-gray-600 mb-6">
                Pinjaman untuk <span className="font-semibold">Toko Cahaya Mandiri</span> sebesar{' '}
                <span className="font-semibold">Rp 75.000.000</span> telah berhasil disetujui.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tolak Pinjaman Ini?</h3>
              <p className="text-gray-600 mb-4">
                Anda akan menolak pinjaman untuk <span className="font-semibold">Toko Cahaya Mandiri</span>. Silakan berikan alasan penolakan.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6 resize-none"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="flex-1 px-6 py-3 bg-[#EF4444] text-white rounded-lg font-semibold hover:bg-[#DC2626] hover:shadow-lg transition-all"
                >
                  Ya, Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
