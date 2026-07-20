import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

// Bukti nota/omzet bisa berupa foto atau file non-gambar (PDF, Excel) —
// dokumen non-gambar ditampilkan sebagai placeholder + tombol buka file.
export const isImageUrl = (url: string) =>
  /\.(jpe?g|png|gif|webp|bmp)$/i.test(url.split("?")[0]);

export function NotaGalleryDialog({
  gallery,
  onOpenChange,
}: {
  gallery: { title: string; urls: string[] } | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!gallery} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Foto Nota — {gallery?.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto p-1">
          {gallery?.urls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border overflow-hidden bg-gray-50 aspect-square"
            >
              {isImageUrl(url) ? (
                <img
                  src={url}
                  alt={`Nota ${i + 1}`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-medium text-center p-2">
                  Dokumen {i + 1}
                </div>
              )}
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
