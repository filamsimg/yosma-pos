'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productSchema, type ProductFormValues } from '@/lib/validations/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandSelect } from './BrandSelect';
import { UnitSelect } from './UnitSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCategory, deleteCategory } from '@/lib/actions/products';
import { 
  Plus, 
  Check, 
  Loader2, 
  Trash2, 
  Package, 
  Tag, 
  Boxes, 
  CircleDollarSign, 
  CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { normalizeTypeName } from '@/lib/utils/string-utils';
import type { Category, Product } from '@/types';

interface ProductFormProps {
  initialData?: Product | null;
  categories: Category[];
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: Omit<ProductFormProps, 'categories'>) {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof productSchema>, any, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      discount_regular: initialData?.discount_regular || 0,
      category_id: initialData?.category_id || '',
      brand_id: initialData?.brand_id || '',
      unit_id: initialData?.unit_id || '',
      min_stock: initialData?.min_stock ?? 10,
    },
  });

  const categoryId = watch('category_id') || '';
  const brandId = watch('brand_id') || '';
  const unitId = watch('unit_id') || '';

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setFetchingCategories(true);
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) {
      setLocalCategories(data);
      // If we're creating new and have no category selected, select the first one
      if (!initialData && !categoryId && data.length > 0) {
        setValue('category_id', data[0].id);
      }
    }
    setFetchingCategories(false);
  }

  async function handleAddCategory() {
    const normalizedName = normalizeTypeName(newCategoryName.trim().toUpperCase());
    if (!normalizedName) return;
    setSubmittingCategory(true);
    const result = await createCategory(normalizedName);
    if (result.error) {
      toast.error('Gagal menambah kategori', { description: result.error });
    } else if (result.data) {
      const newCat = result.data as Category;
      const updated = [...localCategories, newCat].sort((a, b) => a.name.localeCompare(b.name));
      setLocalCategories(updated);
      setValue('category_id', newCat.id, { shouldValidate: true });
      setIsAddingCategory(false);
      setNewCategoryName('');
      toast.success('Kategori berhasil ditambahkan');
    }
    setSubmittingCategory(false);
  }

  async function handleDeleteCategory(e: React.MouseEvent, c: Category) {
    e.stopPropagation();
    e.preventDefault();
    setItemToDelete(c);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteCategory() {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const result = await deleteCategory(itemToDelete.id);
    if (result.error) {
      toast.error('Gagal menghapus kategori', { description: result.error });
    } else {
      setLocalCategories(localCategories.filter((c) => c.id !== itemToDelete.id));
      if (categoryId === itemToDelete.id) setValue('category_id', '', { shouldValidate: true });
      toast.success('Kategori berhasil dihapus');
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-2 max-w-4xl mx-auto">
      <div className="space-y-10">
        
        {/* Section 1: Informasi Produk */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Informasi Utama Produk</h3>
          </div>

          <div className="grid gap-8">
            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Nama Lengkap Produk *</Label>
              <Input
                {...register('name')}
                onChange={(e) => setValue('name', e.target.value.toUpperCase())}
                className="bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 px-5 shadow-sm rounded-xl uppercase font-semibold text-base"
                placeholder="CONTOH: ABARTUS TANG"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">SKU / Kode Produk</Label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                  <Input
                    {...register('sku')}
                    className="pl-12 bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 font-mono font-bold uppercase text-base rounded-xl"
                    placeholder="AUTO-GENERATED (YAP-####)"
                  />
                </div>
                {errors.sku && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.sku.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Kategori Produk *</Label>
                {isAddingCategory ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <Input
                      placeholder="NAMA BARU..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      autoFocus
                      className="bg-white border-input text-slate-900 h-12 px-4 focus-visible:ring-blue-600 rounded-xl shadow-sm uppercase font-bold"
                    />
                    <Button 
                      type="button"
                      size="icon" 
                      onClick={handleAddCategory} 
                      disabled={submittingCategory}
                      className="bg-blue-600 hover:bg-blue-700 h-12 w-12 shrink-0 rounded-xl shadow-sm"
                    >
                      {submittingCategory ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Check className="h-5 w-5 text-white" />}
                    </Button>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsAddingCategory(false)}
                      className="text-slate-500 hover:text-red-600 h-12 px-2 font-bold"
                    >
                      BATAL
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Select
                      value={categoryId}
                      onValueChange={(val: string | null) => setValue('category_id', val || '', { shouldValidate: true })}
                      disabled={localCategories.length === 0}
                    >
                      <SelectTrigger className="bg-white border-input text-slate-900 h-12 focus:ring-blue-600 px-5 flex-1 rounded-xl font-medium">
                        <SelectValue>
                          {localCategories.find(c => c.id === categoryId)?.name || (fetchingCategories ? "Memuat..." : "Pilih Kategori")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-input text-slate-900 shadow-xl rounded-xl">
                        {localCategories.map((c) => (
                          <SelectItem 
                            key={c.id} 
                            value={c.id} 
                            className="focus:bg-slate-50 focus:text-blue-600 py-3 px-4 flex items-center justify-between group/item"
                          >
                            <span>{c.name}</span>
                            <button
                              onClick={(e) => handleDeleteCategory(e, c)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button"
                      size="icon" 
                      onClick={() => setIsAddingCategory(true)}
                      className="h-12 w-12 shrink-0 bg-white border border-input text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                {errors.category_id && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.category_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Merk / Brand *</Label>
                <BrandSelect 
                  value={brandId} 
                  onValueChange={(val: string | null) => setValue('brand_id', val || '', { shouldValidate: true })} 
                />
                {errors.brand_id && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.brand_id.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Satuan Produk *</Label>
                <UnitSelect 
                  value={unitId} 
                  onValueChange={(val: string | null) => setValue('unit_id', val || '', { shouldValidate: true })} 
                />
                {errors.unit_id && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.unit_id.message}</p>}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Deskripsi / Keterangan</Label>
              <Input
                {...register('description')}
                className="bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 px-5 shadow-sm rounded-xl"
                placeholder="TAMBAHKAN INFORMASI TAMBAHAN PRODUK..."
              />
            </div>
          </div>
        </section>

        {/* Section 2: Harga & Stok */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Manajemen Harga & Stok</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Harga Satuan (Rp) *</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-600">Rp</div>
                <Input
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  onFocus={(e) => e.target.select()}
                  className="pl-12 bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 font-black text-lg rounded-xl shadow-sm"
                  placeholder="0"
                />
              </div>
              {errors.price && <p className="text-xs text-red-600 mt-1 font-medium ml-1">{errors.price.message}</p>}
            </div>

            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Diskon Reguler (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  {...register('discount_regular', { valueAsNumber: true })}
                  onFocus={(e) => e.target.select()}
                  className="bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 font-bold text-lg rounded-xl shadow-sm pr-12 text-center"
                  placeholder="0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-600">%</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Minimum Stok (Warning)</Label>
              <div className="relative">
                <Boxes className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                <Input
                  type="number"
                  {...register('min_stock', { valueAsNumber: true })}
                  onFocus={(e) => e.target.select()}
                  className="pl-12 bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 font-bold text-lg rounded-xl shadow-sm"
                  placeholder="10"
                />
              </div>
              <p className="text-[10px] text-slate-600 ml-1">Peringatan saat stok di bawah angka ini.</p>
            </div>
          </div>
        </section>

      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-8 mt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-12 px-8 font-bold text-xs uppercase tracking-widest rounded-sm transition-all order-2 sm:order-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 rounded-sm flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {initialData ? 'SIMPAN PERUBAHAN' : 'TAMBAH PRODUK BARU'}
        </Button>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Kategori?"
        description={`Kategori "${itemToDelete?.name}" akan dihapus permanen. Produk yang menggunakan kategori ini akan tetap ada namun tanpa kategori.`}
        onConfirm={confirmDeleteCategory}
        loading={isDeleting}
      />
    </form>
  );
}
