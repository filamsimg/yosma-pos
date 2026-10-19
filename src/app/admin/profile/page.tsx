import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AdminPageHeader } from '@/components/ui/admin/page-header';

export default async function AdminProfilePage() {
  const profile = await getCurrentUser();
  
  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Profil Saya"
        description="Kelola data diri, informasi kontak, dan keamanan akun Anda secara mandiri"
        breadcrumbs={[{ label: 'Profil' }, { label: 'Pengaturan' }]}
      />
      
      <ProfileForm profile={profile} email={profile.email || ''} />
    </div>
  );
}
