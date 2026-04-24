'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PAYMENT_STATUS_MAP } from '@/lib/constants';
import { AdminTable } from '@/components/ui/admin/data-table';

interface ReceivableTableProps {
  data: any[];
  loading?: boolean;
  onPay: (item: any) => void;
  type: 'ACTIVE' | 'COMPLETED';
}

export function ReceivableTable({ data, loading, onPay, type }: ReceivableTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Memuat data piutang...</p>
      </div>
    );
  }

  const headers = [
    "Outlet & Invoice",
    <div className="text-right">Nilai</div>,
    <div className="text-right">Terbayar</div>,
    <div className="text-right">{type === 'ACTIVE' ? 'Sisa' : 'Total'}</div>,
    type === 'ACTIVE' ? 'Jatuh Tempo' : 'Tgl Lunas',
    <div className="text-center">Aksi</div>
  ];

  return (
    <AdminTable headers={headers}>
      {data.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} className="py-20 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">
              {type === 'ACTIVE' ? 'Tidak ada tagihan aktif' : 'Belum ada riwayat pelunasan'}
            </p>
          </TableCell>
        </TableRow>
      ) : (
        data.map((item) => {
          const balance = item.total_price - item.paid_amount;
          const isOverdue = item.due_date && new Date(item.due_date) < new Date() && type === 'ACTIVE';
          
          const lastPaymentDate = item.payments && item.payments.length > 0
            ? [...item.payments].sort((a: any, b: any) => 
                new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
              )[0]?.payment_date
            : null;

          return (
            <TableRow key={item.id}>
              <TableCell className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-black text-slate-800 text-xs uppercase tracking-tight">
                    {item.outlet?.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                    {item.invoice_number}
                  </span>
                </div>
              </TableCell>
              
              <TableCell className="px-4 text-right">
                <span className="font-black text-slate-500 text-xs tabular-nums">
                  Rp {item.total_price.toLocaleString('id-ID')}
                </span>
              </TableCell>
              
              <TableCell className="px-4 text-right">
                <span className="font-black text-emerald-600 text-xs tabular-nums">
                  Rp {item.paid_amount.toLocaleString('id-ID')}
                </span>
              </TableCell>
              
              <TableCell className="px-4 text-right">
                <span className={cn(
                  "font-black text-xs tabular-nums",
                  type === 'ACTIVE' ? "text-red-600" : "text-slate-900"
                )}>
                  Rp {(type === 'ACTIVE' ? balance : item.total_price).toLocaleString('id-ID')}
                </span>
              </TableCell>
              
              <TableCell className="px-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-2 py-0.5 font-black border-none rounded-sm uppercase tracking-tighter",
                    isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                  )}
                >
                  {type === 'ACTIVE' 
                    ? (item.due_date ? format(new Date(item.due_date), 'dd MMM yyyy', { locale: idLocale }) : '-')
                    : (lastPaymentDate ? format(new Date(lastPaymentDate), 'dd MMM yyyy', { locale: idLocale }) : '-')
                  }
                </Badge>
              </TableCell>
              
              <TableCell className="px-4 text-center">
                <div className="flex items-center justify-center">
                  {type === 'ACTIVE' ? (
                    <Button 
                      size="sm" 
                      onClick={() => onPay(item)}
                      className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-sm transition-all active:scale-95 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Cicil
                    </Button>
                  ) : (
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-2.5 py-0.5 font-black border-none rounded-sm uppercase tracking-tighter",
                      PAYMENT_STATUS_MAP.PAID.color
                    )}>
                      {PAYMENT_STATUS_MAP.PAID.label}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </AdminTable>
  );
}
