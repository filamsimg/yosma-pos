/**
 * Normalizes type-like strings by removing abbreviations in parentheses
 * Example: "APOTEK(APT)" -> "APOTEK"
 * Example: "TEMPO SCAN (TSL)" -> "TEMPO SCAN"
 */
export function normalizeTypeName(name: string): string {
  if (!name) return '';
  
  // Regex to remove content within parentheses and any preceding whitespace
  // \s* matches zero or more whitespace characters
  // \( matches the opening parenthesis
  // .*? matches any character (lazy)
  // \) matches the closing parenthesis
  return name.replace(/\s*\([^)]*\)/g, '').trim();
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

