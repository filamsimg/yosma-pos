import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  role: z.enum(['ADMIN', 'SALES']),
  sales_code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  is_active: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
