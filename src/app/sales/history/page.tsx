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
  History,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
        <td style="padding: 10px 0; border-bottom: 1px solid #efefef;">
          <div style="font-weight: 700; font-size: 13px;">${item.product?.name || '-'}</div>
          <div style="font-size: 11px; color: #666;">SKU: ${item.product?.sku || '-'}</div>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #efefef; text-align: center; font-weight: 600;">${item.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #efefef; text-align: right; font-weight: 500;">Rp ${item.price_at_sale.toLocaleString('id-ID')}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #efefef; text-align: right; font-weight: 700;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
      </tr>
    `
      )
      .join('');

    const statusLabel =
      selectedTxn.status === 'COMPLETED'
        ? 'LUNAS'
        : selectedTxn.status === 'CANCELLED'
        ? 'BATAL'
        : 'PENDING';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${selectedTxn.invoice_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          body { padding: 30px; max-width: 500px; margin: 0 auto; color: #0f172a; line-height: 1.4; }
          .logo { color: #2563eb; font-weight: 800; font-size: 24px; letter-spacing: -0.025em; margin-bottom: 4px; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f1f5f9; }
          .header p { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .invoice-box { background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;}
          .invoice-box b { font-size: 14px; color: #1e293b; }
          .info { margin-bottom: 25px; display: grid; grid-template-cols: 1fr 1fr; gap: 15px; }
          .info-block label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
          .info-block span { font-size: 12px; font-weight: 600; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { text-align: left; padding: 12px 0; border-bottom: 2px solid #0f172a; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
          .totals { margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; font-weight: 500; color: #64748b; }
          .total-row.grand { padding-top: 15px; margin-top: 10px; border-top: 2px solid #f1f5f9; color: #0f172a; font-size: 18px; font-weight: 800; }
          .total-row.grand span:last-child { color: #2563eb; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          .footer p { font-size: 11px; color: #94a3b8; font-weight: 500; }
          @media print { body { padding: 0; } .invoice-box { background: #f8fafc !important; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">YOSMA <span style="color: #0f172a">POS</span></div>
          <p>Electronic Sales Receipt</p>
        </div>

        <div class="invoice-box">
          <b>${selectedTxn.invoice_number}</b>
          <span style="font-size: 10px; font-weight: 800; background: #2563eb; color: #fff; padding: 4px 10px; border-radius: 6px;">${statusLabel}</span>
        </div>

        <div class="info">
          <div class="info-block">
            <label>Tanggal</label>
            <span>${format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</span>
          </div>
          <div class="info-block">
            <label>Outlet</label>
            <span>${selectedTxn.outlet?.name || '-'}</span>
          </div>
          <div class="info-block">
            <label>Metode</label>
            <span>${selectedTxn.payment_method}</span>
          </div>
          <div class="info-block">
            <label>Sales</label>
            <span>${selectedTxn.sales?.full_name || '-'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit</th>
              <th style="text-align: right;">Total</th>
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
              ? `<div class="total-row" style="color: #dc2626;">
                  <span>Diskon</span>
                  <span>-Rp ${selectedTxn.discount.toLocaleString('id-ID')}</span>
                </div>`
              : ''
          }
          <div class="total-row grand">
            <span>TOTAL TAGIHAN</span>
            <span>Rp ${selectedTxn.total_price.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div class="footer">
          <p>Invoice ini sah dan diproses secara elektronik.</p>
          <p style="margin-top: 4px;">Terima kasih telah berlangganan di YOSMA POS.</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              RIWAYAT <span className="text-blue-600">SALES</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
              50 Transaksi Terakhir Anda
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-50">
             <Receipt className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/2 bg-slate-50" />
                  <Skeleton className="h-5 w-1/4 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-3/4 bg-slate-50" />
                  <Skeleton className="h-3 w-1/2 bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <Receipt className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Belum Ada Transaksi</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-[240px] font-medium">
              Selesaikan kunjungan dan buat pesanan untuk melihat riwayat di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <button
                key={txn.id}
                onClick={() => handleViewDetail(txn)}
                className="w-full text-left transition-all active:scale-[0.98] focus:outline-none"
              >
                <Card className="border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all rounded-[28px] overflow-hidden group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight">
                                {txn.invoice_number}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-black px-2 py-0 h-4 border-none uppercase tracking-tighter mt-0.5 ${statusStyle(txn.status)}`}
                              >
                                {txn.status === 'COMPLETED' ? 'LUNAS' : txn.status === 'CANCELLED' ? 'BATAL' : 'PENDING'}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                              <Store className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 truncate">
                              {txn.outlet?.name || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                              <Calendar className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 truncate">
                              {format(new Date(txn.created_at), 'dd MMM yyyy', { locale: idLocale })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL TRANSAKSI</p>
                           <p className="text-base font-black text-blue-600">
                            Rp {txn.total_price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          className="max-w-[420px] w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden flex flex-col bg-white border-slate-200 p-0 rounded-[40px] shadow-2xl"
        >
          {selectedTxn && (
            <>
              <DialogHeader className="p-8 pb-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex justify-between items-start">
                   <div>
                    <div className="flex items-center gap-2 mb-1">
                       <Badge className="bg-blue-600 text-white border-none font-black text-[10px] px-2 py-0.5 rounded-lg">INV</Badge>
                       <DialogTitle className="text-xl font-black text-slate-900 tracking-tighter">
                        {selectedTxn.invoice_number}
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {format(new Date(selectedTxn.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-6 bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">OUTLET</label>
                    <div className="flex items-center gap-1.5">
                       <Store className="h-3.5 w-3.5 text-blue-500" />
                       <span className="text-sm font-black text-slate-800 leading-tight">{selectedTxn.outlet?.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">PEMBAYARAN</label>
                    <div className="flex items-center gap-1.5 justify-end">
                       <span className="text-sm font-black text-slate-800">{selectedTxn.payment_method}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Printer */}
                <div className="flex items-center justify-between px-2">
                   <Badge
                      variant="outline"
                      className={`font-black text-[10px] border-none uppercase px-3 py-1 rounded-full ${statusStyle(selectedTxn.status)}`}
                    >
                      {selectedTxn.status === 'COMPLETED' ? 'LUNAS' : selectedTxn.status === 'CANCELLED' ? 'BATAL' : 'PENDING'}
                    </Badge>
                    <Button
                      onClick={handlePrint}
                      className="bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 hover:border-blue-600 h-9 px-4 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm"
                      variant="outline"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      CETAK STRUK
                    </Button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PESANAN BARANG</p>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{txnItems.length} ITEM</p>
                  </div>
                  <div className="space-y-2.5">
                    {txnItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all shadow-sm"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-black text-slate-900 leading-tight">
                            {item.product?.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase">
                            {item.quantity} Unit <span className="text-slate-200">|</span> Rp {item.price_at_sale.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <p className="text-sm font-black text-blue-600 whitespace-nowrap">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Totals */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1">
                    <span>SUBTOTAL</span>
                    <span className="text-slate-600 font-black">
                      Rp {selectedTxn.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {selectedTxn.discount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-red-500 px-1">
                      <span>DISCOUNT</span>
                      <span className="font-black">
                        - Rp {selectedTxn.discount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <Separator className="bg-slate-200 my-4" />
                  <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">TOTAL AKHIR</p>
                        <p className="text-2xl font-black text-blue-600 tracking-tighter leading-none">
                          Rp {selectedTxn.total_price.toLocaleString('id-ID')}
                        </p>
                    </div>
                    {/* View Photo if exists */}
                    {selectedTxn.photo_url && (
                       <a 
                        href={selectedTxn.photo_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm active:scale-95"
                       >
                         <ExternalLink className="h-5 w-5" />
                       </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
