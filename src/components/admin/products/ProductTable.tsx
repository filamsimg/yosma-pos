'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PackagePlus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Product } from '@/types';
import { AdminTable } from '@/components/ui/admin/data-table';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (product: Product) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
  sorting: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onAdjustStock,
  selectedIds,
  onSelectionChange,
  loading,
  sorting,
  onSort,
}: ProductTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600">
        Memuat data produk...
      </div>
    );
  }


  const toggleAll = () => {
    if (selectedIds.length === products.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const headers = [
    <input 
      type="checkbox" 
      checked={products.length > 0 && selectedIds.length === products.length}
      onChange={toggleAll}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
    />,
    <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={() => onSort('sku')}>
      SKU {sorting.field === 'sku' && (sorting.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </div>,
    <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={() => onSort('name')}>
      Produk {sorting.field === 'name' && (sorting.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </div>,
    "Merk",
    "Satuan",
    <div className="text-center cursor-pointer" onClick={() => onSort('price')}>Harga</div>,
    <div className="text-center">Stok</div>,
    <div className="text-center">Aksi</div>
  ];

  return (
    <AdminTable headers={headers}>
      {products.length === 0 ? (
        <TableRow>
          <TableCell colSpan={8} className="py-20 text-center opacity-60">
            <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada produk ditemukan</p>
          </TableCell>
        </TableRow>
      ) : (
        products.map((p) => (
          <TableRow 
            key={p.id} 
            className={selectedIds.includes(p.id) ? 'bg-blue-50/30' : ''}
          >
            <TableCell className="px-4 py-4">
              <input 
                type="checkbox" 
                checked={selectedIds.includes(p.id)}
                onChange={() => toggleOne(p.id)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
            </TableCell>
            <TableCell className="px-4 py-4 text-[11px] font-black text-slate-600 uppercase tracking-tight">{p.sku}</TableCell>
            <TableCell className="px-4 py-4">
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{p.name}</span>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mt-0.5">{p.category?.name}</span>
              </div>
            </TableCell>
            <TableCell className="px-4 py-4 text-[11px] font-black text-slate-600 uppercase tracking-tighter">{p.brand?.name || '-'}</TableCell>
            <TableCell className="px-4 py-4 text-[11px] font-black text-slate-600 uppercase tracking-tighter">{p.unit?.name || '-'}</TableCell>
            <TableCell className="px-4 py-4 text-right">
              <span className="font-black text-slate-900 text-sm tabular-nums">Rp {p.price.toLocaleString('id-ID')}</span>
            </TableCell>
            <TableCell className="px-4 py-4 text-center">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-3 py-1 font-black border-none rounded-sm uppercase tracking-tighter",
                  p.stock <= 0 ? 'bg-red-50 text-red-600' : p.stock <= (p.min_stock ?? 10) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                )}
              >
                {p.stock} {p.unit?.name}
              </Badge>
            </TableCell>
            <TableCell className="px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdjustStock(p)}
                  className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 h-8 w-8 p-0"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(p)}
                  className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(p.id)}
                  className="text-slate-600 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </AdminTable>
  );
}
