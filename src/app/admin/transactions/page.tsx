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
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction, TransactionItem } from '@/types';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnItems, setTxnItems] = useState<TransactionItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      const supabase = createClient();
      const { data } = await supabase
        .from('transactions')
        .select('*, outlet:outlets(name, address), sales:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchTransactions();

    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async (payload) => {
          // Fetch the complete transaction with joins
          const { data } = await supabase
            .from('transactions')
            .select('*, outlet:outlets(name, address), sales:profiles(full_name)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setTransactions((prev) => [data, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  function handlePrint(txn: Transaction) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemRows = txnItems
      .map(
        (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee">${item.product?.name || '-'}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">Rp ${item.price_at_sale.toLocaleString('id-ID')}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${txn.invoice_number}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:24px;max-width:400px;margin:0 auto;color:#1a1a1a}
    .header{text-align:center;margin-bottom:24px;border-bottom:2px solid #333;padding-bottom:16px}.header h1{font-size:20px;font-weight:700}.header p{font-size:11px;color:#666;margin-top:2px}
    .info{margin-bottom:16px}.info-row{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}.info-row .label{color:#666}.info-row .value{font-weight:500}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}th{text-align:left;padding:8px 0;border-bottom:2px solid #333;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
    .totals{border-top:2px solid #333;padding-top:12px}.total-row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0}
    .total-row.grand{font-size:16px;font-weight:700;border-top:1px solid #ddd;padding-top:8px;margin-top:4px}
    .footer{text-align:center;margin-top:24px;padding-top:16px;border-top:1px dashed #ccc}.footer p{font-size:11px;color:#999}
    @media print{body{padding:0}}</style></head><body>
    <div class="header"><h1>YOSMA POS</h1><p>Sales Monitoring & Point of Sale</p></div>
    <div class="info">
      <div class="info-row"><span class="label">Invoice</span><span class="value">${txn.invoice_number}</span></div>
      <div class="info-row"><span class="label">Tanggal</span><span class="value">${format(new Date(txn.created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</span></div>
      <div class="info-row"><span class="label">Outlet</span><span class="value">${txn.outlet?.name || '-'}</span></div>
      <div class="info-row"><span class="label">Sales</span><span class="value">${txn.sales?.full_name || '-'}</span></div>
      <div class="info-row"><span class="label">Pembayaran</span><span class="value">${txn.payment_method}</span></div>
    </div>
    <table><thead><tr><th>Produk</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${itemRows}</tbody></table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>Rp ${txn.subtotal.toLocaleString('id-ID')}</span></div>
      ${txn.discount > 0 ? `<div class="total-row"><span>Diskon</span><span>-Rp ${txn.discount.toLocaleString('id-ID')}</span></div>` : ''}
      <div class="total-row grand"><span>TOTAL</span><span>Rp ${txn.total_price.toLocaleString('id-ID')}</span></div>
    </div>
    <div class="footer"><p>Terima kasih!</p><p style="margin-top:4px">YOSMA POS © ${new Date().getFullYear()}</p></div>
    <script>window.onload=function(){window.print()}</script></body></html>`);
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

  const filtered = transactions.filter(
    (txn) =>
      !searchQuery.trim() ||
      txn.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.outlet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.sales?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaksi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Semua transaksi dari tim sales ({transactions.length} total)
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Cari invoice, outlet, sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="border-white/5 bg-white/[0.03] hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Invoice</TableHead>
                <TableHead className="text-slate-400">Sales</TableHead>
                <TableHead className="text-slate-400">Outlet</TableHead>
                <TableHead className="text-slate-400">Total</TableHead>
                <TableHead className="text-slate-400">Bayar</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Tanggal</TableHead>
                <TableHead className="text-slate-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20 bg-white/10" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    Tidak ada transaksi ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((txn) => (
                  <TableRow key={txn.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-white text-sm">
                      {txn.invoice_number}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {txn.sales?.full_name || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {txn.outlet?.name || '-'}
                    </TableCell>
                    <TableCell className="text-blue-400 font-semibold text-sm">
                      Rp {txn.total_price.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {txn.payment_method}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(txn.status)}`}>
                        {txn.status === 'COMPLETED' ? 'Lunas' : txn.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {format(new Date(txn.created_at), 'dd MMM HH:mm', { locale: idLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(txn)}
                        className="text-slate-400 hover:text-white h-7 w-7 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
            ))
          : filtered.map((txn) => (
              <button
                key={txn.id}
                onClick={() => handleViewDetail(txn)}
                className="w-full text-left"
              >
                <Card className="border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white">
                            {txn.invoice_number}
                          </p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(txn.status)}`}>
                            {txn.status === 'COMPLETED' ? 'Lunas' : txn.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {txn.sales?.full_name} • {txn.outlet?.name} • {format(new Date(txn.created_at), 'dd MMM HH:mm', { locale: idLocale })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-blue-400 shrink-0 ml-2">
                        Rp {txn.total_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent showCloseButton={true} className="max-w-lg bg-slate-900 border-white/10 p-0">
          {selectedTxn && (
            <>
              <DialogHeader className="p-4 border-b border-white/5">
                <DialogTitle className="text-lg font-semibold text-white">
                  {selectedTxn.invoice_number}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-400">
                  {selectedTxn.sales?.full_name} • {selectedTxn.outlet?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Tanggal</span><span className="text-white">{format(new Date(selectedTxn.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Pembayaran</span><span className="text-white">{selectedTxn.payment_method}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Status</span><Badge variant="outline" className={`text-xs ${statusColor(selectedTxn.status)}`}>{selectedTxn.status === 'COMPLETED' ? 'Lunas' : selectedTxn.status === 'CANCELLED' ? 'Batal' : 'Pending'}</Badge></div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Item Pesanan</p>
                  {txnItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <div>
                        <p className="text-sm text-white">{item.product?.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} × Rp {item.price_at_sale.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-sm font-semibold text-white">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/5 pt-3 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white">Rp {selectedTxn.subtotal.toLocaleString('id-ID')}</span></div>
                  {selectedTxn.discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Diskon</span><span className="text-red-400">- Rp {selectedTxn.discount.toLocaleString('id-ID')}</span></div>}
                  <div className="flex justify-between text-base font-bold"><span className="text-white">Total</span><span className="text-blue-400">Rp {selectedTxn.total_price.toLocaleString('id-ID')}</span></div>
                </div>
                <Button onClick={() => handlePrint(selectedTxn)} variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <Printer className="mr-2 h-4 w-4" /> Cetak Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
