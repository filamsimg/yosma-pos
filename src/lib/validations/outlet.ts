import { z } from 'zod';

export const outletSchema = z.object({
  name: z.string().min(3, 'Nama outlet minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter').nullable().optional(),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').nullable().optional(),
  visit_day: z.string().nullable().optional(),
  visit_frequency: z.string().nullable().optional(),
  assigned_sales: z.string().nullable().optional(),
});

export type OutletFormValues = z.infer<typeof outletSchema>;
