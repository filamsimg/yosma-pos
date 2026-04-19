'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, User, Phone, Shield, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { updateMyProfile } from '@/lib/actions/profiles';
import type { Profile } from '@/types';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      phone: profile.phone || '',
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setLoading(true);
    const result = await updateMyProfile(values);
    
    if (result.error) {
      toast.error('Gagal memperbarui profil', { description: result.error });
    } else {
      toast.success('Profil berhasil diperbarui');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nama Lengkap</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              {...register('full_name')}
              className="pl-11 bg-slate-50/50 border-slate-200 h-12 focus-visible:ring-blue-600 font-medium text-slate-900"
              placeholder="Masukkan nama lengkap"
            />
          </div>
          {errors.full_name && <p className="text-xs text-red-600 font-medium">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nomor Telepon</Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              {...register('phone')}
              className="pl-11 bg-slate-50/50 border-slate-200 h-12 focus-visible:ring-blue-600 font-medium text-slate-900"
              placeholder="Contoh: 08123456789"
            />
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-100 mt-8">
           <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 rounded-lg">
             {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <CheckCircle2 className="h-5 w-5 mr-2"/>}
             Simpan Perubahan
           </Button>
        </div>
      </form>
    </div>
  );
}
