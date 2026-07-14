import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export default function ApprovalFlow() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alur Persetujuan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan pantau proses persetujuan pinjaman</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Menunggu Review</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Dalam Proses</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Disetujui Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ditolak Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Queue */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Antrian Persetujuan</h3>
        <div className="space-y-3">
          {[
            { id: 1, name: 'Toko Sinar Jaya', amount: 'Rp 65.000.000', score: 86, status: 'review', days: 2 },
            { id: 2, name: 'Warung Makan Sederhana', amount: 'Rp 40.000.000', score: 91, status: 'review', days: 1 },
            { id: 3, name: 'CV Teknik Mandiri', amount: 'Rp 150.000.000', score: 79, status: 'process', days: 5 },
            { id: 4, name: 'Toko Bangunan Jaya', amount: 'Rp 95.000.000', score: 83, status: 'process', days: 4 },
            { id: 5, name: 'Salon Cantik Permata', amount: 'Rp 30.000.000', score: 88, status: 'review', days: 1 },
          ].map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {item.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.amount}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500">Skor FinTrust</p>
                  <p className="text-lg font-bold text-gray-900">{item.score}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Waktu tunggu</p>
                  <p className="text-sm font-medium text-gray-700">{item.days} hari</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                    Setujui
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
