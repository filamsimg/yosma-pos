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
import { PAYMENT_STATUSES } from '@/lib/constants';

interface TransactionTableProps {
  data: any[];
  loading?: boolean;
  onView: (item: any) => void;
}

export function TransactionTable({ data, loading, onView }: TransactionTableProps) {
  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING':     return 'bg-amber-50 text-amber-600';
      case 'PROCESSING':  return 'bg-blue-50 text-blue-600';
      case 'COMPLETED':   return 'bg-emerald-50 text-emerald-600';
      case 'CANCELLED':   return 'bg-red-50 text-red-600';
      default:            return 'bg-slate-50 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-50/10 animate-pulse rounded-xl">
        <p className="text-sm font-medium text-slate-400">Memuat data transaksi...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
      <Table className="w-full text-left whitespace-nowrap">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase">Invoice & Outlet</TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase text-right">Total</TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase text-center">Status</TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase">Waktu</TableHead>
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-20 text-center">
                <p className="text-sm font-medium text-slate-400 italic">
                  Tidak ada transaksi ditemukan
                </p>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 text-sm">
                       {item.invoice_number}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-normal uppercase mt-0.5">
                       <Store className="h-3 w-3" />
                       {item.outlet?.name || 'Toko Umum'}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-4 px-4 text-sm font-medium text-blue-600 text-right">
                  Rp {item.total_price.toLocaleString('id-ID')}
                </TableCell>
                
                <TableCell className="py-4 px-4 text-center">
                  <Badge variant="outline" className={cn(
                    "text-[11px] px-2.5 py-1 font-medium border-0 rounded-md uppercase",
                    statusColor(item.status)
                  )}>
                    {item.status}
                  </Badge>
                </TableCell>

                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                     <Calendar className="h-3.5 w-3.5 opacity-40" />
                     {format(new Date(item.created_at), 'dd MMM yyyy', { locale: idLocale })}
                  </div>
                </TableCell>
                
                <TableCell className="py-4 px-6 text-right">
                  <Button 
                    size="sm" 
                    onClick={() => onView(item)}
                    variant="ghost"
                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 px-3 text-xs font-semibold"
                  >
                     Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
