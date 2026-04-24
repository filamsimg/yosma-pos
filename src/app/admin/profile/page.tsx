import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AdminPageHeader } from '@/components/ui/admin/page-header';

export default async function AdminProfilePage() {
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
    <div className="space-y-6">
      <AdminPageHeader 
        title="Profil Saya"
        description="Kelola data diri, informasi kontak, dan keamanan akun Anda secara mandiri"
        breadcrumbs={[{ label: 'Profil' }, { label: 'Pengaturan' }]}
      />
      
      <ProfileForm profile={profile} email={user.email} />
    </div>
  );
}
