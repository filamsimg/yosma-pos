'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormValues } from '@/lib/validations/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { Profile } from '@/types';

interface ProfileFormProps {
  initialData?: Profile | null;
  onSubmit: (values: Partial<Profile>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      role: initialData?.role || 'SALES',
      sales_code: initialData?.sales_code || '',
      phone: initialData?.phone || '',
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-2">
      <div className="grid gap-6">
        
        {/* Nama Lengkap */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nama Lengkap *</Label>
          <Input
            {...register('full_name')}
            onChange={(e) => setValue('full_name', e.target.value.toUpperCase())}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4 uppercase"
            placeholder="MASUKKAN NAMA LENGKAP"
          />
          {errors.full_name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.full_name.message}</p>}
        </div>

        {/* Role & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Role Akses</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600">
                    <SelectValue placeholder="PILIH ROLE" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                    <SelectItem value="SALES" className="focus:bg-slate-50 focus:text-blue-600 py-2.5">
                      SALES (Pekerja Lapangan)
                    </SelectItem>
                    <SelectItem value="ADMIN" className="focus:bg-slate-50 focus:text-blue-600 py-2.5">
                      ADMIN (Akses Penuh)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-xs text-red-600 mt-1 font-medium">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Status Akun</Label>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Select 
                  value={field.value ? "true" : "false"} 
                  onValueChange={(v) => field.onChange(v === "true")}
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600">
                    <SelectValue placeholder="PILIH STATUS" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                    <SelectItem value="true" className="focus:bg-emerald-50 focus:text-emerald-700 py-2.5 font-bold">
                      AKTIF
                    </SelectItem>
                    <SelectItem value="false" className="focus:bg-red-50 focus:text-red-700 py-2.5 font-bold">
                      NONAKTIF
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Sales Code */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider flex items-center justify-between">
            <span>Sales Code (Identitas Rute)</span>
            <span className="text-[10px] text-slate-400 font-normal normal-case">Contoh: JY.05.14</span>
          </Label>
          <Input
            {...register('sales_code')}
            onChange={(e) => setValue('sales_code', e.target.value.toUpperCase())}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4 font-mono font-bold uppercase"
            placeholder="JY.XX.XX Atau KOSONGKAN JIKA ADMIN"
          />
          {errors.sales_code && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sales_code.message}</p>}
        </div>

        {/* Telepon */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">No. WhatsApp / Telepon</Label>
          <Input
            {...register('phone')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4"
            placeholder="0812..."
          />
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          {initialData ? 'Simpan Perubahan' : 'Selesai'}
        </Button>
      </div>
    </form>
  );
}
