'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Plus, Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  categories,
  onSubmit,
  onCancel,
  loading,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      discount_regular: initialData?.discount_regular || 0,
      category_id: initialData?.category_id || (categories[0]?.id || ''),
      brand_id: initialData?.brand_id || '',
      unit_id: initialData?.unit_id || '',
    } as ProductFormValues,
  });

  const categoryId = watch('category_id') || '';
  const brandId = watch('brand_id') || '';
  const unitId = watch('unit_id') || '';

  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setSubmittingCategory(true);
    const result = await createCategory(newCategoryName.trim());
    if (result.error) {
      toast.error('Gagal menambah kategori', { description: result.error });
    } else if (result.data) {
      const newCat = result.data as Category;
      setLocalCategories([...localCategories, newCat].sort((a, b) => a.name.localeCompare(b.name)));
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* Row 1: Nama Produk & SKU */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nama Produk *</Label>
          <Input
            {...register('name')}
            onChange={(e) => setValue('name', e.target.value.toUpperCase())}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4 text-base uppercase"
            placeholder="Masukkan nama lengkap produk (Contoh: ABARTUS TANG)"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">SKU / Kode Produk *</Label>
          <Input
            {...register('sku')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4"
            placeholder="KOSONGKAN UNTUK AUTO-SKU (YAP-####)"
          />
          {errors.sku && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sku.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Kategori *</Label>
          {isAddingCategory ? (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
              <Input
                placeholder="Nama kategori baru..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                autoFocus
                className="bg-white border-slate-200 text-slate-900 h-12 px-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-sm transition-all uppercase"
              />
              <Button 
                type="button"
                size="sm" 
                onClick={handleAddCategory} 
                disabled={submittingCategory}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-4 shrink-0 shadow-sm transition-all"
              >
                {submittingCategory ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Check className="h-5 w-5 text-white" />}
              </Button>
              <Button 
                type="button"
                size="sm" 
                variant="ghost" 
                onClick={() => setIsAddingCategory(false)}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-12 px-3 font-medium transition-all"
              >
                Batal
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Select
                value={categoryId}
                onValueChange={(val: string | null) => setValue('category_id', val || '', { shouldValidate: true })}
                disabled={localCategories.length === 0}
              >
                <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus:ring-blue-600 focus:ring-offset-2 transition-all px-4 flex-1">
                  <SelectValue>
                    {localCategories.find(c => c.id === categoryId)?.name || (localCategories.length === 0 ? "Memuat..." : "Pilih Kategori")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                  {localCategories.map((c) => (
                    <SelectItem 
                      key={c.id} 
                      value={c.id} 
                      className="focus:bg-slate-50 focus:text-blue-600 py-2.5 px-4 flex items-center justify-between group/item"
                    >
                      <span>{c.name}</span>
                      <button
                        onClick={(e) => handleDeleteCategory(e, c)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                        title="Hapus Kategori"
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
                className="h-12 w-12 shrink-0 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm rounded-lg"
                title="Tambah Kategori Baru"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}
          {errors.category_id && <p className="text-xs text-red-600 mt-1 font-medium">{errors.category_id.message}</p>}
        </div>

        {/* Row 2: Merk & Satuan */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Merk *</Label>
          <BrandSelect 
            value={brandId} 
            onValueChange={(val: string | null) => setValue('brand_id', val || '', { shouldValidate: true })} 
          />
          {errors.brand_id && <p className="text-xs text-red-600 mt-1 font-medium">{errors.brand_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Satuan *</Label>
          <UnitSelect 
            value={unitId} 
            onValueChange={(val: string | null) => setValue('unit_id', val || '', { shouldValidate: true })} 
          />
          {errors.unit_id && <p className="text-xs text-red-600 mt-1 font-medium">{errors.unit_id.message}</p>}
        </div>

        {/* Row 3: Harga & Diskon */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Harga Satuan (Rp) *</Label>
          <Input
            type="number"
            {...register('price', { valueAsNumber: true })}
            onFocus={(e) => e.target.select()}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4 font-semibold text-lg"
            placeholder="0"
          />
          {errors.price && <p className="text-xs text-red-600 mt-1 font-medium">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Diskon Reguler (%)</Label>
          <Input
            type="number"
            {...register('discount_regular', { valueAsNumber: true })}
            onFocus={(e) => e.target.select()}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4"
            placeholder="0"
          />
          {errors.discount_regular && <p className="text-xs text-red-600 mt-1 font-medium">{errors.discount_regular.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Keterangan / Deskripsi</Label>
        <Input
          {...register('description')}
          className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4"
          placeholder="Tambahkan informasi tambahan produk..."
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 font-medium"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 font-semibold shadow-md shadow-blue-100 transition-all active:scale-95"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Simpan Produk
        </Button>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Kategori?"
        description={`Kategori "${itemToDelete?.name}" akan dihapus permanen. Produk yang menggunakannya akan menjadi tanpa kategori.`}
        onConfirm={confirmDeleteCategory}
        loading={isDeleting}
      />
    </form>
  );
}
