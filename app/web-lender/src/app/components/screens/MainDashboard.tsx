import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type AppRow = {
  id: string;
  umkm_id: string;
  nominal_diajukan: number;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  created_at: string;
  nama_usaha: string | null;
  sektor: string | null;
  fintrust_score: number | null;
  risk_level: 'rendah' | 'menengah' | 'tinggi' | null;
};

// Dropdown sektor tetap dari mobile-umkm/src/app/components/auth/Register.tsx
// (businessTypes) — bukan teks bebas, jadi aman dipakai sebagai kategori chart.
const SEKTOR_LIST = ['Perdagangan', 'Kuliner', 'Jasa', 'Manufaktur', 'Pertanian', 'Lainnya'];

const RISK_LABELS: Record<string, string> = {
  rendah: 'Risiko Rendah',
  menengah: 'Risiko Menengah',
  tinggi: 'Risiko Tinggi',
};
const RISK_COLORS: Record<string, string> = {
  rendah: '#10B981',
  menengah: '#F59E0B',
  tinggi: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
  disetujui: 'Disetujui',
  menunggu: 'Menunggu',
  ditolak: 'Ditolak',
};
const STATUS_STYLE: Record<string, string> = {
  disetujui: 'bg-emerald-100 text-emerald-700',
  menunggu: 'bg-amber-100 text-amber-700',
  ditolak: 'bg-red-100 text-red-700',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function last6Months() {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()] });
  }
  return months;
}

export default function MainDashboard() {
  const navigate = useNavigate();
  const { lenderProfile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!lenderProfile) {
      setIsLoading(false);
      return;
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(
          `
          id, umkm_id, nominal_diajukan, status, created_at,
          umkm_profiles ( nama_usaha, sektor ),
          scores ( fintrust_score, risk_level )
        `
        )
        .eq('lender_id', lenderProfile.lender.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Gagal memuat data dasbor:', error);
        setApplications([]);
        setIsLoading(false);
        return;
      }

      const normalized: AppRow[] = (data ?? []).map((a: any) => {
        const umkm = Array.isArray(a.umkm_profiles) ? a.umkm_profiles[0] : a.umkm_profiles;
        const score = Array.isArray(a.scores) ? a.scores[0] : a.scores;
        return {
          id: a.id,
          umkm_id: a.umkm_id,
          nominal_diajukan: a.nominal_diajukan,
          status: a.status,
          created_at: a.created_at,
          nama_usaha: umkm?.nama_usaha ?? null,
          sektor: umkm?.sektor ?? null,
          fintrust_score: score?.fintrust_score ?? null,
          risk_level: score?.risk_level ?? null,
        };
      });

      setApplications(normalized);
      setIsLoading(false);
    };

    fetchApplications();
  }, [authLoading, lenderProfile]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  const totalUmkm = new Set(applications.map((a) => a.umkm_id)).size;

  const scored = applications.filter((a) => a.fintrust_score != null);
  const avgScore = scored.length
    ? scored.reduce((sum, a) => sum + (a.fintrust_score as number), 0) / scored.length
    : null;

  const totalDisetujui = applications.filter((a) => a.status === 'disetujui').length;

  const riskCounts = { rendah: 0, menengah: 0, tinggi: 0 };
  for (const a of applications) {
    if (a.risk_level) riskCounts[a.risk_level]++;
  }
  const totalRisk = riskCounts.rendah + riskCounts.menengah + riskCounts.tinggi;
  const riskDistribution = (['rendah', 'menengah', 'tinggi'] as const).map((k) => ({
    id: k,
    name: RISK_LABELS[k],
    value: totalRisk ? Math.round((riskCounts[k] / totalRisk) * 100) : 0,
    color: RISK_COLORS[k],
  }));

  const months = last6Months();
  const approvalTrend = months.map(({ key, label }) => {
    let approved = 0;
    let rejected = 0;
    for (const a of applications) {
      const d = new Date(a.created_at);
      if (`${d.getFullYear()}-${d.getMonth()}` !== key) continue;
      if (a.status === 'disetujui') approved++;
      else if (a.status === 'ditolak') rejected++;
    }
    return { id: key, month: label, approved, rejected };
  });

  const sectorData = SEKTOR_LIST.map((sektor) => {
    const umkmIds = new Set(
      applications.filter((a) => a.sektor === sektor).map((a) => a.umkm_id)
    );
    return { id: sektor, sector: sektor, count: umkmIds.size };
  }).filter((s) => s.count > 0);

  const recentApplications = applications.slice(0, 5);

  const kpiData = [
    {
      title: 'UMKM Mengajukan',
      value: String(totalUmkm),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Rata-rata Skor FinTrust',
      value: avgScore != null ? avgScore.toFixed(1) : '-',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Total Pinjaman Disetujui',
      value: String(totalDisetujui),
      icon: CheckCircle2,
      color: 'from-violet-500 to-violet-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dasbor Utama</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan performa dan analitik pinjaman UMKM — {lenderProfile?.lender.nama}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
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
          {totalRisk === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 text-center px-6">
              Belum ada pengajuan dengan skor untuk dihitung.
            </div>
          ) : (
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
          )}
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Persetujuan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={approvalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
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
          {sectorData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 text-center px-6">
              Belum ada data sektor UMKM.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sectorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar key="sector-bar" dataKey="count" fill="#1D4ED8" radius={[8, 8, 0, 0]} name="Jumlah UMKM" />
              </BarChart>
            </ResponsiveContainer>
          )}
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
              {recentApplications.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/wawasan-data/${item.id}`)}
                >
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    {item.nama_usaha || 'Tidak Diketahui'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.sektor || '-'}</td>
                  <td className="py-3 px-4">
                    {item.fintrust_score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#10B981] to-[#059669]"
                            style={{ width: `${item.fintrust_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.fintrust_score}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                      item.nominal_diajukan || 0
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </td>
                </tr>
              ))}

              {recentApplications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 bg-gray-50/50">
                    Belum ada pengajuan yang masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
