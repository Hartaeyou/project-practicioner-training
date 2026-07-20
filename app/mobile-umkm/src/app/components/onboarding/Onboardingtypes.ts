// ============================================================
// TIPE & KONSTANTA BERSAMA — dipakai di semua step wizard
// ============================================================

export type CaraBayar = 'lunas' | 'tempo_kurang_7' | 'tempo_7_30' | 'sering_telat';

export type Supplier = {
  id: string;
  namaSupplier: string;
  bahanSuplai: string;
  // Nota per bulan (3 bulan terakhir) — dokumentasi saja, TIDAK dihitung otomatis
  notaBulan: [File[], File[], File[]];
  totalPengeluaran: string; // Rp per bulan, disimpan sebagai string biar gampang diedit
  caraBayar: CaraBayar | '';
  rating: number; // 1-5, 0 = belum dinilai
};

export type ProfilForm = {
  dana: string;
  tujuanDana: string;
};

export const walletProviders = ['GoPay Business', 'OVO Merchant', 'DANA Bisnis', 'ShopeePay'];
export const b2bPlatforms = ['Mitra Bukalapak', 'GudangAda', 'SRC', 'BukuWarung'];

export function makeUuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeEmptySupplier(): Supplier {
  return {
    id: makeUuid(),
    namaSupplier: '',
    bahanSuplai: '',
    notaBulan: [[], [], []],
    totalPengeluaran: '',
    caraBayar: '',
    rating: 0,
  };
}

export const CARA_BAYAR_OPTIONS: { id: CaraBayar; label: string; skor: number }[] = [
  { id: 'lunas', label: 'Lunas di Tempat', skor: 100 },
  { id: 'tempo_kurang_7', label: 'Tempo < 7 hari', skor: 85 },
  { id: 'tempo_7_30', label: 'Tempo 7–30 hari', skor: 60 },
  { id: 'sering_telat', label: 'Sering Telat > 30 hari', skor: 30 },
];

export function isSupplierComplete(s: Supplier) {
  return (
    s.namaSupplier.trim() !== '' &&
    s.bahanSuplai.trim() !== '' &&
    Number(s.totalPengeluaran) > 0 &&
    s.caraBayar !== '' &&
    s.rating > 0
  );
}

// Skor "Disiplin & Kualitas Rantai Pasok" dari data supplier:
// - 60% dari rata-rata skor cara bayar (proxy disiplin bayar UMKM)
// - 40% dari rata-rata rating kepuasan (proxy kualitas rantai pasok)
// Nota tidak ikut dihitung — murni dokumentasi/bukti pendukung.
export function computeSkorSupplier(suppliers: Supplier[]): number | null {
  const complete = suppliers.filter(isSupplierComplete);
  if (complete.length === 0) return null;

  const skorCaraBayarMap = Object.fromEntries(
    CARA_BAYAR_OPTIONS.map((o) => [o.id, o.skor]),
  ) as Record<CaraBayar, number>;

  const avgCaraBayar =
    complete.reduce((sum, s) => sum + skorCaraBayarMap[s.caraBayar as CaraBayar], 0) / complete.length;
  const avgRating = complete.reduce((sum, s) => sum + s.rating, 0) / complete.length; // skala 1-5
  const skorRating = (avgRating / 5) * 100;

  return Math.round(avgCaraBayar * 0.6 + skorRating * 0.4);
}