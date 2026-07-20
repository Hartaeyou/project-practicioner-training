import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Upload, X, Star, Store, Package, Loader2 } from 'lucide-react';
import { FieldInput } from './Onboardingshared';
import { formatRupiah, formatThousands } from '../../../lib/useLenders';
import { Supplier, CARA_BAYAR_OPTIONS } from './Onboardingtypes';

// ============================================================
// TAMBAH SUPPLIER — komponen UI
// ============================================================
export function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5 active:scale-90 transition-transform"
        >
          <Star size={22} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

export function NotaBulanUpload({
  label,
  files,
  onChange,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputId = `nota-${label.replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div>
      <label
        htmlFor={inputId}
        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-colors ${
          files.length > 0
            ? 'border-[#10B981] bg-green-50'
            : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {files.length > 0 ? (
          <CheckCircle2 size={18} className="text-[#10B981] shrink-0" />
        ) : (
          <Upload size={18} className="text-gray-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900">{label}</p>
          <p className="text-[11px] text-gray-500">
            {files.length > 0
              ? `${files.length} foto nota dipilih`
              : 'Ketuk untuk pilih foto nota (bisa lebih dari satu)'}
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            if (selected.length) onChange([...files, ...selected]);
            e.target.value = '';
          }}
        />
      </label>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {files.map((f, i) => (
            <span
              key={i}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              {f.name.length > 14 ? f.name.slice(0, 12) + '…' : f.name}
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SupplierFormCard({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Supplier;
  onSave: (s: Supplier) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Supplier>(initial);
  const [error, setError] = useState('');

  function updateNota(bulanIndex: 0 | 1 | 2, files: File[]) {
    setForm((f) => {
      const next = [...f.notaBulan] as [File[], File[], File[]];
      next[bulanIndex] = files;
      return { ...f, notaBulan: next };
    });
  }

  function handleSave() {
    if (!form.namaSupplier.trim()) return setError('Nama supplier harus diisi');
    if (!form.bahanSuplai.trim()) return setError('Bahan yang disuplai harus diisi');
    if (!form.totalPengeluaran || Number(form.totalPengeluaran) <= 0)
      return setError('Total pengeluaran per bulan harus diisi dengan angka valid');
    if (!form.caraBayar) return setError('Pilih rata-rata cara bayar');
    if (form.rating === 0) return setError('Beri rating kepuasan (1–5 bintang)');
    setError('');
    onSave(form);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-4 space-y-4"
    >
      <FieldInput
        label="Nama Supplier"
        icon={<Store size={17} className="text-gray-400" />}
        value={form.namaSupplier}
        onChange={(v) => setForm((f) => ({ ...f, namaSupplier: v }))}
        placeholder="cth. Toko Sembako Pak Budi"
      />
      <FieldInput
        label="Bahan yang Disuplai"
        icon={<Package size={17} className="text-gray-400" />}
        value={form.bahanSuplai}
        onChange={(v) => setForm((f) => ({ ...f, bahanSuplai: v }))}
        placeholder="cth. Beras & Gula"
      />

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Upload Nota (3 Bulan Terakhir)
        </label>
        <div className="space-y-2">
          <NotaBulanUpload label="Nota Bulan 1" files={form.notaBulan[0]} onChange={(fs) => updateNota(0, fs)} />
          <NotaBulanUpload label="Nota Bulan 2" files={form.notaBulan[1]} onChange={(fs) => updateNota(1, fs)} />
          <NotaBulanUpload label="Nota Bulan 3" files={form.notaBulan[2]} onChange={(fs) => updateNota(2, fs)} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Nota ini bukti dokumentasi saja, tidak dihitung otomatis oleh sistem.
        </p>
      </div>

      <FieldInput
        label="Total Pengeluaran per Bulan ke Supplier Ini (Rp)"
        icon={<span className="text-gray-400 text-sm shrink-0">Rp</span>}
        value={formatThousands(form.totalPengeluaran)}
        onChange={(v) => setForm((f) => ({ ...f, totalPengeluaran: v.replace(/[^\d]/g, '') }))}
        placeholder="cth. 3.000.000"
      />

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">Rata-rata Cara Bayar</label>
        <div className="grid grid-cols-1 gap-2">
          {CARA_BAYAR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, caraBayar: opt.id }))}
              className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                form.caraBayar === opt.id
                  ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
                  : 'border-gray-100 bg-white text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
          Rating Kepuasan (Ketepatan Kirim & Kualitas Barang)
        </label>
        <StarRatingInput value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D4ED8] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Menyimpan...
            </>
          ) : (
            'Simpan Supplier'
          )}
        </button>
      </div>
    </motion.div>
  );
}

export function SupplierListItem({
  supplier,
  onEdit,
  onDelete,
}: {
  supplier: Supplier;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const caraBayarLabel = CARA_BAYAR_OPTIONS.find((o) => o.id === supplier.caraBayar)?.label ?? '-';
  const totalNota = supplier.notaBulan.reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-[#0F1D3E] text-sm">{supplier.namaSupplier}</p>
          <p className="text-xs text-gray-500">{supplier.bahanSuplai}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={12}
              className={n <= supplier.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400">Pengeluaran/Bulan</p>
          <p className="text-xs font-semibold text-[#0F1D3E]">
            {supplier.totalPengeluaran ? formatRupiah(Number(supplier.totalPengeluaran)) : '-'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400">Cara Bayar</p>
          <p className="text-xs font-semibold text-[#0F1D3E]">{caraBayarLabel}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{totalNota} foto nota terlampir</span>
        <div className="flex gap-3">
          <button type="button" onClick={onEdit} className="text-xs text-[#1D4ED8] font-semibold">
            Ubah
          </button>
          <button type="button" onClick={onDelete} className="text-xs text-red-500 font-semibold">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}