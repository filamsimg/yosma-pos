"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, User, Phone, Shield, Briefcase, Mail, KeyRound, Activity, Fingerprint, CreditCard, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { updateMyProfile } from '@/lib/actions/profiles';
import { updateMyPassword } from '@/lib/actions/auth';
import { FormSection } from '@/components/ui/form-section';
import type { Profile } from '@/types';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().optional(),
  nik: z.string().optional(),
  npwp: z.string().optional(),
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
    defaultValues: { 
      full_name: profile.full_name, 
      phone: profile.phone || '',
      nik: profile.nik || '',
      npwp: profile.npwp || '',
    },
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
    <div className="grid gap-6 lg:grid-cols-5 items-start animate-in fade-in slide-in-from-bottom-4 duration-150 pb-12">
      
      {/* Kolom Kiri: Info Profil Utama */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-slate-100 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-50">
            <div className="h-16 w-16 bg-blue-600 text-white rounded-sm flex items-center justify-center text-xl font-black shadow-lg shadow-blue-100 shrink-0">
              {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{profile.full_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                 <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-sm bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-widest">
                   {profile.role === 'ADMIN' ? <Shield className="h-3 w-3"/> : <Briefcase className="h-3 w-3"/>}
                   {profile.role}
                 </span>
                 {profile.nik && (
                   <span className="text-[10px] font-black font-mono bg-slate-50 text-slate-500 px-3 py-1 rounded-sm border border-slate-200 uppercase tracking-widest">
                     NIK: {profile.nik}
                   </span>
                 )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
            <FormSection title="Informasi Personal">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                      {...registerProfile('full_name')}
                      className="pl-10 bg-slate-50/50 border-slate-200 h-11 focus-visible:ring-blue-600 font-bold text-slate-900 rounded-sm uppercase text-xs"
                    />
                  </div>
                  {errorsProfile.full_name && <p className="text-[10px] text-red-600 font-bold uppercase">{errorsProfile.full_name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Nomor Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <Input
                        {...registerProfile('phone')}
                        className="pl-10 bg-slate-50/50 border-slate-200 h-11 focus-visible:ring-blue-600 font-bold text-slate-900 rounded-sm text-xs"
                        placeholder="0812..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">NIK (Terkunci)</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <Input
                        {...registerProfile('nik')}
                        disabled
                        className="pl-10 bg-slate-100 border-slate-200 h-11 font-mono font-black text-slate-600 cursor-not-allowed rounded-sm text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">NPWP Pajak</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                      {...registerProfile('npwp')}
                      className="pl-10 bg-slate-50/50 border-slate-200 h-11 focus-visible:ring-blue-600 font-bold text-slate-900 font-mono rounded-sm text-xs"
                      placeholder="80.678..."
                    />
                  </div>
                </div>
              </div>
            </FormSection>
            
            <div className="pt-6 border-t border-slate-100">
               <Button 
                type="submit" 
                disabled={loadingProfile} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 rounded-sm"
               >
                 {loadingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle2 className="h-4 w-4 mr-2"/>}
                 Simpan Perubahan
               </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Kolom Kanan: Keamanan (Email, Status, Password) */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white border border-slate-100 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              Detail Keamanan Akun
            </h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Alamat Email Login</Label>
              <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-sm p-3">
                <Mail className="h-4 w-4 text-slate-600" />
                <div className="text-xs font-bold text-slate-600 truncate">{email || 'Tidak tersedia'}</div>
              </div>
            </div>

            <div>
              <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Status Keaktifan</Label>
              <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-sm p-3">
                <Activity className="h-4 w-4 text-slate-600" />
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${profile.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{profile.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              Ganti Password Keamanan
            </h3>
          </div>
          
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Password Saat Ini</Label>
              <Input
                type="password"
                {...registerPassword('current_password')}
                className="bg-slate-50/50 border-slate-200 h-10 focus-visible:ring-blue-600 font-bold text-slate-900 rounded-sm text-xs"
                placeholder="Ketik sandi lama"
              />
              {errorsPassword.current_password && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter">{errorsPassword.current_password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Password Baru</Label>
              <Input
                type="password"
                {...registerPassword('password')}
                className="bg-slate-50/50 border-slate-200 h-10 focus-visible:ring-blue-600 font-bold text-slate-900 rounded-sm text-xs"
                placeholder="Min. 6 karakter"
              />
              {errorsPassword.password && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter">{errorsPassword.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Konfirmasi Sandi Baru</Label>
              <Input
                type="password"
                {...registerPassword('confirm_password')}
                className="bg-slate-50/50 border-slate-200 h-10 focus-visible:ring-blue-600 font-bold text-slate-900 rounded-sm text-xs"
                placeholder="Ulangi sandi baru"
              />
              {errorsPassword.confirm_password && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter">{errorsPassword.confirm_password.message}</p>}
            </div>
            
            <Button 
              type="submit" 
              disabled={loadingPassword} 
              variant="outline" 
              className="w-full mt-2 h-10 font-black text-[10px] uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 rounded-sm transition-all shadow-sm"
            >
              {loadingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2"/> : <RefreshCcw className="h-3.5 w-3.5 mr-2"/>}
              Perbarui Password
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
