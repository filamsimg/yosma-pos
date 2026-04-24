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
import {
  Receipt,
  Calendar,
  Store,
  ChevronRight,
  History,
  MapPin,
  Clock,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Pencil
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction, TransactionItem } from '@/types';
import { cancelTransaction } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import { EditOrderDialog } from '@/components/sales/EditOrderDialog';

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnItems, setTxnItems] = useState<TransactionItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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

  function isWithin15Min(createdAt: string) {
    const diffMinutes = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60;
    return diffMinutes <= 15;
  }

  async function handleCancelFromHistory(txnId: string, invoiceNumber: string) {
    setCancelling(true);
    try {
      const result = await cancelTransaction(txnId);
      if (result.error) {
        toast.error('Gagal membatalkan transaksi', { description: result.error });
      } else {
        toast.success('Pesanan berhasil dibatalkan', {
          description: `${invoiceNumber} — Stok produk telah dikembalikan.`,
        });
        setTransactions(prev =>
          prev.map(t => t.id === txnId ? { ...t, status: 'CANCELLED' } : t)
        );
        setSelectedTxn(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      }
    } finally {
      setCancelling(false);
    }
  }

  function handleEditSaved() {
    // Refresh detail items setelah edit
    if (selectedTxn) {
      handleViewDetail(selectedTxn);
    }
  }

  // Label & warna berdasarkan transaction status + payment_status
  function getStatusInfo(txn: { status: string; payment_status: string }) {
    if (txn.status === 'CANCELLED') {
      return { label: 'BATAL', style: 'bg-red-50 text-red-600 border-red-100' };
    }
    if (txn.status === 'PENDING') {
      return { label: 'MENUNGGU', style: 'bg-amber-50 text-amber-600 border-amber-100' };
    }
    if (txn.status === 'PROCESSING') {
      return { label: 'DIPROSES', style: 'bg-blue-50 text-blue-600 border-blue-100' };
    }
    // COMPLETED — cek payment_status
    switch (txn.payment_status) {
      case 'PAID':
        return { label: 'LUNAS', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'PARTIAL':
        return { label: 'CICILAN', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'UNPAID':
        return { label: 'TEMPO', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      default:
        return { label: 'SELESAI', style: 'bg-slate-50 text-slate-500 border-slate-100' };
    }
  }

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
                                className={`text-[9px] font-black px-2 py-0 h-4 border-none uppercase tracking-tighter mt-0.5 ${getStatusInfo(txn).style}`}
                              >
                                {getStatusInfo(txn).label}
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

                {/* Status */}
                <div className="px-2">
                   <Badge
                      className={`font-black text-[10px] border-none uppercase px-3 py-1 rounded-full ${getStatusInfo(selectedTxn).style}`}
                    >
                      {getStatusInfo(selectedTxn).label}
                    </Badge>
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

                {/* Tombol Edit & Batalkan — hanya jika status PENDING */}
                {selectedTxn.status === 'PENDING' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setEditOpen(true)}
                      className="flex-1 h-11 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Pesanan
                    </button>
                    <button
                      onClick={() => handleCancelFromHistory(selectedTxn.id, selectedTxn.invoice_number)}
                      disabled={cancelling}
                      className="h-11 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 disabled:opacity-50"
                    >
                      {cancelling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      {selectedTxn && (
        <EditOrderDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          transactionId={selectedTxn.id}
          invoiceNumber={selectedTxn.invoice_number}
          discount={(selectedTxn as any).discount ?? 0}
          paymentMethod={(selectedTxn as any).payment_method ?? 'CASH'}
          initialItems={txnItems as any}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}


