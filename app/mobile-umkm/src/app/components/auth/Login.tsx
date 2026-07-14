import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, TrendingUp } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

interface LoginProps {
  onBack: () => void;
  onSwitchToRegister: () => void;
}

export function Login({ onBack, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMsg, setErrorMsg] = useState("");

  function validate() {
    const e: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email tidak valid";
    if (!password || password.length < 6) e.password = "Password minimal 6 karakter";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) setErrorMsg(error.message);
  }

  return (
    // Penyesuaian wrapper utama (max-w-[393px])
    <div className="relative h-[100dvh] min-h-screen w-full max-w-[393px] mx-auto overflow-hidden bg-white sm:border-x sm:border-gray-100 shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#EEF2FF] to-transparent pointer-events-none" />

      {/* Floating blob decoration */}
      <motion.div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #1D4ED8 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-24 -left-20 w-44 h-44 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Header */}
      <div className="relative z-10 pt-12 px-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Brand mark */}
      <div className="relative z-10 px-6 mt-6">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] flex items-center justify-center mb-4 shadow-lg shadow-blue-200"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <TrendingUp size={26} className="text-white" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="text-[#0F1D3E] font-extrabold text-2xl leading-tight">
            Selamat Datang<br />Kembali 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">Masuk untuk melanjutkan pengelolaan keuangan UMKM Anda</p>
        </motion.div>
      </div>

      {/* Form */}
      <motion.div
        className="relative z-10 px-6 mt-8 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {/* Email field */}
        <div>
          <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">Email</label>
          <div className={`flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 transition-colors ${
            errors.email ? "border-red-400" : "border-transparent focus-within:border-[#1D4ED8]"
          }`}>
            <Mail size={18} className="text-gray-400 shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="nama@usaha.com"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 pl-1">{errors.email}</p>}
        </div>

        {/* Password field */}
        <div>
          <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">Password</label>
          <div className={`flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 transition-colors ${
            errors.password ? "border-red-400" : "border-transparent focus-within:border-[#1D4ED8]"
          }`}>
            <Lock size={18} className="text-gray-400 shrink-0" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="Masukkan password"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
            <button onClick={() => setShowPass(!showPass)} className="shrink-0">
              {showPass ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 pl-1">{errors.password}</p>}
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {errorMsg}
          </p>
        )}

        {/* Login button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 mt-2 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-80"
        >
          {loading ? (
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            "Masuk"
          )}
        </button>
      </motion.div>

      {/* Register link */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <span className="text-gray-500 text-sm">Belum punya akun? </span>
        <button onClick={onSwitchToRegister} className="text-[#1D4ED8] font-bold text-sm">
          Daftar Sekarang
        </button>
      </div>
    </div>
  );
}