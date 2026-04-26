'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, Loader2, Trash2 } from 'lucide-react';
import { createBrand, deleteBrand } from '@/lib/actions/products';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { normalizeTypeName } from '@/lib/utils/string-utils';
import type { Brand } from '@/types';

interface BrandSelectProps {
  value: string;
  onValueChange: (value: string | null) => void;
}

export function BrandSelect({ value, onValueChange }: BrandSelectProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    const supabase = createClient();
    const { data } = await supabase.from('brands').select('*').order('name');
    if (data) setBrands(data);
    setLoading(false);
  }

  async function handleAddBrand() {
    const normalizedName = normalizeTypeName(newBrandName.trim().toUpperCase());
    if (!normalizedName) return;
    setSubmitting(true);
    const result = await createBrand(normalizedName);
    if (result.error) {
      toast.error('Gagal menambah merk', { description: result.error });
    } else if (result.data) {
      const newBrand = result.data as Brand;
      setBrands([...brands, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
      onValueChange(newBrand.id);
      setIsAdding(false);
      setNewBrandName('');
      toast.success('Merk berhasil ditambahkan');
    }
    setSubmitting(false);
  }

  async function handleDeleteBrand(e: React.MouseEvent, b: Brand) {
    e.stopPropagation();
    e.preventDefault();
    setItemToDelete(b);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteBrand() {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const result = await deleteBrand(itemToDelete.id);
    if (result.error) {
      toast.error('Gagal menghapus merk', { description: result.error });
    } else {
      setBrands(brands.filter((b) => b.id !== itemToDelete.id));
      if (value === itemToDelete.id) onValueChange(null);
      toast.success('Merk berhasil dihapus');
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }

  return (
    <div className="w-full">
      {isAdding ? (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
          <Input
            placeholder="Nama merk baru..."
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBrand();
              }
            }}
            autoFocus
            className="bg-white border-slate-200 text-slate-900 h-12 px-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-sm transition-all uppercase"
          />
          <Button 
            size="sm" 
            onClick={handleAddBrand} 
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 h-12 px-4 shrink-0 shadow-sm transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Check className="h-5 w-5 text-white" />}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsAdding(false)}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-12 px-3 font-medium transition-all"
          >
            Batal
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 group">
          <Select value={value} onValueChange={(val: string | null) => onValueChange(val)}>
            <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 px-4 focus:ring-blue-600 focus:ring-offset-2 transition-all hover:bg-slate-100/50">
              <SelectValue>
                {brands.find(b => b.id === value)?.name || (loading ? "Memuat..." : "Pilih Merk")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-lg overflow-hidden">
              {brands.map((b) => (
                <SelectItem 
                  key={b.id} 
                  value={b.id} 
                  className="focus:bg-blue-50 focus:text-blue-600 cursor-pointer py-2.5 px-4 transition-colors group/item flex items-center justify-between"
                >
                  <span>{b.name}</span>
                  <button
                    onClick={(e) => handleDeleteBrand(e, b)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                    title="Hapus Merk"
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
            onClick={() => setIsAdding(true)}
            className="h-12 w-12 shrink-0 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm rounded-lg"
            title="Tambah Merk Baru"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Merk?"
        description={`Merk "${itemToDelete?.name}" akan dihapus permanen. Produk yang menggunakannya akan menjadi tanpa merk.`}
        onConfirm={confirmDeleteBrand}
        loading={isDeleting}
      />
    </div>
  );
}
