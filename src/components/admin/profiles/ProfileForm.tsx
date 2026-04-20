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
import { Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { adminResetPassword } from '@/lib/actions/profiles';
import type { Profile } from '@/types';
import { useState } from 'react';

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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
      nik: initialData?.nik || '',
      npwp: initialData?.npwp || '',
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

        {/* NIK & NPWP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider flex items-center justify-between">
              <span>NIK (Nomor Induk Karyawan) *</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">Contoh: JY.01.YAP.06</span>
            </Label>
            <Input
              {...register('nik')}
              onChange={(e) => setValue('nik', e.target.value.toUpperCase())}
              className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4 font-mono font-bold uppercase"
              placeholder="CONTOH: JY.01.YAP.06"
            />
            {errors.nik && <p className="text-xs text-red-600 mt-1 font-medium">{errors.nik.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider flex items-center justify-between">
              <span>NPWP</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">Contoh: 80.678.564...</span>
            </Label>
            <Input
              {...register('npwp')}
              className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4 font-mono"
              placeholder="MASUKKAN NOMOR NPWP"
            />
          </div>
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

        {/* Reset Password Section (Only for existing profiles) */}
        {initialData && (
          <div className="pt-4 border-t border-dashed border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <Label className="text-slate-800 font-bold block">Reset Password</Label>
                <p className="text-xs text-slate-500 mt-1">Kembalikan sandi karyawan ini ke sandi bawaan.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetConfirmOpen(true)}
                className="border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all font-bold h-10 px-4 whitespace-nowrap"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Ke Default
              </Button>
            </div>
          </div>
        )}

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

      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset Password Karyawan?"
        description={`Sandi "${initialData?.full_name}" akan dikembalikan ke sandi standar yosma12345. Harap infokan karyawan tersebut setelah berhasil.`}
        onConfirm={async () => {
          if (!initialData) return;
          setIsResetting(true);
          const result = await adminResetPassword(initialData.id);
          if (result.success) {
            toast.success('Password berhasil di-reset', { description: `Password baru: ${result.defaultPassword}` });
            setResetConfirmOpen(false);
          } else {
            toast.error('Gagal reset password', { description: result.error });
          }
          setIsResetting(false);
        }}
        loading={isResetting}
      />
    </form>
  );
}
