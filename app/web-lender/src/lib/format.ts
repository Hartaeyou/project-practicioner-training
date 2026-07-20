// Format nominal saat diketik (mis. "5000000" -> "5.000.000") supaya user
// langsung lihat berapa uang yang mereka masukkan. State pemanggil tetap
// menyimpan digit mentah — cuma tampilan input yang diformat.
export function formatThousands(raw: string | number): string {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}
