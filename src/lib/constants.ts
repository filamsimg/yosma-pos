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

// ============================================================
// STATUS & LABEL MAPPINGS
// ============================================================

// 1. Transaction Status Mapping
export const TRANSACTION_STATUS_MAP = {
  PENDING: {
    label: 'Menunggu',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  PROCESSING: {
    label: 'Diproses',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-50 text-red-600 border-red-200',
  }
} as const;

// 2. Payment Status Mapping (Piutang)
export const PAYMENT_STATUS_MAP = {
  UNPAID: {
    label: 'Belum Bayar',
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  PARTIAL: {
    label: 'Cicil',
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  PAID: {
    label: 'Lunas',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  }
} as const;

// 3. Payment Methods (UI Array & Map)
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer Bank' },
  { value: 'CREDIT', label: 'Tempo (Piutang)' },
] as const;

export const PAYMENT_METHOD_MAP = {
  CASH: { label: 'Tunai' },
  TRANSFER: { label: 'Transfer Bank' },
  CREDIT: { label: 'Tempo' }
} as const;

// Legacy constants (keeping for compatibility while refactoring)
export const TRANSACTION_STATUSES = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-amber-500' },
  { value: 'PROCESSING', label: 'Diproses', color: 'bg-blue-500' },
  { value: 'COMPLETED', label: 'Selesai', color: 'bg-emerald-500' },
  { value: 'CANCELLED', label: 'Dibatalkan', color: 'bg-red-500' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'UNPAID', label: 'Belum Bayar', color: 'bg-rose-500 text-white' },
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
