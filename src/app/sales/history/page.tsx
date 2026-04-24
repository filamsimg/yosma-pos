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
  Pencil,
  X
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction, TransactionItem } from '@/types';
import { cancelTransaction } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import { EditOrderDialog } from '@/components/sales/EditOrderDialog';

import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';

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

  const todayTransactions = transactions.filter(t => 
    format(new Date(t.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  
  const stats = {
    today_count: todayTransactions.length,
    today_omzet: todayTransactions.reduce((sum, t) => sum + t.total_price, 0),
    pending_count: transactions.filter(t => t.status === 'PENDING').length
  };

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

  async function handleCancelFromHistory(txnId: string, invoiceNumber: string) {
    setCancelling(true);
    try {
      const result = await cancelTransaction(txnId);
      if (result.error) {
        toast.error('Gagal membatalkan transaksi', { description: result.error });
      } else {
        toast.success('Pesanan berhasil dibatalkan');
        setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, status: 'CANCELLED' } : t));
        setSelectedTxn(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      }
    } finally { setCancelling(false); }
  }

  function handleEditSaved() {
    if (selectedTxn) handleViewDetail(selectedTxn);
  }

  function getStatusInfo(txn: { status: string; payment_status: string }) {
    if (txn.status === 'CANCELLED') return { label: 'BATAL', style: 'bg-red-50 text-red-600 border-red-100' };
    if (txn.status === 'PENDING') return { label: 'MENUNGGU', style: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (txn.status === 'PROCESSING') return { label: 'DIPROSES', style: 'bg-blue-50 text-blue-600 border-blue-100' };
    switch (txn.payment_status) {
      case 'PAID': return { label: 'LUNAS', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'PARTIAL': return { label: 'CICILAN', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'UNPAID': return { label: 'TEMPO', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      default: return { label: 'SELESAI', style: 'bg-slate-50 text-slate-500 border-slate-100' };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-100 px-5 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              RIWAYAT <span className="text-blue-600">SALES</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-widest leading-none">
              Monitoring Transaksi Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Order Hari Ini" value={stats.today_count} icon={History} iconBgColor="bg-blue-50" iconColor="text-blue-600" className="border-slate-100 p-3" />
          <StatCard label="Pending" value={stats.pending_count} icon={Clock} iconBgColor="bg-amber-50" iconColor="text-amber-600" className="border-slate-100 p-3" />
        </div>
      </div>

      <div className="p-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white border border-slate-100" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center px-6">
             <Receipt className="h-10 w-10 text-slate-200 mb-4" />
             <p className="text-sm font-black text-slate-300 uppercase italic">Belum Ada Transaksi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <button key={txn.id} onClick={() => handleViewDetail(txn)} className="w-full text-left active:scale-[0.98] transition-transform">
                <Card className="border border-slate-100 bg-white shadow-sm rounded-xl overflow-hidden group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                         <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black"><Receipt className="h-4 w-4" /></div>
                         <div>
                            <p className="font-black text-xs text-slate-800 leading-tight uppercase">{txn.invoice_number}</p>
                            <Badge variant="outline" className={cn("text-[8px] font-black px-2 py-0 h-4 border rounded-full uppercase mt-1", getStatusInfo(txn).style)}>{getStatusInfo(txn).label}</Badge>
                         </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-3">
                       <span className="flex items-center gap-1 shrink-0"><Store className="h-3 w-3" /> {txn.outlet?.name}</span>
                       <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(txn.created_at), 'dd MMM')}</span>
                       <span className="ml-auto font-black text-xs text-blue-600">Rp {txn.total_price.toLocaleString('id-ID')}</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] bg-white p-0 rounded-2xl overflow-hidden border border-slate-100 shadow-2xl">
          {selectedTxn && (
            <div className="flex flex-col h-full max-h-[90vh]">
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Receipt</p>
                    <h2 className="text-base font-black text-slate-800 leading-none uppercase">{selectedTxn.invoice_number}</h2>
                 </div>
                 <Badge variant="outline" className={cn("text-[9px] font-black px-3 py-1 border rounded-full uppercase", getStatusInfo(selectedTxn).style)}>{getStatusInfo(selectedTxn).label}</Badge>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-5">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outlet</p>
                      <p className="text-xs font-black text-slate-800 leading-tight uppercase">{selectedTxn.outlet?.name}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                      <p className="text-xs font-black text-slate-800 leading-tight">{format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm')}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Item</p>
                   <div className="space-y-2">
                     {txnItems.map(item => (
                       <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex-1 pr-2">
                             <p className="font-black text-[11px] text-slate-800 uppercase truncate leading-tight">{item.product?.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.quantity} Unit x Rp {item.price_at_sale.toLocaleString('id-ID')}</p>
                          </div>
                          <p className="text-xs font-black text-blue-600">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pesanan</p>
                    <p className="text-lg font-black text-blue-600 tracking-tight">Rp {selectedTxn.total_price.toLocaleString('id-ID')}</p>
                 </div>

                 {selectedTxn.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditOpen(true)} className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2">
                      <Pencil className="h-4 w-4" /> Edit Pesanan
                    </button>
                    <button onClick={() => handleCancelFromHistory(selectedTxn.id, selectedTxn.invoice_number)} disabled={cancelling} className="h-11 w-11 rounded-xl bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50">
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                 )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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



