import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Phone,
  Lock,
  User,
  Building2,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  X,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../lib/AuthContext";

interface RegisterProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
}

const steps = [
  { label: "Akun", icon: User },
  { label: "Bisnis", icon: Building2 },
  { label: "Konfirmasi", icon: CheckCircle2 },
];

const businessTypes = [
  "Perdagangan",
  "Kuliner",
  "Jasa",
  "Manufaktur",
  "Pertanian",
  "Lainnya",
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center relative">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                i < current
                  ? "bg-[#10B981] text-white"
                  : i === current
                  ? "bg-[#1D4ED8] text-white shadow-lg shadow-blue-200"
                  : "bg-gray-100 text-gray-400"
              }`}
              animate={i === current ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: i === current ? Infinity : 0 }}
            >
              {i < current ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
            </motion.div>
            <span
              className={`text-[9px] font-semibold mt-1 absolute -bottom-4 whitespace-nowrap ${
                i === current
                  ? "text-[#1D4ED8]"
                  : i < current
                  ? "text-[#10B981]"
                  : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-1 h-0.5 rounded-full overflow-hidden bg-gray-100">
              <motion.div
                className="h-full bg-[#10B981] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: i < current ? "100%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({
  data,
  onChange,
  errors,
}: {
  data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  onChange: (k: string, v: string) => void;
  errors: Record<string, string>;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4 pb-2">
      <FieldInput
        label="Nama Lengkap"
        icon={<User size={17} className="text-gray-400" />}
        value={data.name}
        onChange={(v) => onChange("name", v)}
        placeholder="Masukkan nama lengkap"
        error={errors.name}
        type="text"
      />
      <FieldInput
        label="Email"
        icon={<Mail size={17} className="text-gray-400" />}
        value={data.email}
        onChange={(v) => onChange("email", v)}
        placeholder="nama@usaha.com"
        error={errors.email}
        type="email"
      />
      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Password
        </label>
        <div
          className={`flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 transition-colors ${
            errors.password
              ? "border-red-400"
              : "border-transparent focus-within:border-[#1D4ED8]"
          }`}
        >
          <Lock size={17} className="text-gray-400 shrink-0" />
          <input
            type={showPass ? "text" : "password"}
            value={data.password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="Min. 8 karakter"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <button onClick={() => setShowPass(!showPass)}>
            {showPass ? (
              <EyeOff size={17} className="text-gray-400" />
            ) : (
              <Eye size={17} className="text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1 pl-1">{errors.password}</p>
        )}
        {data.password.length > 0 && (
          <div className="mt-2 flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < Math.min(Math.floor(data.password.length / 2), 4)
                    ? data.password.length >= 8
                      ? "bg-[#10B981]"
                      : data.password.length >= 5
                      ? "bg-yellow-400"
                      : "bg-red-400"
                    : "bg-gray-100"
                }`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {data.password.length >= 8
                ? "Kuat"
                : data.password.length >= 5
                ? "Sedang"
                : "Lemah"}
            </span>
          </div>
        )}
      </div>
      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Konfirmasi Password
        </label>
        <div
          className={`flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 transition-colors ${
            errors.confirmPassword
              ? "border-red-400"
              : "border-transparent focus-within:border-[#1D4ED8]"
          }`}
        >
          <Lock size={17} className="text-gray-400 shrink-0" />
          <input
            type={showConfirm ? "text" : "password"}
            value={data.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            placeholder="Ulangi password"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <button onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? (
              <EyeOff size={17} className="text-gray-400" />
            ) : (
              <Eye size={17} className="text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1 pl-1">
            {errors.confirmPassword}
          </p>
        )}
      </div>
    </div>
  );
}

function Step2({
  data,
  onChange,
  errors,
}: {
  data: {
    businessName: string;
    businessType: string;
    revenue: string;
    phone: string;
    address: string;
    businessDuration: string;
  };
  onChange: (k: string, v: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4 pb-2">
      <FieldInput
        label="Nama Usaha"
        icon={<Building2 size={17} className="text-gray-400" />}
        value={data.businessName}
        onChange={(v) => onChange("businessName", v)}
        placeholder="Toko / CV / UD ..."
        error={errors.businessName}
        type="text"
      />

      <FieldInput
        label="Nomor HP Usaha"
        icon={<Phone size={17} className="text-gray-400" />}
        value={data.phone}
        onChange={(v) => onChange("phone", v)}
        placeholder="08xxxxxxxxxx"
        error={errors.phone}
        type="tel"
      />

      <FieldInput
        label="Alamat"
        icon={<MapPin size={17} className="text-gray-400" />}
        value={data.address}
        onChange={(v) => onChange("address", v)}
        placeholder="Masukkan alamat usaha"
        error={errors.address}
        type="text"
      />

      <FieldInput
        label="Lama Usaha (dalam bulan)"
        icon={<CalendarDays size={17} className="text-gray-400" />}
        value={data.businessDuration}
        onChange={(v) => onChange("businessDuration", v.replace(/[^\d]/g, ""))}
        placeholder="Misal: 12"
        error={errors.businessDuration}
        type="tel"
      />
      
      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Jenis Usaha
        </label>
        <div className="grid grid-cols-3 gap-2">
          {businessTypes.map((t) => (
            <button
              key={t}
              onClick={() => onChange("businessType", t)}
              className={`py-2.5 rounded-2xl text-xs font-semibold border-2 transition-all ${
                data.businessType === t
                  ? "border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]"
                  : "border-gray-100 bg-gray-50 text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {errors.businessType && (
          <p className="text-red-500 text-xs mt-1 pl-1">
            {errors.businessType}
          </p>
        )}
      </div>

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Omzet Bulanan (estimasi)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "< Rp 10 Juta",
            "Rp 10-50 Juta",
            "Rp 50-200 Juta",
            "> Rp 200 Juta",
          ].map((r) => (
            <button
              key={r}
              onClick={() => onChange("revenue", r)}
              className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border-2 text-left transition-all ${
                data.revenue === r
                  ? "border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]"
                  : "border-gray-100 bg-gray-50 text-gray-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {errors.revenue && (
          <p className="text-red-500 text-xs mt-1 pl-1">{errors.revenue}</p>
        )}
      </div>
    </div>
  );
}

function Step3({
  form,
  agreed,
  setAgreed,
  onSubmit,
  loading,
  errorMsg,
  onOpenPrivacy,
}: {
  form: {
    name: string;
    email: string;
    businessName: string;
    businessType: string;
    revenue: string;
    phone: string;
    address: string;
    businessDuration: string;
  };
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onSubmit: () => void;
  loading: boolean;
  errorMsg: string;
  onOpenPrivacy: () => void;
}) {
  return (
    <div className="space-y-5 pb-4">
      <div className="bg-blue-50 rounded-2xl p-4">
        <p className="text-[#0F1D3E] font-semibold text-sm mb-3">
          Ringkasan Pendaftaran
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nama</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.name || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.email || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nomor HP Usaha</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.phone || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Alamat</span>
            <span className="text-[#0F1D3E] font-medium text-right max-w-[60%]">
              {form.address || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lama Usaha</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.businessDuration ? `${form.businessDuration} Bulan` : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nama Usaha</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.businessName || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Jenis Usaha</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.businessType || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Omzet</span>
            <span className="text-[#0F1D3E] font-medium">
              {form.revenue || "-"}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100 cursor-pointer"
        onClick={() => {
          if (!agreed) onOpenPrivacy();
          else setAgreed(false);
        }}
      >
        <button
          type="button"
          className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
            agreed
              ? "border-[#1D4ED8] bg-[#1D4ED8]"
              : "border-gray-300 bg-white"
          }`}
        >
          {agreed && <CheckCircle2 size={12} className="text-white" />}
        </button>
        <p className="text-gray-500 text-xs leading-relaxed select-none">
          Saya menyetujui{" "}
          <span className="text-[#1D4ED8] font-semibold">
            Syarat & Ketentuan
          </span>{" "}
          serta{" "}
          <span
            className="text-[#1D4ED8] font-semibold hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPrivacy();
            }}
          >
            Kebijakan Privasi
          </span>{" "}
          FinTrust AI
        </p>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {errorMsg}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={!agreed || loading}
        className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            Buat Akun <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}

function FieldInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
  error,
  type,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  type: string;
}) {
  return (
    <div>
      <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 transition-colors ${
          error
            ? "border-red-400"
            : "border-transparent focus-within:border-[#1D4ED8]"
        }`}
      >
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 pl-1">{error}</p>}
    </div>
  );
}

export function Register({ onBack, onSwitchToLogin }: RegisterProps) {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessType: "",
    revenue: "",
    phone: "",
    address: "",
    businessDuration: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  }

  function validateStep0() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama harus diisi";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email tidak valid";
    if (form.password.length < 8) e.password = "Password minimal 8 karakter";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Password tidak cocok";
    return e;
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = "Nama usaha harus diisi";
    if (!form.phone || form.phone.length < 10) e.phone = "Nomor HP tidak valid";
    if (!form.address.trim()) e.address = "Alamat harus diisi";
    if (!form.businessDuration) e.businessDuration = "Lama usaha harus diisi";
    if (!form.businessType) e.businessType = "Pilih jenis usaha";
    if (!form.revenue) e.revenue = "Pilih estimasi omzet";
    return e;
  }

  function next() {
    const e = step === 0 ? validateStep0() : step === 1 ? validateStep1() : {};
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  async function submit() {
    setErrorMsg("");
    setLoading(true);

    // 1. Simpan data bisnis ke localStorage SEBELUM signUp,
    //    supaya bisa di-insert setelah user verify email dan login pertama kali.
    //    Key pakai email agar tidak bentrok antar user.
    const pendingKey = `fintrust_pending_umkm_${form.email}`;
    localStorage.setItem(
      pendingKey,
      JSON.stringify({
        phone: form.phone,
        businessName: form.businessName,
        businessType: form.businessType,
        revenue: form.revenue,
        address: form.address,
        businessDuration: form.businessDuration,
      })
    );

    // 2. Daftar akun ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: "umkm" } },
    });

    if (error) {
      localStorage.removeItem(pendingKey);
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    const userId = data.user?.id;

    // 3. Kalau session langsung ada (email confirm dimatikan di Supabase),
    //    langsung insert semuanya sekarang.
    if (data.session && userId) {
      await finishProfileSetup(userId, form.email);
      await refreshProfile();
      setLoading(false);
      return;
    }

    // 4. Email verification aktif → session belum ada.
    //    Data sudah disimpan di localStorage, AuthContext akan pickup
    //    saat user login pertama kali setelah verifikasi.
    setLoading(false);
    setEmailSent(true); // tampilkan halaman instruksi verifikasi
  }

  // Helper: insert profiles + umkm_profiles, dipanggil baik dari submit()
  // (kalau session langsung ada) maupun dari AuthContext setelah login pertama.
  async function finishProfileSetup(userId: string, email: string) {
    const pendingKey = `fintrust_pending_umkm_${email}`;

    // Update no_hp & consent di profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        no_hp: form.phone,
        pdp_consent: true,
        pdp_consent_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Gagal simpan No. HP / consent:", profileError);
    }

    // Insert umkm_profiles
    const { error: umkmError } = await supabase.from("umkm_profiles").insert({
      profile_id: userId,
      nama_usaha: form.businessName,
      sektor: form.businessType,
      omzet_estimasi: form.revenue,
      alamat: form.address,
      lama_usaha_bulan: parseInt(form.businessDuration) || 0,
    });

    if (umkmError) {
      console.error("Gagal simpan umkm_profiles:", umkmError);
      setErrorMsg("Gagal simpan profil usaha: " + umkmError.message);
      return;
    }

    // Berhasil — hapus data pending dari localStorage
    localStorage.removeItem(pendingKey);
  }

  // ── Halaman sukses: instruksi verifikasi email ──────────────────────────────
  if (emailSent) {
    return (
      <div
        className="relative h-[100dvh] min-h-screen w-full max-w-[393px] mx-auto bg-white flex flex-col items-center justify-center px-6"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Animasi spring dihapus, diganti dengan transisi easeOut biasa agar tidak memantul/miring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6"
        >
          <Mail size={40} className="text-[#1D4ED8]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          className="text-center w-full"
        >
          <h2 className="text-[#0F1D3E] font-extrabold text-2xl mb-2">
            Cek Email Anda!
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Kami kirim link verifikasi ke
          </p>
          <p className="text-[#1D4ED8] font-bold text-sm mb-6 break-all">
            {form.email}
          </p>

          <div className="bg-blue-50 rounded-2xl p-4 text-left space-y-2 mb-8">
            <p className="text-sm font-semibold text-[#0F1D3E]">
              Langkah selanjutnya:
            </p>
            <div className="flex items-start gap-2">
              <span className="text-[#1D4ED8] font-bold text-sm shrink-0">
                1.
              </span>
              <p className="text-sm text-gray-600">
                Buka email dan klik link verifikasi
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#1D4ED8] font-bold text-sm shrink-0">
                2.
              </span>
              <p className="text-sm text-gray-600">
                Kembali ke app dan login dengan email & password Anda
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#1D4ED8] font-bold text-sm shrink-0">
                3.
              </span>
              <p className="text-sm text-gray-600">
                Profil usaha Anda akan otomatis tersimpan
              </p>
            </div>
          </div>

          <button
            onClick={onSwitchToLogin}
            className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
          >
            Mengerti, Lanjut Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[100dvh] min-h-screen w-full max-w-[393px] mx-auto overflow-hidden bg-white sm:border-x sm:border-gray-100 flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#EEF2FF] to-transparent pointer-events-none" />
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #1D4ED8 0%, transparent 70%)",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 pt-10 pb-4 px-6 flex items-center gap-3">
        <button
          onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}
          className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="text-[#0F1D3E] font-bold text-base">
            FinTrust AI
          </span>
        </div>
      </div>

      <div className="relative z-10 px-6 mt-2">
        <h1 className="text-[#0F1D3E] font-extrabold text-2xl leading-tight">
          Buat Akun Baru
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Langkah {step + 1} dari {steps.length}
        </p>
      </div>

      <div className="relative z-10 px-6 mt-5 mb-2">
        <StepIndicator current={step} />
      </div>

      <div className="relative z-10 px-6 flex-1 overflow-y-auto mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="pb-4"
          >
            {step === 0 && (
              <Step1
                data={{
                  name: form.name,
                  email: form.email,
                  password: form.password,
                  confirmPassword: form.confirmPassword,
                }}
                onChange={update}
                errors={errors}
              />
            )}
            {step === 1 && (
              <Step2
                data={{
                  businessName: form.businessName,
                  businessType: form.businessType,
                  revenue: form.revenue,
                  phone: form.phone,
                  address: form.address,
                  businessDuration: form.businessDuration,
                }}
                onChange={update}
                errors={errors}
              />
            )}
            {step === 2 && (
              <Step3
                form={form}
                agreed={agreed}
                setAgreed={setAgreed}
                onSubmit={submit}
                loading={loading}
                errorMsg={errorMsg}
                onOpenPrivacy={() => setShowPrivacy(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-20 bg-white border-t border-gray-50 px-6 py-4 pb-8">
        {step < 2 ? (
          <div className="space-y-4">
            <button
              onClick={next}
              className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
            >
              Lanjutkan <ChevronRight size={18} />
            </button>
            <p className="text-center text-gray-500 text-sm">
              Sudah punya akun?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-[#1D4ED8] font-bold"
              >
                Masuk
              </button>
            </p>
          </div>
        ) : (
          <div className="text-center pb-2">
            <p className="text-gray-500 text-sm">
              Sudah punya akun?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-[#1D4ED8] font-bold"
              >
                Masuk
              </button>
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-2xl flex flex-col max-h-[85vh] relative"
            >
              <button
                onClick={() => setShowPrivacy(false)}
                className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-[#0F1D3E] font-extrabold text-xl mb-4 pr-6">
                Kebijakan Privasi
              </h3>

              <div
                className="overflow-y-auto text-sm text-gray-600 mb-6 flex-1 pr-2 space-y-4"
                style={{ scrollbarWidth: "thin" }}
              >
                <p>
                  Selamat datang di FinTrust AI. Kebijakan ini mengatur
                  pengumpulan dan perlindungan data Anda.
                </p>
                <div>
                  <strong className="text-gray-800">1. Pengumpulan Data</strong>
                  <p className="mt-1">
                    Kami mengumpulkan informasi pribadi seperti nama, email,
                    nomor telepon, serta profil usaha Anda guna keperluan
                    verifikasi akun.
                  </p>
                </div>
                <div>
                  <strong className="text-gray-800">
                    2. Penggunaan Informasi
                  </strong>
                  <p className="mt-1">
                    Data Anda secara khusus digunakan oleh sistem AI kami untuk
                    menilai skor kredit UMKM dan menghubungkan Anda dengan
                    layanan pendanaan yang tepat.
                  </p>
                </div>
                <div>
                  <strong className="text-gray-800">3. Keamanan Data</strong>
                  <p className="mt-1">
                    Kami menggunakan enkripsi keamanan tingkat tinggi. Data Anda
                    tidak akan diperjualbelikan kepada pihak ketiga tanpa izin
                    eksplisit dari Anda.
                  </p>
                </div>
                <p className="pt-2 text-xs italic">
                  Dengan menekan tombol <strong>"Saya Setuju"</strong>, Anda
                  menyetujui seluruh ketentuan dan pemrosesan data oleh FinTrust
                  AI.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setAgreed(true);
                    setShowPrivacy(false);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                >
                  Saya Setuju
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}