import { Outlet, NavLink } from 'react-router';
import { LayoutDashboard, Database, Network, CheckCircle, Settings, Search, Bell, User } from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Dasbor Utama', icon: LayoutDashboard, path: '/' },
  { id: 'insights', label: 'Wawasan Data Alternatif', icon: Database, path: '/wawasan-data' },
  { id: 'network', label: 'Analisis Jaringan Kepercayaan', icon: Network, path: '/analisis-jaringan' },
  { id: 'settings', label: 'Pengaturan', icon: Settings, path: '/pengaturan' },
];

export default function DashboardLayout() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#1D4ED8] to-[#10B981] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="font-bold text-lg text-gray-900">FinTrust AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1D4ED8] to-[#1D4ED8]/90 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-9 h-9 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@fintrust.id</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari UMKM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#10B981] rounded-full"></span>
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
