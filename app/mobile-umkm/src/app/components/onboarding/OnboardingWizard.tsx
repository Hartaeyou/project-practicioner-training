import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, ChevronRight } from 'lucide-react';
import { useScore, LoanOffer } from '../../../lib/ScoreContext';
import { useAuth } from '../../../lib/AuthContext';
import { useLenders, formatRupiah, isLenderEligible } from '../../../lib/useLenders';
import { supabase } from '../../../lib/supabaseClient';

import { steps, StepIndicator } from './Onboardingshared';
import { StepProfilDana } from './Stepprofildana';
import { StepOmzet } from './Stepomzet';
import { StepRantaiPasok } from './Steprantaipasok';
import { StepHasil } from './Stephasil';
import {
  Supplier,
  ProfilForm,
  isSupplierComplete,
  computeSkorSupplier,
  makeUuid,
} from './Onboardingtypes';

interface OnboardingWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

// ============================================================
// WIZARD UTAMA
// ============================================================
export function OnboardingWizard({ onComplete, onBack }: OnboardingWizardProps) {
  const { setResult } = useScore();
  const { profile, umkmProfile } = useAuth();
  const { lenders, loading: lendersLoading } = useLenders();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');

  // Dibuat sekali per sesi wizard — jadi id baris `scores` yang bakal
  // dihasilkan handleCalculate DAN penanda `sync_id` pada business_relations
  // yang disimpan sesi ini. Ini yang bikin snapshot profil per sinkronisasi
  // bisa dipisah dari sinkronisasi lain, tanpa FK (baris scores belum ada
  // saat supplier disimpan di Step 3).
  const [syncId] = useState<string>(() => makeUuid());

  const namaPemilik = profile?.full_name ?? '';
  const namaUsaha = umkmProfile?.nama_usaha ?? '';

  // Step 1 — Profil & Dana
  const [profilForm, setProfilForm] = useState<ProfilForm>({ dana: '', tujuanDana: '' });

  // KTP — file yang dipilih user + state upload
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreviewUrl, setKtpPreviewUrl] = useState<string | null>(null);
  const [ktpUploading, setKtpUploading] = useState(false);
  const [ktpDone, setKtpDone] = useState(false);
  const [ktpStorageUrl, setKtpStorageUrl] = useState<string | null>(null);

  // Selfie — blob dari kamera + state upload
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [selfieDone, setSelfieDone] = useState(false);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [selfieStorageUrl, setSelfieStorageUrl] = useState<string | null>(null);

  // Step 2 — Omzet
  const [omzetMode, setOmzetModeState] = useState<'EWALLET' | 'MANUAL' | null>(null);
  const [omzetSubStep, setOmzetSubStep] = useState<0 | 1 | 2>(0);
  const [walletProvider, setWalletProvider] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOmzet, setIsVerifyingOmzet] = useState(false);
  const [qrisFrek] = useState(345);
  const [qrisVol] = useState(28.5);
  const [manualOmzet, setManualOmzet] = useState('');
  const [manualFrekuensi, setManualFrekuensi] = useState('');
  const [manualBuktiFile, setManualBuktiFile] = useState<File | null>(null);
  const [manualBuktiUploading, setManualBuktiUploading] = useState(false);
  const [manualBuktiDone, setManualBuktiDone] = useState(false);
  const [manualBuktiUrl, setManualBuktiUrl] = useState<string | null>(null);
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  function setOmzetMode(m: 'EWALLET' | 'MANUAL') {
    setOmzetModeState(m);
    setOmzetSubStep(0);
    setManualConfirmed(false);
  }

  // ── Upload bukti omzet manual ke Supabase Storage (bucket: bukti-omzet) ──
  async function handleSelectManualBukti(file: File) {
    setManualBuktiFile(file);
    setManualBuktiDone(false);
    setManualBuktiUploading(true);
    setManualError('');

    if (!umkmProfile) {
      setManualBuktiUploading(false);
      setManualError('Profil usaha belum ada. Selesaikan pendaftaran dulu.');
      return;
    }

    const path = `${umkmProfile.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('bukti-omzet')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setManualBuktiUploading(false);
      setManualError('Gagal upload bukti: ' + upErr.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('bukti-omzet').getPublicUrl(path);
    setManualBuktiUrl(urlData.publicUrl);
    setManualBuktiUploading(false);
    setManualBuktiDone(true);
  }

  // ── Konfirmasi data omzet manual → simpan nominal, frekuensi, dan URL
  // bukti ke tabel umkm_profiles (1 baris per UMKM, ditimpa tiap konfirmasi).
  async function handleConfirmManual() {
    const omzetNum = Number(manualOmzet);
    const frekNum = Number(manualFrekuensi);
    if (!omzetNum || omzetNum <= 0) {
      setManualError('Isi omzet dengan angka yang valid');
      return;
    }
    if (!frekNum || frekNum <= 0) {
      setManualError('Isi jumlah transaksi dengan angka yang valid');
      return;
    }

    setManualError('');

    if (!umkmProfile) {
      setManualError('Profil usaha belum ada. Selesaikan pendaftaran dulu.');
      return;
    }

    setManualSaving(true);
    const { error } = await supabase
      .from('umkm_profiles')
      .update({
        omzet_manual_juta_per_bulan: omzetNum,
        omzet_manual_frekuensi_per_bulan: frekNum,
        omzet_manual_bukti_url: manualBuktiUrl,
      })
      .eq('id', umkmProfile.id);
    setManualSaving(false);

    if (error) {
      console.error('Gagal simpan data omzet manual ke Supabase:', error);
      setManualError('Data tersimpan di form, tapi gagal dikirim ke server: ' + error.message);
      return;
    }

    setManualConfirmed(true);
  }

  // Step 3 — Rantai Pasok
  const [rantaiMode, setRantaiMode] = useState<'B2B' | 'UTILITAS' | null>(null);
  const [b2bSubStep, setB2bSubStep] = useState<0 | 1 | 2>(0);
  const [platform, setPlatform] = useState('');
  const [isSyncingB2b, setIsSyncingB2b] = useState(false);
  const [jumlahSupplier] = useState(4);
  const [telatBayar] = useState(1.5);

  // FIX SUPPLIER: ganti bukti-utilitas-generik + OCR simulasi jadi daftar
  // supplier nyata yang diinput user satu per satu.
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const editingSupplier = suppliers.find((s) => s.id === editingSupplierId) ?? null;
  // Skor dihitung otomatis dari data supplier (cara bayar + rating),
  // bukan lagi angka simulasi tetap (85).
  const skorUtilitas = useMemo(() => computeSkorSupplier(suppliers), [suppliers]);

  function handleAddSupplierClick() {
    setEditingSupplierId(null);
    setShowSupplierForm(true);
  }

  function handleEditSupplier(id: string) {
    setEditingSupplierId(id);
    setShowSupplierForm(true);
  }

  // FIX: hapus supplier sekarang juga hapus baris yang sudah tersimpan di
  // Supabase (tabel business_relations), bukan cuma dari state lokal.
  async function handleDeleteSupplier(id: string) {
    setSuppliers((list) => list.filter((s) => s.id !== id));
    if (editingSupplierId === id) {
      setEditingSupplierId(null);
      setShowSupplierForm(false);
    }
    const { error } = await supabase.from('business_relations').delete().eq('id', id);
    if (error) {
      console.error('Gagal hapus supplier dari server:', error);
    }
  }

  // FIX: upload foto nota ke Storage (bucket: nota-supplier), lalu upsert
  // baris supplier ke tabel business_relations. Pakai `s.id` (uuid yang
  // sudah dibuat di client lewat makeEmptySupplier) sebagai primary key,
  // jadi simpan ulang (edit) otomatis jadi UPDATE, bukan INSERT baru.
  async function persistSupplierToSupabase(s: Supplier) {
    if (!umkmProfile) {
      setSaveError('Profil usaha belum ada. Selesaikan pendaftaran dulu.');
      return;
    }

    const notaUrls: string[] = [];
    for (const filesInBulan of s.notaBulan) {
      for (const file of filesInBulan) {
        // File yang belum sempat diupload (baru dipilih user) tidak ada
        // penanda khusus, jadi kita upload ulang tiap kali simpan supaya
        // sederhana — cukup untuk skala hackathon.
        const path = `${umkmProfile.id}/${s.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from('nota-supplier')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) {
          console.error('Gagal upload nota:', upErr);
          continue;
        }
        const { data } = supabase.storage.from('nota-supplier').getPublicUrl(path);
        notaUrls.push(data.publicUrl);
      }
    }

    const { error } = await supabase.from('business_relations').upsert({
      id: s.id,
      umkm_id: umkmProfile.id,
      nama_supplier: s.namaSupplier,
      bahan_suplai: s.bahanSuplai,
      total_pengeluaran: Number(s.totalPengeluaran),
      cara_bayar: s.caraBayar,
      rating: s.rating,
      nota_urls: notaUrls,
      // Penanda sesi sinkronisasi ini, dipakai handleCalculate buat narik
      // supplier yang benar-benar bagian dari sinkronisasi sekarang saja —
      // bukan tercampur sama supplier dari sinkronisasi-sinkronisasi lama.
      sync_id: syncId,
    });

    if (error) {
      console.error('Gagal simpan supplier ke Supabase:', error);
      setSaveError('Supplier tersimpan di form, tapi gagal dikirim ke server: ' + error.message);
    } else {
      setSaveError('');
    }
  }

  async function handleSaveSupplier(s: Supplier) {
    setSavingSupplier(true);
    setSuppliers((list) => {
      const exists = list.some((x) => x.id === s.id);
      return exists ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s];
    });

    await persistSupplierToSupabase(s);

    setSavingSupplier(false);
    setShowSupplierForm(false);
    setEditingSupplierId(null);
  }

  function handleCancelSupplierForm() {
    setShowSupplierForm(false);
    setEditingSupplierId(null);
  }

  // Step 4 — Hasil
  const [isCalculating, setIsCalculating] = useState(false);
  const [finalScore, setFinalScore] = useState<{ total: number; lenders: LoanOffer[] } | null>(null);

  function validateStep0() {
    const e: Record<string, string> = {};
    if (!ktpDone || !selfieDone) e.ekyc = 'Unggah KTP dan selfie liveness terlebih dahulu';
    if (!profilForm.dana || Number(profilForm.dana) < 500000) e.dana = 'Minimal Rp 500.000';
    if (!profilForm.tujuanDana.trim()) e.tujuanDana = 'Tujuan penggunaan dana harus diisi';
    return e;
  }

  function goNext() {
    if (step === 0) {
      const e = validateStep0();
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
    }
    if (step === 1) {
      if (omzetMode === 'EWALLET' && omzetSubStep !== 2) return;
      if (omzetMode === 'MANUAL' && !manualConfirmed) return;
      if (omzetMode === null) return;
    }
    if (step === 2 && rantaiMode === 'B2B' && b2bSubStep !== 2) return;
    // FIX SUPPLIER: baru boleh lanjut kalau minimal 1 supplier lengkap
    // tersimpan (skorUtilitas !== null), dan form tambah/edit tidak lagi
    // terbuka (supaya tidak ada input yang tertinggal belum tersimpan).
    if (step === 2 && rantaiMode === 'UTILITAS' && (skorUtilitas === null || showSupplierForm)) return;
    if (step === 2 && rantaiMode === null) return;

    setErrors({});
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    if (step === 0) {
      onBack();
      return;
    }
    setStep((s) => s - 1);
  }

  // ── Upload KTP ke Supabase Storage (bucket: identitas-umkm) ──────────────
  async function handleSelectKtp(file: File) {
    setKtpFile(file);
    const localUrl = URL.createObjectURL(file);
    setKtpPreviewUrl(localUrl);
    setKtpDone(false);
    setKtpUploading(true);
    setSaveError('');

    if (!umkmProfile) {
      setKtpUploading(false);
      setSaveError('Profil usaha belum ada. Selesaikan pendaftaran dulu.');
      return;
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${umkmProfile.profile_id}/ktp.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('identitas-umkm')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setKtpUploading(false);
      setSaveError('Gagal upload KTP: ' + upErr.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('identitas-umkm').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setKtpStorageUrl(publicUrl);

    await supabase.from('umkm_profiles').update({ ktp_url: publicUrl }).eq('id', umkmProfile.id);

    setKtpUploading(false);
    setKtpDone(true);
  }

  // ── Selfie dari kamera → upload ke Supabase Storage ─────────────────────
  const handleCaptureSelfie = useCallback(
    async (blob: Blob) => {
      setSelfieUploading(true);
      setSaveError('');

      const localUrl = URL.createObjectURL(blob);
      setSelfiePreviewUrl(localUrl);

      if (!umkmProfile) {
        setSelfieUploading(false);
        setSaveError('Profil usaha belum ada. Selesaikan pendaftaran dulu.');
        return;
      }

      const path = `${umkmProfile.profile_id}/selfie.jpg`;
      const { error: upErr } = await supabase.storage
        .from('identitas-umkm')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

      if (upErr) {
        setSelfieUploading(false);
        setSaveError('Gagal upload selfie: ' + upErr.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('identitas-umkm').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setSelfieStorageUrl(publicUrl);

      await supabase.from('umkm_profiles').update({ selfie_url: publicUrl }).eq('id', umkmProfile.id);

      setSelfieUploading(false);
      setSelfieDone(true);
    },
    [umkmProfile],
  );

  function handleVerifyOtp() {
    if (otp !== '1234') {
      setOtpError('OTP salah, gunakan 1234');
      return;
    }
    setOtpError('');
    setIsVerifyingOmzet(true);
    setTimeout(() => {
      setIsVerifyingOmzet(false);
      setOmzetSubStep(2);
    }, 1200);
  }

  function handleOtorisasiB2b() {
    setIsSyncingB2b(true);
    setTimeout(() => {
      setIsSyncingB2b(false);
      setB2bSubStep(2);
    }, 1200);
  }

  async function handleCalculate() {
    setIsCalculating(true);
    setSaveError('');

    // Pakai angka dari e-wallet ATAU input manual, tergantung mana yang
    // dipilih user di step Omzet
    const omzetValue = omzetMode === 'MANUAL' ? Number(manualOmzet) : qrisVol;
    const frekuensiValue = omzetMode === 'MANUAL' ? Number(manualFrekuensi) : qrisFrek;

    // Skoring sederhana & transparan — gampang diganti ketua tim nanti
    // kalau model AI sesungguhnya sudah siap.
    const riwayatTransaksi = Math.min(100, Math.round((frekuensiValue / 400) * 60 + (omzetValue / 40) * 40));
    // FIX SUPPLIER: stabilitas dari jalur UTILITAS sekarang pakai skor
    // disiplin & kualitas rantai pasok hasil hitung dari data supplier asli.
    const stabilitasPendapatan =
      rantaiMode === 'B2B' ? Math.max(40, Math.round(100 - telatBayar * 10)) : skorUtilitas ?? 60;
    const lamaUsaha = 72; // belum ada input untuk ini di alur saat ini — placeholder

    const total = Math.round(riwayatTransaksi * 0.4 + lamaUsaha * 0.3 + stabilitasPendapatan * 0.3);
    const riskLevel = total >= 70 ? 'rendah' : total >= 50 ? 'menengah' : 'tinggi';
    const statusKelayakan: 'Tinggi' | 'Perlu Verifikasi' = total >= 70 ? 'Tinggi' : 'Perlu Verifikasi';

    // Rekomendasi lender dari Supabase (satu sumber sama dengan Pendana.tsx),
    // disaring dulu pakai ambang skor FinTrust masing-masing lender terhadap
    // skor yang baru saja dihitung — jangan rekomendasikan lender yang
    // ambangnya tidak terpenuhi.
    const lenderOffers: LoanOffer[] = lenders
      .filter((l) => isLenderEligible(l, total))
      .slice(0, 3)
      .map((l) => ({
      id: l.id,
      nama: l.nama,
      bunga: l.bunga_rate,
      limit: formatRupiah(l.limit_plafon),
    }));

    let scoreId: string | null = null;

    if (umkmProfile) {
      // Snapshot omzet manual eksplisit: kalau mode-nya bukan MANUAL,
      // null-kan semuanya. Kolom omzet_manual_* di umkm_profiles nggak
      // pernah dikosongkan kalau user ganti ke EWALLET di sinkronisasi
      // ini, jadi kalau dibaca langsung dari sana bisa kebawa angka dari
      // sinkronisasi manual yang lama.
      const omzetManualSnapshot =
        omzetMode === 'MANUAL'
          ? {
              omzet_manual_juta_per_bulan: Number(manualOmzet),
              omzet_manual_frekuensi_per_bulan: Number(manualFrekuensi),
              omzet_manual_bukti_url: manualBuktiUrl,
            }
          : {
              omzet_manual_juta_per_bulan: null,
              omzet_manual_frekuensi_per_bulan: null,
              omzet_manual_bukti_url: null,
            };

      // Snapshot validasi e-wallet: kalau mode-nya bukan EWALLET, null-kan
      // semuanya — pola sama seperti omzetManualSnapshot di atas, supaya
      // data e-wallet lama tidak kebawa kalau user ganti ke MANUAL.
      const omzetEwalletSnapshot =
        omzetMode === 'EWALLET'
          ? {
              ewallet_provider: walletProvider,
              ewallet_phone: walletPhone,
              ewallet_verified: omzetSubStep === 2,
              ewallet_frekuensi_transaksi: qrisFrek,
              ewallet_estimasi_omzet_juta: qrisVol,
            }
          : {
              ewallet_provider: null,
              ewallet_phone: null,
              ewallet_verified: false,
              ewallet_frekuensi_transaksi: null,
              ewallet_estimasi_omzet_juta: null,
            };

      // Supplier yang beneran bagian dari sesi sinkronisasi ini saja
      // (ditandai sync_id waktu disimpan di persistSupplierToSupabase),
      // bukan seluruh riwayat business_relations milik UMKM ini. Kosong
      // itu normal untuk rantaiMode B2B (nggak lewat form supplier).
      const { data: supplierRows } = await supabase
        .from('business_relations')
        .select('id, nama_supplier, bahan_suplai, total_pengeluaran, cara_bayar, rating, nota_urls')
        .eq('sync_id', syncId);

      // FIX SNAPSHOT: baris scores ini immutable (insert-only), jadi ini
      // tempat paling aman buat "membekukan" kondisi profil & dokumen
      // UMKM saat sinkronisasi ini terjadi. DataInsightsDetail.tsx di
      // web-lender baca dari sini dulu, baru fallback ke data live kalau
      // snapshot-nya kosong (baris scores lama sebelum kolom ini ada).
      const profilSnapshot = {
        ktp_url: ktpStorageUrl,
        selfie_url: selfieStorageUrl,
        sektor: umkmProfile.sektor,
        alamat: umkmProfile.alamat ?? null,
        lama_usaha_bulan: umkmProfile.lama_usaha_bulan ?? null,
        omzet_estimasi: umkmProfile.omzet_estimasi,
        nama_usaha: umkmProfile.nama_usaha,
        omzet_mode: omzetMode,
        ...omzetManualSnapshot,
        ...omzetEwalletSnapshot,
        suppliers: supplierRows ?? [],
      };

      const { data: inserted, error } = await supabase
        .from('scores')
        .insert({
          // Sama dengan sync_id di business_relations sesi ini — jadi
          // "milik sinkronisasi mana" bisa ditelusuri tanpa kolom/FK baru.
          id: syncId,
          umkm_id: umkmProfile.id,
          fintrust_score: total,
          risk_level: riskLevel,
          profil_snapshot: profilSnapshot,
          breakdown: {
            riwayatTransaksi,
            lamaUsaha,
            stabilitasPendapatan,
            sumberOmzet: omzetMode === 'MANUAL' ? 'Catatan Manual' : walletProvider,
            // FIX SUPPLIER: catat ringkasan supplier di breakdown, berguna
            // buat narasi XAI & audit — bukan cuma angka mentah. Data
            // lengkapnya sendiri sudah tersimpan permanen di tabel
            // business_relations (lihat persistSupplierToSupabase di atas).
            rantaiPasok:
              rantaiMode === 'UTILITAS'
                ? {
                    jumlahSupplier: suppliers.filter(isSupplierComplete).length,
                    daftarSupplier: suppliers.filter(isSupplierComplete).map((s) => ({
                      nama: s.namaSupplier,
                      bahan: s.bahanSuplai,
                      totalPengeluaranPerBulan: Number(s.totalPengeluaran),
                      caraBayar: s.caraBayar,
                      rating: s.rating,
                    })),
                  }
                : { platform, jumlahSupplier, telatBayar },
          },
          xai_narrative: `Skor ${total}/100 dihitung dari riwayat transaksi (${riwayatTransaksi}), lama usaha (${lamaUsaha}), dan stabilitas pendapatan (${stabilitasPendapatan}). Sumber data omzet: ${
            omzetMode === 'MANUAL' ? 'catatan manual UMKM' : walletProvider
          }. Sumber data rantai pasok: ${
            rantaiMode === 'UTILITAS'
              ? `${suppliers.filter(isSupplierComplete).length} supplier tercatat manual`
              : `platform B2B ${platform}`
          }.`,
        })
        .select()
        .single();

      if (error) {
        console.error('Gagal simpan skor ke Supabase:', error);
        setSaveError('Skor berhasil dihitung, tapi gagal tersimpan ke server. Coba lagi nanti.');
      } else {
        scoreId = inserted.id;
      }
    } else {
      setSaveError('Data profil usaha belum lengkap, skor belum bisa disimpan permanen.');
    }

    const result = { total, lenders: lenderOffers };
    setFinalScore(result);
    setIsCalculating(false);

    setResult({
      completed: true,
      scoreId,
      skorAkhir: total,
      riwayatTransaksi,
      lamaUsaha,
      stabilitasPendapatan,
      statusKelayakan,
      namaUsaha,
      namaPemilik,
      danaDiajukan: Number(profilForm.dana),
      omzetBulanan: omzetValue,
      frekuensiTransaksi: frekuensiValue,
      lenders: lenderOffers,
    });
  }

  const canGoNext =
    step === 3
      ? finalScore !== null
      : step === 1
      ? omzetMode === 'EWALLET'
        ? omzetSubStep === 2
        : omzetMode === 'MANUAL'
        ? manualConfirmed
        : false
      : step === 2
      ? (rantaiMode === 'B2B' && b2bSubStep === 2) ||
        (rantaiMode === 'UTILITAS' && skorUtilitas !== null && !showSupplierForm)
      : true;

  return (
    <div
      className="relative h-[100dvh] min-h-screen w-full max-w-[393px] mx-auto overflow-hidden bg-white flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="relative z-10 pt-10 pb-2 px-6 flex items-center gap-3">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div>
          <p className="text-[#0F1D3E] font-extrabold text-lg leading-tight">Sinkronisasi AI</p>
          <p className="text-gray-500 text-xs">
            Langkah {step + 1} dari {steps.length}
          </p>
        </div>
        <button
          onClick={onBack}
          className="ml-auto w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="relative z-10 px-6 mt-3 mb-1">
        <StepIndicator current={step} />
      </div>

      <div className="relative z-10 px-6 flex-1 overflow-y-auto mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <StepProfilDana
                namaPemilik={namaPemilik}
                namaUsaha={namaUsaha}
                form={profilForm}
                onChange={(k, v) => setProfilForm((f) => ({ ...f, [k]: v }))}
                errors={errors}
                ktpFile={ktpFile}
                ktpPreviewUrl={ktpPreviewUrl}
                ktpUploading={ktpUploading}
                ktpDone={ktpDone}
                selfieDone={selfieDone}
                selfieUrl={selfiePreviewUrl}
                selfieUploading={selfieUploading}
                onSelectKtp={handleSelectKtp}
                onCaptureSelfie={handleCaptureSelfie}
              />
            )}
            {step === 1 && (
              <StepOmzet
                mode={omzetMode}
                setMode={setOmzetMode}
                subStep={omzetSubStep}
                provider={walletProvider}
                setProvider={setWalletProvider}
                phone={walletPhone}
                setPhone={setWalletPhone}
                otp={otp}
                setOtp={setOtp}
                otpError={otpError}
                onStart={() => setOmzetSubStep(1)}
                onVerify={handleVerifyOtp}
                isVerifying={isVerifyingOmzet}
                qrisFrek={qrisFrek}
                qrisVol={qrisVol}
                manualOmzet={manualOmzet}
                setManualOmzet={setManualOmzet}
                manualFrekuensi={manualFrekuensi}
                setManualFrekuensi={setManualFrekuensi}
                manualBuktiFile={manualBuktiFile}
                manualBuktiUploading={manualBuktiUploading}
                manualBuktiDone={manualBuktiDone}
                onSelectBukti={handleSelectManualBukti}
                manualConfirmed={manualConfirmed}
                onConfirmManual={handleConfirmManual}
                manualSaving={manualSaving}
                manualError={manualError}
              />
            )}
            {step === 2 && (
              <StepRantaiPasok
                mode={rantaiMode}
                setMode={(m) => {
                  setRantaiMode(m);
                  setB2bSubStep(0);
                }}
                b2bSubStep={b2bSubStep}
                platform={platform}
                setPlatform={setPlatform}
                onLoginDistributor={() => setB2bSubStep(1)}
                onOtorisasi={handleOtorisasiB2b}
                isSyncing={isSyncingB2b}
                jumlahSupplier={jumlahSupplier}
                telatBayar={telatBayar}
                suppliers={suppliers}
                showSupplierForm={showSupplierForm}
                editingSupplier={editingSupplier}
                onAddSupplierClick={handleAddSupplierClick}
                onSaveSupplier={handleSaveSupplier}
                onCancelSupplierForm={handleCancelSupplierForm}
                onEditSupplier={handleEditSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                skorUtilitas={skorUtilitas}
                savingSupplier={savingSupplier}
              />
            )}
            {step === 3 && (
              <StepHasil
                isCalculating={isCalculating}
                onCalculate={handleCalculate}
                score={finalScore}
                lendersLoading={lendersLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {saveError && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4">
            {saveError}
          </p>
        )}
      </div>

      <div className="relative z-20 bg-white border-t border-gray-50 px-6 py-4 pb-8">
        {step < 3 ? (
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            Lanjutkan <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={onComplete}
            disabled={!finalScore}
            className="w-full bg-[#1D4ED8] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            Selesai, Lihat Skor Saya <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}