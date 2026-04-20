'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import { toast } from 'sonner';

import { ProfileTable } from '@/components/admin/profiles/ProfileTable';
import { ProfileForm } from '@/components/admin/profiles/ProfileForm';
import { getPaginatedProfiles, updateProfile } from '@/lib/actions/profiles';
import type { Profile } from '@/types';
import type { ProfileFormValues } from '@/lib/validations/profile';

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
    
    // Status filter mapping: ACTIVE -> true, INACTIVE -> false, ALL -> undefined
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
    if (!selectedProfile) return; // Only allow editing for now
    
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
      toast.info('Pembuatan akun baru harus melalui halaman Sign Up.');
      return;
    }
    setSelectedProfile(profile);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Header section with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Profil & Karyawan</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola data dan kode rute sales karyawan Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau kode sales..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-white border-slate-200 text-slate-900 h-10 w-full sm:w-64"
            />
          </div>

          <Button
            onClick={() => handleOpenForm()} // Opens info toast since creation is separate
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shadow-md shadow-blue-100"
          >
            <UserCog className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kelola User</span>
            <span className="sm:hidden">Kelola</span>
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden rounded-md flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <ProfileTable 
            profiles={profiles}
            loading={loading}
            onEdit={handleOpenForm}
            roleFilter={roleFilter}
            setRoleFilter={(val) => { setRoleFilter(val); setCurrentPage(1); }}
            statusFilter={statusFilter}
            setStatusFilter={(val) => { setStatusFilter(val); setCurrentPage(1); }}
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
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Menampilkan <span className="text-slate-900 font-bold">{profiles.length}</span> dari <span className="text-slate-900 font-bold">{totalCount}</span> profil
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Baris:</span>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(val) => {
                    if (val) {
                      setPageSize(parseInt(val));
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-16 bg-white border-slate-200 text-xs font-bold text-slate-700 focus:ring-blue-600 transition-all">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl min-w-[4rem]">
                    {[10, 25, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()} className="text-xs cursor-pointer focus:bg-blue-50 focus:text-blue-600">
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
                className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30"
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
                        {showDots && <span className="text-slate-300 px-1">...</span>}
                        <Button
                          variant={currentPage === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(p)}
                          disabled={loading}
                          className={`h-8 w-8 p-0 text-xs font-bold ${
                            currentPage === p 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                          }`}
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
                className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl w-[calc(100%-2rem)] bg-white border-slate-200 p-0 overflow-hidden max-h-[96vh] flex flex-col shadow-2xl rounded-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-900">
              Edit Profil Karyawan
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Perbarui role akses, status identitas rute (Sales Code) karyawan ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
            <ProfileForm 
              initialData={selectedProfile}
              loading={isSubmitting}
              onSubmit={handleProfileSubmit}
              onCancel={() => setModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
