import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Sesuaikan path import

// Tipe data untuk antrean
interface QueueItem {
  id: string;
  name: string;
  amount: string;
  score: number;
  status: string;
  days: number;
}

export default function ApprovalQueue() {
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [lenderName, setLenderName] = useState<string>("Memuat...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Belum login");

        const { data: profile } = await supabase
          .from('lender_profiles')
          .select('lender_id, lenders(nama)')
          .eq('profile_id', user.id)
          .single();

        if (profile) {
          // Akses nama lender (antisipasi jika relasi lenders berbentuk objek atau array)
          const namaLender = Array.isArray(profile.lenders) 
            ? profile.lenders[0]?.nama 
            : profile.lenders?.nama;
            
          setLenderName(namaLender || "Lender Tidak Diketahui");

          const { data: applications, error } = await supabase
            .from('applications')
            .select(`
              id,
              nominal_diajukan,
              status,
              created_at,
              umkm_profiles ( nama_usaha ),
              scores ( fintrust_score )
            `)
            .eq('lender_id', profile.lender_id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (applications) {
            const formatted = applications.map((app: any) => {
              // Kita buat aman untuk kedua kondisi (Objek maupun Array)
              const umkm = Array.isArray(app.umkm_profiles) ? app.umkm_profiles[0] : app.umkm_profiles;
              const skor = Array.isArray(app.scores) ? app.scores[0] : app.scores;

              return {
                id: app.id,
                name: umkm?.nama_usaha || 'Data Relasi Kosong/Diblokir RLS',
                amount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(app.nominal_diajukan),
                score: skor?.fintrust_score || 0,
                status: app.status,
                days: Math.floor((new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 3600 * 24))
              };
            });
            setQueueData(formatted);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data antrean:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, []);

  const menungguCount = queueData.filter(item => item.status === 'menunggu').length;
  const disetujuiCount = queueData.filter(item => item.status === 'disetujui').length;
  const ditolakCount = queueData.filter(item => item.status === 'ditolak').length;

  const handleReview = (id: string) => {
    navigate(`/wawasan-data/${id}`);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Antrean Persetujuan - {lenderName}</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan tinjau aplikasi pinjaman UMKM khusus untuk instansi Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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

      {/* Table */}
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
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{item.name}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{item.amount}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{item.score}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{item.days} hari</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      item.status === 'disetujui' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'menunggu' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button onClick={() => handleReview(item.id)} className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
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