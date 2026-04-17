'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { outletSchema, type OutletFormValues } from '@/lib/validations/outlet';
import { Loader2, Store, MapPin, Phone } from 'lucide-react';
import type { Outlet } from '@/types';

interface OutletFormProps {
  initialData?: Outlet | null;
  onSubmit: (values: OutletFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OutletForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: OutletFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6">
        {/* Nama Outlet */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-blue-500" />
            Nama Outlet *
          </Label>
          <Input
            {...register('name')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4 font-medium"
            placeholder="Masukkan nama outlet..."
          />
          {errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>}
        </div>

        {/* Alamat */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            Alamat Lengkap
          </Label>
          <Input
            {...register('address')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4"
            placeholder="Masukkan alamat cabang..."
          />
          {errors.address && <p className="text-xs text-red-600 mt-1 font-medium">{errors.address.message}</p>}
        </div>

        {/* Telepon */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-blue-500" />
            No. Telepon
          </Label>
          <Input
            {...register('phone')}
            onFocus={(e) => e.target.select()}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4 font-sans"
            placeholder="Contoh: 081234567890"
          />
          {errors.phone && <p className="text-xs text-red-600 mt-1 font-medium">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 font-medium"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 font-semibold shadow-md shadow-blue-100 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {initialData ? 'Update Outlet' : 'Simpan Outlet'}
        </Button>
      </div>
    </form>
  );
}
