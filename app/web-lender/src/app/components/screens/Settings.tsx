import { User, Bell, Shield, Database, Globe } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola preferensi dan konfigurasi sistem</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Profil Pengguna</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Nama Lengkap</label>
              <input
                type="text"
                defaultValue="Admin User"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <input
                type="email"
                defaultValue="admin@fintrust.id"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Jabatan</label>
              <input
                type="text"
                defaultValue="Senior Credit Analyst"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Aplikasi pinjaman baru', checked: true },
              { label: 'Persetujuan otomatis', checked: true },
              { label: 'Peringatan risiko tinggi', checked: true },
              { label: 'Laporan harian', checked: false },
              { label: 'Update sistem', checked: true },
            ].map((item, index) => (
              <label key={index} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">{item.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Keamanan</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-left">
              Ubah Password
            </button>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-left">
              Autentikasi Dua Faktor
            </button>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-left">
              Riwayat Login
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sistem</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Bahasa</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Bahasa Indonesia</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Zona Waktu</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>WIB (GMT+7)</option>
                <option>WITA (GMT+8)</option>
                <option>WIT (GMT+9)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Format Mata Uang</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>IDR (Rupiah)</option>
                <option>USD (Dollar)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2.5 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}
