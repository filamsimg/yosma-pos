"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableFacetedFilter } from '@/components/admin/shared/DataTableFacetedFilter';
import { ProfileTable } from '@/components/admin/profiles/ProfileTable';
import { ProfileForm } from '@/components/admin/profiles/ProfileForm';
import { getPaginatedProfiles, updateProfile } from '@/lib/actions/profiles';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { AdminToolbar, AdminToolbarSection } from '@/components/ui/admin/toolbar';
import { AppDialog } from '@/components/ui/app-dialog';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'created_at', dir: 'desc' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery, pageSize, roleFilter, statusFilter, sorting]);

  async function fetchData() {
    setLoading(true);
    
    let isActive: boolean | undefined = undefined;
    if (statusFilter.length === 1) {
      if (statusFilter.includes('ACTIVE')) isActive = true;
      if (statusFilter.includes('INACTIVE')) isActive = false;
    }

    const filters = {
      role: roleFilter,
      is_active: isActive
    };
    const result = await getPaginatedProfiles(
      currentPage, 
      pageSize, 
      searchQuery, 
      filters,
      sorting.field,
      sorting.dir
    );
    
    if (result.data) {
      setProfiles(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } else if (result.error) {
      toast.error('Gagal mengambil data', { description: result.error });
    }
    
    setLoading(false);
  }

  async function handleProfileSubmit(values: Partial<Profile>) {
    if (!selectedProfile) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateProfile(selectedProfile.id, values);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Profil berhasil diperbarui');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan profil', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenForm(profile?: Profile) {
    if (!profile) {
      toast.info('Pendaftaran karyawan baru harus melalui halaman Sign Up sistem.');
      return;
    }
    setSelectedProfile(profile);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Profil & Karyawan"
        description="Kelola hak akses, status, dan kode identitas sales karyawan Anda"
        breadcrumbs={[{ label: 'Karyawan' }]}
        action={
          <div className="hidden md:flex items-center gap-2">
            <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-sm border border-blue-100 flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Manajemen Akses</span>
            </div>
          </div>
        }
      />

      <AdminToolbar>
        <AdminToolbarSection grow>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              placeholder="Cari nama atau kode sales..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
            />
          </div>
        </AdminToolbarSection>

        <AdminToolbarSection className="border-t md:border-t-0 md:border-l border-slate-100 py-1">
          <div className="flex items-center gap-2">
            <DataTableFacetedFilter
              title="Role"
              options={[
                { label: "Admin", value: "ADMIN" },
                { label: "Sales", value: "SALES" },
              ]}
              selectedValues={roleFilter}
              onSelect={(val) => { setRoleFilter(val); setCurrentPage(1); }}
            />
            <DataTableFacetedFilter
              title="Status"
              options={[
                { label: "Aktif", value: "ACTIVE" },
                { label: "Nonaktif", value: "INACTIVE" },
              ]}
              selectedValues={statusFilter}
              onSelect={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            />
            
            {(roleFilter.length > 0 || statusFilter.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setRoleFilter([]);
                  setStatusFilter([]);
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-[9px] font-black text-red-600 hover:text-red-700 hover:bg-red-50 uppercase tracking-widest"
              >
                Reset
              </Button>
            )}
          </div>
        </AdminToolbarSection>
      </AdminToolbar>

      {/* Main Table Container */}
      <div className="flex-1 overflow-hidden">
        <ProfileTable 
          profiles={profiles}
          loading={loading}
          onEdit={handleOpenForm}
          sorting={sorting}
          onSort={(field) => {
            setSorting(prev => ({
              field,
              dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
            }));
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="border border-slate-100 p-4 bg-white rounded-sm shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">
              Total <span className="text-slate-900">{totalCount}</span> Profil
            </div>
            
            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Baris:</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(val) => {
                  if (val) {
                    setPageSize(parseInt(val));
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-7 w-16 bg-slate-50 border-none text-[10px] font-black text-slate-600 focus:ring-0 rounded-sm">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl min-w-[4rem] rounded-sm">
                  {[10, 25, 50, 100].map(size => (
                    <SelectItem key={size} value={size.toString()} className="text-[10px] font-black uppercase cursor-pointer focus:bg-blue-50 focus:text-blue-600">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="h-8 w-8 p-0 border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-20 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showDots = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showDots && <span className="text-slate-200 px-1 text-[10px] font-black">...</span>}
                      <Button
                        variant={currentPage === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        disabled={loading}
                        className={cn(
                          "h-8 w-8 p-0 text-[10px] font-black rounded-sm transition-all",
                          currentPage === p 
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                            : "border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="h-8 w-8 p-0 border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-20 rounded-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AppDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Edit Profil Karyawan"
        subtitle="Perbarui role akses, status identitas rute (Sales Code) karyawan ini."
        variant="receipt"
      >
        <div className="min-h-0">
          <ProfileForm 
            initialData={selectedProfile}
            loading={isSubmitting}
            onSubmit={handleProfileSubmit}
            onCancel={() => setModalOpen(false)}
          />
        </div>
      </AppDialog>
    </div>
  );
}
