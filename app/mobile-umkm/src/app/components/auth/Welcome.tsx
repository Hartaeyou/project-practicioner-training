import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Shield, TrendingUp, Zap, CheckCircle, Star } from "lucide-react";

interface WelcomeProps {
  onLogin: () => void;
  onRegister: () => void;
}

const slides = [
  {
    id: 0,
    title: "Kelola Keuangan\nUMKM Lebih Cerdas",
    subtitle: "Skor kredit real-time, analisis arus kas, dan akses pendanaan dalam satu platform terintegrasi.",
    accent: "#1D4ED8",
    bg: "from-[#0F1F5C] via-[#1D4ED8] to-[#2563EB]",
  },
  {
    id: 1,
    title: "Skor Kredit AI\nyang Akurat",
    subtitle: "Teknologi AI kami menganalisis 200+ parameter bisnis Anda untuk menghasilkan skor kredit yang adil.",
    accent: "#10B981",
    bg: "from-[#064E3B] via-[#059669] to-[#10B981]",
  },
  {
    id: 2,
    title: "Terhubung ke\nRatusan Pendana",
    subtitle: "Marketplace pendana terpercaya. Ajukan pinjaman dengan mudah dan dapatkan penawaran terbaik.",
    accent: "#7C3AED",
    bg: "from-[#2E1065] via-[#6D28D9] to-[#7C3AED]",
  },
];

const floatingCards = [
  { icon: TrendingUp, label: "Skor Kredit", value: "782", sub: "Sangat Baik", color: "bg-white/15", delay: 0 },
  { icon: Shield, label: "Terlindungi", value: "OJK", sub: "Terdaftar & Diawasi", color: "bg-white/10", delay: 0.3 },
  { icon: Zap, label: "Proses Cepat", value: "24 Jam", sub: "Dana Cair", color: "bg-white/12", delay: 0.6 },
  { icon: Star, label: "Rating", value: "4.9★", sub: "50K+ Ulasan", color: "bg-white/10", delay: 0.9 },
];

function FloatingCard({ card, index }: { card: typeof floatingCards[0]; index: number }) {
  const positions = [
    { top: "18%", left: "6%" },
    { top: "28%", right: "6%" },
    { top: "52%", left: "4%" },
    { top: "62%", right: "8%" },
  ];
  const pos = positions[index % positions.length];

  return (
    <motion.div
      className={`absolute ${card.color} backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2.5 shadow-xl`}
      style={pos}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { delay: card.delay + 0.5, duration: 0.5 },
        scale: { delay: card.delay + 0.5, duration: 0.5 },
        y: { delay: card.delay + 0.5, duration: 3 + index * 0.5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
          <card.icon size={14} className="text-white" />
        </div>
        <div>
          <div className="text-white/70 text-[9px] font-medium leading-none">{card.label}</div>
          <div className="text-white text-sm font-bold leading-tight">{card.value}</div>
          <div className="text-white/60 text-[8px] leading-none">{card.sub}</div>
        </div>
      </div>
    </motion.div>
  );
}

function CentralIllustration({ slideIndex }: { slideIndex: number }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 60%, transparent 100%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-60 h-60 rounded-full border border-white/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/80" />
      </motion.div>
      <motion.div
        className="absolute w-44 h-44 rounded-full border border-white/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white/60" />
        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
      </motion.div>
      <motion.div
        className="relative w-28 h-48 rounded-[22px] bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl overflow-hidden"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-1.5 rounded-[18px] bg-white/10 overflow-hidden">
          <div className="w-full h-5 flex items-center justify-between px-3 pt-1">
            <div className="w-8 h-1.5 rounded-full bg-white/40" />
            <div className="w-8 h-2 rounded bg-white/30" />
          </div>
          <div className="mt-2 flex justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-white/50 flex items-center justify-center bg-white/10">
              <div>
                <div className="text-white font-black text-base leading-none text-center">782</div>
                <div className="text-white/60 text-[7px] text-center">SKOR</div>
              </div>
            </div>
          </div>
          <div className="mt-3 px-2 flex items-end gap-1 justify-center">
            {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
              <motion.div
                key={i}
                className="w-2.5 rounded-sm bg-white/40"
                style={{ height: `${h * 0.28}px` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.08 + 0.8, duration: 0.4 }}
              />
            ))}
          </div>
          <div className="mt-2 px-2 space-y-1">
            {["Aktif", "Terverifikasi"].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <div className="text-white/70 text-[7px]">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const r = 115;
        const x = Math.cos((angle * Math.PI) / 180) * r;
        const y = Math.sin((angle * Math.PI) / 180) * r;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white"
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

export function Welcome({ onLogin, onRegister }: WelcomeProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const slide = slides[slideIndex];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setSlideIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [auto]);

  return (
    // Penyesuaian wrapper utama (max-w-[393px])
    <div className="relative h-[100dvh] min-h-screen w-full max-w-[393px] mx-auto overflow-hidden sm:border-x sm:border-gray-100 shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          className={`absolute inset-0 bg-gradient-to-b ${slide.bg}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-20 pt-12 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FinTrust AI</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-green-400" />
          <span className="text-white/70 text-xs font-medium">OJK Terdaftar</span>
        </div>
      </div>

      <div className="relative z-10 mt-4" style={{ height: "340px" }}>
        <CentralIllustration slideIndex={slideIndex} />
        {floatingCards.map((card, i) => (
          <FloatingCard key={i} card={card} index={i} />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-white rounded-t-[32px] px-6 pt-6 pb-10 shadow-2xl">
          <div className="flex justify-center gap-1.5 mb-5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlideIndex(i); setAuto(false); }}
                className={`h-1.5 rounded-full transition-all duration-400 ${i === slideIndex ? "w-6 bg-[#1D4ED8]" : "w-1.5 bg-gray-200"}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-[#0F1D3E] font-extrabold text-2xl leading-tight mb-3" style={{ whiteSpace: "pre-line" }}>
                {slide.title}
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{slide.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3 mb-6">
            {["50K+ UMKM", "Rp 2T+ Disalurkan", "99.2% Akurasi"].map((b, i) => (
              <div key={i} className="flex-1 bg-blue-50 rounded-xl py-2 px-2 text-center">
                <div className="text-[#1D4ED8] font-bold text-xs leading-tight">{b}</div>
              </div>
            ))}
          </div>

          <button
            onClick={onRegister}
            className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 mb-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
          >
            Mulai Sekarang
            <ArrowRight size={18} />
          </button>
          <button
            onClick={onLogin}
            className="w-full bg-gray-100 text-gray-700 font-semibold text-base rounded-2xl py-4 active:scale-[0.98] transition-transform"
          >
            Masuk ke Akun
          </button>
        </div>
      </div>
    </div>
  );
}