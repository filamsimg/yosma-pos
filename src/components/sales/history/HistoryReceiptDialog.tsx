'use client';

import { Badge } from '@/components/ui/badge';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';
import { format } from 'date-fns';
import { Pencil, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionItem } from '@/types';

interface HistoryReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTxn: Transaction | null;
  txnItems: TransactionItem[];
  statusInfo: { label: string; style: string };
  onEditOrder: () => void;
  onCancelOrder: () => void;
  cancelling: boolean;
}

export function HistoryReceiptDialog({
  open,
  onOpenChange,
  selectedTxn,
  txnItems,
  statusInfo,
  onEditOrder,
  onCancelOrder,
  cancelling,
}: HistoryReceiptDialogProps) {
  if (!selectedTxn) return null;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="receipt"
      title={selectedTxn.invoice_number}
      subtitle="Tanda terima transaksi"
    >
      <div className="absolute top-6 right-16">
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] font-black px-2.5 py-1 border rounded-sm uppercase tracking-widest shadow-sm bg-white',
            statusInfo.style
          )}
        >
          {statusInfo.label}
        </Badge>
      </div>

      <FormSection padding="md" className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Outlet Kunjungan
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm bg-blue-500" />
            <p className="text-xs font-black text-slate-800 uppercase">
              {selectedTxn.outlet?.name}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Waktu Transaksi
          </p>
          <p className="text-xs font-bold text-slate-600">
            {format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      </FormSection>

      <div className="flex-1 overflow-y-auto">
        <FormSection
          title="Detail Pesanan"
          subtitle={`${txnItems.length} Items`}
          dashed={false}
        >
          <div className="space-y-3">
            {txnItems.map((item) => (
              <div key={item.id} className="group relative">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 pr-4">
                    <p className="font-black text-xs text-slate-800 uppercase leading-snug">
                      {item.product?.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">
                      {item.quantity} Unit <span className="mx-1 text-slate-200">|</span> Rp{' '}
                      {item.price_at_sale.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-900 tabular-nums">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </div>

      <FormSection padding="lg" className="bg-slate-50/50" dashed={false}>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Total Pembayaran
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
        </div>

        {selectedTxn.status === 'PENDING' && (
          <div className="space-y-2">
            <button
              onClick={onEditOrder}
              className="w-full h-12 rounded-sm bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Pencil className="h-3.5 w-3.5" /> Koreksi Pesanan
            </button>

            <button
              onClick={onCancelOrder}
              disabled={cancelling}
              className="w-full h-12 rounded-sm bg-red-50 text-red-600 border border-red-100 flex items-center justify-center gap-2 transition-all hover:bg-red-100 disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.1em]"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Batalkan Pesanan
            </button>
          </div>
        )}
      </FormSection>
    </AppDialog>
  );
}
