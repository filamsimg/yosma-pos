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
import { Search, Plus, Package } from 'lucide-react';
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
  adjustStock 
} from '@/lib/actions/products';
import { type Product, type Category } from '@/types';
import { type ProductFormValues } from '@/lib/validations/product';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    
    // Fetch products with all relations
    const [pRes, cRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*), unit:units(*)')
        .eq('is_active', true)
        .order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (pRes.data) setProducts(pRes.data);
    if (cRes.data) setCategories(cRes.data);
    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

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

    if (result.error) {
      toast.error('Gagal menyesuaikan stok');
    } else {
      toast.success('Stok berhasil diperbarui');
      fetchData();
      setStockAdjustOpen(false);
    }
    setIsAdjusting(false);
  }

  return (
    <div className="space-y-4">
      {/* Header section with Search & Create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Produk & Stok</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola katalog produk dengan Merk, Satuan, dan Harga Diskon.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari produk, SKU, atau merk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 h-10 w-full sm:w-64"
            />
          </div>
          <ImportDialog onSuccess={fetchData} />
          <Button
            onClick={() => handleOpenForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shadow-md shadow-blue-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Produk Baru</span>
            <span className="sm:hidden">Baru</span>
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden rounded-md">
        <ProductTable 
          products={filteredProducts}
          loading={loading}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          onAdjustStock={handleOpenStockAdjust}
        />
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
        description={`Produk "${productToDelete?.name}" akan dihapus dari katalog barang.`}
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
    </div>
  );
}
