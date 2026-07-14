import { useState } from 'react';
import { Bell, TrendingUp, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useScore } from '../../lib/ScoreContext';

const monthlyData = [
  { month: 'Jan', amount: 45 },
  { month: 'Feb', amount: 52 },
  { month: 'Mar', amount: 48 },
  { month: 'Apr', amount: 61 },
  { month: 'Mei', amount: 58 },
  { month: 'Jun', amount: 67 },
];

export function Beranda() {
  const { result } = useScore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRevenueSheet, setShowRevenueSheet] = useState(false);
  const [showChartDetail, setShowChartDetail] = useState(false);

  const notifications = [
    { id: 1, text: 'Skor FinTrust Anda naik +4', time: '2 jam yang lalu' },
    { id: 2, text: 'Data QRIS berhasil disinkronkan', time: '5 jam yang lalu' },
    { id: 3, text: 'Peluang pendanaan baru tersedia', time: '1 hari yang lalu' },
  ];

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header with safe area */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl text-gray-900">Selamat Datang!</h1>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 right-6 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notifikasi</h3>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-2 h-2 bg-[#1D4ED8] rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notif.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 py-6 space-y-6">
        {/* Hero Card - Score */}
        <div className="bg-gradient-to-br from-[#1D4ED8] to-[#1e40af] rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-2">Skor FinTrust Anda</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl">{result.skorAkhir}</span>
            <span className="text-xl opacity-90">/100</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{result.skorAkhir >= 70 ? 'Kondisi Baik' : 'Perlu Ditingkatkan'}</span>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowRevenueSheet(true)}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
          >
            <TrendingUp className="w-8 h-8 text-[#10B981] mb-3" />
            <p className="text-xs text-gray-500 mb-1">Status Usaha</p>
            <p className="font-semibold text-gray-900">Stabil</p>
          </button>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <CheckCircle className="w-8 h-8 text-[#10B981] mb-3" />
            <p className="text-xs text-gray-500 mb-1">Status Pinjaman</p>
            <p className="font-semibold text-gray-900">Siap</p>
          </div>
        </div>

        {/* Chart Card */}
        <div
          onClick={() => setShowChartDetail(true)}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Transaksi Bulanan</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#1D4ED8"
                strokeWidth={3}
                dot={{ fill: '#1D4ED8', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Trend Bottom Sheet */}
      <AnimatePresence>
        {showRevenueSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRevenueSheet(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-[393px] mx-auto bg-white rounded-t-3xl z-50 p-6"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Tren Pendapatan</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rata-rata Bulanan</span>
                  <span className="font-semibold text-gray-900">
                    Rp {result.completed ? result.omzetBulanan : 55.2} Juta
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pertumbuhan</span>
                  <span className="font-semibold text-[#10B981]">+12.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-gray-900">Stabil</span>
                </div>
              </div>
              <button
                onClick={() => setShowRevenueSheet(false)}
                className="w-full mt-6 bg-[#1D4ED8] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chart Detail Page */}
      <AnimatePresence>
        {showChartDetail && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-white z-50"
          >
            <div className="pt-12 px-6 pb-6">
              <button
                onClick={() => setShowChartDetail(false)}
                className="text-[#1D4ED8] font-semibold mb-4"
              >
                ← Kembali
              </button>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analitik Detail</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#1D4ED8"
                    strokeWidth={3}
                    dot={{ fill: '#1D4ED8', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-8 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-semibold text-gray-900">Rp 331 Juta</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Rata-rata per Bulan</p>
                  <p className="text-2xl font-semibold text-gray-900">Rp 55,2 Juta</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}