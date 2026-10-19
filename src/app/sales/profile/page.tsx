import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ProfileForm } from '@/components/profile/ProfileForm';

export default async function SalesProfilePage() {
  const profile = await getCurrentUser();
  
  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Profil Saya</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Kelola data diri dan perbarui nomor kontak Anda agar mudah dihubungi.</p>
        </div>
      </div>
      
      <ProfileForm profile={profile} email={profile.email || ''} />
    </div>
  );
}
