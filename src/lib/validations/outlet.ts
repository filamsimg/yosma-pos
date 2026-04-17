import { z } from 'zod';

export const outletSchema = z.object({
  name: z.string().min(3, 'Nama outlet minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter').nullable().optional(),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').nullable().optional(),
});

export type OutletFormValues = z.infer<typeof outletSchema>;
