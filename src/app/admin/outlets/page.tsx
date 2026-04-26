"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, ChevronLeft, ChevronRight, Trash2 as TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AppDialog } from '@/components/ui/app-dialog';

import { DataTableFacetedFilter } from '@/components/admin/shared/DataTableFacetedFilter';
import { AdminTable } from '@/components/ui/admin/data-table';
import { AdminPagination } from '@/components/ui/admin/pagination';
import { OutletTable } from '@/components/admin/outlets/OutletTable';
import { OutletForm } from '@/components/admin/outlets/OutletForm';
import { ImportDialog } from '@/components/admin/outlets/ImportDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { AdminToolbar, AdminToolbarSection } from '@/components/ui/admin/toolbar';
import { cn } from '@/lib/utils';
import { 
  upsertOutlet, 
  softDeleteOutlet, 
  getPaginatedOutlets,
  bulkDeleteOutlets,
  getOutletTypes,
  getAllOutlets
} from '@/lib/actions/outlets';
import { ExportButton } from '@/components/admin/shared/ExportButton';
import { VISIT_DAYS, OUTLET_STATUS_MAP } from '@/lib/constants';
import { type Outlet } from '@/types';
import { type OutletFormValues } from '@/lib/validations/outlet';

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dayFilter, setDayFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'name', dir: 'asc' });
  const [outletTypes, setOutletTypes] = useState<any[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal & Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Dialog States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [outletToDelete, setOutletToDelete] = useState<Outlet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    async function loadLookup() {
      const types = await getOutletTypes();
      setOutletTypes(types);
    }
    loadLookup();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery, pageSize, typeFilter, dayFilter, statusFilter, sorting]);

  async function fetchData() {
    setLoading(true);
    const filters = {
      type: typeFilter,
      visit_day: dayFilter,
      status: statusFilter
    };
    const result = await getPaginatedOutlets(
      currentPage, 
      pageSize, 
      searchQuery, 
      filters,
      sorting.field,
      sorting.dir
    );
    
    if (result.data) {
      setOutlets(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } else if (result.error) {
      toast.error('Gagal mengambil data', { description: result.error });
    }
    
    setLoading(false);
  }

  async function handleOutletSubmit(values: OutletFormValues) {
    setIsSubmitting(true);
    try {
      const result = await upsertOutlet(values, selectedOutlet?.id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(selectedOutlet ? 'Outlet diperbarui' : 'Outlet ditambahkan');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan outlet', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const outlet = outlets.find(o => o.id === id);
    if (!outlet) return;
    setOutletToDelete(outlet);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteOutlet() {
    if (!outletToDelete) return;
    setIsDeleting(true);
    const result = await softDeleteOutlet(outletToDelete.id);
    if (result.error) {
      toast.error('Gagal menghapus');
    } else {
      toast.success('Outlet berhasil dihapus');
      fetchData();
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setOutletToDelete(null);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  }

  async function confirmBulkDelete() {
    setIsSubmitting(true);
    const result = await bulkDeleteOutlets(selectedIds);
    if (result.error) {
      toast.error('Gagal menghapus masal');
    } else {
      toast.success(`${selectedIds.length} outlet berhasil dihapus`);
      setSelectedIds([]);
      setCurrentPage(1);
      fetchData();
    }
    setIsSubmitting(false);
    setBulkDeleteConfirmOpen(false);
  }

  function handleOpenForm(outlet?: Outlet) {
    setSelectedOutlet(outlet || null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Daftar Outlet"
        description="Kelola cabang dan lokasi outlet perusahaan Anda secara real-time"
        breadcrumbs={[{ label: 'Outlet' }]}
        action={
          <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
            <ExportButton 
              fetcher={getAllOutlets}
              filename="Daftar_Outlet"
              className="w-full md:w-auto"
              mapper={(o) => ({
                'Nama': o.name,
                'Tipe': o.type || '-',
                'Alamat': o.address || '-',
                'Telepon': o.phone || '-',
                'Pemilik': o.owner_name || '-',
                'Hari Kunjungan': o.visit_day || '-',
                'Frekuensi': o.visit_frequency || '-',
                'NIK Sales': o.assigned_sales || '-'
              })}
            />
            <ImportDialog onSuccess={fetchData} className="w-full md:w-auto" />
            <Button
              onClick={() => handleOpenForm()}
              className="col-span-2 md:col-auto bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 shadow-xl shadow-blue-100 rounded-sm font-bold text-xs uppercase tracking-widest w-full md:w-auto transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Outlet Baru
            </Button>
          </div>
        }
      />

      <AdminToolbar>
        <AdminToolbarSection grow>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Cari outlet berdasarkan nama atau ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>
        </AdminToolbarSection>

        <AdminToolbarSection className="border-t md:border-t-0 md:border-l border-slate-400 py-1">
          <div className="flex items-center gap-2">
            <DataTableFacetedFilter
              title="Tipe"
              options={outletTypes.map(t => ({ label: t.name, value: t.name }))}
              selectedValues={typeFilter}
              onSelect={(val) => { setTypeFilter(val); setCurrentPage(1); }}
            />
            <DataTableFacetedFilter
              title="Hari"
              options={VISIT_DAYS.map(day => ({ label: day.label, value: day.value }))}
              selectedValues={dayFilter}
              onSelect={(val) => { setDayFilter(val); setCurrentPage(1); }}
            />
            <DataTableFacetedFilter
              title="Status"
              options={Object.entries(OUTLET_STATUS_MAP).map(([key, val]) => ({ label: val.label, value: key }))}
              selectedValues={statusFilter}
              onSelect={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            />
            
            {(typeFilter.length > 0 || dayFilter.length > 0 || statusFilter.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setTypeFilter([]);
                  setDayFilter([]);
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

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-sm flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
          <div className="text-blue-700 text-[10px] font-black uppercase tracking-widest px-2">
            <span className="text-blue-900">{selectedIds.length}</span> Outlet Terpilih
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            className="bg-red-600 text-white hover:bg-red-700 h-8 font-black text-[10px] uppercase tracking-widest transition-all px-4 rounded-sm"
            disabled={isSubmitting}
          >
            <TrashIcon className="h-3.5 w-3.5 mr-2" />
            Hapus Masal
          </Button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="flex-1 overflow-hidden">
        <OutletTable 
          outlets={outlets}
          loading={loading}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          sorting={sorting}
          onSort={(field: string) => {
            setSorting(prev => ({
              field,
              dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
            }));
            setCurrentPage(1);
          }}
        />
      </div>

      <AdminPagination
        totalCount={totalCount}
        filteredCount={outlets.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemName="Outlet"
        loading={loading}
      />

      <AppDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={selectedOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'}
        subtitle="Isi detail outlet untuk mengelola cabang toko Anda."
        variant="receipt"
        maxWidth="max-w-md lg:max-w-5xl"
      >
        <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-4 lg:p-6">
          <OutletForm 
            initialData={selectedOutlet}
            loading={isSubmitting}
            onSubmit={handleOutletSubmit}
            onCancel={() => setModalOpen(false)}
          />
        </div>
      </AppDialog>

      <ConfirmDialog 
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Outlet?"
        description={`Outlet "${outletToDelete?.name || ''}" akan dihapus dari sistem.`}
        variant="danger"
        onConfirm={confirmDeleteOutlet}
        loading={isDeleting}
      />

      <ConfirmDialog 
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Hapus Masal?"
        description={`Anda akan menghapus ${selectedIds.length} outlet sekaligus. Tindakan ini tidak dapat dibatalkan.`}
        variant="danger"
        onConfirm={confirmBulkDelete}
        loading={isSubmitting}
      />
    </div>
  );
}
