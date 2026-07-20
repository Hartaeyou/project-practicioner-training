import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ArrowRight, Loader2, X, Upload, History, Search, FileText } from 'lucide-react';
import { useLenders, formatRupiah, formatThousands, isLenderEligible, Lender } from '../../lib/useLenders';
import { useAuth } from '../../lib/AuthContext';
import { useScore } from '../../lib/ScoreContext';
import { supabase } from '../../lib/supabaseClient';
import { RiwayatPengajuan } from './RiwayatPengajuan'; // FIX 3: import komponen riwayat

// FIX 4: dokumen tambahan (NPWP, Surat Izin Usaha, Rekening Koran) sekarang
// beneran bisa diupload, bukan cuma centang statis lagi.
// Disimpan sebagai satu kolom jsonb `dokumen` di tabel applications
// (key: ktp, npwp, izin_usaha, rekening_koran) — sesuai skema yang sudah ada,
// bukan kolom terpisah per dokumen.
type DocKey = 'npwp' | 'izinUsaha' | 'rekeningKoran';

type DocState = {
  file: File | null;
  uploading: boolean;
  url: string | null;
  error: string;
};

const DOC_LABELS: Record<DocKey, string> = {
  npwp: 'NPWP',
  izinUsaha: 'Surat Izin Usaha',
  rekeningKoran: 'Rekening Koran 3 Bulan Terakhir',
};

// Map key internal komponen -> key yang dipakai di kolom jsonb `dokumen`
const DOC_JSON_KEYS: Record<DocKey, string> = {
  npwp: 'npwp',
  izinUsaha: 'izin_usaha',
  rekeningKoran: 'rekening_koran',
};

const EMPTY_DOC_STATE: DocState = { file: null, uploading: false, url: null, error: '' };

function DocumentUploadTile({
  label,
  state,
  onSelect,
}: {
  label: string;
  state: DocState;
  onSelect: (file: File) => void;
}) {
  const inputId = `doc-upload-${label.replace(/\s+/g, '-')}`;
  const done = !!state.url && !state.uploading;
  return (
    <div>
      <label
        htmlFor={inputId}
        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
          done
            ? 'border-[#10B981] bg-green-50'
            : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {state.uploading ? (
            <Loader2 className="w-5 h-5 text-[#1D4ED8] animate-spin shrink-0" />
          ) : done ? (
            <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-gray-400 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-sm text-gray-900 block truncate">{label}</span>
            <span className="text-xs text-gray-500 truncate block">
              {state.uploading
                ? 'Mengunggah...'
                : done
                ? state.file?.name ?? 'Berhasil diunggah'
                : 'Ketuk untuk unggah (JPG/PNG/PDF)'}
            </span>
          </div>
        </div>
        {done && (
          <a
            href={state.url!}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#1D4ED8] underline shrink-0 ml-2"
          >
            Lihat
          </a>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
          }}
        />
      </label>
      {state.error && <p className="text-red-500 text-xs mt-1 pl-1">{state.error}</p>}
    </div>
  );
}

// FIX 5: props ini dioper dari App.tsx (lihat handleNavigateToPendana &
// handleNavigateToRiwayat) supaya tombol-tombol di Beranda.tsx bisa langsung
// buka tab/lender yang tepat begitu Pendana ini di-mount.
type PendanaProps = {
  initialTab?: 'cari' | 'riwayat';
  initialLenderId?: string;
  navKey?: number; // berubah tiap kali ada event navigasi baru, walau targetnya sama
};

export function Pendana({ initialTab, initialLenderId, navKey }: PendanaProps) {
  const { lenders, loading: lendersLoading } = useLenders();
  const { umkmProfile, profile } = useAuth();
  const { result, isHydrating } = useScore();

  // FIX 3: tab switch antara "Cari Pendana" dan "Riwayat Pengajuan"
  const [activeTab, setActiveTab] = useState<'cari' | 'riwayat'>('cari');

  const [activeFilter, setActiveFilter] = useState<'semua' | 'bank' | 'fintech' | 'koperasi'>('semua');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Lender | null>(null);
  const [applicationStep, setApplicationStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // FIX 2: nominal yang mau diajukan sekarang bisa diedit user
  const [nominalInput, setNominalInput] = useState('');

  // FIX 4: state upload untuk NPWP, Surat Izin Usaha, Rekening Koran
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({
    npwp: { ...EMPTY_DOC_STATE },
    izinUsaha: { ...EMPTY_DOC_STATE },
    rekeningKoran: { ...EMPTY_DOC_STATE },
  });

  // Pengajuan aktif (belum disetujui/ditolak) milik UMKM ini — kalau ada,
  // UMKM tidak boleh mengajukan pinjaman baru ke lender manapun sampai
  // pengajuan ini mendapat keputusan. "Aktif" dites dengan BUKAN
  // disetujui/ditolak, bukan mencocokkan string "menunggu" — nilai default
  // kolom status yang sebenarnya tersimpan di DB tidak konsisten dipakai di
  // seluruh codebase ini (ada indikasi 'diajukan' juga dipakai sebagai
  // default), jadi tes negatif ini lebih aman daripada tebak salah satu.
  const [pending, setPending] = useState<{ id: string; lenderId: string } | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    if (!umkmProfile) return;
    let active = true;
    const checkPending = async () => {
      setPendingLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('id, lender_id, status, created_at')
        .eq('umkm_id', umkmProfile.id)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        console.error('Gagal cek status pengajuan aktif:', error);
        setPendingLoading(false);
        return;
      }
      const found = (data ?? []).find((a) => a.status !== 'disetujui' && a.status !== 'ditolak');
      setPending(found ? { id: found.id, lenderId: found.lender_id } : null);
      setPendingLoading(false);
    };
    checkPending();
    return () => {
      active = false;
    };
  }, [umkmProfile]);

  const handleSelectDoc = async (key: DocKey, file: File) => {
    if (!umkmProfile) {
      setDocs((d) => ({ ...d, [key]: { ...d[key], error: 'Profil usaha belum lengkap.' } }));
      return;
    }
    setDocs((d) => ({ ...d, [key]: { file, uploading: true, url: null, error: '' } }));

    const jsonKey = DOC_JSON_KEYS[key];
    // FIX 4: pakai bucket & pola path yang sama dengan yang sudah dipakai di
    // production kamu: dokumen-pengajuan/{umkm_id}/{timestamp}-{jsonKey}-{filename}
    const path = `${umkmProfile.id}/${Date.now()}-${jsonKey}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('dokumen-pengajuan')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setDocs((d) => ({
        ...d,
        [key]: { file, uploading: false, url: null, error: 'Gagal upload: ' + upErr.message },
      }));
      return;
    }

    const { data: urlData } = supabase.storage.from('dokumen-pengajuan').getPublicUrl(path);
    setDocs((d) => ({
      ...d,
      [key]: { file, uploading: false, url: urlData.publicUrl, error: '' },
    }));
  };

  const allDocsUploaded = (['npwp', 'izinUsaha', 'rekeningKoran'] as DocKey[]).every(
    (k) => !!docs[k].url,
  );

  // FIX 1: ktpFromSinkronisasi sebelumnya dipakai tapi tidak pernah didefinisikan
  // -> menyebabkan ReferenceError & blank screen saat masuk ke step 2.
  // Ambil dari umkmProfile yang sudah diisi lewat OnboardingWizard (ktp_url).
  const ktpFromSinkronisasi = (umkmProfile as any)?.ktp_url ?? null;

  // Cuma tampilkan lender yang ambang skor FinTrust-nya dipenuhi skor UMKM
  // saat ini. Kalau belum pernah Sinkronisasi AI, result.completed masih
  // false dan result.skorAkhir cuma placeholder — jangan dipakai buat filter,
  // makanya daftar dikosongkan dan diganti ajakan sinkronisasi di render.
  const eligibleProviders = result.completed
    ? lenders.filter((p) => isLenderEligible(p, result.skorAkhir))
    : [];
  const filteredProviders =
    activeFilter === 'semua' ? eligibleProviders : eligibleProviders.filter((p) => p.tipe === activeFilter);

  const handleApplyClick = (provider: Lender) => {
    // Gerbang tunggal: menutup baik klik tombol "Ajukan Sekarang" langsung
    // maupun jalur deep-link dari Beranda.tsx (initialLenderId effect di
    // bawah memanggil fungsi ini langsung, tanpa lewat tombol).
    if (pending) return;
    setSelectedProvider(provider);
    setApplicationStep(1);
    setSubmitError('');
    // FIX 2: default nominal dari hasil Sinkronisasi AI, fallback ke limit lender,
    // tapi tetap bisa diubah user di step 1.
    const defaultNominal = result.danaDiajukan > 0 ? result.danaDiajukan : provider.limit_plafon;
    setNominalInput(String(defaultNominal));
    setDocs({
      npwp: { ...EMPTY_DOC_STATE },
      izinUsaha: { ...EMPTY_DOC_STATE },
      rekeningKoran: { ...EMPTY_DOC_STATE },
    });
    setShowApplicationModal(true);
  };

  // FIX 5: kalau App.tsx ngirim initialTab (mis. dari tombol "Riwayat" di
  // Beranda), langsung aktifkan tab itu. `navKey` di dependency supaya efek
  // ini tetap jalan walau user klik target yang sama berkali-kali.
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, navKey]);

  // FIX 5: kalau App.tsx ngirim initialLenderId (dari tombol "Ajukan" di
  // kartu Rekomendasi Pendana), otomatis buka modal pengajuan untuk lender
  // itu begitu daftar lender selesai dimuat.
  useEffect(() => {
    if (!initialLenderId || lendersLoading) return;
    const lender = lenders.find((l) => l.id === initialLenderId);
    if (lender) {
      setActiveTab('cari');
      handleApplyClick(lender);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLenderId, navKey, lendersLoading, lenders]);

  const parsedNominal = Number(nominalInput.replace(/[^\d]/g, '')) || 0;

  const handleNextStep = async () => {
    if (applicationStep === 2 && !allDocsUploaded) {
      setSubmitError('Unggah semua dokumen (NPWP, Surat Izin Usaha, Rekening Koran) terlebih dahulu.');
      return;
    }
    if (applicationStep < 3) {
      setSubmitError('');
      setApplicationStep(applicationStep + 1);
      return;
    }

    // Step 3 -> kirim pengajuan beneran ke Supabase, baru lanjut ke step 4 (sukses)
    setIsProcessing(true);
    setSubmitError('');

    if (!umkmProfile || !selectedProvider) {
      setIsProcessing(false);
      setSubmitError('Profil usaha belum lengkap. Selesaikan Sinkronisasi AI dulu di tab Profil.');
      return;
    }

    // Defense-in-depth: modal ini bisa saja sudah terbuka dari sebelum
    // pengajuan lain berubah status (tab lain, dsb) — cek ulang di sini,
    // jangan cuma andalkan gerbang di handleApplyClick.
    if (pending) {
      setIsProcessing(false);
      setSubmitError('Anda masih memiliki pengajuan yang menunggu keputusan. Selesaikan itu dulu sebelum mengajukan lagi.');
      return;
    }

    if (parsedNominal <= 0) {
      setIsProcessing(false);
      setSubmitError('Nominal yang diajukan harus diisi.');
      return;
    }

    const { data: inserted, error } = await supabase
      .from('applications')
      .insert({
        umkm_id: umkmProfile.id,
        lender_id: selectedProvider.id,
        score_id: result.scoreId,
        // FIX 2: pakai nominal yang diinput user, bukan otomatis lagi
        nominal_diajukan: parsedNominal,
        // FIX 4: simpan semua dokumen sebagai satu kolom jsonb `dokumen`,
        // sesuai skema yang sudah ada di tabel applications kamu.
        dokumen: {
          ktp: ktpFromSinkronisasi,
          npwp: docs.npwp.url,
          izin_usaha: docs.izinUsaha.url,
          rekening_koran: docs.rekeningKoran.url,
        },
      })
      .select('id')
      .single();

    setIsProcessing(false);

    if (error) {
      console.error('Gagal kirim pengajuan:', error);
      setSubmitError('Pengajuan gagal terkirim: ' + error.message);
      return;
    }

    // Optimistic: langsung tandai ada pengajuan aktif tanpa nunggu fetch
    // ulang, supaya begitu balik ke tab "cari" gerbangnya sudah aktif.
    if (inserted) {
      setPending({ id: inserted.id, lenderId: selectedProvider.id });
    }

    setApplicationStep(4);
  };

  const handleCloseModal = () => {
    setShowApplicationModal(false);
    setApplicationStep(1);
    setSelectedProvider(null);
    setIsProcessing(false);
    setSubmitError('');
    setNominalInput('');
    setDocs({
      npwp: { ...EMPTY_DOC_STATE },
      izinUsaha: { ...EMPTY_DOC_STATE },
      rekeningKoran: { ...EMPTY_DOC_STATE },
    });
  };

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header with safe area */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-2xl text-gray-900 mb-4">Mitra Pendana</h1>

        {/* FIX 3: Tab switcher Cari Pendana / Riwayat */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setActiveTab('cari')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'cari' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-gray-500'
            }`}
          >
            <Search className="w-4 h-4" />
            Cari Pendana
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'riwayat' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-gray-500'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat
          </button>
        </div>

        {/* Dynamic Filters — hanya relevan di tab "Cari Pendana" */}
        {activeTab === 'cari' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'bank', label: 'Bank' },
              { id: 'fintech', label: 'Fintech' },
              { id: 'koperasi', label: 'Koperasi' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FIX 3: render riwayat kalau tab aktif = riwayat */}
      {activeTab === 'riwayat' ? (
        <RiwayatPengajuan />
      ) : (
        <>
          {/* Loan Cards */}
          <div className="px-6 pt-6 space-y-4">
            {lendersLoading || isHydrating || pendingLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#1D4ED8] animate-spin" />
              </div>
            ) : pending ? (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-[#0F1D3E] mb-1">
                  Pengajuan Masih Diproses
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Anda memiliki pengajuan yang masih menunggu keputusan
                  {(() => {
                    const lenderName = lenders.find((l) => l.id === pending.lenderId)?.nama;
                    return lenderName ? ` di ${lenderName}` : '';
                  })()}
                  . Pengajuan baru bisa dilakukan setelah pengajuan itu disetujui atau ditolak.
                </p>
                <button
                  onClick={() => setActiveTab('riwayat')}
                  className="text-xs text-[#1D4ED8] font-semibold underline"
                >
                  Lihat Riwayat Pengajuan
                </button>
              </div>
            ) : !result.completed ? (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-[#0F1D3E] mb-1">
                  Selesaikan Sinkronisasi AI Dulu
                </p>
                <p className="text-xs text-gray-500">
                  Daftar pendana yang sesuai dengan skor FinTrust Anda baru bisa ditampilkan
                  setelah Sinkronisasi AI selesai.
                </p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-[#0F1D3E] mb-1">
                  Belum Ada Pendana yang Sesuai
                </p>
                <p className="text-xs text-gray-500">
                  Skor FinTrust Anda saat ini belum memenuhi ambang minimum pendana yang
                  tersedia{activeFilter !== 'semua' ? ' untuk kategori ini' : ''}.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {filteredProviders.map((provider, index) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <span className="text-4xl">{provider.logo}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{provider.nama}</h3>
                          <span className="inline-block px-2 py-1 bg-blue-50 text-[#1D4ED8] text-xs rounded-full">
                            {provider.tipe === 'bank' && 'Bank'}
                            {provider.tipe === 'fintech' && 'Fintech'}
                            {provider.tipe === 'koperasi' && 'Koperasi'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Limit</p>
                          <p className="font-semibold text-gray-900">{formatRupiah(provider.limit_plafon)}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Bunga</p>
                          <p className="font-semibold text-gray-900">{provider.bunga_rate}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyClick(provider)}
                        className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors flex items-center justify-center gap-2"
                      >
                        Ajukan Sekarang
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* Application Bottom Sheet Modal */}
      <AnimatePresence>
        {showApplicationModal && selectedProvider && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-[393px] mx-auto bg-white rounded-t-3xl z-50 overflow-hidden"
              style={{ height: '70vh' }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          step <= applicationStep ? 'bg-[#1D4ED8]' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Langkah {applicationStep} dari 4
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto" style={{ height: 'calc(70vh - 120px)' }}>
                {applicationStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Pinjaman</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Pemberi Pinjaman</p>
                        <p className="font-semibold text-gray-900">{selectedProvider.nama}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Limit Maksimal</p>
                        <p className="font-semibold text-gray-900">{formatRupiah(selectedProvider.limit_plafon)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Suku Bunga</p>
                        <p className="font-semibold text-gray-900">{selectedProvider.bunga_rate}</p>
                      </div>

                      {/* FIX 2: input nominal yang bisa diedit user, bukan cuma teks statis */}
                      <div className="bg-blue-50 rounded-xl p-4">
                        <label className="text-sm text-blue-700 mb-1 block">
                          Nominal yang Diajukan (Rp)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatThousands(nominalInput)}
                          onChange={(e) => setNominalInput(e.target.value.replace(/[^\d]/g, ''))}
                          placeholder="cth. 5.000.000"
                          className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold text-blue-900 outline-none focus:border-[#1D4ED8]"
                        />
                        {parsedNominal > selectedProvider.limit_plafon && (
                          <p className="text-xs text-red-600 mt-1">
                            Nominal melebihi limit maksimal {formatRupiah(selectedProvider.limit_plafon)}.
                          </p>
                        )}
                        {result.danaDiajukan > 0 && (
                          <p className="text-xs text-blue-700/70 mt-1">
                            Rekomendasi dari Sinkronisasi AI: {formatRupiah(result.danaDiajukan)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {applicationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Verifikasi Dokumen</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      KTP sudah terverifikasi otomatis dari Sinkronisasi AI.
                    </p>

                    {/* KTP — otomatis dari Sinkronisasi AI */}
                    <div className="mb-3">
                      {ktpFromSinkronisasi ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#10B981] bg-green-50">
                          <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">KTP Pemilik Usaha</p>
                            <p className="text-xs text-[#10B981]">Terverifikasi dari Sinkronisasi AI ✓</p>
                          </div>
                          <a
                            href={ktpFromSinkronisasi}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1D4ED8] underline shrink-0"
                          >
                            Lihat
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-amber-300 bg-amber-50">
                          <Upload className="w-5 h-5 text-amber-500 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">KTP Pemilik Usaha</p>
                            <p className="text-xs text-amber-700">
                              Belum ada — selesaikan Sinkronisasi AI di tab Profil dulu
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* FIX 4: Dokumen tambahan — upload sungguhan, bukan centang statis */}
                    <div className="space-y-3">
                      {(['npwp', 'izinUsaha', 'rekeningKoran'] as DocKey[]).map((key) => (
                        <DocumentUploadTile
                          key={key}
                          label={DOC_LABELS[key]}
                          state={docs[key]}
                          onSelect={(file) => handleSelectDoc(key, file)}
                        />
                      ))}
                    </div>
                    {submitError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mt-4">
                        {submitError}
                      </p>
                    )}
                  </motion.div>
                )}

                {applicationStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Review AI</h3>
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-12 h-12 text-[#1D4ED8] animate-spin mb-4" />
                        <p className="text-gray-600">Mengirim pengajuan...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-[#10B981] mt-1" />
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">
                                Kelayakan: {result.statusKelayakan === 'Tinggi' ? 'Tinggi' : 'Perlu Verifikasi'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Skor FinTrust Anda: {result.skorAkhir}/100
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-1">Nominal yang Diajukan</p>
                          <p className="font-semibold text-gray-900">{formatRupiah(parsedNominal)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-1">Estimasi Persetujuan</p>
                          <p className="font-semibold text-gray-900">2-3 Hari Kerja</p>
                        </div>
                        {submitError && (
                          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                            {submitError}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {applicationStep === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
                    >
                      <CheckCircle className="w-12 h-12 text-[#10B981]" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Pengajuan Berhasil!</h3>
                    <p className="text-gray-600 text-center mb-6">
                      Pengajuan Anda telah dikirim ke {selectedProvider.nama}
                    </p>
                    <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-900 text-center">
                        Kami akan mengirimkan notifikasi setelah pengajuan Anda diproses
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer Button */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                {applicationStep < 4 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={
                      isProcessing ||
                      (applicationStep === 1 && parsedNominal <= 0) ||
                      (applicationStep === 2 && !allDocsUploaded)
                    }
                    className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Lanjutkan
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors"
                  >
                    Selesai
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}