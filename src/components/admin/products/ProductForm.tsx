'use client';

import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* Row 1: Nama Produk & SKU */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nama Produk *</Label>
          <Input
            {...register('name')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4 text-base"
            placeholder="Masukkan nama lengkap produk (Contoh: ABARTUS TANG)"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">SKU / Kode Produk *</Label>
          <Input
            {...register('sku')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:bg-white transition-all px-4"
            placeholder="Contoh: PROD-001"
          />
          {errors.sku && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sku.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Kategori *</Label>
          <Select
            value={categoryId}
            onValueChange={(val: string | null) => setValue('category_id', val || '', { shouldValidate: true })}
            disabled={categories.length === 0}
          >
            <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 focus:ring-blue-600 focus:ring-offset-2 transition-all px-4">
              <SelectValue>
                {categories.find(c => c.id === categoryId)?.name || (categories.length === 0 ? "Memuat..." : "Pilih Kategori")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="focus:bg-slate-50 focus:text-blue-600 py-2.5">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </form>
  );
}
