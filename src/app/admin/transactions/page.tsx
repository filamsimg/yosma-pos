'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  Printer,
  Download,
  Store,
  Calendar,
  X,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Receipt,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TRANSACTION_STATUS_MAP, PAYMENT_STATUSES, PAYMENT_METHODS } from '@/lib/constants';
import type { Transaction, TransactionItem } from '@/types';
import { updateTransactionStatus } from '@/lib/actions/transactions';
import { toast } from 'sonner';

import { StatCard } from '@/components/ui/stat-card';
import { TransactionTable } from '@/components/admin/transactions/TransactionTable';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { AdminToolbar, AdminToolbarSection } from '@/components/ui/admin/toolbar';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';
import { cn } from '@/lib/utils';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnItems, setTxnItems] = useState<TransactionItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    async function fetchTransactions() {
      const supabase = createClient();
      const { data } = await supabase
        .from('transactions')
        .select('*, outlet:outlets(name, address, type), sales:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchTransactions();

    const supabase = createClient();
    const channel = supabase
      .channel('admin-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, async (payload) => {
          const { data } = await supabase
            .from('transactions')
            .select('*, outlet:outlets(name, address, type), sales:profiles(full_name)')
            .eq('id', payload.new.id)
            .single();
          if (data) setTransactions((prev) => [data, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleViewDetail(txn: Transaction) {
    setSelectedTxn(txn);
    setDetailOpen(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('transaction_items')
      .select('*, product:products(name, sku)')
      .eq('transaction_id', txn.id);
    if (data) setTxnItems(data);
  }

  async function handleStatusUpdate(txnId: string, newStatus: 'PROCESSING' | 'COMPLETED' | 'CANCELLED') {
    setUpdatingStatus(txnId + newStatus);
    try {
      const result = await updateTransactionStatus(txnId, newStatus);
      if (result.error) {
        toast.error('Gagal mengubah status', { description: result.error });
      } else {
        const label = TRANSACTION_STATUS_MAP[newStatus].label;
        toast.success(`Status berhasil diubah: ${label}`);
        setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, status: newStatus } : t));
        if (selectedTxn?.id === txnId) setSelectedTxn(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } finally { setUpdatingStatus(null); }
  }

  const handlePrint = (txn: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const itemRows = txnItems.map(item => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee">${item.product?.name || '-'}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
      </tr>`).join('');
    printWindow.document.write(`<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse;margin:10px 0}.header{text-align:center;margin-bottom:20px}</style></head><body><div class="header"><h2>YOSMA POS</h2><p>${txn.invoice_number}</p></div><table><thead><tr><th>Produk</th><th>Qty</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table><div style="text-align:right;font-weight:bold;margin-top:10px">TOTAL: Rp ${txn.total_price.toLocaleString('id-ID')}</div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };


  const stats = {
    today: transactions.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
    pending: transactions.filter(t => t.status === 'PENDING').length,
    processing: transactions.filter(t => t.status === 'PROCESSING').length,
    amount: transactions.reduce((sum, t) => sum + t.total_price, 0)
  };

  const filtered = transactions.filter(txn => {
    const match = !searchQuery.trim() || txn.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || txn.outlet?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return match && (activeTab === 'ALL' || txn.status === activeTab);
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Monitoring Transaksi"
        description="Monitoring arus pesanan dan status pengiriman harian secara real-time"
        breadcrumbs={[{ label: 'Transaksi' }]}
        action={
          <Button variant="outline" className="h-10 px-4 border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-slate-50">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-white border border-slate-100" />) : (
          <>
            <StatCard label="Order Hari Ini" value={stats.today} icon={History} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
            <StatCard label="Menunggu" value={stats.pending} icon={Clock} iconBgColor="bg-amber-50" iconColor="text-amber-600" />
            <StatCard label="Diproses" value={stats.processing} icon={Truck} iconBgColor="bg-indigo-50" iconColor="text-indigo-600" />
            <StatCard label="Total Omzet" value={`Rp ${stats.amount.toLocaleString('id-ID')}`} icon={TrendingUp} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
          </>
        )}
      </div>

      <AdminToolbar>
        <AdminToolbarSection grow>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              placeholder="Cari invoice atau outlet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
            />
          </div>
        </AdminToolbarSection>

        <AdminToolbarSection className="border-t md:border-t-0 md:border-l border-slate-100 py-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-sm overflow-x-auto scrollbar-none">
            {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
              const label = tab === 'ALL' ? 'Semua' : TRANSACTION_STATUS_MAP[tab].label;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </AdminToolbarSection>
      </AdminToolbar>

      <div className="flex-1 min-h-0">
        <TransactionTable 
          data={filtered} 
          loading={loading} 
          onView={handleViewDetail} 
        />
      </div>

      <AppDialog 
        open={detailOpen} 
        onOpenChange={setDetailOpen}
        variant="receipt"
        title={selectedTxn?.invoice_number}
        subtitle="Order Detail Monitoring"
      >
        {selectedTxn && (
          <>
            <div className="absolute top-6 right-16">
               <Badge variant="outline" className={cn(
                 "text-[9px] font-black px-3 py-1 border rounded-sm uppercase tracking-widest bg-white shadow-sm",
                 TRANSACTION_STATUS_MAP[selectedTxn.status as keyof typeof TRANSACTION_STATUS_MAP]?.color || 'bg-slate-50 text-slate-600 border-slate-200'
               )}>
                 {TRANSACTION_STATUS_MAP[selectedTxn.status as keyof typeof TRANSACTION_STATUS_MAP]?.label || selectedTxn.status}
               </Badge>
            </div>

            <FormSection padding="md" className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outlet</p>
                  <div className="flex items-center gap-2">
                    <Store className="h-3 w-3 text-blue-500" />
                    <p className="text-xs font-black text-slate-800 uppercase leading-none">{selectedTxn.outlet?.name}</p>
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Order</p>
                  <p className="text-xs font-black text-slate-800 leading-none">{format(new Date(selectedTxn.created_at), 'dd MMM yyyy, HH:mm')}</p>
               </div>
            </FormSection>

            <div className="flex-1 overflow-y-auto">
              <FormSection 
                title="Item Pesanan" 
                subtitle={`${txnItems.length} Items`}
                dashed={false}
              >
                 <div className="space-y-2">
                   {txnItems.map(item => (
                     <div key={item.id} className="flex justify-between items-center p-3 rounded-sm bg-slate-50/50 border border-slate-100">
                        <div className="flex-1 pr-2">
                          <p className="text-[11px] font-black text-slate-800 leading-tight uppercase truncate">{item.product?.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.quantity} Unit × Rp {item.price_at_sale.toLocaleString('id-ID')}</p>
                        </div>
                        <p className="text-xs font-black text-slate-900 tabular-nums">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                     </div>
                   ))}
                 </div>
              </FormSection>
            </div>

            <FormSection padding="lg" className="bg-slate-50/50" dashed={false}>
               <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Bayar</p>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-sm uppercase tracking-tighter">IDR</span>
                      <p className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">
                        {selectedTxn.total_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => handlePrint(selectedTxn)} className="h-10 w-10 rounded-sm bg-white border-slate-200 shadow-sm"><Printer className="h-4 w-4 text-slate-400" /></Button>
               </div>

               <div className="grid grid-cols-1 gap-2">
                  {selectedTxn.status === 'PENDING' && (
                      <Button className="h-12 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-slate-200 active:scale-95 transition-all" onClick={() => handleStatusUpdate(selectedTxn.id, 'PROCESSING')}>PROSES PENGIRIMAN</Button>
                  )}
                  {selectedTxn.status === 'PROCESSING' && (
                      <Button className="h-12 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all" onClick={() => handleStatusUpdate(selectedTxn.id, 'COMPLETED')}>KONFIRMASI SELESAI</Button>
                  )}
                  {(selectedTxn.status === 'PENDING' || selectedTxn.status === 'PROCESSING') && (
                      <Button variant="ghost" className="h-10 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-sm bg-red-50/50 hover:bg-red-50 mt-2" onClick={() => handleStatusUpdate(selectedTxn.id, 'CANCELLED')}>BATALKAN ORDER</Button>
                  )}
               </div>
            </FormSection>
          </>
        )}
      </AppDialog>
    </div>
  );
}

