import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ArrowRight, Loader2, X, Upload, FileCheck2 } from 'lucide-react';
import { useLenders, formatRupiah, Lender } from '../../lib/useLenders';
import { useAuth } from '../../lib/AuthContext';
import { useScore } from '../../lib/ScoreContext';
import { supabase } from '../../lib/supabaseClient';
import { RiwayatPengajuan } from './RiwayatPengajuan';

// Dokumen yang wajib diunggah sebelum pengajuan bisa dikirim.
// key dipakai sebagai nama field di object `dokumen` (jsonb) pada tabel `applications`.
const REQUIRED_DOCS: { key: string; label: string }[] = [
  { key: 'ktp', label: 'KTP Pemilik Usaha' },
  { key: 'npwp', label: 'NPWP' },
  { key: 'izin_usaha', label: 'Surat Izin Usaha' },
  { key: 'rekening_koran', label: 'Rekening Koran 3 Bulan Terakhir' },
];

function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function DocumentUploadTile({
  label,
  file,
  onSelect,
}: {
  label: string;
  file: File | null;
  onSelect: (file: File) => void;
}) {
  const inputId = `doc-${label.replace(/\s+/g, '-')}`;
  return (
    <label
      htmlFor={inputId}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
        file ? 'border-[#10B981] bg-green-50' : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {file ? (
        <FileCheck2 className="w-5 h-5 text-[#10B981] shrink-0" />
      ) : (
        <Upload className="w-5 h-5 text-gray-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500 truncate">
          {file ? file.name : 'Ketuk untuk unggah (PDF/JPG/PNG)'}
        </p>
      </div>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
    </label>
  );
}

export function Pendana() {
  const { lenders, loading: lendersLoading } = useLenders();
  const { umkmProfile } = useAuth();
  const { result } = useScore();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'riwayat'>('marketplace');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'bank' | 'fintech' | 'koperasi'>('semua');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Lender | null>(null);
  const [applicationStep, setApplicationStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Nominal yang diajukan diinput manual user saat memilih pendana ini,
  // bukan lagi otomatis diambil dari hasil Sinkronisasi AI di Profil.
  const [nominalInput, setNominalInput] = useState('');
  const [nominalError, setNominalError] = useState('');

  // Dokumen verifikasi — wajib diunggah sebelum lanjut ke step Review AI.
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [docError, setDocError] = useState('');

  const filteredProviders =
    activeFilter === 'semua' ? lenders : lenders.filter((p) => p.tipe === activeFilter);

  const handleApplyClick = (provider: Lender) => {
    setSelectedProvider(provider);
    setApplicationStep(1);
    setSubmitError('');
    setDocError('');
    setDocFiles({});
    // Prefill dari hasil Sinkronisasi AI kalau ada, tapi tetap bisa diubah user
    setNominalInput(result.danaDiajukan > 0 ? String(result.danaDiajukan) : '');
    setNominalError('');
    setShowApplicationModal(true);
  };

  function validateNominal(): boolean {
    if (!selectedProvider) return false;
    const value = parseRupiahInput(nominalInput);
    if (value <= 0) {
      setNominalError('Masukkan nominal yang ingin diajukan');
      return false;
    }
    if (value > selectedProvider.limit_plafon) {
      setNominalError(`Melebihi limit maksimal ${formatRupiah(selectedProvider.limit_plafon)}`);
      return false;
    }
    setNominalError('');
    return true;
  }

  function validateDocuments(): boolean {
    const missing = REQUIRED_DOCS.filter((d) => !docFiles[d.key]);
    if (missing.length > 0) {
      setDocError(`Lengkapi dokumen: ${missing.map((d) => d.label).join(', ')}`);
      return false;
    }
    setDocError('');
    return true;
  }

  const handleNextStep = async () => {
    if (applicationStep === 1) {
      if (!validateNominal()) return;
      setApplicationStep(2);
      return;
    }

    if (applicationStep === 2) {
      if (!validateDocuments()) return;
      setApplicationStep(3);
      return;
    }

    // Step 3 -> unggah dokumen + kirim pengajuan beneran ke Supabase, baru lanjut ke step 4 (sukses)
    setIsProcessing(true);
    setSubmitError('');

    if (!umkmProfile || !selectedProvider) {
      setIsProcessing(false);
      setSubmitError('Profil usaha belum lengkap. Selesaikan Sinkronisasi AI dulu di tab Profil.');
      return;
    }

    // 1. Unggah semua dokumen ke Supabase Storage (bucket: dokumen-pengajuan)
    const dokumenUrls: Record<string, string> = {};
    for (const doc of REQUIRED_DOCS) {
      const file = docFiles[doc.key];
      if (!file) continue;

      const path = `${umkmProfile.id}/${Date.now()}-${doc.key}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('dokumen-pengajuan')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setIsProcessing(false);
        setSubmitError('Gagal mengunggah dokumen: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('dokumen-pengajuan').getPublicUrl(path);
      dokumenUrls[doc.key] = publicUrlData.publicUrl;
    }

    // 2. Insert pengajuan
    const { error } = await supabase.from('applications').insert({
      umkm_id: umkmProfile.id,
      lender_id: selectedProvider.id,
      score_id: result.scoreId,
      nominal_diajukan: parseRupiahInput(nominalInput),
      dokumen: dokumenUrls,
      status: 'diajukan',
    });

    setIsProcessing(false);

    if (error) {
      console.error('Gagal kirim pengajuan:', error);
      setSubmitError('Pengajuan gagal terkirim: ' + error.message);
      return;
    }

    setApplicationStep(4);
  };

  const handleCloseModal = () => {
    setShowApplicationModal(false);
    setApplicationStep(1);
    setSelectedProvider(null);
    setIsProcessing(false);
    setSubmitError('');
    setDocFiles({});
    setDocError('');
    setNominalInput('');
    setNominalError('');
  };

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header with safe area */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-2xl text-gray-900 mb-4">Mitra Pendana</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {[
            { id: 'marketplace', label: 'Cari Pendana' },
            { id: 'riwayat', label: 'Riwayat Pengajuan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'marketplace' | 'riwayat')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Filters - marketplace only */}
        {activeTab === 'marketplace' && (
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

      {activeTab === 'riwayat' ? (
        <RiwayatPengajuan />
      ) : (
        /* Loan Cards */
        <div className="px-6 pt-6 space-y-4">
          {lendersLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#1D4ED8] animate-spin" />
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
              style={{ height: '75vh' }}
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
              <div className="p-6 overflow-y-auto" style={{ height: 'calc(75vh - 160px)' }}>
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

                      {/* Input nominal - diisi manual user di sini, bukan otomatis dari Profil */}
                      <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Nominal yang Diajukan
                        </label>
                        <div
                          className={`flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3.5 border-2 transition-colors ${
                            nominalError ? 'border-red-400' : 'border-transparent focus-within:border-[#1D4ED8]'
                          }`}
                        >
                          <span className="text-gray-400 text-sm shrink-0">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={nominalInput ? Number(nominalInput).toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                              setNominalInput(String(parseRupiahInput(e.target.value)));
                              setNominalError('');
                            }}
                            placeholder="0"
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                          />
                        </div>
                        {nominalError ? (
                          <p className="text-red-500 text-xs mt-1 pl-1">{nominalError}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1 pl-1">
                            Maksimal {formatRupiah(selectedProvider.limit_plafon)}
                          </p>
                        )}
                      </div>

                      {result.danaDiajukan > 0 && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3">
                          Nominal awal terisi otomatis dari hasil Sinkronisasi AI terakhir Anda — silakan ubah sesuai kebutuhan.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {applicationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Verifikasi Dokumen</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Unggah dokumen berikut untuk melanjutkan pengajuan.
                    </p>
                    <div className="space-y-3">
                      {REQUIRED_DOCS.map((doc) => (
                        <DocumentUploadTile
                          key={doc.key}
                          label={doc.label}
                          file={docFiles[doc.key] ?? null}
                          onSelect={(file) =>
                            setDocFiles((prev) => {
                              setDocError('');
                              return { ...prev, [doc.key]: file };
                            })
                          }
                        />
                      ))}
                    </div>
                    {docError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mt-4">
                        {docError}
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
                        <p className="text-gray-600">Mengunggah dokumen & mengirim pengajuan...</p>
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
                          <p className="text-sm text-gray-600 mb-1">Nominal Diajukan</p>
                          <p className="font-semibold text-gray-900">
                            {formatRupiah(parseRupiahInput(nominalInput))}
                          </p>
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
                        Cek status pengajuan Anda kapan saja di tab "Riwayat Pengajuan"
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
                    disabled={isProcessing}
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
                    onClick={() => {
                      handleCloseModal();
                      setActiveTab('riwayat');
                    }}
                    className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors"
                  >
                    Lihat Riwayat Pengajuan
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