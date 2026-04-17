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
    },
  });

  const categoryId = watch('category_id');
  const brandId = watch('brand_id');
  const unitId = watch('unit_id');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name & SKU */}
        <div className="space-y-2">
          <Label className="text-slate-300">Nama Produk *</Label>
          <Input
            {...register('name')}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Contoh: ABARTUS TANG"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">SKU / Kode *</Label>
          <Input
            {...register('sku')}
            className="bg-white/5 border-white/10 text-white"
            placeholder="PROD-001"
          />
          {errors.sku && <p className="text-xs text-red-400">{errors.sku.message}</p>}
        </div>

        {/* Brand & Category */}
        <div className="space-y-2">
          <Label className="text-slate-300">Merk *</Label>
          <BrandSelect 
            value={brandId} 
            onValueChange={(val) => setValue('brand_id', val, { shouldValidate: true })} 
          />
          {errors.brand_id && <p className="text-xs text-red-400">{errors.brand_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Kategori *</Label>
          <Select
            value={categoryId}
            onValueChange={(val) => setValue('category_id', val, { shouldValidate: true })}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-xs text-red-400">{errors.category_id.message}</p>}
        </div>

        {/* Price & Unit */}
        <div className="space-y-2">
          <Label className="text-slate-300">Harga Satuan (Rp) *</Label>
          <Input
            type="number"
            {...register('price')}
            className="bg-white/5 border-white/10 text-white"
          />
          {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Satuan *</Label>
          <UnitSelect 
            value={unitId} 
            onValueChange={(val) => setValue('unit_id', val, { shouldValidate: true })} 
          />
          {errors.unit_id && <p className="text-xs text-red-400">{errors.unit_id.message}</p>}
        </div>

        {/* Discount & Extras */}
        <div className="space-y-2">
          <Label className="text-slate-300">Diskon Reguler (%)</Label>
          <Input
            type="number"
            {...register('discount_regular')}
            className="bg-white/5 border-white/10 text-white"
            placeholder="0"
          />
          {errors.discount_regular && <p className="text-xs text-red-400">{errors.discount_regular.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Keterangan / Deskripsi</Label>
        <Input
          {...register('description')}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Simpan Produk
        </Button>
      </div>
    </form>
  );
}
