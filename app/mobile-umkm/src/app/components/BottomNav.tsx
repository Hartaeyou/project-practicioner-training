import { Home, User, TrendingUp, Users } from 'lucide-react';

interface BottomNavProps {
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
}

export function BottomNav({ currentScreen, setCurrentScreen }: BottomNavProps) {
  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'skor', label: 'Skor', icon: TrendingUp },
    { id: 'pendana', label: 'Pendana', icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[393px] mx-auto bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className="flex flex-col items-center gap-1 transition-colors"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? 'text-[#1D4ED8]' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-[#1D4ED8]' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
