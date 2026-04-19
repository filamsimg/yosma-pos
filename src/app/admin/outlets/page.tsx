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
import { Search, Plus, ChevronLeft, ChevronRight, Trash2 as TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { OutletTable } from '@/components/admin/outlets/OutletTable';
import { OutletForm } from '@/components/admin/outlets/OutletForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { 
  upsertOutlet, 
  softDeleteOutlet, 
  getPaginatedOutlets,
  bulkDeleteOutlets 
} from '@/lib/actions/outlets';
import { type Outlet } from '@/types';
import { type OutletFormValues } from '@/lib/validations/outlet';

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchData();
  }, [currentPage, searchQuery, pageSize]);

  async function fetchData() {
    setLoading(true);
    const result = await getPaginatedOutlets(currentPage, pageSize, searchQuery);
    
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
    <div className="space-y-4">
      {/* Header section with Search & Create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Daftar Outlet</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola cabang dan lokasi outlet perusahaan Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau alamat..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-white border-slate-200 text-slate-900 h-10 w-full sm:w-64"
            />
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shadow-md shadow-blue-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Outlet Baru</span>
            <span className="sm:hidden">Baru</span>
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="text-blue-700 text-sm font-medium px-2">
            <span className="font-bold">{selectedIds.length}</span> outlet dipilih
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            className="bg-red-600 text-white hover:bg-white hover:text-red-600 border border-red-600 h-9 font-bold transition-all px-4"
            disabled={isSubmitting}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Hapus Terpilih
          </Button>
        </div>
      )}

      {/* Main Table Container */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden rounded-md flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <OutletTable 
            outlets={outlets}
            loading={loading}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Menampilkan <span className="text-slate-900 font-bold">{outlets.length}</span> dari <span className="text-slate-900 font-bold">{totalCount}</span> outlet
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
              {selectedOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Isi detail outlet untuk mengelola cabang toko Anda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
            <OutletForm 
              initialData={selectedOutlet}
              loading={isSubmitting}
              onSubmit={handleOutletSubmit}
              onCancel={() => setModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

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
