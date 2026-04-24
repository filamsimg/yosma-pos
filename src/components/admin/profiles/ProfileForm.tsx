"use client"

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
import { 
  Loader2, 
  CheckCircle2, 
  KeyRound, 
  UserCheck, 
  ShieldCheck, 
  Fingerprint, 
  CreditCard, 
  LockKeyhole 
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { adminResetPassword } from '@/lib/actions/profiles';
import { normalizePhoneNumber } from '@/lib/utils/string-utils';
import { FormSection } from '@/components/ui/form-section';
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
      phone: normalizePhoneNumber(initialData?.phone || ''),
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        
        <FormSection title="Informasi Dasar Karyawan">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap Karyawan *</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  {...register('full_name')}
                  onChange={(e) => setValue('full_name', e.target.value.toUpperCase())}
                  className="pl-10 bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 rounded-sm uppercase font-black text-xs tracking-tight"
                  placeholder="CONTOH: AHMAD SUBARI"
                />
              </div>
              {errors.full_name && <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role / Hak Akses</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600 rounded-sm font-black text-xs uppercase">
                        <SelectValue placeholder="PILIH ROLE" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-sm">
                        <SelectItem value="SALES" className="focus:bg-blue-50 focus:text-blue-600 py-2.5 font-black text-[10px] uppercase cursor-pointer">
                          SALES (Lapangan)
                        </SelectItem>
                        <SelectItem value="ADMIN" className="focus:bg-blue-50 focus:text-blue-600 py-2.5 font-black text-[10px] uppercase cursor-pointer">
                          ADMIN (Full Akses)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Akun</Label>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value ? "true" : "false"} 
                      onValueChange={(v) => field.onChange(v === "true")}
                    >
                      <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600 rounded-sm font-black text-xs uppercase">
                        <SelectValue placeholder="PILIH STATUS" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-sm">
                        <SelectItem value="true" className="focus:bg-emerald-50 focus:text-emerald-700 py-2.5 font-black text-[10px] uppercase text-emerald-600 cursor-pointer">
                          AKTIF
                        </SelectItem>
                        <SelectItem value="false" className="focus:bg-red-50 focus:text-red-700 py-2.5 font-black text-[10px] uppercase text-red-600 cursor-pointer">
                          NONAKTIF
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Identitas & Kontak">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIK (No. Induk Karyawan) *</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    {...register('nik')}
                    onChange={(e) => setValue('nik', e.target.value.toUpperCase())}
                    className="pl-10 bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 font-mono font-black uppercase text-xs rounded-sm tracking-widest"
                    placeholder="JY.XX.XXX.XX"
                  />
                </div>
                {errors.nik && <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{errors.nik.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">NPWP (Pajak)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    {...register('npwp')}
                    className="pl-10 bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 font-mono text-xs rounded-sm"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">No. WhatsApp / Telepon</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 border-r border-slate-200 pr-2 h-4 flex items-center">
                  +62
                </div>
                <Input
                  {...register('phone')}
                  onChange={(e) => setValue('phone', normalizePhoneNumber(e.target.value))}
                  className="pl-12 bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 text-xs font-black rounded-sm tracking-wider"
                  placeholder="812xxxxxx"
                />
              </div>
            </div>
          </div>
        </FormSection>

        {initialData && (
          <FormSection title="Akses & Keamanan">
            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-3.5 w-3.5 text-blue-600" />
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Reset Password Login</h4>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Kembalikan sandi ke pengaturan awal <span className="text-blue-600">(yosma12345)</span>.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetConfirmOpen(true)}
                className="bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all h-9 px-4 rounded-sm shadow-sm"
              >
                <KeyRound className="h-3.5 w-3.5 mr-2" />
                Reset Password
              </Button>
            </div>
          </FormSection>
        )}

      </div>

      <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-10 px-6 font-black text-[10px] uppercase tracking-widest rounded-sm transition-all"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-8 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 rounded-sm flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {initialData ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}
        </Button>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset Password?"
        description={`Sandi "${initialData?.full_name}" akan dikembalikan ke standar (yosma12345).`}
        variant="danger"
        onConfirm={async () => {
          if (!initialData) return;
          setIsResetting(true);
          const result = await adminResetPassword(initialData.id);
          if (result.success) {
            toast.success('Password Berhasil di-Reset', { description: `Password baru: ${result.defaultPassword}` });
            setResetConfirmOpen(false);
          } else {
            toast.error('Gagal Reset Password');
          }
          setIsResetting(false);
        }}
        loading={isResetting}
      />
    </form>
  );
}
