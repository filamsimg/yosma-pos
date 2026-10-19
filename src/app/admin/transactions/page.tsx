'use client';

import { useState, useEffect } from 'react';
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
import { 
  updateTransactionStatus, 
  getPaginatedTransactions,
  getAllTransactions,
  getTransactionItems
} from '@/lib/actions/transactions';
import { ExportButton } from '@/components/admin/shared/ExportButton';
import { toast } from 'sonner';

import { StatCard } from '@/components/ui/stat-card';
import { TransactionTable } from '@/components/admin/transactions/TransactionTable';
import { AdminPagination } from '@/components/ui/admin/pagination';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { AdminToolbar, AdminToolbarSection } from '@/components/ui/admin/toolbar';
import { AdminTransactionDetailDialog } from '@/components/admin/transactions/AdminTransactionDetailDialog';
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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  async function fetchTransactions() {
    setLoading(true);
    const { data, totalCount, totalPages } = await getPaginatedTransactions({
      page: currentPage,
      pageSize,
      search: searchQuery,
      status: activeTab
    });
    
    setTransactions(data);
    setTotalCount(totalCount);
    setTotalPages(totalPages);
    setLoading(false);
  }

  useEffect(() => {
    fetchTransactions();

    const interval = setInterval(() => {
      // Auto-refresh when on first page with no search query
      if (currentPage === 1 && !searchQuery) {
        fetchTransactions();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentPage, pageSize, searchQuery, activeTab]);

  async function handleViewDetail(txn: Transaction) {
    setSelectedTxn(txn);
    setDetailOpen(true);
    const res = await getTransactionItems(txn.id);
    if (res.data) setTxnItems(res.data);
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
        // Refresh data to ensure correct sorting/filtering
        fetchTransactions();
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

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Monitoring Transaksi"
        description="Monitoring arus pesanan dan status pengiriman harian secara real-time"
        breadcrumbs={[{ label: 'Transaksi' }]}
        action={
          <div className="flex items-center gap-2">
            <ExportButton 
              fetcher={getAllTransactions}
              filename="Laporan_Transaksi"
              timestampField="created_at"
              label="Export Excel"
              mapper={(t) => ({
                'Invoice': t.invoice_number,
                'Outlet': t.outlet?.name || '-',
                'Sales': t.sales?.full_name || '-',
                'Total': t.total_price,
                'Status': TRANSACTION_STATUS_MAP[t.status as keyof typeof TRANSACTION_STATUS_MAP]?.label || t.status,
                'Metode': t.payment_method,
                'Tanggal': format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')
              })}
            />
            <Button variant="outline" className="hidden sm:flex h-10 px-4 border-slate-400 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-slate-50">
              <Printer className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && totalCount === 0 ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-white border border-slate-100" />) : (
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              placeholder="Cari invoice atau outlet..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-600 outline-none"
            />
          </div>
        </AdminToolbarSection>

        <AdminToolbarSection className="border-t md:border-t-0 md:border-l border-slate-400 py-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-sm overflow-x-auto scrollbar-none">
            {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
              const label = tab === 'ALL' ? 'Semua' : TRANSACTION_STATUS_MAP[tab].label;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "text-slate-600 hover:text-slate-800 hover:bg-white"
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
          data={transactions} 
          loading={loading} 
          onView={handleViewDetail} 
        />
        
        <AdminPagination
          totalCount={totalCount}
          filteredCount={transactions.length}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemName="Transaksi"
          loading={loading}
        />
      </div>

      <AdminTransactionDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        selectedTxn={selectedTxn}
        txnItems={txnItems}
        onStatusUpdate={handleStatusUpdate}
        onPrint={handlePrint}
      />
    </div>
  );
}

