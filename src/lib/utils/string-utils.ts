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
