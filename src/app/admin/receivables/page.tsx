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

      // Requirement: Proof of transfer if method is TRANSFER
      if (paymentMethod === 'TRANSFER' && !img.compressedFile) {
        throw new Error('Mohon unggah bukti transfer');
      }

      const formData = new FormData();
      formData.append('transactionId', selectedTxn.id);
      formData.append('amount', amount.toString());
      formData.append('paymentMethod', paymentMethod);
      formData.append('notes', paymentNotes);
      if (img.compressedFile) {
        formData.append('proofFile', img.compressedFile);
      }

      await addPayment(formData);

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
    img.clearImage();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-blue-700 uppercase tracking-tight">Manajemen Piutang</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau dan kelola penagihan outlet dengan tempo 14/30 hari.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-slate-900">
              Rp {totalOutstanding.toLocaleString('id-ID')}
            </h4>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Piutang Berjalan
            </span>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-red-600">
              {overdueCount} <span className="text-xs text-slate-400">Invoice</span>
            </h4>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lewat Jatuh Tempo
            </span>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-emerald-600">
              85%
            </h4>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tingkat Penagihan
            </span>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-slate-900">
              {receivables.length}
            </h4>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Invoice Aktif
            </span>
          </div>
        </Card>
      </div>

      {/* Main Table section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari apotek atau nomor invoice..." 
              className="pl-10 h-10 bg-white border-slate-200 text-slate-900 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden rounded-md flex flex-col">
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Outlet & Invoice</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider text-right">Nilai</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider text-right">Terbayar</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider text-right">Sisa Hutang</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Jatuh Tempo</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-100">
                      <TableCell colSpan={7} className="h-12 text-center text-slate-400 text-xs animate-pulse">Memuat data...</TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length === 0 ? (
                   <TableRow className="border-slate-100 italic">
                    <TableCell colSpan={7} className="h-24 text-center text-slate-400 font-medium">
                      Tidak ada piutang aktif ditemukan
                    </TableCell>
                   </TableRow>
                ) : filteredData.map((item) => {
                  const balance = item.total_price - item.paid_amount;
                  const isOverdue = item.due_date && new Date(item.due_date) < new Date();
                  const statusInfo = PAYMENT_STATUSES.find(s => s.value === item.payment_status);

                  return (
                    <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 uppercase">
                            {item.outlet?.type ? `${item.outlet.type} ${item.outlet.name}` : item.outlet?.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">{item.invoice_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">Rp {item.total_price.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-600 font-medium">Rp {item.paid_amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-black text-red-600">
                          Rp {balance.toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isOverdue ? 'text-red-500 underline' : 'text-slate-500'}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {item.due_date ? format(new Date(item.due_date), 'dd MMM yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-0 text-[10px] px-2 py-0.5 font-bold uppercase ${statusInfo?.color}`}>
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
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 transition-all active:scale-95">
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              CICIL
                            </Button>
                          } />
                          <DialogContent className="max-w-md w-[calc(100%-2rem)] bg-white rounded-xl shadow-2xl border-slate-200">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-slate-900">Catat Pelunasan/Cicilan</DialogTitle>
                              <DialogDescription className="text-slate-500">
                                {selectedTxn?.invoice_number} • {selectedTxn?.outlet?.name}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-4">
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <span>TAGIHAN</span>
                                  <span>SISA PIUTANG</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                  <span className="text-sm font-medium text-slate-600">Rp {selectedTxn?.total_price.toLocaleString('id-ID')}</span>
                                  <span className="text-xl font-black text-red-600 underline">Rp {balance.toLocaleString('id-ID')}</span>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-slate-700">Jumlah Bayar (Rp)</Label>
                                  <Input 
                                    type="number" 
                                    placeholder="0"
                                    className="h-11 bg-white border-slate-200 text-lg font-bold"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-slate-700">Metode Bayar</Label>
                                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => setPaymentMethod('CASH')}
                                      className={cn(
                                        "h-10 rounded-lg text-sm font-bold transition-all",
                                        paymentMethod === 'CASH'
                                          ? "bg-white text-blue-600 shadow-sm"
                                          : "text-slate-400 hover:text-slate-600"
                                      )}
                                    >
                                      Tunai
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPaymentMethod('TRANSFER')}
                                      className={cn(
                                        "h-10 rounded-lg text-sm font-bold transition-all",
                                        paymentMethod === 'TRANSFER'
                                          ? "bg-white text-blue-600 shadow-sm"
                                          : "text-slate-400 hover:text-slate-600"
                                      )}
                                    >
                                      Transfer
                                    </button>
                                  </div>
                                </div>

                                {/* Proof of Transfer Upload */}
                                {paymentMethod === 'TRANSFER' && (
                                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 px-1">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                      <Camera className="h-3 w-3 text-blue-600" /> UNGGAH BUKTI TRANSFER
                                    </Label>
                                    
                                    {img.preview ? (
                                      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm group aspect-[4/3]">
                                        <img
                                          src={img.preview}
                                          alt="Bukti transfer"
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => img.clearImage()}
                                            className="rounded-full w-10 h-10"
                                          >
                                            <X className="h-5 w-5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-white hover:border-blue-400 transition-all group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Camera className="h-5 w-5" />
                                          </div>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klik untuk pilih foto</p>
                                        </div>
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) img.processImage(file);
                                          }}
                                        />
                                      </label>
                                    )}
                                    {img.loading && (
                                      <p className="text-[10px] text-blue-600 animate-pulse font-bold">Sedang memproses gambar...</p>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-slate-700">Catatan Tambahan</Label>
                                  <Input 
                                    placeholder="Opsional..."
                                    className="h-11 bg-white border-slate-200 text-sm"
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
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-100"
                              >
                                {submitting ? 'Sedang Menyimpan...' : 'Simpan Pembayaran'}
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
        </Card>
      </div>
    </div>
  );
}
