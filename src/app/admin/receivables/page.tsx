'use client';

import { useState, useEffect } from 'react';
import { getReceivables, addPayment } from '@/lib/actions/receivables';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Wallet, 
  Search, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Store,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

export default function ReceivablesPage() {
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  
  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await getReceivables();
    setReceivables(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalOutstanding = receivables.reduce((sum, item) => sum + (item.total_price - item.paid_amount), 0);
  const overdueCount = receivables.filter(item => item.due_date && new Date(item.due_date) < new Date()).length;

  const filteredData = receivables.filter(item => 
    item.outlet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddPayment() {
    if (!selectedTxn || !paymentAmount) return;
    
    setSubmitting(true);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Jumlah bayar tidak valid');
      
      const balance = selectedTxn.total_price - selectedTxn.paid_amount;
      if (amount > balance) throw new Error('Jumlah bayar melebihi sisa piutang');

      await addPayment({
        transactionId: selectedTxn.id,
        amount,
        paymentMethod,
        notes: paymentNotes
      });

      toast.success('Pembayaran berhasil dicatat');
      setIsPaymentDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat pembayaran');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentNotes('');
    setSelectedTxn(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            MANAJEMEN PIUTANG
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Pantau dan Kelola Penagihan Outlet
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl shadow-blue-100/50 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Total Piutang Berjalan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">Rp {totalOutstanding.toLocaleString('id-ID')}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30 text-[10px]">
                {receivables.length} INVOICE AKTIF
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-red-100/50 bg-white overflow-hidden border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Jatuh Tempo (Overdue)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-red-600">{overdueCount}</p>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">HARUS SEGERA DITAGIH</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-emerald-100/50 bg-white overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Tingkat Penagihan</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-emerald-600">85%</p>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Target: 90% Bulan Ini</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-xl shadow-slate-100/50">
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Daftar Tagihan</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari apotek / invoice..." 
                className="pl-10 h-10 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto p-6">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Outlet & Invoice</TableHead>
                  <TableHead className="font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Nilai Transaksi</TableHead>
                  <TableHead className="font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Telah Dibayar</TableHead>
                  <TableHead className="font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Sisa Hutang</TableHead>
                  <TableHead className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Jatuh Tempo</TableHead>
                  <TableHead className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <TrendingUp className="h-6 w-6 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-widest">Memuat data piutang...</span>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Tidak ada piutang aktif
                    </TableCell>
                   </TableRow>
                ) : filteredData.map((item) => {
                  const balance = item.total_price - item.paid_amount;
                  const isOverdue = item.due_date && new Date(item.due_date) < new Date();
                  const statusInfo = PAYMENT_STATUSES.find(s => s.value === item.payment_status);

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                            {item.outlet?.type ? `${item.outlet.type} ${item.outlet.name}` : item.outlet?.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">{item.invoice_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">Rp {item.total_price.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right font-bold text-sm text-emerald-600">Rp {item.paid_amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-black border border-red-100/50 shadow-sm">
                          Rp {balance.toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {item.due_date ? format(new Date(item.due_date), 'dd MMM yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo?.color} border-0 shadow-sm px-2 text-[9px] font-black uppercase tracking-widest`}>
                          {statusInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isPaymentDialogOpen && selectedTxn?.id === item.id} onOpenChange={(open) => {
                          setIsPaymentDialogOpen(open);
                          if (open) setSelectedTxn(item);
                          else resetForm();
                        }}>
                          <DialogTrigger render={
                            <Button size="sm" className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-md shadow-emerald-100 active:scale-95 transition-all">
                              <Plus className="h-3.5 w-3.5" />
                              CICIL
                            </Button>
                          } />
                          <DialogContent className="max-w-md w-[calc(100%-2rem)] rounded-[32px] border-slate-200">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                                  <Wallet className="h-4 w-4" />
                                </div>
                                CATAT CICILAN
                              </DialogTitle>
                              <DialogDescription className="font-bold text-xs uppercase tracking-wider text-slate-400 mt-1">
                                {selectedTxn?.invoice_number} - {selectedTxn?.outlet?.name}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  <span>TAGIHAN</span>
                                  <span>SISA PIUTANG</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span className="text-sm font-bold text-slate-600">Rp {selectedTxn?.total_price.toLocaleString('id-ID')}</span>
                                  <span className="text-xl font-black text-red-600">Rp {balance.toLocaleString('id-ID')}</span>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">JUMLAH BAYAR (RP)</Label>
                                  <Input 
                                    type="number" 
                                    placeholder="0"
                                    className="h-12 bg-slate-50 border-slate-200 text-lg font-black rounded-xl"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">METODE BAYAR</Label>
                                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PAYMENT_METHODS.filter(m => m.value !== 'CREDIT').map(m => (
                                        <SelectItem key={m.value} value={m.value} className="font-bold text-xs">
                                          {m.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CATATAN (OPTIONAL)</Label>
                                  <Input 
                                    placeholder="Keterangan tambahan..."
                                    className="h-12 bg-slate-50 border-slate-200 text-sm font-bold rounded-xl"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button 
                                onClick={handleAddPayment}
                                disabled={submitting || !paymentAmount}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 transition-all"
                              >
                                {submitting ? 'SEDANG MENYIMPAN...' : 'KONFIRMASI PEMBAYARAN'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
