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
import { Eye, Clock, Calendar, Store } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TRANSACTION_STATUS_MAP } from '@/lib/constants';
import { AdminTable } from '@/components/ui/admin/data-table';

interface TransactionTableProps {
  data: any[];
  loading?: boolean;
  onView: (item: any) => void;
}

export function TransactionTable({ data, loading, onView }: TransactionTableProps) {

  if (loading) {
    return (
      <div className="p-12 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Memuat data transaksi...</p>
      </div>
    );
  }

  const headers = [
    "Invoice & Outlet",
    <div className="text-right">Total</div>,
    <div className="text-center">Status</div>,
    "Waktu",
    <div className="text-center">Aksi</div>
  ];

  return (
    <AdminTable headers={headers}>
      {data.length === 0 ? (
        <TableRow>
          <TableCell colSpan={5} className="py-20 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada transaksi ditemukan</p>
          </TableCell>
        </TableRow>
      ) : (
        data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="px-4 py-4">
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-sm uppercase tracking-tight">
                   {item.invoice_number}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">
                   <Store className="h-3 w-3" />
                   {item.outlet?.name || 'Toko Umum'}
                </div>
              </div>
            </TableCell>
            
            <TableCell className="px-4 py-4 text-right">
              <span className="font-black text-blue-600 text-sm tabular-nums">
                Rp {item.total_price.toLocaleString('id-ID')}
              </span>
            </TableCell>
            
            <TableCell className="px-4 py-4 text-center">
              <Badge variant="outline" className={cn(
                "text-[10px] px-3 py-1 font-black border-none rounded-sm uppercase tracking-tighter",
                TRANSACTION_STATUS_MAP[item.status as keyof typeof TRANSACTION_STATUS_MAP]?.color || 'bg-slate-50 text-slate-600 border-slate-200'
              )}>
                {TRANSACTION_STATUS_MAP[item.status as keyof typeof TRANSACTION_STATUS_MAP]?.label || item.status}
              </Badge>
            </TableCell>

            <TableCell className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase">
              <div className="flex items-center gap-2">
                 <Calendar className="h-3.5 w-3.5 opacity-50 text-blue-500" />
                 {format(new Date(item.created_at), 'dd MMM yyyy', { locale: idLocale })}
              </div>
            </TableCell>
            
            <TableCell className="px-4 py-4 text-center">
              <div className="flex items-center justify-center">
                <Button 
                  size="sm" 
                  onClick={() => onView(item)}
                  variant="ghost"
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-9 px-4 text-[11px] font-black uppercase tracking-widest rounded-sm border border-transparent hover:border-blue-100"
                >
                   Detail
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </AdminTable>
  );
}
