import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';

export default async function SalesProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6 max-w-4xl p-4 sm:p-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Profil Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola data diri dan perbarui nomor kontak Anda agar mudah dihubungi.</p>
      </div>
      
      <ProfileForm profile={profile} />
    </div>
  );
}
