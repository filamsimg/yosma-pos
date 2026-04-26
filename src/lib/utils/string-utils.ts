/**
 * Normalizes type-like strings by removing abbreviations in parentheses
 * Example: "APOTEK(APT)" -> "APOTEK"
 * Example: "TEMPO SCAN (TSL)" -> "TEMPO SCAN"
 */
export function normalizeTypeName(name: string): string {
  if (!name) return '';
  
  // 1. Basic cleaning (Uppercase and remove content in parentheses)
  let cleaned = name.toUpperCase().replace(/\s*\([^)]*\)/g, '').trim();

  // 2. Alias Mapping
  const aliasMap: Record<string, string> = {
    'APT': 'APOTEK',
    'APT.': 'APOTEK',
    'APOTIK': 'APOTEK',
    'TK': 'TOKO',
    'TK.': 'TOKO',
    'RS': 'RS',
    'R.S.': 'RS',
    'RUMAH SAKIT': 'RS',
    'KLINIK': 'KLINIK',
    'PUSKESMAS': 'PUSKESMAS',
  };

  return aliasMap[cleaned] || cleaned;
}

/**
 * Normalizes phone numbers by removing prefixes like +62, 62, and leading 0
 * Example: "0812345" -> "812345"
 * Example: "+62812345" -> "812345"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove '62' prefix if it exists
  if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading '0' if it exists
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Normalizes visit days to standard Indonesian names
 */
export function normalizeVisitDay(day: string): string {
  if (!day) return '';
  const cleaned = day.trim().toLowerCase();
  
  const map: Record<string, string> = {
    'monday': 'Senin', 'senin': 'Senin',
    'tuesday': 'Selasa', 'selasa': 'Selasa',
    'wednesday': 'Rabu', 'rabu': 'Rabu',
    'thursday': 'Kamis', 'kamis': 'Kamis',
    'friday': 'Jumat', 'jumat': 'Jumat',
    'saturday': 'Sabtu', 'sabtu': 'Sabtu',
    'sunday': 'Minggu', 'minggu': 'Minggu',
  };
  
  return map[cleaned] || day;
}

/**
 * Normalizes visit frequencies to standard Indonesian labels
 */
export function normalizeVisitFrequency(freq: string): string {
  if (!freq) return 'Seminggu Sekali';
  const cleaned = freq.trim().toLowerCase();
  
  const map: Record<string, string> = {
    'weekly': 'Seminggu Sekali',
    'seminggu sekali': 'Seminggu Sekali',
    'seminggu': 'Seminggu Sekali',
    'tiap minggu': 'Seminggu Sekali',
    '2 weekly': '2 Minggu Sekali',
    '2 minggu sekali': '2 Minggu Sekali',
    '3 minggu sekali': '3 Minggu Sekali',
    'monthly': 'Sebulan Sekali',
    'sebulan sekali': 'Sebulan Sekali',
    'sebulan': 'Sebulan Sekali',
  };
  
  return map[cleaned] || freq;
}

