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
import { createUnit, deleteUnit } from '@/lib/actions/products';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { normalizeTypeName } from '@/lib/utils/string-utils';
import type { Unit } from '@/types';

interface UnitSelectProps {
  value: string;
  onValueChange: (value: string | null) => void;
}

export function UnitSelect({ value, onValueChange }: UnitSelectProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Unit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  async function fetchUnits() {
    const supabase = createClient();
    const { data } = await supabase.from('units').select('*').order('name');
    if (data) setUnits(data);
    setLoading(false);
  }

  async function handleAddUnit() {
    const normalizedName = normalizeTypeName(newUnitName.trim().toUpperCase());
    if (!normalizedName) return;
    setSubmitting(true);
    const result = await createUnit(normalizedName);
    if (result.error) {
      toast.error('Gagal menambah satuan', { description: result.error });
    } else if (result.data) {
      const newUnit = result.data as Unit;
      setUnits([...units, newUnit].sort((a, b) => a.name.localeCompare(b.name)));
      onValueChange(newUnit.id);
      setIsAdding(false);
      setNewUnitName('');
      toast.success('Satuan berhasil ditambahkan');
    }
    setSubmitting(false);
  }

  async function handleDeleteUnit(e: React.MouseEvent, u: Unit) {
    e.stopPropagation();
    e.preventDefault();
    setItemToDelete(u);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteUnit() {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const result = await deleteUnit(itemToDelete.id);
    if (result.error) {
      toast.error('Gagal menghapus satuan', { description: result.error });
    } else {
      setUnits(units.filter((u) => u.id !== itemToDelete.id));
      if (value === itemToDelete.id) onValueChange(null);
      toast.success('Satuan berhasil dihapus');
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
            placeholder="PCS, BTL..."
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value.toUpperCase())}
            autoFocus
            className="bg-white border-slate-200 text-slate-900 h-12 px-4 uppercase focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-sm transition-all"
          />
          <Button 
            size="sm" 
            onClick={handleAddUnit} 
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
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-12 px-4 focus:ring-blue-600 focus:ring-offset-2 transition-all hover:bg-slate-100/50">
              <SelectValue>
                {units.find(u => u.id === value)?.name || (loading ? "Memuat..." : "Pilih Satuan")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-lg overflow-hidden">
              {units.map((u) => (
                <SelectItem 
                  key={u.id} 
                  value={u.id} 
                  className="focus:bg-blue-50 focus:text-blue-600 cursor-pointer py-2.5 px-4 transition-colors group/item flex items-center justify-between"
                >
                  <span>{u.name}</span>
                  <button
                    onClick={(e) => handleDeleteUnit(e, u)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                    title="Hapus Satuan"
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
            title="Tambah Satuan Baru"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Satuan?"
        description={`Satuan "${itemToDelete?.name}" akan dihapus permanen. Produk yang menggunakannya akan menjadi tanpa satuan.`}
        onConfirm={confirmDeleteUnit}
        loading={isDeleting}
      />
    </div>
  );
}
