import { Navigate } from "react-router";
import { useAuth } from "../../../lib/AuthContext";

// Bungkus semua route dashboard dengan ini di App.tsx.
// - Selagi status login masih dicek (loading) -> tampilkan layar loading singkat
// - Kalau tidak ada sesi sama sekali -> lempar ke /login
// - Kalau ada sesi TAPI bukan lender valid (role salah / belum ke-link
//   ke institusi) -> lempar ke /login juga (AuthContext sudah otomatis
//   sign-out akun yang tidak valid saat percobaan signIn(), tapi ini jadi
//   pengaman tambahan untuk sesi lama yang mungkin masih tersimpan browser)
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, lenderProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-sm text-gray-400">Memuat...</p>
      </div>
    );
  }

  if (!session || !lenderProfile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}