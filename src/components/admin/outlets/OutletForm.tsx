"use client"

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { outletSchema, type OutletFormValues } from '@/lib/validations/outlet';
import { VISIT_DAYS, VISIT_FREQUENCIES } from '@/lib/constants';
import { getSalesProfiles } from '@/lib/actions/profiles';
import { getOutletTypes, createOutletType, deleteOutletType } from '@/lib/actions/outlets';
import { 
  Loader2, 
  X, 
  CheckCircle2, 
  Plus, 
  Check, 
  Trash2, 
  MapPin, 
  CalendarClock, 
  Users, 
  Store,
  Navigation 
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FormSection } from '@/components/ui/form-section';
import { normalizeTypeName, normalizePhoneNumber } from '@/lib/utils/string-utils';
import type { Outlet, Profile, OutletType } from '@/types';

interface OutletFormProps {
  initialData?: Outlet | null;
  onSubmit: (values: OutletFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OutletForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: OutletFormProps) {
  const [salesProfiles, setSalesProfiles] = useState<Profile[]>([]);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);

  const [outletTypes, setOutletTypes] = useState<OutletType[]>([]);
  const [fetchingTypes, setFetchingTypes] = useState(true);

  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [submittingType, setSubmittingType] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<OutletType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      address: initialData?.address || '',
      phone: normalizePhoneNumber(initialData?.phone || ''),
      visit_day: initialData?.visit_day || '',
      visit_frequency: (initialData?.visit_frequency === 'WEEKLY' || !initialData?.visit_frequency) 
        ? 'Seminggu Sekali' 
        : initialData.visit_frequency,
      city: initialData?.city || '',
      assigned_sales: initialData?.assigned_sales || '',
    },
  });

  const assignedSalesString = watch('assigned_sales') || '';
  const selectedCodes = assignedSalesString
    ? assignedSalesString.split(',').map((s) => s.trim().toUpperCase())
    : [];

  useEffect(() => {
    async function loadData() {
      const [profilesData, typesData] = await Promise.all([
        getSalesProfiles(),
        getOutletTypes()
      ]);
      setSalesProfiles(profilesData);
      setOutletTypes(typesData);
      setFetchingProfiles(false);
      setFetchingTypes(false);
    }
    loadData();
  }, []);

  async function handleAddType() {
    const normalizedName = normalizeTypeName(newTypeName.trim().toUpperCase());
    if (!normalizedName) return;
    setSubmittingType(true);
    const result = await createOutletType(normalizedName);
    if (result.error) {
      toast.error('Gagal menambah tipe', { description: result.error });
    } else if (result.data) {
      const newType = result.data as OutletType;
      setOutletTypes([...outletTypes, newType].sort((a, b) => a.name.localeCompare(b.name)));
      setValue('type', newType.name, { shouldValidate: true });
      setIsAddingType(false);
      setNewTypeName('');
      toast.success('Tipe berhasil ditambahkan');
    }
    setSubmittingType(false);
  }

  function handleDeleteTypeClick(e: React.MouseEvent, t: OutletType) {
    e.stopPropagation();
    e.preventDefault();
    setTypeToDelete(t);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteType() {
    if (!typeToDelete) return;
    setIsDeleting(true);
    const result = await deleteOutletType(typeToDelete.id);
    if (result.error) {
      toast.error('Gagal menghapus tipe', { description: result.error });
    } else {
      setOutletTypes(outletTypes.filter((t) => t.id !== typeToDelete.id));
      if (watch('type') === typeToDelete.name) setValue('type', '', { shouldValidate: true });
      toast.success('Tipe berhasil dihapus');
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setTypeToDelete(null);
  }

  const addSales = (code: string) => {
    const upperCode = code.toUpperCase();
    if (!selectedCodes.includes(upperCode)) {
      const newCodes = [...selectedCodes, upperCode];
      setValue('assigned_sales', newCodes.join(', '));
    }
  };

  const removeSales = (code: string) => {
    const upperCode = code.toUpperCase();
    const newCodes = selectedCodes.filter((c) => c !== upperCode);
    setValue('assigned_sales', newCodes.join(', '));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-2 pb-6 max-w-4xl mx-auto">
      <div className="space-y-12">
        
        {/* Section 1: Detail & Lokasi */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Informasi Utama & Lokasi</h3>
          </div>

          <div className="grid gap-8">
            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Nama Lengkap Outlet *</Label>
              <Input
                {...register('name')}
                onChange={(e) => setValue('name', e.target.value.toUpperCase())}
                className="bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 px-5 shadow-sm rounded-xl uppercase font-semibold text-base"
                placeholder="CONTOH: SEHAT JAYA"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1 font-medium ml-1 uppercase">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Tipe Outlet / Toko</Label>
                {isAddingType ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <Input
                      placeholder="NAMA TIPE..."
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value.toUpperCase())}
                      autoFocus
                      className="bg-white border-input text-slate-900 h-12 px-4 focus-visible:ring-blue-600 rounded-xl shadow-sm uppercase font-bold"
                    />
                    <Button 
                      type="button"
                      size="icon" 
                      onClick={handleAddType} 
                      disabled={submittingType}
                      className="bg-blue-600 hover:bg-blue-700 h-12 w-12 shrink-0 rounded-xl shadow-sm"
                    >
                      {submittingType ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Check className="h-5 w-5 text-white" />}
                    </Button>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsAddingType(false)}
                      className="text-slate-500 hover:text-red-600 h-12 px-2 font-bold uppercase"
                    >
                      BATAL
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange} disabled={fetchingTypes}>
                          <SelectTrigger className="bg-white border-input text-slate-900 h-12 focus:ring-blue-600 px-5 flex-1 rounded-xl font-medium uppercase text-left">
                            <SelectValue placeholder={fetchingTypes ? "MEMUAT..." : "PILIH TIPE"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-input text-slate-900 shadow-xl rounded-xl">
                            {outletTypes.map((type) => (
                              <SelectItem key={type.id} value={type.name} className="focus:bg-slate-50 focus:text-blue-600 py-3 px-4 flex items-center justify-between group/item text-xs font-bold uppercase">
                                <span>{type.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteTypeClick(e, type)}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all ml-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Button 
                      type="button"
                      size="icon" 
                      onClick={() => setIsAddingType(true)}
                      className="h-12 w-12 shrink-0 bg-white border border-input text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Kota / Kabupaten</Label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <Input
                    {...register('city')}
                    onChange={(e) => setValue('city', e.target.value.toUpperCase())}
                    className="bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 pr-5 pl-12 shadow-sm rounded-xl uppercase font-semibold text-base"
                    placeholder="CONTOH: PEMALANG"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Alamat Lengkap Outlet</Label>
              <div className="relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  {...register('address')}
                  className="bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 pr-5 pl-12 shadow-sm rounded-xl uppercase font-semibold text-base"
                  placeholder="Gunakan nama jalan, nomor, dan kecamatan..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Operasional & Jadwal */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarClock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Operasional & Jadwal</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Hari Kunjungan Utama</Label>
              <Controller
                name="visit_day"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white border-input text-slate-900 h-12 focus:ring-blue-600 px-5 rounded-xl font-medium uppercase">
                      <SelectValue placeholder="PILIH HARI" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-input text-slate-900 shadow-xl rounded-xl">
                      {VISIT_DAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value} className="focus:bg-slate-50 focus:text-blue-600 py-3 px-4 text-xs font-bold uppercase">
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Frekuensi Kunjungan</Label>
              <Controller
                name="visit_frequency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white border-input text-slate-900 h-12 focus:ring-blue-600 px-5 rounded-xl font-medium uppercase">
                      <SelectValue placeholder="SEMINGGU SEKALI" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-input text-slate-900 shadow-xl rounded-xl">
                      {VISIT_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value} className="focus:bg-slate-50 focus:text-blue-600 py-3 px-4 text-xs font-bold uppercase">
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Penugasan & Kontak */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Penugasan & Kontak</h3>
          </div>

          <div className="grid gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">No. WhatsApp Toko / Owner</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-600 border-r border-slate-100 pr-4 h-5 flex items-center">
                    +62
                  </div>
                  <Input
                    {...register('phone')}
                    onChange={(e) => setValue('phone', normalizePhoneNumber(e.target.value))}
                    className="pl-16 bg-white border-input text-slate-900 h-12 focus-visible:ring-blue-600 text-base font-black tabular-nums rounded-xl shadow-sm"
                    placeholder="812xxxxxx"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-600 mt-1 font-medium ml-1 uppercase">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1">Pilih Sales Lapangan</Label>
                <Select onValueChange={(val: any) => { if (typeof val === 'string') addSales(val); }}>
                  <SelectTrigger className="bg-white border-input text-slate-900 h-12 focus:ring-blue-600 px-5 rounded-xl shadow-sm font-medium uppercase">
                    <SelectValue placeholder={fetchingProfiles ? "MEMUAT DATA SALES..." : "TAMBAH SALES"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-100 text-slate-900 shadow-xl rounded-xl">
                    {salesProfiles.filter(p => p.nik && !selectedCodes.includes(p.nik.toUpperCase())).length === 0 ? (
                      <div className="p-6 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Semua sales aktif telah ditugaskan</div>
                    ) : (
                      salesProfiles
                        .filter(p => p.nik && !selectedCodes.includes(p.nik.toUpperCase()))
                        .map((profile) => (
                          <SelectItem key={profile.id} value={profile.nik || ''} className="focus:bg-slate-50 focus:text-blue-600 py-3 px-4 text-xs font-bold uppercase">
                            <div className="flex items-center gap-3">
                               <span className="text-slate-900">{profile.full_name}</span>
                               <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{profile.nik}</span>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* List Selected Items */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-wrap gap-3 ${selectedCodes.length === 0 ? 'bg-slate-50/30 border-slate-100' : 'bg-slate-50/50 border-slate-200 shadow-inner'}`}>
              {selectedCodes.length > 0 ? (
                selectedCodes.map(code => {
                  const profile = salesProfiles.find(p => p.nik?.toUpperCase() === code);
                  return (
                    <div key={code} className="flex items-center gap-3 bg-white border border-slate-200 pl-4 pr-1 py-1.5 rounded-xl transition-all hover:border-blue-300 group shadow-sm">
                       <div className="flex flex-col">
                         <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{profile?.full_name || 'Loading...'}</span>
                         <span className="text-[9px] font-mono text-blue-600 font-black">{code}</span>
                       </div>
                       <button type="button" onClick={() => removeSales(code)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all">
                         <X className="h-4 w-4" />
                       </button>
                    </div>
                  )
                })
              ) : (
                <div className="w-full text-center py-4 flex flex-col items-center gap-2 opacity-30">
                   <Users className="h-6 w-6 text-slate-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada sales terpilih</span>
                </div>
              )}
            </div>
            <Input type="hidden" {...register('assigned_sales')} />
          </div>
        </section>

      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-8 mt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-12 px-8 font-bold text-xs uppercase tracking-widest rounded-sm transition-all order-2 sm:order-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading || fetchingProfiles || fetchingTypes}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 rounded-sm flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {initialData ? 'SIMPAN PERUBAHAN' : 'SELESAIKAN'}
        </Button>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Tipe Outlet?"
        description={`Kategori "${typeToDelete?.name}" akan dihapus permanen. Outlet yang menggunakannya akan tetap ada namun tanpa tipe.`}
        onConfirm={confirmDeleteType}
        loading={isDeleting}
      />
    </form>
  );
}
