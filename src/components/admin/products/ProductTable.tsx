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
      <div className="p-8 text-center text-slate-400">
        Memuat data produk...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        Tidak ada produk ditemukan.
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

  return (
    <div className="overflow-x-auto relative">
      <Table className="w-full text-left whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-200">
            <TableHead className="py-4 px-6 w-10">
              <input 
                type="checkbox" 
                checked={products.length > 0 && selectedIds.length === products.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
            </TableHead>
            <TableHead 
              className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => onSort('sku')}
            >
              <div className="flex items-center gap-1">
                SKU
                {sorting.field === 'sku' ? (
                  sorting.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-2">
                Nama Produk
                {sorting.field === 'name' ? (
                  sorting.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                )}
              </div>
            </TableHead>
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase">
                Merk
            </TableHead>
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-right">Satuan</TableHead>
            <TableHead 
              className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-right cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onSort('price')}
            >
              <div className="flex items-center justify-end gap-1">
                Harga
                {sorting.field === 'price' ? (
                  sorting.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                )}
              </div>
            </TableHead>
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-center">Diskon</TableHead>
            <TableHead 
              className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onSort('stock')}
            >
              <div className="flex items-center justify-center gap-2">
                Stok
                {sorting.field === 'stock' ? (
                  sorting.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                )}
              </div>
            </TableHead>
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {products.map((p) => (
            <TableRow 
              key={p.id} 
              className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50/30' : ''}`}
            >
              <TableCell className="py-4 px-6">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleOne(p.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </TableCell>
              <TableCell className="py-4 px-5 text-sm text-slate-500">{p.sku}</TableCell>
              <TableCell className="py-4 px-5 font-medium text-slate-900 text-sm">
                <div>
                  {p.name}
                  <div className="text-[10px] text-slate-400 font-normal">{p.category?.name}</div>
                </div>
              </TableCell>
              <TableCell className="py-4 px-5 text-slate-500 text-sm">{p.brand?.name || '-'}</TableCell>
              <TableCell className="py-4 px-5 text-slate-500 text-sm">{p.unit?.name || '-'}</TableCell>
              <TableCell className="py-4 px-5 text-slate-900 font-medium text-sm text-right">
                Rp {p.price.toLocaleString('id-ID')}
              </TableCell>
              <TableCell className="py-4 px-5 text-center text-slate-500 text-xs">
                {p.discount_regular > 0 ? `${p.discount_regular}%` : '-'}
              </TableCell>
              <TableCell className="py-4 px-5 text-center">
                <Badge
                  variant="outline"
                  className={`text-[11px] px-2.5 py-1 font-medium border-0 rounded-md ${
                    p.stock <= 0
                      ? 'bg-red-50 text-red-600'
                      : p.stock <= (p.min_stock ?? 10)
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {p.stock} {p.unit?.name}
                </Badge>
                {p.stock > 0 && p.stock <= (p.min_stock ?? 10) && (
                  <div className="text-[10px] text-amber-600 mt-1 font-semibold uppercase" title={`Batas: ${p.min_stock ?? 10}`}>
                    Segera Restock!
                  </div>
                )}
              </TableCell>
              <TableCell className="py-3 px-6 text-center whitespace-nowrap">
                <div className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdjustStock(p)}
                  className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 h-8 px-2"
                  title="Sesuaikan Stok"
                >
                  <PackagePlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(p)}
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 px-2"
                  title="Edit Produk"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(p.id)}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                  title="Hapus Produk"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
