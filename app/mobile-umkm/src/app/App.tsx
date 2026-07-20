// CONTOH src/app/App.tsx — versi lengkap dengan Welcome screen
//
// FIX: sebelumnya cuma ada listener untuk 'navigateToSkor'. Sekarang
// ditambahkan listener untuk 'navigateToPendana', 'navigateToProfil', dan
// 'navigateToRiwayat' supaya semua tombol di Beranda.tsx beneran pindah
// screen — bukan cuma dispatch event ke ruang kosong.
//
// Untuk tombol "Ajukan" di kartu Rekomendasi Pendana & tombol "Riwayat",
// kita perlu oper info tambahan (lender mana yang mau langsung dibuka,
// atau tab riwayat yang mau langsung aktif) ke <Pendana />. Makanya ada
// state `pendanaNav` yang dikirim sebagai props ke Pendana.

import { useState, useEffect } from 'react';
import { Beranda } from './components/Beranda';
import { Skor } from './components/Skor';
import { Profil } from './components/Profil';
import { Pendana } from './components/Pendana';
import { BottomNav } from './components/BottomNav';
import { Welcome } from './components/auth/Welcome';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { ScoreProvider } from '../lib/ScoreContext';

type AuthScreen = 'welcome' | 'login' | 'register';

// FIX: state navigasi khusus buat Pendana — dioper sebagai props supaya
// Pendana bisa langsung buka tab/lender yang tepat begitu di-mount.
// `nonce` dinaikkan tiap kali event diterima, supaya efek di Pendana tetap
// jalan meskipun user klik target yang sama dua kali berturut-turut.
type PendanaNav = {
  tab?: 'cari' | 'riwayat';
  lenderId?: string;
  nonce: number;
};

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [currentScreen, setCurrentScreen] = useState('beranda');
  const [pendanaNav, setPendanaNav] = useState<PendanaNav>({ nonce: 0 });

  useEffect(() => {
    const handleNavigateToSkor = () => setCurrentScreen('skor');

    const handleNavigateToProfil = () => setCurrentScreen('profil');

    // Dipicu oleh tombol "Ajukan Pinjaman" / "Mitra Pendana" / kartu lender
    // di Beranda. detail.lenderId opsional — kalau ada, Pendana langsung
    // buka modal pengajuan untuk lender itu.
    const handleNavigateToPendana = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setPendanaNav((prev) => ({
        tab: detail.tab ?? 'cari',
        lenderId: detail.lenderId,
        nonce: prev.nonce + 1,
      }));
      setCurrentScreen('pendana');
    };

    // Dipicu oleh tombol "Riwayat Pengajuan" di Beranda — arahkan ke
    // Pendana dengan tab "Riwayat" yang langsung aktif.
    const handleNavigateToRiwayat = () => {
      setPendanaNav((prev) => ({ tab: 'riwayat', lenderId: undefined, nonce: prev.nonce + 1 }));
      setCurrentScreen('pendana');
    };

    window.addEventListener('navigateToSkor', handleNavigateToSkor);
    window.addEventListener('navigateToProfil', handleNavigateToProfil);
    window.addEventListener('navigateToPendana', handleNavigateToPendana);
    window.addEventListener('navigateToRiwayat', handleNavigateToRiwayat);

    return () => {
      window.removeEventListener('navigateToSkor', handleNavigateToSkor);
      window.removeEventListener('navigateToProfil', handleNavigateToProfil);
      window.removeEventListener('navigateToPendana', handleNavigateToPendana);
      window.removeEventListener('navigateToRiwayat', handleNavigateToRiwayat);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full max-w-[393px] mx-auto flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  // belum login -> alur Welcome / Login / Register
  if (!session || !profile) {
    if (authScreen === 'welcome') {
      return (
        <Welcome
          onLogin={() => setAuthScreen('login')}
          onRegister={() => setAuthScreen('register')}
        />
      );
    }
    if (authScreen === 'login') {
      return (
        <Login
          onSwitchToRegister={() => setAuthScreen('register')}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    }
    return (
      <Register
        onSwitchToLogin={() => setAuthScreen('login')}
        onBack={() => setAuthScreen('welcome')}
      />
    );
  }

  // sudah login -> tampilan app seperti biasa
  return (
    <div className="h-screen w-full max-w-[393px] mx-auto bg-gray-50 flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20">
        {currentScreen === 'beranda' && <Beranda />}
        {currentScreen === 'skor' && <Skor />}
        {currentScreen === 'profil' && <Profil />}
        {currentScreen === 'pendana' && (
          <Pendana
            initialTab={pendanaNav.tab}
            initialLenderId={pendanaNav.lenderId}
            navKey={pendanaNav.nonce}
          />
        )}
      </div>
      <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScoreProvider>
        <AppContent />
      </ScoreProvider>
    </AuthProvider>
  );
}