import { useEffect, useState } from "react";
import {
  Bell, TrendingUp, CheckCircle, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Clock, Building2, ChevronRight, X,
  Banknote, Sparkles, Loader2, AlertCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
import { useScore } from "../../lib/ScoreContext";
import { useLenders, formatRupiah, isLenderEligible, Lender } from "../../lib/useLenders";
import { supabase } from "../../lib/supabaseClient";

// ─── Types untuk data asli yang di-fetch ────────────────────────────────────

type ScoreHistoryPoint = { tanggal: string; skor: number };

type RecentApplication = {
  id: string;
  lender_id: string;
  nominal_diajukan: number;
  status: string | null;
  created_at: string;
};

type FeedItem = {
  id: string;
  icon: typeof CheckCircle;
  color: string;
  bg: string;
  title: string;
  desc: string;
  time: string; // sudah diformat relatif
  sortDate: string; // ISO, untuk sorting
};

// ─── Quick actions (statis — cuma navigasi, bukan data) ─────────────────────

const quickActions = [
  { icon: Banknote, label: "Ajukan\nPinjaman", key: "pinjaman", navEvent: "navigateToPendana" },
  { icon: RefreshCw, label: "Sinkronisasi\nAI", key: "sync", navEvent: "navigateToProfil" },
  { icon: Clock, label: "Riwayat\nPengajuan", key: "riwayat", navEvent: "navigateToRiwayat" },
  { icon: Building2, label: "Mitra\nPendana", key: "pendana", navEvent: "navigateToPendana" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreStatus(score: number) {
  if (score >= 75) return { label: "Kondisi Baik", color: "#10B981", bg: "rgba(16,185,129,0.18)" };
  if (score >= 50) return { label: "Perlu Verifikasi", color: "#F59E0B", bg: "rgba(245,158,11,0.18)" };
  return { label: "Risiko Tinggi", color: "#EF4444", bg: "rgba(239,68,68,0.18)" };
}

function statusUsahaFromStabilitas(stabilitas: number) {
  if (stabilitas >= 75) return { label: "Stabil", color: "#10B981", bg: "#ECFDF5" };
  if (stabilitas >= 50) return { label: "Berkembang", color: "#1D4ED8", bg: "#EFF6FF" };
  return { label: "Perlu Perhatian", color: "#F59E0B", bg: "#FFFBEB" };
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

const APPLICATION_STATUS_META: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  diajukan: { label: "Pengajuan Terkirim", icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
  menunggu: { label: "Pengajuan Terkirim", icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
  diproses: { label: "Pengajuan Diproses", icon: RefreshCw, color: "#1D4ED8", bg: "#EFF6FF" },
  disetujui: { label: "Pengajuan Disetujui", icon: CheckCircle, color: "#10B981", bg: "#ECFDF5" },
  ditolak: { label: "Pengajuan Ditolak", icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
};

// ─── Custom tooltip untuk chart skor ────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2.5 text-xs">
      <p className="font-bold text-[#0F1D3E] mb-1">{label}</p>
      <p className="text-[#1D4ED8]">Skor: <span className="font-semibold">{payload[0]?.value}/100</span></p>
    </div>
  );
}

// ─── Score ring SVG ──────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (Math.min(100, Math.max(0, score)) / 100) * circ;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke="white" strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x={36} y={40} textAnchor="middle" fill="white" fontSize={15} fontWeight={800}>
        {score}
      </text>
    </svg>
  );
}

// ─── Notification Dropdown — isi dari feed data asli (bukan array statis) ───

function NotifDropdown({ items, onClose }: { items: FeedItem[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-[78px] right-5 w-[310px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <span className="font-bold text-[#0F1D3E] text-sm">Notifikasi</span>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
          <X size={12} className="text-gray-500" />
        </button>
      </div>
      <div className="py-2">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Belum ada notifikasi.</p>
        ) : (
          items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: n.bg }}>
                <n.icon size={15} style={{ color: n.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0F1D3E] text-xs font-semibold leading-tight">{n.title}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{n.desc} · {n.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Bottom Sheet ────────────────────────────────────────────────────────────

function BottomSheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 max-w-[393px] mx-auto bg-white rounded-t-3xl z-50 pb-10"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          <h3 className="font-bold text-[#0F1D3E] text-lg mt-2">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-2">
            <X size={14} className="text-gray-600" />
          </button>
        </div>
        <div className="px-6">{children}</div>
      </motion.div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Beranda() {
  const { profile, umkmProfile } = useAuth();
  const { result } = useScore();
  const { lenders, loading: lendersLoading } = useLenders();

  const [showNotif, setShowNotif] = useState(false);
  const [showRevenueSheet, setShowRevenueSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState<"usaha" | "pinjaman" | null>(null);
  const [showActionSheet, setShowActionSheet] = useState<string | null>(null);

  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryPoint[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const score = result.completed ? result.skorAkhir : 0;
  const status = getScoreStatus(score);
  const namaUsaha = umkmProfile?.nama_usaha || result.namaUsaha || "Usaha Anda";
  const namaPemilik = profile?.full_name || result.namaPemilik || "";

  // ── Fetch riwayat skor & pengajuan terbaru dari Supabase (data asli) ──────
  useEffect(() => {
    if (!umkmProfile) {
      setLoadingFeed(false);
      return;
    }
    let active = true;
    setLoadingFeed(true);

    Promise.all([
      supabase
        .from("scores")
        .select("fintrust_score, created_at")
        .eq("umkm_id", umkmProfile.id)
        .order("created_at", { ascending: true })
        .limit(10),
      supabase
        .from("applications")
        .select("id, lender_id, nominal_diajukan, status, created_at")
        .eq("umkm_id", umkmProfile.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]).then(([scoresRes, appsRes]) => {
      if (!active) return;
      if (!scoresRes.error && scoresRes.data) {
        setScoreHistory(
          scoresRes.data.map((r: any) => ({
            tanggal: new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
            skor: r.fintrust_score,
          })),
        );
      }
      if (!appsRes.error && appsRes.data) {
        setRecentApplications(appsRes.data as RecentApplication[]);
      }
      setLoadingFeed(false);
    });

    return () => { active = false; };
  }, [umkmProfile]);

  // ── Bangun feed aktivitas + notifikasi dari data asli di atas ─────────────
  const activityFeed: FeedItem[] = [
    ...recentApplications.map((app): FeedItem => {
      const lender = lenders.find((l) => l.id === app.lender_id);
      const meta = APPLICATION_STATUS_META[app.status ?? "menunggu"] ?? APPLICATION_STATUS_META.menunggu;
      return {
        id: `app-${app.id}`,
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
        title: meta.label,
        desc: `${formatRupiah(app.nominal_diajukan)} — ${lender?.nama ?? "Pendana"}`,
        time: timeAgo(app.created_at),
        sortDate: app.created_at,
      };
    }),
    ...(scoreHistory.length > 0
      ? [
          {
            id: "score-latest",
            icon: TrendingUp,
            color: "#1D4ED8",
            bg: "#EFF6FF",
            title: "Skor Diperbarui",
            desc: `${scoreHistory[scoreHistory.length - 1].skor}/100`,
            time: "",
            sortDate: new Date().toISOString(), // ditaruh di paling atas kalau baru saja sync
          } as FeedItem,
        ]
      : []),
  ]
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .slice(0, 3);

  const unreadCount = activityFeed.length;

  // ── Status usaha & pinjaman dari data ScoreContext asli ───────────────────
  const statusUsaha = statusUsahaFromStabilitas(result.stabilitasPendapatan ?? 0);
  const bestLimit = lenders.length ? Math.max(...lenders.map((l) => l.limit_plafon)) : 0;
  const statusPinjaman = !result.completed
    ? { label: "Lengkapi Sinkronisasi", color: "#F59E0B", bg: "#FFFBEB" }
    : result.statusKelayakan === "Tinggi"
    ? { label: "Siap Mengajukan", color: "#1D4ED8", bg: "#EFF6FF" }
    : { label: "Perlu Verifikasi", color: "#F59E0B", bg: "#FFFBEB" };

  // ── Rekomendasi pendana dari data lenders asli (bukan array dummy) ────────
  // Kalau sudah Sinkronisasi AI, saring dulu pakai ambang skor FinTrust
  // masing-masing lender — kalau belum, tetap tampilkan top-3 by limit apa
  // adanya (ini kartu teaser di dashboard, tombol "Ajukan"-nya toh cuma
  // deep-link ke Pendana.tsx yang punya gate lengkapnya sendiri).
  const recommendedLenders: Lender[] = (
    result.completed ? lenders.filter((l) => isLenderEligible(l, result.skorAkhir)) : lenders
  )
    .slice()
    .sort((a, b) => b.limit_plafon - a.limit_plafon)
    .slice(0, 3);

  function handleQuickAction(key: string, navEvent: string) {
    // FIX: buka bottom sheet info + dispatch event navigasi.
    // Pastikan komponen induk (App/Layout) listen ke event ini untuk
    // benar-benar pindah tab, mis: window.addEventListener('navigateToPendana', ...)
    setShowActionSheet(key);
  }

  return (
    <div className="min-h-full bg-[#F9FAFB]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="relative bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Selamat Datang</p>
            <h1 className="text-[#0F1D3E] font-extrabold text-lg leading-tight">{namaUsaha}</h1>
            {namaPemilik && <p className="text-gray-400 text-xs mt-0.5">{namaPemilik}</p>}
          </div>
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Bell size={19} className="text-[#0F1D3E]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showNotif && <NotifDropdown items={activityFeed} onClose={() => setShowNotif(false)} />}
        </AnimatePresence>
      </div>

      <div className="px-5 pt-5 pb-24 space-y-4">

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl overflow-hidden shadow-lg"
          style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #1e3a8a 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                radial-gradient(circle at 60% 80%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #93C5FD 0%, transparent 70%)" }} />

          <div className="relative px-5 py-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-blue-300" />
                  <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-wider">Skor FinTrust Anda</p>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-white font-black" style={{ fontSize: 52, lineHeight: 1 }}>{score}</span>
                  <span className="text-blue-300 text-xl font-bold">/100</span>
                </div>

                {!result.completed ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/15">
                    <AlertCircle size={12} className="text-white" />
                    <span className="text-xs font-bold text-white">Belum Sinkronisasi</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: status.bg }}>
                    <CheckCircle size={12} style={{ color: status.color }} />
                    <span className="text-xs font-bold" style={{ color: status.color }}>{status.label}</span>
                  </div>
                )}

                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] text-blue-300">
                    <span>0</span>
                    <span>Progres Skor</span>
                    <span>100</span>
                  </div>
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #60A5FA, #34D399)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-4">
                <ScoreRing score={score} />
              </div>
            </div>

            <button
              className="mt-4 flex items-center gap-1 text-blue-200 text-xs font-semibold hover:text-white transition-colors"
              onClick={() => window.dispatchEvent(new Event("navigateToSkor"))}
            >
              {result.completed ? "Lihat Detail Skor" : "Mulai Sinkronisasi AI"} <ArrowUpRight size={13} />
            </button>
          </div>
        </motion.div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowStatusSheet("usaha")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.97] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: statusUsaha.bg }}>
              <TrendingUp size={18} style={{ color: statusUsaha.color }} />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Status Usaha</p>
            <p className="font-extrabold text-[#0F1D3E] text-sm mt-0.5">
              {result.completed ? statusUsaha.label : "Belum Ada Data"}
            </p>
            {result.completed && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusUsaha.color }} />
                <span className="text-[10px] font-semibold" style={{ color: statusUsaha.color }}>
                  Stabilitas {result.stabilitasPendapatan}/100
                </span>
              </div>
            )}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setShowStatusSheet("pinjaman")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.97] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: statusPinjaman.bg }}>
              <CheckCircle size={18} style={{ color: statusPinjaman.color }} />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Status Pinjaman</p>
            <p className="font-extrabold text-[#0F1D3E] text-sm mt-0.5">{statusPinjaman.label}</p>
            {bestLimit > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusPinjaman.color }} />
                <span className="text-[10px] font-semibold" style={{ color: statusPinjaman.color }}>
                  Limit hingga {formatRupiah(bestLimit)}
                </span>
              </div>
            )}
          </motion.button>
        </div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100"
        >
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((a, i) => (
              <button
                key={a.key}
                onClick={() => handleQuickAction(a.key, a.navEvent)}
                className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              >
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, type: "spring", stiffness: 300 }}
                  className="rounded-2xl bg-[#EFF6FF] flex items-center justify-center"
                  style={{ width: 52, height: 52 }}
                >
                  <a.icon size={22} className="text-[#1D4ED8]" />
                </motion.div>
                <span
                  className="text-[10px] font-semibold text-[#0F1D3E] text-center leading-tight"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Ringkasan Keuangan ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0F1D3E] text-sm">Ringkasan 30 Hari Terakhir</h2>
            <button
              onClick={() => setShowRevenueSheet(true)}
              className="text-[#1D4ED8] text-xs font-semibold flex items-center gap-0.5"
            >
              Lihat Detail <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Omzet — data asli dari result.omzetBulanan */}
            <div className="bg-[#ECFDF5] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                  <ArrowUpRight size={13} className="text-[#10B981]" />
                </div>
                <span className="text-[10px] font-semibold text-[#10B981]">Estimasi Omzet</span>
              </div>
              <p className="font-extrabold text-[#0F1D3E] text-base">
                {result.completed ? `Rp ${result.omzetBulanan} Jt` : "-"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Dari Sinkronisasi AI</p>
            </div>

            {/* Frekuensi transaksi — data asli, menggantikan "Pengeluaran" yang
                tidak punya sumber data di skema saat ini */}
            <div className="bg-[#EFF6FF] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#1D4ED8]/15 flex items-center justify-center">
                  <RefreshCw size={13} className="text-[#1D4ED8]" />
                </div>
                <span className="text-[10px] font-semibold text-[#1D4ED8]">Frekuensi Transaksi</span>
              </div>
              <p className="font-extrabold text-[#0F1D3E] text-base">
                {result.completed ? `${result.frekuensiTransaksi}x` : "-"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">30 hari terakhir</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#F9FAFB] rounded-xl px-4 py-3 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Nominal Diajukan Terakhir</span>
            <span className="font-extrabold text-[#0F1D3E] text-sm">
              {result.danaDiajukan > 0 ? formatRupiah(result.danaDiajukan) : "Belum ada"}
            </span>
          </div>
        </motion.div>

        {/* ── Chart Riwayat Skor (menggantikan grafik omzet/keluar yang
             datanya tidak tersedia — ini pakai histori tabel `scores` asli) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-[#0F1D3E] text-sm">Riwayat Skor FinTrust</h2>
          </div>

          {loadingFeed ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-[#1D4ED8] animate-spin" />
            </div>
          ) : scoreHistory.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-gray-400 leading-relaxed px-4">
                Grafik akan muncul setelah Anda menjalankan Sinkronisasi AI lebih dari sekali.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={scoreHistory} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone" dataKey="skor" stroke="#1D4ED8" strokeWidth={2.5}
                  dot={{ fill: "#1D4ED8", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#1D4ED8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Rekomendasi Pendana — dari useLenders() asli ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#0F1D3E] text-sm">Rekomendasi Pendana</h2>
            <button
              className="text-[#1D4ED8] text-xs font-semibold flex items-center gap-0.5"
              onClick={() => window.dispatchEvent(new Event("navigateToPendana"))}
            >
              Semua <ChevronRight size={13} />
            </button>
          </div>

          {lendersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-[#1D4ED8] animate-spin" />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {recommendedLenders.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 shrink-0 w-[160px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EFF6FF] text-xl">
                      {l.logo}
                    </div>
                    <div className="bg-gray-50 px-2 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{l.tipe}</span>
                    </div>
                  </div>
                  <p className="font-bold text-[#0F1D3E] text-sm">{l.nama}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[10px] text-gray-400">Bunga <span className="text-[#0F1D3E] font-semibold">{l.bunga_rate}</span></p>
                    <p className="text-[10px] text-gray-400">Limit <span className="text-[#0F1D3E] font-semibold">{formatRupiah(l.limit_plafon)}</span></p>
                  </div>
                  <button
                    className="mt-3 w-full rounded-xl py-2 text-[11px] font-bold text-white bg-[#1D4ED8]"
                    onClick={() => window.dispatchEvent(new CustomEvent("navigateToPendana", { detail: { lenderId: l.id } }))}
                  >
                    Ajukan
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Aktivitas Terbaru — dari tabel applications & scores asli ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0F1D3E] text-sm">Aktivitas Terbaru</h2>
            <button
              className="text-[#1D4ED8] text-xs font-semibold flex items-center gap-0.5"
              onClick={() => window.dispatchEvent(new Event("navigateToRiwayat"))}
            >
              Semua <ChevronRight size={13} />
            </button>
          </div>

          {loadingFeed ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-[#1D4ED8] animate-spin" />
            </div>
          ) : activityFeed.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-3">
              {activityFeed.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.bg }}>
                    <a.icon size={16} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F1D3E] text-xs">{a.title}</p>
                    <p className="text-gray-400 text-[10px] truncate">{a.desc}</p>
                  </div>
                  {a.time && <span className="text-[10px] text-gray-300 font-medium shrink-0">{a.time}</span>}
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* ── Bottom Sheets ── */}
      <AnimatePresence>
        {showRevenueSheet && (
          <BottomSheet title="Ringkasan Keuangan" onClose={() => setShowRevenueSheet(false)}>
            <div className="space-y-3 pb-2">
              {[
                { label: "Estimasi Omzet (30 hari)", val: result.completed ? `Rp ${result.omzetBulanan} Jt` : "-", color: "#10B981" },
                { label: "Frekuensi Transaksi", val: result.completed ? `${result.frekuensiTransaksi}x` : "-", color: "#1D4ED8" },
                { label: "Stabilitas Pendapatan", val: result.completed ? `${result.stabilitasPendapatan}/100` : "-", color: "#1D4ED8" },
                { label: "Nominal Diajukan Terakhir", val: result.danaDiajukan > 0 ? formatRupiah(result.danaDiajukan) : "-", color: "#0F1D3E" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className="font-bold text-sm" style={{ color: row.color }}>{row.val}</span>
                </div>
              ))}
              {!result.completed && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mt-2">
                  Selesaikan Sinkronisasi AI di tab Profil untuk melihat ringkasan keuangan Anda.
                </p>
              )}
            </div>
          </BottomSheet>
        )}

        {showStatusSheet === "usaha" && (
          <BottomSheet title="Status Usaha" onClose={() => setShowStatusSheet(null)}>
            <div className="space-y-4 pb-2">
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: statusUsaha.bg }}>
                <TrendingUp size={28} style={{ color: statusUsaha.color }} />
                <div>
                  <p className="font-extrabold text-[#0F1D3E] text-lg">
                    {result.completed ? statusUsaha.label : "Belum Ada Data"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {result.completed ? "Berdasarkan hasil Sinkronisasi AI terakhir" : "Selesaikan Sinkronisasi AI dulu"}
                  </p>
                </div>
              </div>
              {result.completed && [
                { label: "Stabilitas Pendapatan", val: `${result.stabilitasPendapatan}/100`, color: "#1D4ED8" },
                { label: "Riwayat Transaksi", val: `${result.riwayatTransaksi}/100`, color: "#1D4ED8" },
                { label: "Lama Usaha", val: `${result.lamaUsaha}/100`, color: "#1D4ED8" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className="font-bold text-sm" style={{ color: row.color }}>{row.val}</span>
                </div>
              ))}
            </div>
          </BottomSheet>
        )}

        {showStatusSheet === "pinjaman" && (
          <BottomSheet title="Status Pinjaman" onClose={() => setShowStatusSheet(null)}>
            <div className="space-y-4 pb-2">
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: statusPinjaman.bg }}>
                <CheckCircle size={28} style={{ color: statusPinjaman.color }} />
                <div>
                  <p className="font-extrabold text-[#0F1D3E] text-lg">{statusPinjaman.label}</p>
                  <p className="text-gray-400 text-xs">
                    {result.completed ? "Berdasarkan skor FinTrust Anda" : "Lengkapi Sinkronisasi AI dulu"}
                  </p>
                </div>
              </div>
              {[
                { label: "Limit Maksimal Tersedia", val: bestLimit > 0 ? formatRupiah(bestLimit) : "-", color: "#1D4ED8" },
                { label: "Pendana Terdaftar", val: `${lenders.length} pendana`, color: "#10B981" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className="font-bold text-sm" style={{ color: row.color }}>{row.val}</span>
                </div>
              ))}
              <button
                className="w-full bg-[#1D4ED8] text-white font-bold rounded-2xl py-4 mt-2 shadow-lg shadow-blue-100"
                onClick={() => {
                  setShowStatusSheet(null);
                  window.dispatchEvent(new Event("navigateToPendana"));
                }}
              >
                Ajukan Sekarang
              </button>
            </div>
          </BottomSheet>
        )}

        {showActionSheet && (
          <BottomSheet
            title={quickActions.find((a) => a.key === showActionSheet)?.label.replace("\n", " ") ?? ""}
            onClose={() => setShowActionSheet(null)}
          >
            <div className="pb-4">
              <div className="bg-[#EFF6FF] rounded-2xl p-5 flex flex-col items-center text-center mb-5">
                {(() => {
                  const a = quickActions.find((q) => q.key === showActionSheet);
                  return a ? <a.icon size={36} className="text-[#1D4ED8] mb-2" /> : null;
                })()}
                <p className="text-gray-500 text-sm leading-relaxed">
                  {showActionSheet === "pinjaman" && "Ajukan pinjaman ke mitra pendana terpercaya sesuai skor FinTrust Anda."}
                  {showActionSheet === "sync" && "Sinkronisasi data QRIS, rantai pasok, dan dokumen Anda untuk memperbarui skor."}
                  {showActionSheet === "riwayat" && "Lihat seluruh riwayat pengajuan pinjaman, status, dan dokumen Anda."}
                  {showActionSheet === "pendana" && "Jelajahi mitra pendana terdaftar dan temukan yang paling cocok dengan profil Anda."}
                </p>
              </div>
              <button
                className="w-full bg-[#1D4ED8] text-white font-bold rounded-2xl py-4 shadow-lg shadow-blue-100"
                onClick={() => {
                  const a = quickActions.find((q) => q.key === showActionSheet);
                  setShowActionSheet(null);
                  if (a) window.dispatchEvent(new Event(a.navEvent));
                }}
              >
                {showActionSheet === "pinjaman" ? "Mulai Pengajuan" :
                 showActionSheet === "sync" ? "Sinkronkan Sekarang" :
                 showActionSheet === "riwayat" ? "Lihat Riwayat" : "Jelajahi Pendana"}
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}