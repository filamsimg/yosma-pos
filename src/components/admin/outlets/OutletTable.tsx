"use client"

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Store, 
  MapPin, 
  Phone, 
  Calendar, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { VISIT_DAYS, VISIT_FREQUENCIES, OUTLET_STATUS_MAP } from '@/lib/constants';
import type { Outlet } from '@/types';
import { cn } from '@/lib/utils';
import { AdminTable } from '@/components/ui/admin/data-table';

interface OutletTableProps {
  outlets: Outlet[];
  onEdit: (outlet: Outlet) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
  sorting: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function OutletTable({
  outlets,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  loading,
  sorting,
  onSort,
}: OutletTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Memuat data outlet...</p>
      </div>
    );
  }

  const toggleAll = () => {
    if (selectedIds.length === outlets.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(outlets.map(o => o.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getDayLabel = (value: string | null) => {
    return VISIT_DAYS.find(d => d.value === value)?.label || '-';
  };

  const getFreqLabel = (value: string | null) => {
    return VISIT_FREQUENCIES.find(f => f.value === value)?.label || '-';
  };

  const headers = [
    <input 
      type="checkbox" 
      checked={outlets.length > 0 && selectedIds.length === outlets.length}
      onChange={toggleAll}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
    />,
    <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => onSort('name')}>
      Outlet
      {sorting.field === 'name' ? (
        sorting.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-90" />
      )}
    </div>,
    <div className="text-center">Kota</div>,
    <div className="text-center">Alamat</div>,
    <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => onSort('visit_day')}>
      Jadwal
      {sorting.field === 'visit_day' ? (
        sorting.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-90" />
      )}
    </div>,
    <div className="text-center">Kontak</div>,
    <div className="text-center">Status</div>,
    <div className="text-center">Aksi</div>
  ];

  return (
    <AdminTable headers={headers}>
      {outlets.map((o) => (
        <TableRow 
          key={o.id} 
          className={cn(selectedIds.includes(o.id) && "bg-blue-50/30")}
        >
          <TableCell className="px-4">
            <input 
              type="checkbox" 
              checked={selectedIds.includes(o.id)}
              onChange={() => toggleOne(o.id)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="font-black text-slate-800 text-xs uppercase tracking-tight flex items-center gap-2">
                  {o.type ? `${o.type} ${o.name}` : o.name}
                  {o.assigned_sales && (
                    <Badge variant="outline" className="text-[8px] font-black border-none text-blue-600 bg-blue-50 py-0 px-1.5 h-3.5 rounded-sm">
                      {o.assigned_sales}
                    </Badge>
                  )}
                </div>
                <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter mt-0.5">ID: {o.id.split('-')[0]}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              {o.city || '-'}
            </span>
          </TableCell>
          <TableCell className="px-4 py-3">
            {o.address ? (
              <div className="flex items-start gap-1.5 max-w-[200px]">
                <MapPin className="h-3 w-3 text-slate-600 mt-0.5 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 whitespace-normal line-clamp-2 uppercase tracking-tight">{o.address}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-50">No Address</span>
            )}
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
                <Calendar className="h-3 w-3 text-blue-500" />
                {getDayLabel(o.visit_day)}
              </div>
              <Badge variant="outline" className="text-[8px] w-fit font-black border-none text-slate-400 bg-slate-50 py-0 px-2 rounded-sm uppercase">
                {getFreqLabel(o.visit_frequency)}
              </Badge>
            </div>
          </TableCell>
          <TableCell className="px-4 py-3">
            {o.phone ? (
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-sm bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-black text-slate-700 tabular-nums">{o.phone}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-50">No Contact</span>
            )}
          </TableCell>
          <TableCell className="px-4 py-3">
             {o.status && (
                <Badge className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm",
                  OUTLET_STATUS_MAP[o.status as keyof typeof OUTLET_STATUS_MAP]?.color || "bg-slate-100 text-slate-500"
                )}>
                  {OUTLET_STATUS_MAP[o.status as keyof typeof OUTLET_STATUS_MAP]?.label || o.status}
                </Badge>
              )}
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(o)}
                className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-sm"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(o.id)}
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
      {outlets.length === 0 && !loading && (
        <TableRow>
          <TableCell colSpan={6} className="py-20 text-center opacity-60">
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <Store className="h-10 w-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">Belum ada data outlet</p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </AdminTable>
  );
}
