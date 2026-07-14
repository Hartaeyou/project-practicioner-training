// src/lib/phone.ts
// Normalisasi nomor HP Indonesia ke format E.164 (dibutuhkan Supabase phone auth)
// Contoh: "08123456789" -> "+628123456789"
//         "8123456789"  -> "+628123456789"
//         "+628123456789" -> "+628123456789" (dibiarkan)

export function toE164(rawPhone: string): string {
    const digits = rawPhone.replace(/[^\d+]/g, '');
  
    if (digits.startsWith('+62')) return digits;
    if (digits.startsWith('62')) return `+${digits}`;
    if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
    return `+62${digits}`;
  }
  
  export function isValidIndonesianPhone(rawPhone: string): boolean {
    const e164 = toE164(rawPhone);
    return /^\+62\d{8,13}$/.test(e164);
  }