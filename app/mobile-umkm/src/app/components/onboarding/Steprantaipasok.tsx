import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldCheck, Loader2, Store, Receipt, Plus, CheckCircle2 } from 'lucide-react';
import { FieldInput } from './Onboardingshared';
import { SupplierFormCard, SupplierListItem } from './Supplierform';
import { Supplier, b2bPlatforms, makeEmptySupplier } from './Onboardingtypes';

// ============================================================
// STEP 3 — Rantai Pasok
// ============================================================
export function StepRantaiPasok({
  mode,
  setMode,
  b2bSubStep,
  platform,
  setPlatform,
  onLoginDistributor,
  onOtorisasi,
  isSyncing,
  jumlahSupplier,
  telatBayar,
  suppliers,
  showSupplierForm,
  editingSupplier,
  onAddSupplierClick,
  onSaveSupplier,
  onCancelSupplierForm,
  onEditSupplier,
  onDeleteSupplier,
  skorUtilitas,
  savingSupplier,
}: {
  mode: 'B2B' | 'UTILITAS' | null;
  setMode: (m: 'B2B' | 'UTILITAS') => void;
  b2bSubStep: 0 | 1 | 2;
  platform: string;
  setPlatform: (v: string) => void;
  onLoginDistributor: () => void;
  onOtorisasi: () => void;
  isSyncing: boolean;
  jumlahSupplier: number;
  telatBayar: number;
  suppliers: Supplier[];
  showSupplierForm: boolean;
  editingSupplier: Supplier | null;
  onAddSupplierClick: () => void;
  onSaveSupplier: (s: Supplier) => void;
  onCancelSupplierForm: () => void;
  onEditSupplier: (id: string) => void;
  onDeleteSupplier: (id: string) => void;
  skorUtilitas: number | null;
  savingSupplier: boolean;
}) {
  // Login distributor cuma simulasi (tidak ada API B2B beneran) — jadi
  // username/password cukup state lokal, dummy, tidak perlu dikirim ke Supabase.
  const [distributorUsername, setDistributorUsername] = useState('');
  const [distributorPassword, setDistributorPassword] = useState('');

  return (
    <div className="space-y-5 pb-2">
      <p className="text-[#0F1D3E] font-bold text-sm">Validasi Pengeluaran Kulakan</p>

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Bagaimana cara Anda kulakan barang?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {/* TAKEDOWN SEMENTARA: opsi "Aplikasi B2B Digital" dimatikan dulu
              dari UI atas permintaan — kode & alurnya (b2bSubStep 0/1/2 di
              bawah, state di OnboardingWizard.tsx) sengaja tidak dihapus
              supaya bisa diaktifkan lagi kapan saja tinggal buka komentar ini.
          <button
            onClick={() => setMode('B2B')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              mode === 'B2B' ? 'border-[#1D4ED8] bg-blue-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <Store size={18} className={mode === 'B2B' ? 'text-[#1D4ED8]' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${mode === 'B2B' ? 'text-[#1D4ED8]' : 'text-gray-600'}`}>
              Aplikasi B2B Digital
            </span>
          </button>
          */}
          <button
            onClick={() => setMode('UTILITAS')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              mode === 'UTILITAS' ? 'border-[#1D4ED8] bg-blue-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <Receipt size={18} className={mode === 'UTILITAS' ? 'text-[#1D4ED8]' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${mode === 'UTILITAS' ? 'text-[#1D4ED8]' : 'text-gray-600'}`}>
              Tunai / Tradisional
            </span>
          </button>
        </div>
      </div>

      {mode === 'B2B' && (
        <AnimatePresence mode="wait">
          {b2bSubStep === 0 && (
            <motion.div key="b0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">Pilih Platform B2B</label>
                <div className="grid grid-cols-2 gap-2">
                  {b2bPlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border-2 transition-all ${
                        platform === p
                          ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
                          : 'border-gray-100 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={onLoginDistributor}
                disabled={!platform}
                className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Login ke Akun Distributor
              </button>
            </motion.div>
          )}

          {b2bSubStep === 1 && (
            <motion.div key="b1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <FieldInput
                label="Username"
                icon={<User size={17} className="text-gray-400" />}
                value={distributorUsername}
                onChange={setDistributorUsername}
                placeholder="Username distributor"
              />
              <FieldInput
                label="Password"
                icon={<ShieldCheck size={17} className="text-gray-400" />}
                value={distributorPassword}
                onChange={setDistributorPassword}
                placeholder="••••••"
                type="password"
              />
              <button
                onClick={onOtorisasi}
                disabled={isSyncing}
                className="w-full bg-[#1D4ED8] text-white font-bold text-sm rounded-2xl py-3.5 disabled:opacity-60 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sinkronisasi invoice...
                  </>
                ) : (
                  'Otorisasi Akses Faktur'
                )}
              </button>
            </motion.div>
          )}

          {b2bSubStep === 2 && (
            <motion.div key="b2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">Supplier Terhubung</p>
                <p className="text-xl font-bold text-[#0F1D3E]">{jumlahSupplier}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">Rata-rata Telat Bayar</p>
                <p className="text-xl font-bold text-[#0F1D3E]">{telatBayar} Hari</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {mode === 'UTILITAS' && (
        <div className="space-y-4">
          {suppliers.length === 0 && !showSupplierForm && (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Store size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 px-6">
                Belum ada supplier ditambahkan. Tambahkan minimal 1 supplier kulakan Anda.
              </p>
            </div>
          )}

          {suppliers.length > 0 && (
            <div className="space-y-3">
              {suppliers.map((s) => (
                <SupplierListItem
                  key={s.id}
                  supplier={s}
                  onEdit={() => onEditSupplier(s.id)}
                  onDelete={() => onDeleteSupplier(s.id)}
                />
              ))}
            </div>
          )}

          {showSupplierForm ? (
            <SupplierFormCard
              initial={editingSupplier ?? makeEmptySupplier()}
              onSave={onSaveSupplier}
              onCancel={onCancelSupplierForm}
              saving={savingSupplier}
            />
          ) : (
            <button
              type="button"
              onClick={onAddSupplierClick}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#1D4ED8]/30 text-[#1D4ED8] text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} /> {suppliers.length === 0 ? 'Tambah Supplier' : 'Tambah Supplier Lain'}
            </button>
          )}

          {skorUtilitas !== null && (
            <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
              <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
              <p className="text-xs text-[#10B981] font-medium">
                Skor Disiplin & Kualitas Rantai Pasok: {skorUtilitas}/100
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}