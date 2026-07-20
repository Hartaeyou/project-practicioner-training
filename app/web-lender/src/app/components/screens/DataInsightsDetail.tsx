import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "@/lib/supabaseClient"; // Sesuaikan path ini jika berbeda
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  NotaGalleryDialog,
  isImageUrl,
} from "@/app/components/shared/NotaGalleryDialog";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Images,
  Wallet,
  Network,
} from "lucide-react";

export default function DataInsightsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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

        // Melakukan Nested Join: applications -> umkm_profiles -> business_relations
        const { data: appData, error: appError } = await supabase
          .from("applications")
          .select(
            `
            *,
            scores (*),
            umkm_profiles (
              *,
              business_relations (*)
            )
          `
          )
          .eq("id", id)
          // FIX KEAMANAN: lender cuma boleh buka pengajuan yang ditujukan
          // ke lender-nya sendiri. Sebelumnya dikomentari sehingga lender
          // mana pun bisa membuka detail pengajuan milik lender lain.
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
        console.error("Terjadi kegagalan Detail:", err);
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

  const handleUpdateStatus = async (newStatus: "disetujui" | "ditolak") => {
    if (
      !confirm(
        `Apakah Anda yakin ingin ${newStatus.toUpperCase()} pengajuan ini?`
      )
    )
      return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      alert(`Berhasil! Status diubah menjadi ${newStatus}.`);
      navigate(-1);
    } catch (error) {
      console.error("Gagal mengupdate status:", error);
      alert("Terjadi kesalahan sistem saat memproses keputusan.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  // Format Helper untuk Judul Dokumen JSONB
  const formatTitle = (key: string) => {
    if (key.toLowerCase() === "npwp") return "NPWP";
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };
  const dokumen = data?.dokumen || {};

  const scoreData = Array.isArray(data?.scores)
    ? data?.scores[0]
    : data?.scores;
  const umkmProfile = Array.isArray(data?.umkm_profiles)
    ? data?.umkm_profiles[0]
    : data?.umkm_profiles;

  // FIX SNAPSHOT: kalau scoreData.profil_snapshot ada, itu adalah kondisi
  // profil UMKM saat sinkronisasi AI yang menghasilkan skor ini terjadi —
  // dipakai supaya pengajuan lama tidak ikut berubah kalau UMKM
  // sinkronisasi ulang. Baris scores lama (sebelum kolom ini ada / belum
  // di-backfill) tidak punya snapshot, jadi fallback ke data live seperti
  // sebelumnya — tidak ada regresi untuk data yang sudah ada.
  const snapshot = scoreData?.profil_snapshot ?? null;
  const profileView = snapshot ?? umkmProfile;
  const suppliersView: any[] =
    snapshot?.suppliers ?? umkmProfile?.business_relations ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Review: {profileView?.nama_usaha || "Tidak Diketahui"}
            </h1>
            <p className="text-sm text-gray-500">
              Nominal:{" "}
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(data?.nominal_diajukan || 0)}{" "}
              | Status:{" "}
              <span className="font-semibold uppercase">{data?.status}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {data?.status === "menunggu" && (
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus("ditolak")}
              disabled={isUpdating}
            >
              <XCircle className="w-4 h-4 mr-2" /> Tolak
            </Button>
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              onClick={() => handleUpdateStatus("disetujui")}
              disabled={isUpdating}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Setujui
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="ai-score" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
          <TabsTrigger value="ai-score">Skor FinTrust & AI</TabsTrigger>
          <TabsTrigger value="dokumen">Verifikasi Dokumen</TabsTrigger>
          <TabsTrigger value="bisnis">Analisis Usaha</TabsTrigger>
        </TabsList>

        {/* Tab 1: AI Score */}
        <TabsContent value="ai-score" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rekomendasi AI Credit Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <div
                  className={`p-6 rounded-full border-8 flex items-center justify-center w-32 h-32 ${
                    scoreData?.fintrust_score >= 80
                      ? "border-[#10B981] text-[#10B981]"
                      : scoreData?.fintrust_score >= 60
                      ? "border-amber-500 text-amber-600"
                      : "border-red-500 text-red-600"
                  }`}
                >
                  <span className="text-4xl font-bold">
                    {scoreData?.fintrust_score || "N/A"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    Tingkat Risiko:{" "}
                    <span className="uppercase">
                      {scoreData?.risk_level || "UNKNOWN"}
                    </span>
                  </h3>
                  <p className="text-gray-600 max-w-2xl leading-relaxed">
                    {scoreData?.xai_narrative ||
                      "Tidak ada penjelasan AI (XAI) yang tersedia untuk data ini."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Dokumen Legal & Finansial */}
        <TabsContent value="dokumen">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. KTP dan Selfie — dari snapshot sinkronisasi (fallback ke
                data live untuk baris scores lama tanpa snapshot) */}
            {profileView?.ktp_url && (
              <Card className="overflow-hidden">
                <CardHeader className="p-4 bg-muted/30">
                  <CardTitle className="text-sm font-medium">
                    Foto KTP
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <div className="h-48 w-full rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={profileView.ktp_url}
                      alt="KTP"
                      className="object-contain h-full w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(profileView.ktp_url, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Buka Ukuran Penuh
                  </Button>
                </CardContent>
              </Card>
            )}

            {profileView?.selfie_url && (
              <Card className="overflow-hidden">
                <CardHeader className="p-4 bg-muted/30">
                  <CardTitle className="text-sm font-medium">
                    Foto Selfie Liveness
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <div className="h-48 w-full rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={profileView.selfie_url}
                      alt="Selfie"
                      className="object-contain h-full w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(profileView.selfie_url, "_blank")
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Buka Ukuran Penuh
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 2. NPWP, Rekening Koran, Surat Izin Usaha (dari kolom JSONB applications) */}
            {Object.keys(dokumen).map((key) => {
              const url = dokumen[key];
              return (
                <Card key={key} className="overflow-hidden">
                  <CardHeader className="p-4 bg-muted/30">
                    <CardTitle className="text-sm font-medium">
                      {formatTitle(key)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col items-center gap-4">
                    <div className="h-48 w-full rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                      {url.endsWith(".pdf") ? (
                        <span className="text-gray-500 font-medium">
                          Dokumen PDF Terlampir
                        </span>
                      ) : (
                        <img
                          src={url}
                          alt={key}
                          className="object-contain h-full w-full"
                        />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> Buka Ukuran
                      Penuh
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tampilan Empty State jika benar-benar tidak ada dokumen */}
          {Object.keys(dokumen).length === 0 && !profileView?.ktp_url && (
            <div className="w-full p-8 text-center border-2 border-dashed rounded-xl text-gray-500">
              Belum ada dokumen yang diunggah.
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Bisnis & Supply Chain */}
        <TabsContent value="bisnis">
          <Card>
            <CardHeader>
              <CardTitle>Profil Lengkap & Supply Chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-xl border">
                <div>
                  <span className="font-semibold block text-gray-500">
                    Sektor:
                  </span>
                  {profileView?.sektor || "-"}
                </div>
                <div>
                  <span className="font-semibold block text-gray-500">
                    Lama Usaha:
                  </span>
                  {profileView?.lama_usaha_bulan
                    ? `${profileView.lama_usaha_bulan} Bulan`
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold block text-gray-500">
                    Estimasi Omzet:
                  </span>
                  {profileView?.omzet_estimasi || "-"}
                </div>
                <div>
                  <span className="font-semibold block text-gray-500">
                    Alamat:
                  </span>
                  {profileView?.alamat || "-"}
                </div>
              </div>

              {/* Bukti Omzet Manual — hanya tampil kalau UMKM mencatat omzet
                  manual (tidak terhubung ke merchant/e-wallet) */}
              {profileView?.omzet_manual_juta_per_bulan != null && (
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">
                    Bukti Omzet Manual (Tidak Terhubung Merchant)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm h-fit">
                      <div>
                        <span className="font-semibold block text-gray-500">
                          Omzet per Bulan:
                        </span>
                        Rp {profileView.omzet_manual_juta_per_bulan} Juta
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-500">
                          Transaksi per Bulan:
                        </span>
                        {profileView.omzet_manual_frekuensi_per_bulan || "-"}x
                      </div>
                    </div>
                    <Card className="overflow-hidden">
                      <CardHeader className="p-3 bg-muted/30">
                        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5" /> Foto/File Bukti
                          Omzet
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 flex flex-col items-center gap-3">
                        {profileView.omzet_manual_bukti_url ? (
                          <>
                            <div className="h-32 w-full rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                              {isImageUrl(profileView.omzet_manual_bukti_url) ? (
                                <img
                                  src={profileView.omzet_manual_bukti_url}
                                  alt="Bukti Omzet Manual"
                                  className="object-contain h-full w-full"
                                />
                              ) : (
                                <span className="text-xs text-gray-500 font-medium px-2 text-center">
                                  Dokumen Terlampir
                                </span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                window.open(
                                  profileView.omzet_manual_bukti_url,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />{" "}
                              Buka File
                            </Button>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-6">
                            Tidak ada bukti diunggah (opsional)
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Relasi Bisnis (Supplier)
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/analisis-jaringan/${id}`)}
                  >
                    <Network className="w-3.5 h-3.5 mr-1.5" /> Lihat
                    Visualisasi Jaringan
                  </Button>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b text-gray-700">
                      <tr>
                        <th className="p-4 text-left font-semibold">
                          Nama Supplier
                        </th>
                        <th className="p-4 text-left font-semibold">
                          Bahan Suplai
                        </th>
                        <th className="p-4 text-left font-semibold">
                          Cara Bayar
                        </th>
                        <th className="p-4 text-center font-semibold">
                          Rating
                        </th>
                        <th className="p-4 text-right font-semibold">
                          Pengeluaran
                        </th>
                        <th className="p-4 text-center font-semibold">
                          Foto Nota
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {suppliersView.map((rel: any) => (
                        <tr
                          key={rel.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 font-medium text-gray-900">
                            {rel.nama_supplier}
                          </td>
                          <td className="p-4 text-gray-600">
                            {rel.bahan_suplai || "-"}
                          </td>
                          <td className="p-4 text-gray-600 capitalize">
                            {(rel.cara_bayar || "-").replace(/_/g, " ")}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-semibold text-xs border border-amber-100">
                              {rel.rating || 0} ★
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium text-gray-900">
                            {rel.total_pengeluaran
                              ? new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                }).format(rel.total_pengeluaran)
                              : "-"}
                          </td>
                          <td className="p-4 text-center">
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
                      ))}

                      {suppliersView.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-gray-500 bg-gray-50/50"
                          >
                            Tidak ada data relasi bisnis yang dilampirkan oleh
                            UMKM.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lightbox galeri foto nota supplier */}
      <NotaGalleryDialog
        gallery={notaGallery}
        onOpenChange={(open) => !open && setNotaGallery(null)}
      />
    </div>
  );
}
