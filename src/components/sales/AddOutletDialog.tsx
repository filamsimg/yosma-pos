'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from '@/components/ui/input-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Camera, MapPin, Store, Plus, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

interface AddOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (outletId: string, mode: 'WITH_ORDER' | 'PROSPECT_ONLY') => void;
}

export function AddOutletDialog({ open, onOpenChange, onSuccess }: AddOutletDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [outletTypes, setOutletTypes] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    address: '',
    phone: '',
    owner_name: ''
  });

  useEffect(() => {
    if (open) {
      fetchOutletTypes();
      getCurrentLocation();
    }
  }, [open]);

  async function fetchOutletTypes() {
    const supabase = createClient();
    const { data } = await supabase.from('outlet_types').select('*').order('name');
    if (data) setOutletTypes(data);
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error('Gagal mengambil lokasi. Pastikan GPS aktif.')
    );
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      setPhoto(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      toast.error('Gagal mengompres foto');
    }
  }

  async function handleSubmit(e: React.FormEvent, mode: 'WITH_ORDER' | 'PROSPECT_ONLY' = 'WITH_ORDER') {
    e.preventDefault();
    if (!user) return;
    if (!photo || !location) {
      toast.error('Foto dan Lokasi wajib diisi');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Upload Photo
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('outlet-photos')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('outlet-photos')
        .getPublicUrl(fileName);

      // 2. Insert Outlet
      const { data: outletData, error: outletError } = await supabase
        .from('outlets')
        .insert({
          name: formData.name,
          type: formData.type,
          address: formData.address,
          phone: formData.phone,
          owner_name: formData.owner_name,
          lat: location.lat,
          lng: location.lng,
          assigned_sales: user.id,
          is_active: true,
          status: 'PROSPECT' // Default to Prospect
        })
        .select()
        .single();

      if (outletError) throw outletError;

      // 3. If it's a "Prospect Only" visit, record a visit entry
      if (mode === 'PROSPECT_ONLY') {
        const { error: visitError } = await supabase
          .from('visits')
          .insert({
            sales_id: user.id,
            outlet_id: outletData.id,
            lat: location.lat,
            lng: location.lng,
            photo_url: publicUrl,
            notes: 'Kunjungan prospek baru (Canvassing)',
            status: 'COMPLETED'
          });
        
        if (visitError) console.error('Gagal mencatat kunjungan prospek:', visitError);
        toast.success('Kunjungan prospek berhasil dicatat');
      } else {
        toast.success('Outlet berhasil didaftarkan');
      }

      onSuccess(outletData.id, mode);
      onOpenChange(false);
      
      // Reset form
      setFormData({ name: '', type: '', address: '', phone: '', owner_name: '' });
      setPhoto(null);
      setPreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mendaftarkan outlet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Daftarkan Outlet Baru"
      subtitle="Input data toko untuk mulai transaksi atau catat prospek"
    >
      <div className="flex flex-col h-[75vh] md:h-[600px]">
        <form 
          onSubmit={(e) => handleSubmit(e, 'WITH_ORDER')} 
          className="flex flex-col h-full overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {/* Photo Section */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Foto Tampak Depan</Label>
              <div className="relative aspect-[16/9] w-full rounded-sm border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-blue-300">
                {preview ? (
                  <>
                    <Image src={preview!} alt="Preview" fill className="object-cover" />
                    <label className="absolute bottom-3 right-3 h-10 w-10 bg-white/90 backdrop-blur rounded-sm flex items-center justify-center shadow-xl cursor-pointer hover:bg-white transition-all active:scale-90">
                      <Camera className="h-5 w-5 text-blue-600" />
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-3 cursor-pointer p-6 w-full group">
                    <div className="h-14 w-14 rounded-sm bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      <Camera className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Ambil Foto Toko</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Wajib untuk Verifikasi Lokasi</p>
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                  </label>
                )}
              </div>
            </div>

            <FormSection title="Informasi Toko" dashed={false}>
               <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Outlet</Label>
                    <InputGroup className="h-11 shadow-none border-slate-200 bg-slate-50/30">
                      <InputGroupAddon className="bg-transparent border-none px-3">
                        <Store className="h-4 w-4 text-slate-400" />
                      </InputGroupAddon>
                      <InputGroupInput 
                        required
                        placeholder="Contoh: Sehat Abadi"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="font-bold text-slate-700 bg-transparent"
                      />
                    </InputGroup>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Outlet</Label>
                    <Select 
                      required
                      value={formData.type}
                      onValueChange={val => setFormData({ ...formData, type: val || '' })}
                    >
                      <SelectTrigger className="h-11 font-bold bg-slate-50/30 border-slate-200 text-slate-700">
                        <SelectValue placeholder="Pilih Tipe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {outletTypes.map(t => (
                          <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap</Label>
                    <InputGroup className="h-auto min-h-[100px] items-start shadow-none border-slate-200 bg-slate-50/30">
                      <InputGroupAddon className="pt-3.5 px-3">
                        <MapPin className="h-4 w-4 text-slate-400" />
                      </InputGroupAddon>
                      <InputGroupTextarea 
                        required
                        placeholder="Masukkan alamat lengkap outlet..."
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="font-bold text-slate-700 min-h-[100px] bg-transparent py-3"
                      />
                    </InputGroup>
                    {location && (
                      <div className="flex items-center gap-1.5 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">
                          GPS Terkunci: {location!.lat.toFixed(6)}, {location!.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Telepon</Label>
                      <InputGroup className="h-11 shadow-none border-slate-200 bg-slate-50/30">
                        <InputGroupAddon className="bg-transparent border-none px-3">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput 
                          placeholder="0812..."
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="font-bold text-slate-700 bg-transparent"
                        />
                      </InputGroup>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px) font-black text-slate-400 uppercase tracking-widest">Nama Pemilik</Label>
                      <InputGroup className="h-11 shadow-none border-slate-200 bg-slate-50/30">
                        <InputGroupAddon className="bg-transparent border-none px-3">
                          <User className="h-4 w-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput 
                          placeholder="Nama Owner"
                          value={formData.owner_name}
                          onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                          className="font-bold text-slate-700 bg-transparent"
                        />
                      </InputGroup>
                   </div>
                 </div>
               </div>
            </FormSection>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 pb-10 shrink-0">
             <Button
               type="submit"
               disabled={loading}
               className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
               Daftarkan & Mulai Order
             </Button>
             
             <Button
               type="button"
               disabled={loading}
               onClick={(e) => handleSubmit(e, 'PROSPECT_ONLY')}
               className="w-full h-11 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
               Hanya Mampir (Tanpa Order)
             </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  );
}
