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
import { Search, Plus, Package, ChevronLeft, ChevronRight, Trash2 as TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { ProductTable } from '@/components/admin/products/ProductTable';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { ImportDialog } from '@/components/admin/products/ImportDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StockAdjustDialog } from '@/components/admin/products/StockAdjustDialog';
import { 
  createProduct, 
  updateProduct, 
  softDeleteProduct, 
  adjustStock,
  getPaginatedProducts,
  bulkDeleteProducts
} from '@/lib/actions/products';
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
    <div className="space-y-4">
      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Produk & Stok</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola katalog produk dengan Merk, Satuan, dan Harga Diskon.
        </p>
      </div>

      {/* Actions section (Search, Import, Create) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari produk, SKU, atau merk..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-white border-slate-200 text-slate-900 h-10 w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <ImportDialog onSuccess={fetchData} />
          <Button
            onClick={() => handleOpenForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shadow-md shadow-blue-100 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Produk Baru</span>
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="text-blue-700 text-sm font-medium px-2">
            <span className="font-bold">{selectedIds.length}</span> produk dipilih
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
          <ProductTable 
            products={products}
            loading={loading}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
            onAdjustStock={handleOpenStockAdjust}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            categoryFilter={categoryFilter}
            setCategoryFilter={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
            brandFilter={brandFilter}
            setBrandFilter={(val) => { setBrandFilter(val); setCurrentPage(1); }}
            stockFilter={stockFilter}
            setStockFilter={(val) => { setStockFilter(val); setCurrentPage(1); }}
            categories={categories}
            brands={brands}
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
                Menampilkan <span className="text-slate-900 font-bold">{products.length}</span> dari <span className="text-slate-900 font-bold">{totalCount}</span> produk
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
              categories={categories}
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
