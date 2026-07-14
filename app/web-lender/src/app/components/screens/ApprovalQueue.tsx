import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

const queueData = [
  { id: 1, name: 'Toko Cahaya Mandiri', amount: 'Rp 75.000.000', score: 88, status: 'Menunggu Review', days: 2 },
  { id: 2, name: 'Toko Sinar Jaya', amount: 'Rp 65.000.000', score: 86, status: 'Menunggu Review', days: 2 },
  { id: 3, name: 'Warung Makan Sederhana', amount: 'Rp 40.000.000', score: 91, status: 'Disetujui', days: 1 },
  { id: 4, name: 'CV Teknik Mandiri', amount: 'Rp 150.000.000', score: 79, status: 'Menunggu Review', days: 5 },
  { id: 5, name: 'Toko Bangunan Jaya', amount: 'Rp 95.000.000', score: 83, status: 'Disetujui', days: 4 },
  { id: 6, name: 'Salon Cantik Permata', amount: 'Rp 30.000.000', score: 88, status: 'Menunggu Review', days: 1 },
  { id: 7, name: 'Warung Berkah Jaya', amount: 'Rp 50.000.000', score: 92, status: 'Disetujui', days: 3 },
  { id: 8, name: 'Toko Elektronik Sentosa', amount: 'Rp 85.000.000', score: 84, status: 'Ditolak', days: 6 },
];

export default function ApprovalQueue() {
  const navigate = useNavigate();

  const menungguCount = queueData.filter(item => item.status === 'Menunggu Review').length;
  const disetujuiCount = queueData.filter(item => item.status === 'Disetujui').length;
  const ditolakCount = queueData.filter(item => item.status === 'Ditolak').length;

  const handleReview = (id: number) => {
    navigate(`/wawasan-data/${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Antrean Persetujuan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan tinjau aplikasi pinjaman UMKM</p>
      </div>

      {/* Stats Cards - Only 3 Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Menunggu Review */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Menunggu Review</p>
              <p className="text-3xl font-bold text-gray-900">{menungguCount}</p>
            </div>
          </div>
        </div>

        {/* Disetujui */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Disetujui</p>
              <p className="text-3xl font-bold text-gray-900">{disetujuiCount}</p>
            </div>
          </div>
        </div>

        {/* Ditolak */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <XCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Ditolak</p>
              <p className="text-3xl font-bold text-gray-900">{ditolakCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Queue Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Aplikasi Pinjaman</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama UMKM</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Jumlah Pinjaman</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skor FinTrust</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Waktu Tunggu</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {queueData.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.amount}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.score}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{item.days} hari</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Menunggu Review' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleReview(item.id)}
                      className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-200"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
