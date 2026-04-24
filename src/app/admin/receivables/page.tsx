'use client';

import { useState, useEffect } from 'react';
import { getReceivables, addPayment } from '@/lib/actions/receivables';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { AdminToolbar, AdminToolbarSection } from '@/components/ui/admin/toolbar';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';

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
      <AdminPageHeader 
        title="Manajemen Piutang"
        description="Pantau penagihan outlet dan kelola jatuh tempo pembayaran secara real-time"
        breadcrumbs={[{ label: 'Piutang' }]}
        action={
          <Button variant="outline" className="h-10 px-4 border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-slate-50 w-full md:w-auto">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" /> Laporan Piutang
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Piutang Berjalan" value={`Rp ${totalOutstanding.toLocaleString('id-ID')}`} icon={Wallet} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Lewat Tempo" value={overdueCount} icon={AlertCircle} iconBgColor="bg-red-50" iconColor="text-red-600" />
        <StatCard label="Tingkat Tagih" value={`${collectionRate}%`} icon={CheckCircle2} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Invoice Aktif" value={activeReceivables.length} icon={TrendingUp} iconBgColor="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      <AdminToolbar>
        <AdminToolbarSection grow>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              placeholder="Cari outlet atau nomor invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
            />
          </div>
        </AdminToolbarSection>

        <AdminToolbarSection className="border-t md:border-t-0 md:border-l border-slate-100 py-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-sm overflow-x-auto scrollbar-none">
            <button
              onClick={() => {}} // Active logic already handled by Tabs below, but keeping look consistent
              className={cn(
                "px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all",
                "bg-slate-900 text-white shadow-lg shadow-slate-200"
              )}
            >
              Semua Piutang
            </button>
          </div>
        </AdminToolbarSection>
      </AdminToolbar>

      <Tabs defaultValue="aktif" className="w-full">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
           <TabsList className="bg-slate-50/50 p-1 h-auto rounded-sm border border-slate-100">
             <TabsTrigger value="aktif" className="font-black text-[9px] uppercase tracking-[0.2em] px-6 py-2 rounded-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Aktif</TabsTrigger>
             <TabsTrigger value="selesai" className="font-black text-[9px] uppercase tracking-[0.2em] px-6 py-2 rounded-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Selesai</TabsTrigger>
           </TabsList>
        </div>

          <TabsContent value="aktif" className="mt-0">
             <ReceivableTable 
               data={filteredActive} 
               loading={loading} 
               onPay={handleOpenPayment} 
               type="ACTIVE" 
             />
          </TabsContent>

          <TabsContent value="selesai" className="mt-0">
             <ReceivableTable 
               data={filteredCompleted} 
               loading={loading} 
               onPay={() => {}} 
               type="COMPLETED" 
             />
          </TabsContent>
        </Tabs>

      <AppDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={(open) => { setIsPaymentDialogOpen(open); if (!open) resetForm(); }}
        variant="receipt"
        title="Catat Pembayaran"
        subtitle={`Invoice: ${selectedTxn?.invoice_number}`}
      >
        {selectedTxn && (
          <>
            <FormSection padding="md" className="bg-blue-50/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Sisa Tagihan</p>
                  <p className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">
                    Rp {(selectedTxn.total_price - selectedTxn.paid_amount).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="h-10 w-10 bg-white rounded-sm border border-blue-100 flex items-center justify-center shadow-sm">
                  <Wallet className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </FormSection>

            <div className="flex-1 overflow-y-auto">
              <FormSection title="Data Pembayaran" subtitle="Mohon isi nominal dengan teliti">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Bayar (Rp)</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-12 bg-white border-slate-100 text-lg font-black text-slate-800 rounded-sm focus:ring-blue-500 transition-all" 
                      value={paymentAmount} 
                      onChange={(e) => setPaymentAmount(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 border border-slate-100 rounded-sm">
                      <button 
                        onClick={() => setPaymentMethod('CASH')} 
                        className={cn(
                          "h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all", 
                          paymentMethod === 'CASH' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                        )}
                      >
                        Tunai
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('TRANSFER')} 
                        className={cn(
                          "h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all", 
                          paymentMethod === 'TRANSFER' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                        )}
                      >
                        Transfer
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'TRANSFER' && (
                    <div className="space-y-3 animate-in slide-in-from-top-4 duration-150">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Camera className="h-3.5 w-3.5 text-blue-500" /> Bukti Transfer
                      </Label>
                      <div className="aspect-video relative rounded-sm border border-dashed border-slate-200 bg-slate-50/50 overflow-hidden group hover:border-blue-300 transition-all">
                        {img.preview ? (
                          <>
                            <img src={img.preview} className="w-full h-full object-cover" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); img.clearImage(); }} 
                              className="absolute top-2 right-2 w-8 h-8 rounded-sm bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            <Camera className="h-6 w-6 text-slate-300 mb-2 group-hover:text-blue-400 transition-colors" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilih / Ambil Foto</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              capture="environment" 
                              onChange={(e) => { const f = e.target.files?.[0]; if(f) img.processImage(f); }} 
                            />
                          </label>
                        )}
                      </div>
                      {img.loading && <p className="text-[9px] text-blue-600 animate-pulse font-black uppercase">Memproses Gambar...</p>}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan Tambahan</Label>
                    <Input 
                      placeholder="Contoh: Titipan ke sales atau via outlet..." 
                      className="h-10 bg-white border-slate-100 text-[11px] text-slate-600 rounded-sm" 
                      value={paymentNotes} 
                      onChange={(e) => setPaymentNotes(e.target.value)} 
                    />
                  </div>
                </div>
              </FormSection>
            </div>

            <FormSection padding="lg" dashed={false} className="bg-slate-50/50">
               <div className="flex flex-col gap-2">
                 <Button 
                   onClick={handleAddPayment} 
                   disabled={submitting || !paymentAmount} 
                   className="w-full h-12 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-slate-100 active:scale-95 transition-all"
                 >
                   {submitting ? 'MEMPROSES...' : 'SIMPAN PEMBAYARAN'}
                 </Button>
                 <Button 
                   onClick={() => setIsPaymentDialogOpen(false)} 
                   variant="ghost" 
                   className="w-full h-10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-sm"
                 >
                   BATALKAN
                 </Button>
               </div>
            </FormSection>
          </>
        )}
      </AppDialog>
    </div>
  );
}
