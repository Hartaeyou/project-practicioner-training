import { FieldInput } from './Onboardingshared';
import { KtpUploadTile, SelfieCapture } from './Onboardingkyc';
import { ProfilForm } from './Onboardingtypes';
import { formatThousands } from '../../../lib/useLenders';

// ============================================================
// STEP 1 — Profil & Dana
// (Nama Pemilik & Nama Usaha sekarang read-only, diambil dari akun)
// ============================================================
export function StepProfilDana({
  namaPemilik,
  namaUsaha,
  form,
  onChange,
  errors,
  ktpFile,
  ktpPreviewUrl,
  ktpUploading,
  ktpDone,
  selfieDone,
  selfieUrl,
  selfieUploading,
  onSelectKtp,
  onCaptureSelfie,
}: {
  namaPemilik: string;
  namaUsaha: string;
  form: ProfilForm;
  onChange: (k: keyof ProfilForm, v: string) => void;
  errors: Record<string, string>;
  ktpFile: File | null;
  ktpPreviewUrl: string | null;
  ktpUploading: boolean;
  ktpDone: boolean;
  selfieDone: boolean;
  selfieUrl: string | null;
  selfieUploading: boolean;
  onSelectKtp: (f: File) => void;
  onCaptureSelfie: (blob: Blob) => void;
}) {
  return (
    <div className="space-y-5 pb-2">
      <div>
        <p className="text-[#0F1D3E] font-bold text-sm mb-3">1. Data Diri & Usaha</p>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama Pemilik</span>
            <span className="text-[#0F1D3E] font-semibold">{namaPemilik || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama Usaha</span>
            <span className="text-[#0F1D3E] font-semibold">{namaUsaha || '-'}</span>
          </div>
          <p className="text-[10px] text-blue-700/70 pt-1">
            Data dari akun Anda. Ubah lewat halaman Profil kalau ada yang salah.
          </p>
        </div>
      </div>

      <div>
        <p className="text-[#0F1D3E] font-bold text-sm mb-3">2. eKYC (Verifikasi Identitas)</p>
        <div className="space-y-3">
          <KtpUploadTile
            file={ktpFile}
            previewUrl={ktpPreviewUrl}
            uploading={ktpUploading}
            done={ktpDone}
            onSelect={onSelectKtp}
          />
          <SelfieCapture
            selfieUrl={selfieUrl}
            uploading={selfieUploading}
            done={selfieDone}
            onCapture={onCaptureSelfie}
          />
        </div>
        {errors.ekyc && <p className="text-red-500 text-xs mt-1 pl-1">{errors.ekyc}</p>}
      </div>

      <div>
        <p className="text-[#0F1D3E] font-bold text-sm mb-3">3. Rincian Pengajuan</p>
        <div className="space-y-4">
          <FieldInput
            label="Nominal Dana yang Dibutuhkan (Rp)"
            icon={<span className="text-gray-400 text-sm shrink-0">Rp</span>}
            value={formatThousands(form.dana)}
            onChange={(v) => onChange('dana', v.replace(/[^\d]/g, ''))}
            placeholder="500.000"
            type="text"
            error={errors.dana}
          />
          <div>
            <label className="text-[#0F1D3E] font-semibold text-sm mb-2 block">
              Tujuan Penggunaan Dana
            </label>
            <div
              className={`bg-gray-50 rounded-2xl border-2 transition-colors ${
                errors.tujuanDana ? 'border-red-400' : 'border-transparent focus-within:border-[#1D4ED8]'
              }`}
            >
              <textarea
                value={form.tujuanDana}
                onChange={(e) => onChange('tujuanDana', e.target.value)}
                placeholder="Misal: Menambah stok sembako menjelang lebaran..."
                rows={3}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
              />
            </div>
            {errors.tujuanDana && <p className="text-red-500 text-xs mt-1 pl-1">{errors.tujuanDana}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}