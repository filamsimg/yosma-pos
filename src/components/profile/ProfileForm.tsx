'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, User, Phone, Shield, Briefcase, Mail, KeyRound, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { updateMyProfile } from '@/lib/actions/profiles';
import { updateMyPassword } from '@/lib/actions/auth';
import type { Profile } from '@/types';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Password saat ini wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirm_password: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Password tidak cocok",
  path: ["confirm_password"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileForm({ profile, email }: { profile: Profile, email?: string }) {
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: errorsProfile } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile.full_name, phone: profile.phone || '' },
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: errorsPassword } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmitProfile(values: ProfileFormValues) {
    setLoadingProfile(true);
    const result = await updateMyProfile(values);
    if (result.error) toast.error('Gagal memperbarui profil', { description: result.error });
    else toast.success('Profil berhasil diperbarui');
    setLoadingProfile(false);
  }

  async function onSubmitPassword(values: PasswordFormValues) {
    setLoadingPassword(true);
    const result = await updateMyPassword(values.current_password, values.password);
    if (result.error) toast.error('Gagal mengubah password', { description: result.error });
    else {
      toast.success('Password berhasil diperbarui');
      resetPassword();
    }
    setLoadingPassword(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Kolom Kiri: Info Profil Utama */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-md shrink-0 ring-4 ring-blue-50">
              {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">{profile.full_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                 <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                   {profile.role === 'ADMIN' ? <Shield className="h-3 w-3"/> : <Briefcase className="h-3 w-3"/>}
                   {profile.role}
                 </span>
                 {profile.sales_code && (
                   <span className="text-xs font-black font-mono bg-blue-50 text-blue-600 px-3 py-1 rounded-md border border-blue-200/50 shadow-sm">
                     {profile.sales_code}
                   </span>
                 )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  {...registerProfile('full_name')}
                  className="pl-11 bg-slate-50/50 border-slate-200 h-12 focus-visible:ring-blue-600 font-medium text-slate-900"
                />
              </div>
              {errorsProfile.full_name && <p className="text-xs text-red-600 font-medium">{errorsProfile.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nomor Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  {...registerProfile('phone')}
                  className="pl-11 bg-slate-50/50 border-slate-200 h-12 focus-visible:ring-blue-600 font-medium text-slate-900"
                  placeholder="Contoh: 08123456789"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 mt-8">
               <Button type="submit" disabled={loadingProfile} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 rounded-lg">
                 {loadingProfile ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <CheckCircle2 className="h-5 w-5 mr-2"/>}
                 Simpan Perubahan
               </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Kolom Kanan: Keamanan (Email, Status, Password) */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-5 flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            Keamanan Akun
          </h3>
          
          <div className="space-y-5">
            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Email Login</Label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div className="h-8 w-8 bg-white border border-slate-200 rounded-md flex justify-center items-center shrink-0">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-sm font-medium text-slate-700 truncate">{email || 'Tidak tersedia'}</div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Status Akun</Label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div className="h-8 w-8 bg-white border border-slate-200 rounded-md flex justify-center items-center shrink-0">
                  <Activity className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {profile.is_active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${profile.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  </span>
                  <span className="text-sm font-bold text-slate-700">{profile.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-5 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-400" />
            Ubah Password
          </h3>
          
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password Saat Ini</Label>
              <Input
                type="password"
                {...registerPassword('current_password')}
                className="bg-slate-50/50 border-slate-200 h-10 focus-visible:ring-blue-600 font-medium text-slate-900"
                placeholder="Ketik password lama Anda"
              />
              {errorsPassword.current_password && <p className="text-xs text-red-600 font-medium">{errorsPassword.current_password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password Baru</Label>
              <Input
                type="password"
                {...registerPassword('password')}
                className="bg-slate-50/50 border-slate-200 h-10 focus-visible:ring-blue-600 font-medium text-slate-900"
                placeholder="Minimal 6 karakter"
              />
              {errorsPassword.password && <p className="text-xs text-red-600 font-medium">{errorsPassword.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Konfirmasi Password</Label>
              <Input
                type="password"
                {...registerPassword('confirm_password')}
                className="bg-slate-50/50 border-slate-200 h-10 focus-visible:ring-blue-600 font-medium text-slate-900"
                placeholder="Ulangi password baru"
              />
              {errorsPassword.confirm_password && <p className="text-xs text-red-600 font-medium">{errorsPassword.confirm_password.message}</p>}
            </div>
            
            <Button type="submit" disabled={loadingPassword} variant="outline" className="w-full mt-2 h-10 font-bold text-sm shadow-sm transition-all border-slate-200 hover:bg-slate-50 hover:text-blue-700">
              {loadingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
              Perbarui Password
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
