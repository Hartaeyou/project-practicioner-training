import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/app/components/ui/button";
import {
  NotaGalleryDialog,
} from "@/app/components/shared/NotaGalleryDialog";
import {
  Network,
  FileText,
  Zap,
  TrendingUp,
  Clock,
  Loader2,
  ArrowLeft,
  Images,
} from "lucide-react";

// MIRROR: harus disinkron manual dengan CARA_BAYAR_OPTIONS/computeSkorSupplier
// di mobile-umkm/src/app/components/onboarding/Onboardingtypes.ts — web-lender
// dan mobile-umkm adalah dua app terpisah, tidak ada package bersama untuk
// mengimpor formula ini langsung.
const CARA_BAYAR_SKOR: Record<string, number> = {
  lunas: 100,
  tempo_kurang_7: 85,
  tempo_7_30: 60,
  sering_telat: 30,
};

// Skor kepercayaan per-mitra: 60% disiplin cara bayar + 40% rating kepuasan.
// null kalau datanya tidak lengkap (bukan dipaksa jadi 0 yang menyesatkan).
function computeSkorMitra(rel: {
  cara_bayar?: string | null;
  rating?: number | null;
}): number | null {
  const skorCaraBayar = rel.cara_bayar ? CARA_BAYAR_SKOR[rel.cara_bayar] : undefined;
  if (skorCaraBayar == null || !rel.rating) return null;
  const skorRating = (rel.rating / 5) * 100;
  return Math.round(skorCaraBayar * 0.6 + skorRating * 0.4);
}

// Kategori 3-tingkat untuk kartu insight — ambang sama persis dengan yang
// dipakai untuk fintrust_score di DataInsightsDetail.tsx/ApprovalQueue.tsx,
// supaya lender melihat bahasa yang konsisten di seluruh app.
function scoreTier(score: number | null) {
  if (score == null)
    return { label: "Belum Tersedia", text: "text-gray-500", bar: "from-gray-300 to-gray-400" };
  if (score >= 80)
    return { label: "Sangat Baik", text: "text-[#10B981]", bar: "from-emerald-500 to-emerald-600" };
  if (score >= 60)
    return { label: "Cukup", text: "text-amber-600", bar: "from-amber-500 to-amber-600" };
  return { label: "Perlu Perhatian", text: "text-red-600", bar: "from-red-500 to-red-600" };
}

// Warna garis/node di peta jaringan: 2 tingkat saja (kuat vs perlu perhatian),
// ambang 70 supaya kategori cara_bayar "tempo_7_30" (skor dasar 60) tidak ikut
// lolos jadi "kuat" hanya karena rating kepuasannya tinggi. Abu-abu = data
// supplier belum lengkap, bukan skor buruk.
function svgTierColor(score: number | null): string {
  if (score == null) return "#9CA3AF";
  return score >= 70 ? "#10B981" : "#F59E0B";
}

function truncateLabel(label: string, max = 16) {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}

export default function TrustNetworkAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notaGallery, setNotaGallery] = useState<{
    title: string;
    urls: string[];
  } | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("Sesi login tidak ditemukan.");

        const { data: profile, error: profileError } = await supabase
          .from("lender_profiles")
          .select("lender_id")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile)
          throw new Error("Profil Anda sebagai Lender tidak ditemukan.");

        const { data: appData, error: appError } = await supabase
          .from("applications")
          .select(
            `
            id,
            umkm_profiles ( nama_usaha, business_relations (*) ),
            scores ( breakdown, profil_snapshot )
          `
          )
          .eq("id", id)
          // Sama seperti DataInsightsDetail.tsx: lender cuma boleh buka
          // pengajuan yang ditujukan ke lender-nya sendiri.
          .eq("lender_id", profile.lender_id)
          .maybeSingle();

        if (appError) {
          console.error("Error dari Supabase:", appError);
          throw new Error(
            appError.message || "Gagal mengambil relasi dari database"
          );
        }

        if (!appData) {
          throw new Error(
            "Data pengajuan kosong, terblokir RLS, atau ID tidak cocok."
          );
        }

        setData(appData);
      } catch (err: any) {
        console.error("Terjadi kegagalan Trust Network:", err);
        const errorMessage =
          err?.message ||
          (typeof err === "string" ? err : "Terjadi kesalahan tidak dikenal.");
        alert(`Gagal menarik data: ${errorMessage}`);
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id, navigate]);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    toast.loading("Membuat laporan risiko...", { id: "report-generation" });

    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Laporan berhasil dibuat!", {
        id: "report-generation",
        description: "Laporan analisis risiko telah siap untuk diunduh",
      });
    }, 2500);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  const scoreData = Array.isArray(data?.scores) ? data?.scores[0] : data?.scores;
  const umkmProfile = Array.isArray(data?.umkm_profiles)
    ? data?.umkm_profiles[0]
    : data?.umkm_profiles;

  // Sama seperti DataInsightsDetail.tsx: snapshot per-sinkronisasi dulu,
  // fallback ke join live untuk baris scores lama yang belum punya snapshot.
  const snapshot = scoreData?.profil_snapshot ?? null;
  const profileView = snapshot ?? umkmProfile;
  const suppliersView: any[] =
    snapshot?.suppliers ?? umkmProfile?.business_relations ?? [];
  const isB2B = !!scoreData?.breakdown?.rantaiPasok?.platform;
  const platformB2B = scoreData?.breakdown?.rantaiPasok?.platform as
    | string
    | undefined;

  const centerScore: number | null =
    scoreData?.breakdown?.stabilitasPendapatan ?? null;

  const n = suppliersView.length;
  const supplierNodes = suppliersView.map((rel: any, i: number) => {
    const angle = (-90 + i * (360 / n)) * (Math.PI / 180);
    const radius = 32;
    return {
      id: rel.id ?? `supplier-${i}`,
      label: rel.nama_supplier ?? "Supplier",
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      isCenter: false,
      score: computeSkorMitra(rel),
    };
  });

  const networkNodes = [
    {
      id: "center",
      label: profileView?.nama_usaha ?? "UMKM",
      x: 50,
      y: 50,
      isCenter: true,
      score: centerScore,
    },
    ...supplierNodes,
  ];

  const validCaraBayar = suppliersView
    .map((s) => (s.cara_bayar ? CARA_BAYAR_SKOR[s.cara_bayar] : undefined))
    .filter((v): v is number => v != null);
  const skorKetepatanBayar = validCaraBayar.length
    ? Math.round(
        validCaraBayar.reduce((a, b) => a + b, 0) / validCaraBayar.length
      )
    : null;

  // Hubungan Pemasok & Skor Jaringan Kepercayaan sama-sama berasal dari
  // stabilitasPendapatan (satu sumber kebenaran, sudah tersimpan permanen
  // di scores.breakdown), jadi memang satu tier dipakai untuk dua kartu.
  const stabilitasTier = scoreTier(centerScore);
  const ketepatanTier = scoreTier(skorKetepatanBayar);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analisis Jaringan Kepercayaan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {profileView?.nama_usaha || "UMKM"} — visualisasi relasi supplier
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Network Visualization - Left Side */}
        <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" />
              Peta Jaringan Bisnis
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span>Kuat</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span>Perlu Perhatian</span>
              </div>
            </div>
          </div>

          <div
            className="relative bg-gray-800/50 rounded-lg p-4"
            style={{ height: "400px" }}
          >
            {n === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2 px-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: svgTierColor(centerScore) + "33" }}
                >
                  <Network
                    className="w-7 h-7"
                    style={{ color: svgTierColor(centerScore) }}
                  />
                </div>
                <p className="text-white text-sm font-semibold">
                  {profileView?.nama_usaha || "UMKM"}
                </p>
                <p className="text-gray-400 text-xs max-w-xs">
                  {isB2B
                    ? `UMKM ini menggunakan platform B2B: ${platformB2B}. Belum ada data mitra individual yang tercatat.`
                    : "Belum ada data mitra/pemasok yang dilaporkan UMKM."}
                </p>
              </div>
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Connections */}
                {supplierNodes.map((node) => {
                  const color = svgTierColor(node.score);
                  const strength = Math.max((node.score ?? 30) / 100, 0.15);
                  return (
                    <g key={node.id}>
                      <line
                        x1={50}
                        y1={50}
                        x2={node.x}
                        y2={node.y}
                        stroke={color}
                        strokeWidth={strength * 0.4}
                        strokeDasharray={node.score != null && node.score >= 70 ? "0" : "2,2"}
                        opacity={0.6}
                        filter="url(#glow)"
                      />
                      <circle r="1" fill={color} opacity="0.8">
                        <animateMotion
                          dur={`${3 / strength}s`}
                          repeatCount="indefinite"
                          path={`M 50,50 L ${node.x},${node.y}`}
                        />
                      </circle>
                    </g>
                  );
                })}

                {/* Nodes */}
                {networkNodes.map((node) => {
                  const color = svgTierColor(node.score);
                  return (
                    <g
                      key={node.id}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.isCenter ? 8 : 5}
                        fill="none"
                        stroke={color}
                        strokeWidth="0.3"
                        opacity={hoveredNode === node.id ? 1 : 0.3}
                        filter="url(#glow)"
                      >
                        <animate
                          attributeName="r"
                          from={node.isCenter ? "8" : "5"}
                          to={node.isCenter ? "10" : "7"}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>

                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.isCenter ? 6 : 4}
                        fill={color}
                        filter="url(#glow)"
                        opacity={hoveredNode === node.id ? 1 : 0.9}
                      />

                      <text
                        x={node.x}
                        y={node.y + (node.isCenter ? 10 : 8)}
                        textAnchor="middle"
                        fill="white"
                        fontSize={node.isCenter ? "3.5" : "2.5"}
                        fontWeight={node.isCenter ? "bold" : "normal"}
                        opacity={hoveredNode === node.id ? 1 : 0.8}
                      >
                        {truncateLabel(node.label)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {hoveredNode && (
              <div className="absolute top-4 right-4 bg-gray-900/95 border border-emerald-500/50 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-white text-sm font-semibold">
                  {networkNodes.find((n) => n.id === hoveredNode)?.label}
                </p>
                <p className="text-emerald-400 text-xs mt-1">
                  {(() => {
                    const s = networkNodes.find((n) => n.id === hoveredNode)?.score;
                    return s != null ? `Skor: ${s}/100` : "Data belum lengkap";
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Insights Panel - Right Side */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Hubungan Pemasok</p>
                <p className={`text-xl font-bold ${stabilitasTier.text}`}>
                  {stabilitasTier.label}
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${stabilitasTier.bar}`}
                style={{ width: `${centerScore ?? 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {n} pemasok tercatat
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Skor Ketepatan Bayar</p>
                <p className={`text-xl font-bold ${ketepatanTier.text}`}>
                  {skorKetepatanBayar != null ? skorKetepatanBayar : "-"}
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${ketepatanTier.bar}`}
                style={{ width: `${skorKetepatanBayar ?? 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {validCaraBayar.length} dari {n} supplier punya data cara bayar
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Skor Jaringan Kepercayaan</p>
                <p className="text-xl font-bold text-gray-900">
                  {centerScore != null ? `${centerScore}/100` : "N/A"}
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${stabilitasTier.bar}`}
                style={{ width: `${centerScore ?? 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Kategori: {stabilitasTier.label}
            </p>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Membuat Laporan...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Buat Laporan Risiko</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Detailed Relationship Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detail Hubungan Bisnis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Nama Mitra
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Bahan Suplai
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Pengeluaran/Bulan
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Skor
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Foto Nota
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliersView.map((rel: any) => {
                const skor = computeSkorMitra(rel);
                return (
                  <tr
                    key={rel.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                      {rel.nama_supplier}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {rel.bahan_suplai || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {rel.total_pengeluaran
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(rel.total_pengeluaran)
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {skor != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                              style={{ width: `${skor}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {skor}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Data Belum Lengkap
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rel.nota_urls?.length ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNotaGallery({
                              title: rel.nama_supplier,
                              urls: rel.nota_urls,
                            })
                          }
                        >
                          <Images className="w-3.5 h-3.5 mr-1.5" />{" "}
                          {rel.nota_urls.length} Foto
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {suppliersView.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500 bg-gray-50/50"
                  >
                    {isB2B
                      ? `UMKM ini menggunakan platform B2B: ${platformB2B}, tidak ada data mitra individual.`
                      : "Tidak ada data relasi bisnis yang dilampirkan oleh UMKM."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox galeri foto nota supplier */}
      <NotaGalleryDialog
        gallery={notaGallery}
        onOpenChange={(open) => !open && setNotaGallery(null)}
      />
    </div>
  );
}
