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
import { Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PAYMENT_STATUSES } from '@/lib/constants';

interface ReceivableTableProps {
  data: any[];
  loading?: boolean;
  onPay: (item: any) => void;
  type: 'ACTIVE' | 'COMPLETED';
}

export function ReceivableTable({ data, loading, onPay, type }: ReceivableTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-50/10 animate-pulse rounded-xl">
        <p className="text-sm font-medium text-slate-400">Memuat data piutang...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-dashed border-slate-100 rounded-xl">
        <p className="text-sm font-medium text-slate-400 italic">
          {type === 'ACTIVE' ? 'Tidak ada tagihan aktif' : 'Belum ada riwayat pelunasan'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
      <Table className="w-full text-left whitespace-nowrap">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase">Outlet & Invoice</TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase text-right">Nilai</TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase text-right">Terbayar</TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase text-right">
               {type === 'ACTIVE' ? 'Sisa' : 'Total'}
            </TableHead>
            <TableHead className="py-4 px-4 font-semibold text-slate-500 text-xs uppercase">
               {type === 'ACTIVE' ? 'Jatuh Tempo' : 'Tgl Lunas'}
            </TableHead>
            <TableHead className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {data.map((item) => {
            const balance = item.total_price - item.paid_amount;
            const isOverdue = item.due_date && new Date(item.due_date) < new Date() && type === 'ACTIVE';
            
            // Get last payment date for completed ones
            const lastPaymentDate = item.payments && item.payments.length > 0
              ? [...item.payments].sort((a: any, b: any) => 
                  new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
                )[0]?.payment_date
              : null;

            return (
              <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="py-4 px-6">
                  <div className="font-medium text-slate-900 text-sm">
                    {item.outlet?.name}
                    <div className="text-[10px] text-slate-400 font-normal uppercase mt-0.5">
                      {item.invoice_number}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-4 px-4 text-sm text-slate-500 text-right font-medium">
                  Rp {item.total_price.toLocaleString('id-ID')}
                </TableCell>
                
                <TableCell className="py-4 px-4 text-sm font-medium text-emerald-600 text-right">
                  Rp {item.paid_amount.toLocaleString('id-ID')}
                </TableCell>
                
                <TableCell className={cn(
                    "py-4 px-4 text-sm font-bold text-right",
                    type === 'ACTIVE' ? "text-red-600" : "text-slate-900"
                )}>
                  Rp {(type === 'ACTIVE' ? balance : item.total_price).toLocaleString('id-ID')}
                </TableCell>
                
                <TableCell className="py-4 px-4">
                  <Badge
                    variant="outline"
                    className={`text-[11px] px-2.5 py-1 font-medium border-0 rounded-md ${
                      isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {type === 'ACTIVE' 
                       ? (item.due_date ? format(new Date(item.due_date), 'dd MMM yyyy', { locale: idLocale }) : '-')
                       : (lastPaymentDate ? format(new Date(lastPaymentDate), 'dd MMM yyyy', { locale: idLocale }) : '-')
                    }
                  </Badge>
                </TableCell>
                
                <TableCell className="py-4 px-6 text-right">
                  {type === 'ACTIVE' ? (
                    <Button 
                      size="sm" 
                      onClick={() => onPay(item)}
                      className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Cicil
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-600 border-0 text-[11px] px-2.5 py-1 font-medium rounded-md">LUNAS</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
