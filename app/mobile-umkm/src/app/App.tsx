// CONTOH src/app/App.tsx — versi lengkap dengan Welcome screen

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

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [currentScreen, setCurrentScreen] = useState('beranda');

  useEffect(() => {
    const handleNavigateToSkor = () => setCurrentScreen('skor');
    window.addEventListener('navigateToSkor', handleNavigateToSkor);
    return () => window.removeEventListener('navigateToSkor', handleNavigateToSkor);
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
        {currentScreen === 'pendana' && <Pendana />}
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