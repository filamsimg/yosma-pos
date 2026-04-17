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
import { Plus, Check, Loader2 } from 'lucide-react';
import { createBrand } from '@/lib/actions/products';
import { toast } from 'sonner';
import type { Brand } from '@/types';

interface BrandSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function BrandSelect({ value, onValueChange }: BrandSelectProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!newBrandName.trim()) return;
    setSubmitting(true);
    const result = await createBrand(newBrandName.trim());
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

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          {isAdding ? (
            <div className="flex gap-1">
              <Input
                placeholder="Nama merk baru..."
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                autoFocus
                className="bg-white/5 border-white/10 text-white h-9"
              />
              <Button 
                size="sm" 
                onClick={handleAddBrand} 
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 h-9"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white h-9"
              >
                Batal
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue placeholder={loading ? "Memuat..." : "Pilih Merk"} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAdding(true)}
                className="border-white/10 text-slate-400 hover:text-white h-9"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
