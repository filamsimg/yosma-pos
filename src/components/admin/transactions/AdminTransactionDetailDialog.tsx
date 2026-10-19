'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';
import { Store, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { TRANSACTION_STATUS_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionItem } from '@/types';

interface AdminTransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTxn: Transaction | null;
  txnItems: TransactionItem[];
  onStatusUpdate: (txnId: string, status: 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => void;
  onPrint: (txn: Transaction) => void;
}

export function AdminTransactionDetailDialog({
  open,
  onOpenChange,
  selectedTxn,
  txnItems,
  onStatusUpdate,
  onPrint,
}: AdminTransactionDetailDialogProps) {
  if (!selectedTxn) return null;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="receipt"
      title={selectedTxn.invoice_number}
      subtitle="Order Detail Monitoring"
    >
      <div className="absolute top-6 right-16">
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] font-black px-3 py-1 border rounded-sm uppercase tracking-widest bg-white shadow-sm',
            TRANSACTION_STATUS_MAP[
              selectedTxn.status as keyof typeof TRANSACTION_STATUS_MAP
            ]?.color || 'bg-slate-50 text-slate-600 border-slate-200'
          )}
        >
          {TRANSACTION_STATUS_MAP[
            selectedTxn.status as keyof typeof TRANSACTION_STATUS_MAP
          ]?.label || selectedTxn.status}
        </Badge>
      </div>

      <FormSection padding="md" className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Outlet
          </p>
          <div className="flex items-center gap-2">
            <Store className="h-3 w-3 text-blue-500" />
            <p className="text-xs font-black text-slate-800 uppercase leading-none">
              {selectedTxn.outlet?.name}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Waktu Order
          </p>
          <p className="text-xs font-black text-slate-800 leading-none">
            {format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      </FormSection>

      <div className="flex-1 overflow-y-auto">
        <FormSection
          title="Item Pesanan"
          subtitle={`${txnItems.length} Items`}
          dashed={false}
        >
          <div className="space-y-2">
            {txnItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-sm bg-slate-50/50 border border-slate-100"
              >
                <div className="flex-1 pr-2">
                  <p className="text-[11px] font-black text-slate-800 leading-tight uppercase truncate">
                    {item.product?.name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                    {item.quantity} Unit × Rp {item.price_at_sale.toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="text-xs font-black text-slate-900 tabular-nums">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </FormSection>
      </div>

      <FormSection padding="lg" className="bg-slate-50/50" dashed={false}>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Total Bayar
            </p>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-sm uppercase tracking-tighter">
                IDR
              </span>
              <p className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">
                {selectedTxn.total_price.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPrint(selectedTxn)}
            className="h-10 w-10 rounded-sm bg-white border-slate-200 shadow-sm"
          >
            <Printer className="h-4 w-4 text-slate-400" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {selectedTxn.status === 'PENDING' && (
            <Button
              className="h-12 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-slate-200 active:scale-95 transition-all"
              onClick={() => onStatusUpdate(selectedTxn.id, 'PROCESSING')}
            >
              PROSES PENGIRIMAN
            </Button>
          )}
          {selectedTxn.status === 'PROCESSING' && (
            <Button
              className="h-12 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all"
              onClick={() => onStatusUpdate(selectedTxn.id, 'COMPLETED')}
            >
              KONFIRMASI SELESAI
            </Button>
          )}
          {(selectedTxn.status === 'PENDING' || selectedTxn.status === 'PROCESSING') && (
            <Button
              variant="ghost"
              className="h-10 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-sm bg-red-50/50 hover:bg-red-50 mt-2"
              onClick={() => onStatusUpdate(selectedTxn.id, 'CANCELLED')}
            >
              BATALKAN ORDER
            </Button>
          )}
        </div>
      </FormSection>
    </AppDialog>
  );
}
