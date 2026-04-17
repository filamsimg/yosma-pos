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
import { createUnit } from '@/lib/actions/products';
import { toast } from 'sonner';
import type { Unit } from '@/types';

interface UnitSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function UnitSelect({ value, onValueChange }: UnitSelectProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!newUnitName.trim()) return;
    setSubmitting(true);
    const result = await createUnit(newUnitName.trim().toUpperCase());
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

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          {isAdding ? (
            <div className="flex gap-1">
              <Input
                placeholder="PCS, BTL, BOX..."
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                autoFocus
                className="bg-white/5 border-white/10 text-white h-9 uppercase"
              />
              <Button 
                size="sm" 
                onClick={handleAddUnit} 
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
                  <SelectValue placeholder={loading ? "Memuat..." : "Pilih Satuan"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
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
