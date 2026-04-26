'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { 
  Search, 
  Plus, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Trash2 as TrashIcon, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

import { DataTableFacetedFilter } from '@/components/admin/shared/DataTableFacetedFilter';
import { ProductTable } from '@/components/admin/products/ProductTable';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { ImportDialog } from '@/components/admin/products/ImportDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StockAdjustDialog } from '@/components/admin/products/StockAdjustDialog';
import { StatCard } from '@/components/ui/stat-card';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { AdminToolbar, AdminToolbarSection } from '@/components/ui/admin/toolbar';
import { AdminTable } from '@/components/ui/admin/data-table';
import { cn } from '@/lib/utils';
import { 
  createProduct, 
  updateProduct, 
  softDeleteProduct, 
  adjustStock,
  getPaginatedProducts,
  bulkDeleteProducts,
  getAllProducts
} from '@/lib/actions/products';
import { ExportButton } from '@/components/admin/shared/ExportButton';
import { type Product, type Category } from '@/types';
import { type ProductFormValues } from '@/lib/validations/product';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sorting, setSorting] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'name', dir: 'asc' });
  const [brands, setBrands] = useState<any[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal & Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Premium Dialog States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery, pageSize, categoryFilter, brandFilter, stockFilter, sorting]);

  async function fetchData() {
    setLoading(true);
    const filters = {
      category_id: categoryFilter,
      brand_id: brandFilter,
      stock_status: stockFilter
    };
    const result = await getPaginatedProducts(
      currentPage, 
      pageSize, 
      searchQuery, 
      filters,
      sorting.field,
      sorting.dir
    );
    
    if (result.data) {
      setProducts(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } else if (result.error) {
      toast.error('Gagal mengambil data', { description: result.error });
    }

    const supabase = createClient();
    const { data: cData } = await supabase.from('categories').select('*').order('name');
    if (cData) setCategories(cData);

    const { data: bData } = await supabase.from('brands').select('*').order('name');
    if (bData) setBrands(bData);
    
    setLoading(false);
  }

  // No need for filteredProducts here, backend handles search

  async function handleProductSubmit(values: ProductFormValues) {
    setIsSubmitting(true);
    try {
      let result;
      if (selectedProduct) {
        result = await updateProduct(selectedProduct.id, values);
      } else {
        result = await createProduct(values);
      }

      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Terjadi kesalahan validasi');
      }

      toast.success(selectedProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
      setProductModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan produk', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;
    setIsDeleting(true);
    const result = await softDeleteProduct(productToDelete.id);
    if (result.error) {
      toast.error('Gagal menghapus');
    } else {
      toast.success('Produk berhasil dihapus');
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  }

  function handleOpenForm(product?: Product) {
    setSelectedProduct(product || null);
    setProductModalOpen(true);
  }

  function handleOpenStockAdjust(product: Product) {
    setProductToAdjust(product);
    setStockAdjustOpen(true);
  }

  async function confirmAdjustStock(data: { quantity: number; reason: string; notes: string }) {
    if (!productToAdjust) return;
    setIsAdjusting(true);
    
    const result = await adjustStock({
      product_id: productToAdjust.id,
      quantity: data.quantity,
      reason: data.reason as any,
      notes: data.notes
    });

    if (result?.error) {
      const errorMsg = typeof result.error === 'string' ? result.error : 'Terjadi kesalahan validasi';
      toast.error('Gagal mengupdate stok', { description: errorMsg });
    } else {
      toast.success('Stok berhasil diperbarui', {
        description: `${productToAdjust.name} — ${data.reason === 'RESTOCK' ? '+' : '-'}${data.quantity} unit`,
      });
      setStockAdjustOpen(false);
      setProductToAdjust(null);
      fetchData();
    }

    setIsAdjusting(false);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  }

  async function confirmBulkDelete() {
    setIsSubmitting(true);
    const result = await bulkDeleteProducts(selectedIds);
    if (result.error) {
      toast.error('Gagal menghapus masal');
    } else {
      toast.success(`${selectedIds.length} produk berhasil dihapus`);
      setSelectedIds([]);
      setCurrentPage(1); // Back to first page to be safe
      fetchData();
    }
    setIsSubmitting(false);
    setBulkDeleteConfirmOpen(false);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Katalog Produk"
        description="Kelola katalog barang dan monitoring stok gudang secara real-time"
        breadcrumbs={[{ label: 'Produk' }]}
        action={
          <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
            <ExportButton 
              fetcher={getAllProducts}
              filename="Daftar_Produk"
              className="w-full md:w-auto"
              mapper={(p) => ({
                'Nama': p.name,
                'SKU': p.sku,
                'Merk': p.brand?.name || '-',
                'Kategori': p.category?.name || '-',
                'Satuan': p.unit?.name || '-',
                'Harga': p.price,
                'Stok': p.stock,
                'Min Stok': p.min_stock,
                'Deskripsi': p.description || '-'
              })}
            />
            <ImportDialog onSuccess={fetchData} className="w-full md:w-auto" />
            <Button
              onClick={() => handleOpenForm()}
              className="col-span-2 md:col-auto bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 shadow-xl shadow-blue-100 rounded-sm font-bold text-xs uppercase tracking-widest w-full md:w-auto transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Produk Baru
            </Button>
          </div>
        }
      />

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
            label="Total Produk" 
            value={totalCount} 
            icon={Package} 
            iconBgColor="bg-blue-50" 
            iconColor="text-blue-600" 
        />
        <StatCard 
            label="Stok Habis" 
            value={products.filter(p => (p.stock || 0) <= 0).length} 
            icon={XCircle} 
            iconBgColor="bg-red-50" 
            iconColor="text-red-600" 
        />
        <StatCard 
            label="Stok Menipis" 
            value={products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.min_stock || 5)).length} 
            icon={AlertTriangle} 
            iconBgColor="bg-amber-50" 
            iconColor="text-amber-600" 
        />
        <StatCard 
            label="Kategori Aktif" 
            value={Array.from(new Set(products.map(p => p.category))).length} 
            icon={TrendingUp} 
            iconBgColor="bg-emerald-50" 
            iconColor="text-emerald-600" 
        />
      </div>

      <AdminToolbar>
        <AdminToolbarSection grow>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              placeholder="Cari produk, SKU, atau merk..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
            />
          </div>
        </AdminToolbarSection>
        
        <AdminToolbarSection className="border-t md:border-t-0 md:border-l border-slate-100 py-1 md:py-1">
          <div className="flex items-center gap-2">
            <DataTableFacetedFilter
              title="Kategori"
              options={categories.map(c => ({ label: c.name, value: c.id }))}
              selectedValues={categoryFilter}
              onSelect={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
            />
            <DataTableFacetedFilter
              title="Merk"
              options={brands.map(b => ({ label: b.name, value: b.id }))}
              selectedValues={brandFilter}
              onSelect={(val) => { setBrandFilter(val); setCurrentPage(1); }}
            />
            <Select value={stockFilter} onValueChange={(val) => { if (val) { setStockFilter(val); setCurrentPage(1); } }}>
              <SelectTrigger className="h-8 w-fit min-w-[120px] bg-white border-slate-200 text-[10px] font-black text-slate-400 hover:bg-slate-50 px-3 rounded-sm uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Status Stok" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-sm">
                <SelectItem value="ALL" className="text-[10px] font-black uppercase">SEMUA STOK</SelectItem>
                <SelectItem value="OUT_OF_STOCK" className="text-[10px] font-black uppercase">HABIS (0)</SelectItem>
                <SelectItem value="LOW_STOCK" className="text-[10px] font-black uppercase">MENIPIS ({"<="}10)</SelectItem>
                <SelectItem value="IN_STOCK" className="text-[10px] font-black uppercase">TERSEDIA ({'>'}10)</SelectItem>
              </SelectContent>
            </Select>
            
            {(categoryFilter.length > 0 || brandFilter.length > 0 || stockFilter !== 'ALL') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setCategoryFilter([]);
                  setBrandFilter([]);
                  setStockFilter('ALL');
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-[10px] font-black text-red-600 hover:text-red-700 hover:bg-red-50 rounded-sm"
              >
                Reset
              </Button>
            )}
          </div>
        </AdminToolbarSection>
      </AdminToolbar>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-sm flex items-center justify-between animate-in slide-in-from-top-2 duration-150 shadow-sm mb-4">
          <div className="text-red-700 text-[10px] font-black uppercase tracking-widest px-2">
            <span className="bg-red-600 text-white px-2 py-0.5 rounded-sm mr-2">{selectedIds.length}</span> PRODUK DIPILIH
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            className="bg-red-600 text-white hover:bg-red-700 h-9 font-black text-[10px] uppercase tracking-widest transition-all px-4 rounded-sm shadow-lg shadow-red-100"
            disabled={isSubmitting}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Hapus Masal
          </Button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 flex flex-col">
          <ProductTable 
            products={products}
            loading={loading}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
            onAdjustStock={handleOpenStockAdjust}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            sorting={sorting}
            onSort={(field) => {
              setSorting(prev => ({
                field,
                dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
              }));
              setCurrentPage(1);
            }}
          />
      </div>        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="p-4 bg-white border border-slate-100 rounded-sm mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">
                Showing <span className="text-slate-900">{products.length}</span> of <span className="text-slate-900">{totalCount}</span> Products
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Rows:</span>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(val) => {
                    if (val) {
                      setPageSize(parseInt(val));
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-16 bg-slate-50 border-slate-100 text-[10px] font-black text-slate-600 rounded-sm">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-100 text-slate-900 shadow-xl min-w-[4rem] rounded-sm">
                    {[10, 25, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()} className="text-[10px] font-black uppercase">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
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

      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-5xl w-[calc(100%-2rem)] bg-white border-slate-200 p-0 overflow-hidden max-h-[96vh] flex flex-col shadow-2xl rounded-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Isi detail produk untuk katalog barang Anda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <ProductForm 
              initialData={selectedProduct}
              loading={isSubmitting}
              onSubmit={handleProductSubmit}
              onCancel={() => setProductModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Produk?"
        description={`Produk "${productToDelete?.name || ''}" akan dihapus dari katalog barang.`}
        onConfirm={confirmDeleteProduct}
        loading={isDeleting}
      />

      <StockAdjustDialog 
        open={stockAdjustOpen}
        onOpenChange={setStockAdjustOpen}
        product={productToAdjust}
        onConfirm={confirmAdjustStock}
        loading={isAdjusting}
      />

      <ConfirmDialog 
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Hapus Masal?"
        description={`Anda akan menghapus ${selectedIds.length} produk sekaligus. Tindakan ini tidak dapat dibatalkan.`}
        variant="danger"
        onConfirm={confirmBulkDelete}
        loading={isSubmitting}
      />
    </div>
  );
}
