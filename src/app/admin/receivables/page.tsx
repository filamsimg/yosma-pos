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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Wallet, 
  Search, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Camera,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useImageCapture } from '@/hooks/use-image-capture';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

import { StatCard } from '@/components/ui/stat-card';
import { ReceivableTable } from '@/components/admin/receivables/ReceivableTable';

export default function ReceivablesPage() {
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  
  // Hooks
  const img = useImageCapture();
  
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

  useEffect(() => { loadData(); }, []);

  const activeReceivables = receivables.filter(r => r.payment_status !== 'PAID');
  const completedReceivables = receivables.filter(r => r.payment_status === 'PAID');
  const totalOutstanding = activeReceivables.reduce((sum, item) => sum + (item.total_price - item.paid_amount), 0);
  const overdueCount = activeReceivables.filter(item => item.due_date && new Date(item.due_date) < new Date()).length;
  const totalBilled = activeReceivables.reduce((sum, item) => sum + item.total_price, 0);
  const totalPaid = activeReceivables.reduce((sum, item) => sum + item.paid_amount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const filterFn = (item: any) => 
    item.outlet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredActive = activeReceivables.filter(filterFn);
  const filteredCompleted = completedReceivables.filter(filterFn);

  async function handleAddPayment() {
    if (!selectedTxn || !paymentAmount) return;
    setSubmitting(true);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Jumlah bayar tidak valid');
      const balance = selectedTxn.total_price - selectedTxn.paid_amount;
      if (amount > balance) throw new Error('Jumlah bayar melebihi sisa piutang');
      if (paymentMethod === 'TRANSFER' && !img.compressedFile) throw new Error('Mohon unggah bukti transfer');

      const formData = new FormData();
      formData.append('transactionId', selectedTxn.id);
      formData.append('amount', amount.toString());
      formData.append('paymentMethod', paymentMethod);
      formData.append('notes', paymentNotes);
      if (img.compressedFile) formData.append('proofFile', img.compressedFile);

      await addPayment(formData);
      toast.success('Pembayaran berhasil dicatat');
      setIsPaymentDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat pembayaran');
    } finally { setSubmitting(false); }
  }

  function resetForm() {
    setPaymentAmount(''); setPaymentMethod('CASH'); setPaymentNotes('');
    setSelectedTxn(null); img.clearImage();
  }

  function handleOpenPayment(item: any) {
    setSelectedTxn(item);
    setIsPaymentDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            MANAJEMEN <span className="text-blue-600">PIUTANG</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest leading-tight">
            Pantau penagihan outlet dengan tempo 14/30 hari
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Piutang Berjalan" value={`Rp ${totalOutstanding.toLocaleString('id-ID')}`} icon={Wallet} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Lewat Tempo" value={overdueCount} icon={AlertCircle} iconBgColor="bg-red-50" iconColor="text-red-600" />
        <StatCard label="Tingkat Tagih" value={`${collectionRate}%`} icon={CheckCircle2} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Invoice Aktif" value={activeReceivables.length} icon={TrendingUp} iconBgColor="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari outlet atau nomor invoice..." className="pl-10 h-10 bg-white border-slate-100 text-slate-900 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <Tabs defaultValue="aktif" className="w-full">
          <TabsList className="bg-slate-100 p-1 mb-6 h-12 w-full sm:w-auto grid grid-cols-2 rounded-xl">
            <TabsTrigger value="aktif" className="font-bold text-[10px] uppercase tracking-widest px-8 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Aktif</TabsTrigger>
            <TabsTrigger value="selesai" className="font-bold text-[10px] uppercase tracking-widest px-8 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Selesai</TabsTrigger>
          </TabsList>

          <TabsContent value="aktif" className="mt-0">
            <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden rounded-xl">
              <ReceivableTable 
                data={filteredActive} 
                loading={loading} 
                onPay={handleOpenPayment} 
                type="ACTIVE" 
              />
            </Card>
          </TabsContent>

          <TabsContent value="selesai" className="mt-0">
            <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden rounded-xl">
              <ReceivableTable 
                data={filteredCompleted} 
                loading={loading} 
                onPay={() => {}} 
                type="COMPLETED" 
              />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { setIsPaymentDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-md w-[calc(100%-2rem)] bg-white rounded-2xl shadow-3xl border-none p-0 overflow-hidden">
            {selectedTxn && (
              <>
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Catat Pembayaran</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase mt-1">Invoice: {selectedTxn.invoice_number} • {selectedTxn.outlet?.name}</DialogDescription>
                </div>
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sisa Tagihan</p>
                      <p className="text-xl font-black text-blue-600">Rp {(selectedTxn.total_price - selectedTxn.paid_amount).toLocaleString('id-ID')}</p>
                    </div>
                    <Wallet className="h-6 w-6 text-blue-200" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jumlah Bayar (Rp)</Label>
                      <Input type="number" placeholder="0" className="h-11 bg-white border-slate-100 text-base font-black text-slate-800 focus:ring-blue-500 transition-all" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metode</Label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                        <button onClick={() => setPaymentMethod('CASH')} className={cn("h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all", paymentMethod === 'CASH' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}>Tunai</button>
                        <button onClick={() => setPaymentMethod('TRANSFER')} className={cn("h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all", paymentMethod === 'TRANSFER' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}>Transfer</button>
                      </div>
                    </div>
                    {paymentMethod === 'TRANSFER' && (
                      <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                          <Camera className="h-3 w-3" /> Bukti Transfer
                        </Label>
                        <div className="aspect-video relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden group hover:border-blue-300 transition-all">
                          {img.preview ? (
                            <>
                              <img src={img.preview} className="w-full h-full object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); img.clearImage(); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"><X className="h-4 w-4" /></button>
                            </>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <Camera className="h-6 w-6 text-slate-300 mb-2 group-hover:text-blue-400 transition-colors" />
                              <span className="text-[9px] font-black text-slate-400 uppercase">Ambil Foto Bukti</span>
                              <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if(f) img.processImage(f); }} />
                            </label>
                          )}
                        </div>
                        {img.loading && <p className="text-[10px] text-blue-600 animate-pulse font-bold">Sedang memproses gambar...</p>}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-black">Catatan Tambahan</Label>
                      <Input placeholder="Opsional..." className="h-11 bg-white border-slate-100 text-xs text-slate-600" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <Button onClick={() => setIsPaymentDialogOpen(false)} variant="ghost" className="flex-1 h-11 text-slate-400 font-black text-[10px] uppercase tracking-widest">Batal</Button>
                  <Button onClick={handleAddPayment} disabled={submitting || !paymentAmount} className="flex-[2] h-11 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">{submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
