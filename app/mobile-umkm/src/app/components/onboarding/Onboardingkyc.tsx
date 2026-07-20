import { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle2, Loader2, FileImage, Camera, RefreshCw } from 'lucide-react';

// ============================================================
// UPLOAD KTP — file input real, upload ke bucket identitas-umkm
// ============================================================
export function KtpUploadTile({
  file,
  previewUrl,
  uploading,
  done,
  onSelect,
}: {
  file: File | null;
  previewUrl: string | null;
  uploading: boolean;
  done: boolean;
  onSelect: (f: File) => void;
}) {
  const inputId = 'ktp-upload-input';
  return (
    <label
      htmlFor={inputId}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors text-left ${
        done
          ? 'border-[#10B981] bg-green-50'
          : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {uploading ? (
        <Loader2 size={20} className="text-[#1D4ED8] animate-spin shrink-0" />
      ) : done ? (
        <CheckCircle2 size={20} className="text-[#10B981] shrink-0" />
      ) : (
        <FileImage size={20} className="text-gray-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Foto KTP</p>
        <p className="text-xs text-gray-500 truncate">
          {uploading
            ? 'Mengunggah...'
            : done
            ? file?.name ?? 'Berhasil diunggah'
            : 'Ketuk untuk pilih foto KTP (JPG/PNG/PDF)'}
        </p>
      </div>
      {previewUrl && (
        <img src={previewUrl} alt="preview ktp" className="w-12 h-8 object-cover rounded-lg shrink-0" />
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
  );
}

// ============================================================
// SELFIE CAMERA — buka kamera depan, ambil foto, upload ke bucket
// ============================================================
export function SelfieCapture({
  selfieUrl,
  uploading,
  done,
  onCapture,
}: {
  selfieUrl: string | null;
  uploading: boolean;
  done: boolean;
  onCapture: (blob: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [camError, setCamError] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setMode('camera');
    } catch (err) {
      console.error('Camera error:', err);
      setCamError('Kamera tidak bisa diakses. Izinkan akses kamera di browser Anda.');
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera' && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play().catch((e) => console.error('Video play error:', e));
    }
  }, [mode]);

  const takePicture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2) {
      console.warn('Video belum ready, readyState:', video.readyState);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
        setMode('preview');
        onCapture(blob);
      },
      'image/jpeg',
      0.85,
    );
  }, [stopCamera, onCapture]);

  const retake = useCallback(() => {
    setCapturedUrl(null);
    setMode('idle');
  }, []);

  if (done && selfieUrl) {
    return (
      <div className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-[#10B981] bg-green-50">
        <img
          src={selfieUrl}
          alt="selfie"
          className="w-12 h-12 object-cover rounded-full shrink-0 border-2 border-[#10B981]"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Selfie Liveness</p>
          <p className="text-xs text-[#10B981]">Berhasil diunggah ✓</p>
        </div>
        <button
          onClick={retake}
          className="text-xs text-gray-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw size={12} /> Ulang
        </button>
      </div>
    );
  }

  if (mode === 'camera') {
    return (
      <div className="w-full rounded-2xl overflow-hidden border-2 border-[#1D4ED8] bg-black">
        <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex items-center justify-center gap-4 py-3 bg-black">
          <button
            onClick={() => {
              stopCamera();
              setMode('idle');
            }}
            className="text-white/70 text-xs px-4 py-2 rounded-xl hover:bg-white/10"
          >
            Batal
          </button>
          <button
            onClick={takePicture}
            className="w-14 h-14 rounded-full border-4 border-white bg-[#1D4ED8] flex items-center justify-center active:scale-90 transition-transform"
          >
            <Camera size={24} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'preview') {
    return (
      <div className="w-full rounded-2xl overflow-hidden border-2 border-gray-200">
        {capturedUrl && (
          <img src={capturedUrl} alt="selfie preview" className="w-full aspect-video object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex items-center justify-center gap-3 py-3 bg-gray-50">
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-[#1D4ED8]">
              <Loader2 size={16} className="animate-spin" /> Mengunggah selfie...
            </div>
          ) : (
            <button
              onClick={retake}
              className="text-sm text-gray-500 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-100"
            >
              <RefreshCw size={14} /> Ambil Ulang
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={startCamera}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <Camera size={20} className="text-gray-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Selfie Liveness</p>
          <p className="text-xs text-gray-500">Ketuk untuk buka kamera selfie</p>
        </div>
      </button>
      {camError && <p className="text-xs text-red-500 pl-1">{camError}</p>}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}