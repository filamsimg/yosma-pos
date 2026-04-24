// ============================================================
// Database Types - Mirrors Supabase PostgreSQL schema
// ============================================================

export type UserRole = 'ADMIN' | 'SALES';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CREDIT';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type VisitDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type VisitFrequency = 'WEEKLY' | 'BIWEEKLY';

// ----- Profiles -----
export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  nik: string | null;
  npwp: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----- Categories -----
export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// ----- Brands -----
export interface Brand {
  id: string;
  name: string;
  created_at: string;
}

// ----- Units -----
export interface Unit {
  id: string;
  name: string;
  created_at: string;
}

// ----- Products -----
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  brand_id: string | null;
  unit_id: string | null;
  discount_regular: number;
  image_url: string | null;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  brand?: Brand;
  unit?: Unit;
}

// ----- Outlets -----
export interface Outlet {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  owner_name: string | null;
  visit_day: string | null;
  visit_frequency: string | null;
  assigned_sales: string | null;
  is_active: boolean;
  status: 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | null;
  created_at: string;
  updated_at: string;
}

// ----- Outlet Types -----
export interface OutletType {
  id: string;
  name: string;
  created_at: string;
}

// ----- Transactions -----
export interface Transaction {
  id: string;
  invoice_number: string;
  sales_id: string;
  outlet_id: string;
  subtotal: number;
  discount: number;
  total_price: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  // Joined fields
  sales?: Profile;
  outlet?: Outlet;
  items?: TransactionItem[];
  payments?: TransactionPayment[];
}

// ----- Transaction Payments (Installments) -----
export interface TransactionPayment {
  id: string;
  transaction_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes: string | null;
  recorded_by: string;
  proof_url: string | null;
  created_at: string;
  // Joined fields
  recorder?: Profile;
}

// ----- Transaction Items -----
export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
  created_at: string;
  // Joined fields
  product?: Product;
}

// ----- Stock Adjustments -----
export interface StockAdjustment {
  id: string;
  product_id: string;
  adjusted_by: string;
  old_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
  // Joined fields
  product?: Product;
  adjuster?: Profile;
}

// ----- Cart (Client-side only) -----
export interface CartItem {
  product: Product;
  quantity: number;
  price_at_sale: number;
}

// ----- API Response types -----
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
