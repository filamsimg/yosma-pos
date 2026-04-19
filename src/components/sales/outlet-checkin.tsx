'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useImageCapture } from '@/hooks/use-image-capture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Camera,
  Search,
  Store,
  CheckCircle2,
  Loader2,
  Navigation,
  X,
  AlertCircle,
  Map,
} from 'lucide-react';
import type { Outlet } from '@/types';

interface OutletCheckinProps {
  onCheckin: (data: {
    outlet: Outlet;
    lat: number;
    lng: number;
    photoUrl: string;
  }) => void;
  checkedIn: boolean;
  checkinData: {
    outlet: Outlet;
    lat: number;
    lng: number;
    photoUrl: string;
  } | null;
}

export function OutletCheckin({
  onCheckin,
  checkedIn,
  checkinData,
}: OutletCheckinProps) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filteredOutlets, setFilteredOutlets] = useState<Outlet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geo = useGeolocation();
  const img = useImageCapture();

  // Fetch outlets
  useEffect(() => {
    async function fetchOutlets() {
      const supabase = createClient();
      const { data } = await supabase
        .from('outlets')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setOutlets(data);
        setFilteredOutlets(data);
      }
    }
    fetchOutlets();
  }, []);

  // Filter outlets by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOutlets(outlets);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredOutlets(
        outlets.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            o.address?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, outlets]);

  // Handle photo capture
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await img.processImage(file);
    }
  }

  // Handle check-in submission
  async function handleCheckin() {
    if (!selectedOutlet || !geo.latitude || !geo.longitude || !img.compressedFile)
      return;

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}_checkin.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('transaction-photos')
        .upload(fileName, img.compressedFile, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('transaction-photos').getPublicUrl(fileName);

      onCheckin({
        outlet: selectedOutlet,
        lat: geo.latitude,
        lng: geo.longitude,
        photoUrl: publicUrl,
      });

      setDialogOpen(false);
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setUploading(false);
    }
  }

  // If already checked in
  if (checkedIn && checkinData) {
    return (
      <Card className="border-blue-100 bg-white shadow-md shadow-blue-50/50 rounded-[24px] overflow-hidden">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-50">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">TER-CHECKIN</p>
            <p className="text-sm font-black text-slate-900 truncate">
              {checkinData.outlet.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3 w-3 text-slate-300" />
              <p className="text-xs font-medium text-slate-400 truncate">
                {checkinData.outlet.address || 'Lokasi GPS Tercatat'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-8 font-bold text-[10px]"
            onClick={() => window.location.reload()} // Quick way to 'reset' session if needed
          >
            GANTI
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger 
        render={
          <Card className="border-blue-200 bg-white shadow-xl shadow-blue-100/50 rounded-[24px] overflow-hidden hover:scale-[1.02] transition-all cursor-pointer group active:scale-95">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-black text-slate-900 tracking-tight">
                  Mulai Check-in
                </p>
                <p className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  Pilih outlet kunjungan Anda
                </p>
              </div>
            </CardContent>
          </Card>
        }
      />
      <DialogContent
        className="max-w-lg w-[calc(100%-2rem)] max-h-[92vh] overflow-hidden flex flex-col bg-white border-slate-200 p-0 rounded-[32px] shadow-2xl"
      >
        <DialogHeader className="p-6 pb-4 bg-slate-50/50 border-b border-slate-100">
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Map className="h-4 w-4" />
            </div>
            CHECK-IN OUTLET
          </DialogTitle>
          <DialogDescription className="text-sm font-bold text-slate-400 mt-1">
            Validasi lokasi dan foto untuk mulai jualan
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                01
              </span>
              Validasi Lokasi GPS
            </div>
            {geo.latitude && geo.longitude ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-50/50 animate-in zoom-in-95 duration-300">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                  <Navigation className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">LOKASI TERDETEKSI</p>
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            ) : (
              <Button
                onClick={geo.getCurrentPosition}
                disabled={geo.loading}
                className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-blue-200 transition-all font-bold shadow-sm"
              >
                {geo.loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <Navigation className="mr-2 h-5 w-5 text-blue-500" />
                )}
                {geo.loading ? 'Sedang Melacak...' : 'Aktifkan GPS Sekarang'}
              </Button>
            )}
            {geo.error && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs text-red-600 font-bold tracking-tight"> {geo.error}</p>
              </div>
            )}
          </div>

          {/* Step 2: Select Outlet */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                02
              </span>
              Pilih Outlet Kunjungan
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Cari apotik / toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-medium focus-visible:bg-white transition-all shadow-inner"
              />
            </div>
            <ScrollArea className="h-44 rounded-2xl border border-slate-100 bg-slate-50/30 p-2 shadow-inner">
              <div className="space-y-1.5">
                {filteredOutlets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30 text-slate-400">
                    <Store className="h-8 w-8 mb-2" />
                    <p className="text-xs font-bold">Apotik tidak ditemukan</p>
                  </div>
                ) : (
                  filteredOutlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => setSelectedOutlet(outlet)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all relative overflow-hidden ${
                        selectedOutlet?.id === outlet.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedOutlet?.id === outlet.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-black truncate ${selectedOutlet?.id === outlet.id ? 'text-white' : 'text-slate-900'}`}>
                          {outlet.name}
                        </p>
                        {outlet.address && (
                          <div className="flex items-center gap-1 mt-0.5 opacity-70">
                            <MapPin className="h-2.5 w-2.5" />
                            <p className="text-[10px] font-bold truncate tracking-tight">{outlet.address}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Step 3: Photo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                03
              </span>
              Foto Bukti Kunjungan
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {img.preview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/20 shadow-xl group">
                <img
                  src={img.preview}
                  alt="Preview outlet"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                   <button
                    onClick={() => {
                      img.clearImage();
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-3 rounded-full bg-red-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {img.loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-2xl bg-white border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-600 transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white shadow-inner">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Buka Kamera</span>
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <Button
            onClick={handleCheckin}
            disabled={
              !selectedOutlet ||
              !geo.latitude ||
              !geo.longitude ||
              !img.compressedFile ||
              uploading
            }
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                MENYIMPAN DATA...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                KONFIRMASI CHECK-IN
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
