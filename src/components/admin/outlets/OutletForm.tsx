'use client';

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
import { Loader2, X, CheckCircle2 } from 'lucide-react';
import type { Outlet, Profile } from '@/types';

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
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      visit_day: initialData?.visit_day || '',
      visit_frequency: initialData?.visit_frequency === 'WEEKLY' ? 'Seminggu Sekali' : (initialData?.visit_frequency || 'Seminggu Sekali'),
      assigned_sales: initialData?.assigned_sales || '',
    },
  });

  const assignedSalesString = watch('assigned_sales') || '';
  const selectedCodes = assignedSalesString
    ? assignedSalesString.split(',').map((s) => s.trim().toUpperCase())
    : [];

  useEffect(() => {
    async function loadProfiles() {
      const data = await getSalesProfiles();
      setSalesProfiles(data);
      setFetchingProfiles(false);
    }
    loadProfiles();
  }, []);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-2">
      <div className="grid gap-6">
        {/* Nama Outlet */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Nama Outlet *</Label>
          <Input
            {...register('name')}
            onChange={(e) => setValue('name', e.target.value.toUpperCase())}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4 uppercase"
            placeholder="MASUKKAN NAMA LENGKAP OUTLET"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>}
        </div>

        {/* Alamat */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Alamat Lengkap</Label>
          <Input
            {...register('address')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4"
            placeholder="MASUKKAN ALAMAT LENGKAP OUTLET"
          />
        </div>

        {/* Jadwal & Frekuensi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Hari Kunjungan</Label>
            <Controller
              name="visit_day"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600">
                    <SelectValue placeholder="PILIH HARI" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                    {VISIT_DAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value} className="focus:bg-slate-50 focus:text-blue-600 py-2.5">
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Frekuensi</Label>
            <Controller
              name="visit_frequency"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600">
                    <SelectValue placeholder="SEMINGGU SEKALI" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                    {VISIT_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value} className="focus:bg-slate-50 focus:text-blue-600 py-2.5">
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Penugasan Sales */}
        <div className="space-y-3">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Penugasan Sales</Label>
          <div className="space-y-4">
            <Select onValueChange={(val: any) => { if (typeof val === 'string') addSales(val); }}>
              <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus:ring-blue-600">
                <SelectValue placeholder={fetchingProfiles ? "MEMUAT..." : "TAMBAH SALES KE OUTLET"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                {salesProfiles.filter(p => p.sales_code && !selectedCodes.includes(p.sales_code.toUpperCase())).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Semua sales sudah terpilih</div>
                ) : (
                  salesProfiles
                    .filter(p => p.sales_code && !selectedCodes.includes(p.sales_code.toUpperCase()))
                    .map((profile) => (
                      <SelectItem key={profile.id} value={profile.sales_code || ''} className="focus:bg-slate-50 focus:text-blue-600 py-2.5">
                        <div className="flex items-center gap-2">
                           <span className="font-bold">{profile.full_name}</span>
                           <span className="text-[10px] opacity-50">({profile.sales_code})</span>
                        </div>
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>

            {/* List Selected Items */}
            <div className={`p-4 rounded-lg border border-slate-200 flex flex-wrap gap-2 ${selectedCodes.length === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
              {selectedCodes.length > 0 ? (
                selectedCodes.map(code => {
                  const profile = salesProfiles.find(p => p.sales_code?.toUpperCase() === code);
                  return (
                    <div key={code} className="flex items-center gap-2 bg-slate-100 border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg transition-all hover:bg-slate-200">
                       <span className="text-xs font-bold text-slate-700">{profile?.full_name || code}</span>
                       <button type="button" onClick={() => removeSales(code)} className="text-slate-400 hover:text-red-500 transition-colors">
                         <X className="h-4 w-4" />
                       </button>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-slate-400 font-medium py-1 uppercase tracking-wider">Belum ada sales terpilih</div>
              )}
            </div>
          </div>
          <Input type="hidden" {...register('assigned_sales')} />
        </div>

        {/* Telepon */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">No. Telepon Toko/Owner</Label>
          <Input
            {...register('phone')}
            className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:ring-blue-600 px-4"
            placeholder="MASUKKAN NOMOR TELEPON TOKO/OWNER"
          />
          {errors.phone && <p className="text-xs text-red-600 mt-1 font-medium">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 font-medium"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading || fetchingProfiles}
          className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 font-semibold shadow-md shadow-blue-100 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          {initialData ? 'Simpan Perubahan' : 'Simpan Outlet'}
        </Button>
      </div>
    </form>
  );
}
