'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  PackagePlus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Category } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category_id: '',
  });
  const [stockAmount, setStockAmount] = useState('');
  const [stockReason, setStockReason] = useState('RESTOCK');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    
    const [pRes, cRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (pRes.data) setProducts(pRes.data);
    if (cRes.data) setCategories(cRes.data);
    setLoading(false);
  }

  function handleOpenProductModal(product?: Product) {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description ?? '',
        price: product.price.toString(),
        category_id: product.category_id || '',
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        category_id: categories[0]?.id || '',
      });
    }
    setProductModalOpen(true);
  }

  function handleOpenStockModal(product: Product) {
    setSelectedProduct(product);
    setStockAmount('');
    setStockReason('RESTOCK');
    setStockModalOpen(true);
  }

  async function handleSaveProduct() {
    if (!formData.name || !formData.sku || !formData.price || !formData.category_id) {
      toast.error('Harap isi semua field wajib');
      return;
    }

    setActionLoading(true);
    const supabase = createClient();
    const payload = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      price: parseInt(formData.price),
      category_id: formData.category_id,
    };

    try {
      if (selectedProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', selectedProduct.id);
        if (error) throw error;
        toast.success('Produk berhasil diperbarui');
      } else {
        // Insert (stock auto 0 from DB)
        const { error } = await supabase
          .from('products')
          .insert(payload);
        if (error) throw error;
        toast.success('Produk berhasil ditambahkan');
      }
      setProductModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan produk', { description: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus (soft delete) produk ini?')) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus produk');
    } else {
      toast.success('Produk dihapus');
      setProducts(products.filter(p => p.id !== id));
    }
  }

  async function handleAdjustStock() {
    if (!selectedProduct || !stockAmount || isNaN(parseInt(stockAmount))) {
      toast.error('Kuantitas tidak valid');
      return;
    }

    setActionLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const amount = parseInt(stockAmount);
      // Determine adjustment value based on reason
      const adjustment = stockReason === 'RESTOCK' ? amount : -amount;
      
      const payload = {
        product_id: selectedProduct.id,
        user_id: user.id,
        quantity: amount,
        reason: stockReason,
        adjustment_value: adjustment
      };

      // Trigger will auto update the product stock based on adjustment_value
      const { error } = await supabase
        .from('stock_adjustments')
        .insert(payload);

      if (error) throw error;
      
      toast.success('Stok berhasil disesuaikan');
      setStockModalOpen(false);
      fetchData(); // Refresh to get new stock
    } catch (err: any) {
      toast.error('Gagal merubah stok', { description: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Produk & Stok</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola katalog produk dan penyesuaian stok ({products.length} total)
          </p>
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari produk atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-10"
              />
            </div>
            <Button
              onClick={() => handleOpenProductModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Produk Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="border-slate-200 bg-white shadow-sm hidden md:block rounded-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full table-auto text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">SKU</th>
                <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Nama Produk</th>
                <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Kategori</th>
                <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Harga</th>
                <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Stok</th>
                <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-12 bg-slate-200 rounded mx-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 w-20 bg-slate-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 align-middle text-sm text-slate-500">{p.sku}</td>
                    <td className="py-4 px-5 align-middle font-medium text-slate-900 text-sm">{p.name}</td>
                    <td className="py-4 px-5 align-middle">
                      <span className="text-slate-500 text-sm">
                        {p.category?.name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-5 align-middle text-slate-900 font-medium text-sm text-right">
                      Rp {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-5 align-middle text-center">
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2.5 py-1 font-medium border-0 rounded-md ${
                          p.stock <= 0
                            ? 'bg-red-50 text-red-600'
                            : p.stock < 10
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {p.stock}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 align-middle text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStockModal(p)}
                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 h-8 px-2"
                        title="Sesuaikan Stok"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenProductModal(p)}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 px-2"
                        title="Edit Produk"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-slate-200" />
                <Skeleton className="h-3 w-1/2 bg-slate-200" />
              </div>
            ))
          : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Package className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <Card key={p.id} className="border-slate-200 bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 shrink-0 border-0 ${
                              p.stock <= 0
                                ? 'bg-red-50 text-red-600'
                                : p.stock < 10
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            Stok: {p.stock}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{p.sku}</span>
                          <span>•</span>
                          <span>{p.category?.name || '-'}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-blue-600 shrink-0">
                        Rp {p.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStockModal(p)}
                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 h-7 px-2 text-xs"
                      >
                        <PackagePlus className="h-3.5 w-3.5 mr-1" /> Stok
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenProductModal(p)}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-7 px-2 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
      </div>

      {/* Product Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent showCloseButton={true} className="max-w-md w-[calc(100%-2rem)] bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedProduct ? 'Edit Produk' : 'Produk Baru'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Isi detail produk untuk katalog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sku" className="text-slate-300">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="PROD-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-300">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-slate-300">Kategori *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({ ...formData, category_id: val || '' })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-slate-300">Harga (Rp) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductModalOpen(false)}
              className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Modal */}
      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent showCloseButton={true} className="max-w-sm w-[calc(100%-2rem)] bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Sesuaikan Stok</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedProduct?.name} (Stok saat ini: {selectedProduct?.stock})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-slate-300">Tipe Penyesuaian</Label>
              <Select value={stockReason} onValueChange={(v) => setStockReason(v || 'RESTOCK')}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTOCK">Restock (Tambah)</SelectItem>
                  <SelectItem value="DAMAGE">Rusak (Kurang)</SelectItem>
                  <SelectItem value="CORRECTION">Koreksi (Kurang)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-slate-300">Jumlah {stockReason === 'RESTOCK' ? 'Tambahan' : 'Pengurangan'}</Label>
              <Input
                id="amount"
                type="number"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                min="1"
                placeholder="Contoh: 10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockModalOpen(false)}
              className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={actionLoading || !stockAmount}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
