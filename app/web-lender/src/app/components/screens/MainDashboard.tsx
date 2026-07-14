import { TrendingUp, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const kpiData = [
  { title: 'Total UMKM', value: '1,247', icon: Users, color: 'from-blue-500 to-blue-600', change: '+12.5%' },
  { title: 'Rata-rata Skor FinTrust', value: '81.4', icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', change: '+2.3%' },
  { title: 'Total Pinjaman Disetujui', value: '289', icon: CheckCircle2, color: 'from-violet-500 to-violet-600', change: '+8.1%' },
  { title: 'Prediksi NPL', value: '1.2%', icon: AlertTriangle, color: 'from-amber-500 to-amber-600', change: '-0.3%' },
];

const riskDistribution = [
  { id: 'low', name: 'Risiko Rendah', value: 62, color: '#10B981' },
  { id: 'medium', name: 'Risiko Menengah', value: 28, color: '#F59E0B' },
  { id: 'high', name: 'Risiko Tinggi', value: 10, color: '#EF4444' },
];

const approvalTrend = [
  { id: 'jan', month: 'Jan', approved: 42, rejected: 8 },
  { id: 'feb', month: 'Feb', approved: 51, rejected: 6 },
  { id: 'mar', month: 'Mar', approved: 48, rejected: 9 },
  { id: 'apr', month: 'Apr', approved: 63, rejected: 5 },
  { id: 'mei', month: 'Mei', approved: 58, rejected: 7 },
  { id: 'jun', month: 'Jun', approved: 72, rejected: 4 },
];

const sectorData = [
  { id: 'retail', sector: 'Retail', count: 325 },
  { id: 'fnb', sector: 'F&B', count: 289 },
  { id: 'manufaktur', sector: 'Manufaktur', count: 198 },
  { id: 'jasa', sector: 'Jasa', count: 245 },
  { id: 'teknologi', sector: 'Teknologi', count: 190 },
];

export default function MainDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dasbor Utama</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan performa dan analitik pinjaman UMKM</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${kpi.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.change}
                  </span>
                  <span className="text-xs text-gray-500">vs bulan lalu</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Risiko</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Persentase']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Persetujuan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={approvalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line key="approved-line" type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={3} name="Disetujui" dot={{ r: 4 }} />
              <Line key="rejected-line" type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={3} name="Ditolak" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sektor Industri</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar key="sector-bar" dataKey="count" fill="#1D4ED8" radius={[8, 8, 0, 0]} name="Jumlah UMKM" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aplikasi Pinjaman Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama UMKM</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sektor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skor FinTrust</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Jumlah</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Toko Cahaya Mandiri', sector: 'Retail', score: 88, amount: 'Rp 75.000.000', status: 'Menunggu' },
                { name: 'Warung Berkah Jaya', sector: 'F&B', score: 92, amount: 'Rp 50.000.000', status: 'Disetujui' },
                { name: 'CV Maju Sejahtera', sector: 'Manufaktur', score: 76, amount: 'Rp 120.000.000', status: 'Tinjauan' },
                { name: 'Toko Elektronik Sentosa', sector: 'Retail', score: 84, amount: 'Rp 85.000.000', status: 'Menunggu' },
              ].map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.sector}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#10B981] to-[#059669]"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status}
                    </span>
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
