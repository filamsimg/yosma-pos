// Application-wide constants

export const APP_NAME = 'YOSMA POS';
export const APP_DESCRIPTION = 'Aplikasi POS & Sales Monitoring';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PRODUCT_PAGE_SIZE = 24;

// Image compression settings
export const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,          // Max file size in MB
  maxWidthOrHeight: 1280,   // Max dimension
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.7,
};

// Map defaults (Indonesia - Jakarta center)
export const MAP_DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
export const MAP_DEFAULT_ZOOM = 12;

// Payment methods for UI
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer Bank' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'CREDIT', label: 'Tempo' },
] as const;

// Transaction statuses for UI
export const TRANSACTION_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'COMPLETED', label: 'Selesai', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Batal', color: 'bg-red-500' },
] as const;

// Payment statuses for UI
export const PAYMENT_STATUSES = [
  { value: 'UNPAID', label: 'Belum Bayar', color: 'bg-red-500 text-white' },
  { value: 'PARTIAL', label: 'Cicil', color: 'bg-orange-500 text-white' },
  { value: 'PAID', label: 'Lunas', color: 'bg-emerald-500 text-white' },
] as const;

// Visit Schedule constants
export const VISIT_DAYS = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
] as const;

export const VISIT_FREQUENCIES = [
  { value: 'Seminggu Sekali', label: 'Seminggu Sekali' },
  { value: '2 Minggu Sekali', label: '2 Minggu Sekali' },
  { value: '3 Minggu Sekali', label: '3 Minggu Sekali' },
  { value: 'Sebulan Sekali', label: 'Sebulan Sekali' },
] as const;
