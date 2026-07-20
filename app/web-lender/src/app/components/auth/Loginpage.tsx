import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Shield, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/AuthContext";

// --- Animated network nodes for the left panel ---
const NODE_COUNT = 18;
const EDGE_PAIRS = [
  [0, 3], [0, 5], [1, 4], [1, 6], [2, 5], [2, 7],
  [3, 8], [4, 9], [5, 10], [6, 11], [7, 12],
  [8, 13], [9, 14], [10, 15], [11, 16], [12, 17],
  [13, 15], [14, 16], [15, 17],
];

function useAnimatedNodes() {
  const [nodes, setNodes] = useState(() =>
    Array.from({ length: NODE_COUNT }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      r: 2 + Math.random() * 3,
      pulse: Math.random() * Math.PI * 2,
    }))
  );

  const frameRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      setNodes((prev) =>
        prev.map((n) => {
          let nx = n.x + n.vx;
          let ny = n.y + n.vy;
          let nvx = n.vx;
          let nvy = n.vy;
          if (nx < 5 || nx > 95) nvx = -nvx;
          if (ny < 5 || ny > 95) nvy = -nvy;
          return { ...n, x: nx, y: ny, vx: nvx, vy: nvy, pulse: n.pulse + 0.02 };
        })
      );
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return nodes;
}

function NetworkCanvas() {
  const nodes = useAnimatedNodes();
  return (
    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
      {EDGE_PAIRS.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
        const opacity = Math.max(0, 1 - dist / 40) * 0.6;
        return (
          <line
            key={i}
            x1={na.x} y1={na.y}
            x2={nb.x} y2={nb.y}
            stroke="#93C5FD"
            strokeWidth="0.25"
            opacity={opacity}
          />
        );
      })}
      {nodes.map((n) => (
        <circle
          key={n.id}
          cx={n.x} cy={n.y}
          r={n.r * (1 + 0.2 * Math.sin(n.pulse))}
          fill="#BFDBFE"
          opacity={0.5 + 0.3 * Math.sin(n.pulse)}
        />
      ))}
    </svg>
  );
}

// --- Trust stat chip ---
function StatChip({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3"
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <div>
        <p className="text-white font-semibold text-sm leading-none">{value}</p>
        <p className="text-blue-200 text-xs mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// --- Input field component ---
interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  success?: boolean;
  rightElement?: React.ReactNode;
  autoComplete?: string;
}

function InputField({ id, label, type, value, onChange, placeholder, error, success, rightElement, autoComplete }: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={[
            "w-full px-4 py-3 rounded-xl border-2 bg-slate-50 text-slate-900 placeholder-slate-400",
            "text-sm transition-all duration-200 outline-none",
            "focus:bg-white",
            rightElement ? "pr-12" : "",
            error
              ? "border-red-300 focus:border-red-500 bg-red-50 focus:bg-white"
              : success && hasValue
              ? "border-emerald-300 focus:border-emerald-500"
              : focused
              ? "border-blue-500 shadow-[0_0_0_3px_rgba(29,78,216,0.12)]"
              : "border-slate-200 hover:border-slate-300",
          ].join(" ")}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
        {error && !rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Login Page ---
// CATATAN PERUBAHAN dari versi Figma awal:
// 1. `onLogin` prop dihapus — status login sekarang sepenuhnya dikelola oleh
//    AuthContext (lihat App.tsx), bukan dikirim manual dari sini.
// 2. Cek kredensial hardcoded ("admin@fintrust.id" / "password123") diganti
//    dengan `signIn()` dari useAuth(), yang manggil Supabase Auth beneran
//    dan sekaligus verifikasi role === 'lender'.
// 3. Komponen <DemoHint /> dihapus karena akun demo hardcoded sudah tidak
//    berlaku — kalau kamu mau nampilkan akun demo lagi, buat akun lender
//    sungguhan dulu di Supabase, baru tulis ulang teksnya manual di sini.
export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Real-time email format validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!email) e.email = "Email wajib diisi";
    else if (!emailValid) e.email = "Format email tidak valid";
    if (!password) e.password = "Kata sandi wajib diisi";
    else if (password.length < 6) e.password = "Kata sandi minimal 6 karakter";
    return e;
  }

  function handleBlur(field: "email" | "password") {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoginError("");
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      setLoginError(error);
      return;
    }

    setLoginSuccess(true);
    await new Promise((r) => setTimeout(r, 500));
    navigate("/");
  }

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F9FAFB" }}
    >
      {/* === LEFT PANEL === */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative flex-col overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F2472 0%, #1D4ED8 55%, #1E40AF 100%)" }}
      >
        <NetworkCanvas />

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #60A5FA, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #34D399, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">FinTrust</span>
              <span className="text-blue-300 font-bold text-lg leading-none"> AI</span>
            </div>
          </motion.div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center mt-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
              <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-4">
                Platform Kredit UMKM Berbasis AI
              </p>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Penilaian Kredit<br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(90deg, #60A5FA, #34D399)" }}>
                  Lebih Cerdas
                </span>
              </h1>
              <p className="text-blue-200 text-base mt-5 max-w-sm leading-relaxed">
                Analisis kelayakan kredit UMKM secara akurat menggunakan data alternatif dan jaringan kepercayaan berbasis kecerdasan buatan.
              </p>
            </motion.div>

            {/* Stats */}
            <div className="flex flex-col gap-3 mt-10 max-w-xs">
              <StatChip value="500+ UMKM" label="Berhasil terdanai bulan ini" delay={0.45} />
              <StatChip value="Rp 2.4 Triliun" label="Total dana tersalurkan" delay={0.55} />
              <StatChip value="99.2% Akurasi" label="Model penilaian FinTrust AI" delay={0.65} />
            </div>
          </div>

          {/* Bottom tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-blue-300/60 text-xs mt-auto"
          >
            © 2026 FinTrust AI · Terdaftar & Diawasi OJK
          </motion.p>
        </div>
      </div>

      {/* === RIGHT PANEL === */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#1D4ED8" }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">FinTrust <span style={{ color: "#1D4ED8" }}>AI</span></span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat datang kembali</h2>
            <p className="text-slate-500 text-sm mt-1.5">Masuk ke dasbor penilaian kredit Anda</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <InputField
              id="email"
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(v) => { setEmail(v); setLoginError(""); if (touched.email) setErrors(validate()); }}
              placeholder="nama@institusi.com"
              error={touched.email ? errors.email : undefined}
              success={emailValid}
              autoComplete="email"
            />

            <InputField
              id="password"
              label="Kata Sandi"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(v) => { setPassword(v); setLoginError(""); if (touched.password) setErrors(validate()); }}
              placeholder="Masukkan kata sandi"
              error={touched.password ? errors.password : undefined}
              success={password.length >= 6}
              autoComplete="current-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={[
                    "w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all duration-150 cursor-pointer",
                    rememberMe
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white group-hover:border-blue-400",
                  ].join(" ")}
                  style={{ width: 18, height: 18 }}
                >
                  {rememberMe && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      viewBox="0 0 10 8" fill="none"
                      className="w-2.5 h-2.5"
                    >
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </div>
                <span className="text-sm text-slate-600 select-none">Ingat saya</span>
              </label>
              <button
                type="button"
                className="text-sm font-semibold transition-colors"
                style={{ color: "#1D4ED8" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1E40AF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#1D4ED8")}
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Global error */}
            <AnimatePresence mode="wait">
              {loginError && (
                <motion.div
                  key="login-error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed"
              style={{
                background: loginSuccess
                  ? "#10B981"
                  : "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                boxShadow: "0 4px 14px rgba(29, 78, 216, 0.35)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(29, 78, 216, 0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(29, 78, 216, 0.35)";
              }}
            >
              {isLoading && !loginSuccess && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {loginSuccess && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              )}
              {loginSuccess ? "Berhasil masuk..." : isLoading ? "Memverifikasi..." : (
                <>
                  <span>Masuk ke Dasbor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Butuh bantuan?{" "}
            <button
              className="font-semibold transition-colors"
              style={{ color: "#1D4ED8" }}
            >
              Hubungi Tim Dukungan
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}