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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            MONITORING <span className="text-blue-600">TRANSAKSI</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest leading-tight">
            Monitoring arus pesanan dan status pengiriman harian
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari invoice/outlet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-100 rounded-xl h-10 shadow-sm"
          />
        </div>
      </div>

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

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
          const label = tab === 'ALL' ? 'Semua' : TRANSACTION_STATUS_MAP[tab].label;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                activeTab === tab ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-100 font-bold"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Card className="border border-slate-100 bg-white shadow-sm rounded-xl overflow-hidden">
        <TransactionTable 
          data={filtered} 
          loading={loading} 
          onView={handleViewDetail} 
        />
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] bg-white p-0 rounded-2xl overflow-hidden border border-slate-100 shadow-2xl">
          {selectedTxn && (
            <div className="flex flex-col h-full max-h-[90vh]">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Invoice</p>
                    <h2 className="text-lg font-black text-slate-800 leading-none uppercase">{selectedTxn.invoice_number}</h2>
                 </div>
                 <Badge variant="outline" className={cn(
                   "text-[9px] font-black px-3 py-1 border rounded-full uppercase tracking-widest",
                   TRANSACTION_STATUS_MAP[selectedTxn.status as keyof typeof TRANSACTION_STATUS_MAP]?.color || 'bg-slate-50 text-slate-600 border-slate-200'
                 )}>
                   {TRANSACTION_STATUS_MAP[selectedTxn.status as keyof typeof TRANSACTION_STATUS_MAP]?.label || selectedTxn.status}
                 </Badge>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outlet</p>
                      <p className="text-xs font-black text-slate-800 leading-tight uppercase">{selectedTxn.outlet?.name}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                      <p className="text-xs font-black text-slate-800 leading-tight">{format(new Date(selectedTxn.created_at), 'dd MMM yyyy')}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Pesanan</p>
                   <div className="space-y-2">
                     {txnItems.map(item => (
                       <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex-1 pr-2">
                            <p className="text-[11px] font-black text-slate-800 leading-tight uppercase truncate">{item.product?.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.quantity} Unit × Rp {item.price_at_sale.toLocaleString('id-ID')}</p>
                          </div>
                          <p className="text-xs font-black text-blue-600">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                 <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bayar</p>
                        <p className="text-xl font-black text-blue-600 leading-none">Rp {selectedTxn.total_price.toLocaleString('id-ID')}</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handlePrint(selectedTxn)} className="h-10 w-10 rounded-xl bg-white border-slate-200"><Printer className="h-4 w-4 text-slate-400" /></Button>
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                    {selectedTxn.status === 'PENDING' && (
                        <Button className="col-span-2 h-11 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl" onClick={() => handleStatusUpdate(selectedTxn.id, 'PROCESSING')}>PROSES PENGIRIMAN</Button>
                    )}
                    {selectedTxn.status === 'PROCESSING' && (
                        <Button className="col-span-2 h-11 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl" onClick={() => handleStatusUpdate(selectedTxn.id, 'COMPLETED')}>KONFIRMASI SELESAI</Button>
                    )}
                    {(selectedTxn.status === 'PENDING' || selectedTxn.status === 'PROCESSING') && (
                        <Button variant="ghost" className="col-span-2 h-11 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl bg-red-50/50 hover:bg-red-50" onClick={() => handleStatusUpdate(selectedTxn.id, 'CANCELLED')}>BATALKAN ORDER</Button>
                    )}
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

