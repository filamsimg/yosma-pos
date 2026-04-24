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
import { TRANSACTION_STATUS_MAP, PAYMENT_STATUS_MAP } from '@/lib/constants';
import { toast } from 'sonner';
import { EditOrderDialog } from '@/components/sales/EditOrderDialog';

import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';

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

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  function handleEditSaved() {
    if (selectedTxn) handleViewDetail(selectedTxn);
  }

  function getStatusInfo(txn: { status: string; payment_status: string }) {
    // 1. Prioritaskan status transaksi jika Batal atau Pending
    if (txn.status === 'CANCELLED' || txn.status === 'PENDING' || txn.status === 'PROCESSING') {
      const info = TRANSACTION_STATUS_MAP[txn.status as keyof typeof TRANSACTION_STATUS_MAP];
      return { 
        label: info?.label.toUpperCase() || txn.status, 
        style: info?.color || 'bg-slate-50 text-slate-500 border-slate-100' 
      };
    }

    // 2. Jika sudah selesai, gunakan status pembayaran untuk konteks tambahan
    const info = PAYMENT_STATUS_MAP[txn.payment_status as keyof typeof PAYMENT_STATUS_MAP];
    if (info) {
      return { 
        label: info.label.toUpperCase(), 
        style: info.color 
      };
    }

    return { label: 'SELESAI', style: 'bg-slate-50 text-slate-500 border-slate-100' };
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
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-sm bg-white border border-slate-100" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-sm border border-slate-100 shadow-sm text-center px-6">
             <Receipt className="h-10 w-10 text-slate-200 mb-4" />
             <p className="text-sm font-black text-slate-300 uppercase italic">Belum Ada Transaksi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <button key={txn.id} onClick={() => handleViewDetail(txn)} className="w-full text-left active:scale-[0.98] transition-transform">
                <Card className="border border-slate-100 bg-white shadow-sm rounded-sm overflow-hidden group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                         <div className="w-9 h-9 rounded-sm bg-blue-50 flex items-center justify-center text-blue-600 font-black"><Receipt className="h-4 w-4" /></div>
                         <div>
                            <p className="font-black text-xs text-slate-800 leading-tight uppercase">{txn.invoice_number}</p>
                            <Badge variant="outline" className={cn("text-[8px] font-black px-2 py-0 h-4 border rounded-sm uppercase mt-1", getStatusInfo(txn).style)}>{getStatusInfo(txn).label}</Badge>
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

      <AppDialog 
        open={detailOpen} 
        onOpenChange={setDetailOpen}
        variant="receipt"
        title={selectedTxn?.invoice_number}
        subtitle="Tanda terima transaksi"
      >
        {selectedTxn && (
          <>
            <div className="absolute top-6 right-16">
               <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] font-black px-2.5 py-1 border rounded-sm uppercase tracking-widest shadow-sm bg-white", 
                    getStatusInfo(selectedTxn).style
                  )}
               >
                 {getStatusInfo(selectedTxn).label}
               </Badge>
            </div>

            <FormSection padding="md" className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Outlet Kunjungan</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm bg-blue-500" />
                    <p className="text-xs font-black text-slate-800 uppercase">{selectedTxn.outlet?.name}</p>
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Waktu Transaksi</p>
                  <p className="text-xs font-bold text-slate-600">{format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm')}</p>
               </div>
            </FormSection>

            <div className="flex-1 overflow-y-auto">
              <FormSection 
                title="Detail Pesanan" 
                subtitle={`${txnItems.length} Items`}
                dashed={false}
              >
                 <div className="space-y-3">
                   {txnItems.map(item => (
                     <div key={item.id} className="group relative">
                        <div className="flex justify-between items-start mb-1">
                           <div className="flex-1 pr-4">
                              <p className="font-black text-xs text-slate-800 uppercase leading-snug">{item.product?.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">
                                {item.quantity} Unit <span className="mx-1 text-slate-200">|</span> Rp {item.price_at_sale.toLocaleString('id-ID')}
                              </p>
                           </div>
                           <p className="text-sm font-black text-slate-900 tabular-nums">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                        </div>
                     </div>
                   ))}
                 </div>
              </FormSection>
            </div>

            <FormSection padding="lg" className="bg-slate-50/50" dashed={false}>
               <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Pembayaran</p>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-sm uppercase tracking-tighter">IDR</span>
                      <p className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">
                        {selectedTxn.total_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
               </div>

               {selectedTxn.status === 'PENDING' && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => setEditOpen(true)} 
                      className="w-full h-12 rounded-sm bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Koreksi Pesanan
                    </button>
                    
                    <button 
                      onClick={() => setConfirmCancelOpen(true)} 
                      disabled={cancelling}
                      className="w-full h-12 rounded-sm bg-red-50 text-red-600 border border-red-100 flex items-center justify-center gap-2 transition-all hover:bg-red-100 disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.1em]"
                    >
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Batalkan Pesanan
                    </button>
                  </div>
               )}
            </FormSection>
          </>
        )}
      </AppDialog>

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

      {selectedTxn && (
        <ConfirmDialog
          open={confirmCancelOpen}
          onOpenChange={setConfirmCancelOpen}
          title="Batalkan Pesanan?"
          description={`Apakah Anda yakin ingin membatalkan pesanan ${selectedTxn.invoice_number}? Stok akan dikembalikan otomatis.`}
          onConfirm={() => handleCancelFromHistory(selectedTxn.id, selectedTxn.invoice_number)}
          confirmText="Ya, Batalkan"
          variant="danger"
          loading={cancelling}
        />
      )}
    </div>
  );
}



