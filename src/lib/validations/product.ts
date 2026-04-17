import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  sku: z.string().min(3, 'SKU minimal 3 karakter'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  discount_regular: z.coerce.number().min(0).max(100).default(0),
  category_id: z.string().uuid('Kategori harus dipilih'),
  brand_id: z.string().uuid('Merk harus dipilih'),
  unit_id: z.string().uuid('Satuan harus dipilih'),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().min(1, 'Jumlah minimal 1'),
  reason: z.enum(['RESTOCK', 'DAMAGE', 'CORRECTION', 'SALE']),
  notes: z.string().optional(),
});

export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;
