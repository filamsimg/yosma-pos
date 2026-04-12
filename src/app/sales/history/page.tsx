'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  Calendar,
  Store,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction, TransactionItem } from '@/types';

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnItems, setTxnItems] = useState<TransactionItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('transactions')
        .select('*, outlet:outlets(*), sales:profiles(*)')
        .eq('sales_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchHistory();
  }, [user]);

  async function handleViewDetail(txn: Transaction) {
    setSelectedTxn(txn);
    setDetailOpen(true);

    const supabase = createClient();
    const { data } = await supabase
      .from('transaction_items')
      .select('*, product:products(*)')
      .eq('transaction_id', txn.id);

    if (data) setTxnItems(data);
  }

  function handlePrint() {
    if (!selectedTxn) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemRows = txnItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">${item.product?.name || '-'}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">Rp ${item.price_at_sale.toLocaleString('id-ID')}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee; text-align: right;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
      </tr>
    `
      )
      .join('');

    const statusLabel =
      selectedTxn.status === 'COMPLETED'
        ? 'Lunas'
        : selectedTxn.status === 'CANCELLED'
        ? 'Batal'
        : 'Pending';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${selectedTxn.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; padding: 24px; max-width: 400px; margin: 0 auto; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px; }
          .header h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; }
          .header p { font-size: 11px; color: #666; margin-top: 2px; }
          .info { margin-bottom: 16px; }
          .info-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
          .info-row .label { color: #666; }
          .info-row .value { font-weight: 500; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
          th { text-align: left; padding: 8px 0; border-bottom: 2px solid #333; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          .totals { border-top: 2px solid #333; padding-top: 12px; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
          .total-row.grand { font-size: 16px; font-weight: 700; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 4px; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #ccc; }
          .footer p { font-size: 11px; color: #999; }
          .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .status.completed { background: #dcfce7; color: #166534; }
          .status.cancelled { background: #fef2f2; color: #991b1b; }
          .status.pending { background: #fef9c3; color: #854d0e; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>YOSMA POS</h1>
          <p>Sales Monitoring & Point of Sale</p>
        </div>

        <div class="info">
          <div class="info-row">
            <span class="label">Invoice</span>
            <span class="value">${selectedTxn.invoice_number}</span>
          </div>
          <div class="info-row">
            <span class="label">Tanggal</span>
            <span class="value">${format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</span>
          </div>
          <div class="info-row">
            <span class="label">Outlet</span>
            <span class="value">${selectedTxn.outlet?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Sales</span>
            <span class="value">${selectedTxn.sales?.full_name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Pembayaran</span>
            <span class="value">${selectedTxn.payment_method}</span>
          </div>
          <div class="info-row">
            <span class="label">Status</span>
            <span class="value"><span class="status ${selectedTxn.status.toLowerCase()}">${statusLabel}</span></span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Harga</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>Rp ${selectedTxn.subtotal.toLocaleString('id-ID')}</span>
          </div>
          ${
            selectedTxn.discount > 0
              ? `<div class="total-row">
                  <span>Diskon</span>
                  <span>-Rp ${selectedTxn.discount.toLocaleString('id-ID')}</span>
                </div>`
              : ''
          }
          <div class="total-row grand">
            <span>TOTAL</span>
            <span>Rp ${selectedTxn.total_price.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div class="footer">
          <p>Terima kasih atas transaksi Anda!</p>
          <p style="margin-top: 4px;">YOSMA POS © ${new Date().getFullYear()}</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Riwayat Transaksi</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Daftar semua transaksi Anda
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-white/10" />
              <Skeleton className="h-3 w-1/2 bg-white/10" />
              <Skeleton className="h-3 w-1/4 bg-white/10" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Receipt className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Belum ada transaksi</p>
          <p className="text-xs mt-1">
            Transaksi akan muncul setelah Anda menyelesaikan pesanan
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => (
            <button
              key={txn.id}
              onClick={() => handleViewDetail(txn)}
              className="w-full text-left"
            >
              <Card className="border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white">
                          {txn.invoice_number}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${statusColor(txn.status)}`}
                        >
                          {txn.status === 'COMPLETED'
                            ? 'Lunas'
                            : txn.status === 'CANCELLED'
                            ? 'Batal'
                            : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {txn.outlet?.name || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(txn.created_at),
                            'dd MMM yyyy',
                            { locale: idLocale }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-blue-400">
                        Rp {txn.total_price.toLocaleString('id-ID')}
                      </p>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          showCloseButton={true}
          className="max-w-lg w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto bg-slate-900 border-white/10 p-0"
        >
          {selectedTxn && (
            <>
              <DialogHeader className="p-4 border-b border-white/5">
                <DialogTitle className="text-lg font-semibold text-white">
                  {selectedTxn.invoice_number}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-400 mt-0.5">
                  Detail transaksi
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 space-y-4">
                {/* Info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Outlet</span>
                    <span className="text-white font-medium">
                      {selectedTxn.outlet?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tanggal</span>
                    <span className="text-white">
                      {format(
                        new Date(selectedTxn.created_at),
                        'dd MMMM yyyy, HH:mm',
                        { locale: idLocale }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pembayaran</span>
                    <span className="text-white">
                      {selectedTxn.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColor(selectedTxn.status)}`}
                    >
                      {selectedTxn.status === 'COMPLETED'
                        ? 'Lunas'
                        : selectedTxn.status === 'CANCELLED'
                        ? 'Batal'
                        : 'Pending'}
                    </Badge>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Item Pesanan
                  </p>
                  {txnItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/5"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × Rp{' '}
                          {item.price_at_sale.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-white/5 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">
                      Rp {selectedTxn.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {selectedTxn.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Diskon</span>
                      <span className="text-red-400">
                        - Rp{' '}
                        {selectedTxn.discount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-blue-400">
                      Rp {selectedTxn.total_price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Print Button */}
                <Button
                  onClick={handlePrint}
                  className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  variant="outline"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
