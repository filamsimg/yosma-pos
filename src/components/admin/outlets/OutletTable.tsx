'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Store, MapPin, Phone, Calendar, Briefcase } from 'lucide-react';
import { VISIT_DAYS, VISIT_FREQUENCIES } from '@/lib/constants';
import type { Outlet } from '@/types';

interface OutletTableProps {
  outlets: Outlet[];
  onEdit: (outlet: Outlet) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

export function OutletTable({
  outlets,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  loading,
}: OutletTableProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
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

  return (
    <div className="overflow-x-auto relative">
      <Table className="w-full text-left whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-200">
            <TableHead className="py-4 px-5 w-10">
              <input 
                type="checkbox" 
                checked={outlets.length > 0 && selectedIds.length === outlets.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
            </TableHead>
            <TableHead className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase">Outlet</TableHead>
            <TableHead className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase">Alamat</TableHead>
            <TableHead className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase">Jadwal</TableHead>
            <TableHead className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase">Kontak</TableHead>
            <TableHead className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {outlets.map((o) => (
            <TableRow 
              key={o.id} 
              className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(o.id) ? 'bg-blue-50/30' : ''}`}
            >
              <TableCell className="py-4 px-5">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(o.id)}
                  onChange={() => toggleOne(o.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </TableCell>
              <TableCell className="py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {o.name}
                      {o.type && (
                        <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-600 bg-slate-50 py-0 px-1.5 h-4">
                          {o.type}
                        </Badge>
                      )}
                      {o.assigned_sales && (
                        <Badge variant="outline" className="text-[9px] font-black border-blue-100 text-blue-600 bg-blue-50 py-0 px-1.5 h-4">
                          <Briefcase className="h-2 w-2 mr-1" />
                          {o.assigned_sales}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">ID: {o.id.split('-')[0]}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 px-5">
                {o.address ? (
                  <div className="flex items-start gap-1.5 max-w-[250px]">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-600 whitespace-normal line-clamp-2">{o.address}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300 italic">Tidak ada alamat</span>
                )}
              </TableCell>
              <TableCell className="py-4 px-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-tight">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    {getDayLabel(o.visit_day)}
                  </div>
                  <Badge variant="outline" className="text-[9px] w-fit font-bold border-slate-200 text-slate-400 bg-slate-50 py-0 px-2 rounded-lg">
                    {getFreqLabel(o.visit_frequency)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-4 px-5">
                {o.phone ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{o.phone}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300 italic">Tidak ada kontak</span>
                )}
              </TableCell>
              <TableCell className="py-4 px-5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(o)}
                    className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(o.id)}
                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {outlets.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Store className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Belum ada data outlet</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
