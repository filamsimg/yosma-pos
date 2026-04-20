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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-2 max-w-4xl mx-auto">
      <div className="space-y-10">
        
        {/* Section 1: Informasi Dasar */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Informasi Dasar Karyawan</h3>
          </div>

          <div className="grid gap-8">
            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Nama Lengkap Karyawan *</Label>
              <Input
                {...register('full_name')}
                onChange={(e) => setValue('full_name', e.target.value.toUpperCase())}
                className="bg-white border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 px-5 shadow-sm rounded-xl uppercase font-semibold text-base"
                placeholder="CONTOH: AHMAD SUBARI"
              />
              {errors.full_name && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Role / Hak Akses</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-12 focus:ring-blue-600 rounded-xl px-5 font-medium">
                        <SelectValue placeholder="PILIH ROLE" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl">
                        <SelectItem value="SALES" className="focus:bg-slate-50 focus:text-blue-600 py-3 font-medium">
                          SALES (Lapangan)
                        </SelectItem>
                        <SelectItem value="ADMIN" className="focus:bg-slate-50 focus:text-blue-600 py-3 font-medium">
                          ADMIN (Full Akses)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Status Akun</Label>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value ? "true" : "false"} 
                      onValueChange={(v) => field.onChange(v === "true")}
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-12 focus:ring-blue-600 rounded-xl px-5 font-medium">
                        <SelectValue placeholder="PILIH STATUS" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl">
                        <SelectItem value="true" className="focus:bg-emerald-50 focus:text-emerald-700 py-3 font-bold text-emerald-600">
                          AKTIF
                        </SelectItem>
                        <SelectItem value="false" className="focus:bg-red-50 focus:text-red-700 py-3 font-bold text-red-600">
                          NONAKTIF
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Identitas & Kontak */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Identitas & Kontak</h3>
          </div>

          <div className="grid gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1 flex items-center justify-between">
                  <span>NIK (No. Induk Karyawan) *</span>
                </Label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    {...register('nik')}
                    onChange={(e) => setValue('nik', e.target.value.toUpperCase())}
                    className="pl-12 bg-white border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 font-mono font-black uppercase text-base rounded-xl"
                    placeholder="JY.XX.XXX.XX"
                  />
                </div>
                {errors.nik && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.nik.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">NPWP (No. Pokok Wajib Pajak)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    {...register('npwp')}
                    className="pl-12 bg-white border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 font-mono text-base rounded-xl shadow-sm"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">No. WhatsApp / Telepon Aktif</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 border-r border-slate-200 pr-3 h-6 flex items-center">
                  +62
                </div>
                <Input
                  {...register('phone')}
                  className="pl-16 bg-white border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 text-base font-semibold rounded-xl"
                  placeholder="812xxxxxx"
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">Gunakan nomor yang terhubung dengan WhatsApp untuk notifikasi rute.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Keamanan Keamanan */}
        {initialData && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <LockKeyhole className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Akses & Keamanan</h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">Reset Password Login</h4>
                <p className="text-xs text-slate-500 font-medium">Kembalikan sandi ke pengaturan awal <span className="font-bold text-blue-600">(yosma12345)</span>.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetConfirmOpen(true)}
                className="bg-white border-slate-200 text-slate-700 hover:text-red-600 hover:bg-white hover:border-red-200 transition-all font-bold h-11 px-6 rounded-xl shadow-sm whitespace-nowrap"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Ke Default
              </Button>
            </div>
          </section>
        )}

      </div>

      <div className="flex items-center justify-end gap-4 pt-10 mt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-12 px-8 font-bold rounded-xl transition-all"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 font-black text-sm shadow-xl shadow-blue-200 transition-all active:scale-95 rounded-xl flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {initialData ? 'SIMPAN PERUBAHAN' : 'SELESAIKAN PENDAFTARAN'}
        </Button>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Konfirmasi Reset Password"
        description={`Sandi "${initialData?.full_name}" akan dikembalikan ke standar (yosma12345). Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={async () => {
          if (!initialData) return;
          setIsResetting(true);
          const result = await adminResetPassword(initialData.id);
          if (result.success) {
            toast.success('Password Berhasil di-Reset', { description: `Password baru karyawan: ${result.defaultPassword}` });
            setResetConfirmOpen(false);
          } else {
            toast.error('Gagal Reset Password', { description: result.error });
          }
          setIsResetting(false);
        }}
        loading={isResetting}
      />
    </form>
  );
}
