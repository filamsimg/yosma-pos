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
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-300 truncate">
              Check-in: {checkinData.outlet.name}
            </p>
            <p className="text-xs text-green-400/60 truncate">
              {checkinData.outlet.address || 'Lokasi tercatat'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger className="w-full">
        <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
              <MapPin className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-blue-300">
                Check-in ke Outlet
              </p>
              <p className="text-xs text-blue-400/60">
                Pilih outlet, ambil foto, dan mulai transaksi
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent
        showCloseButton={true}
        className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 p-0"
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b border-white/5">
          <DialogTitle className="text-lg font-semibold text-white">
            Check-in Outlet
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400 mt-0.5">
            Pilih outlet dan ambil foto untuk memulai
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 1: Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
                1
              </span>
              Lokasi GPS
            </div>
            {geo.latitude && geo.longitude ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Navigation className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-300">
                  {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
                </span>
              </div>
            ) : (
              <Button
                onClick={geo.getCurrentPosition}
                disabled={geo.loading}
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {geo.loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="mr-2 h-4 w-4" />
                )}
                {geo.loading ? 'Mendapatkan lokasi...' : 'Ambil Lokasi GPS'}
              </Button>
            )}
            {geo.error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {geo.error}
              </p>
            )}
          </div>

          {/* Step 2: Select Outlet */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
                2
              </span>
              Pilih Outlet
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Cari outlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-10"
              />
            </div>
            <ScrollArea className="h-40 rounded-lg border border-white/10">
              <div className="p-1 space-y-0.5">
                {filteredOutlets.length === 0 ? (
                  <p className="text-sm text-slate-500 p-3 text-center">
                    Tidak ada outlet ditemukan
                  </p>
                ) : (
                  filteredOutlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => setSelectedOutlet(outlet)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-colors ${
                        selectedOutlet?.id === outlet.id
                          ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                          : 'hover:bg-white/5 text-slate-300 border border-transparent'
                      }`}
                    >
                      <Store className="h-4 w-4 shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {outlet.name}
                        </p>
                        {outlet.address && (
                          <p className="text-xs text-slate-500 truncate">
                            {outlet.address}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Step 3: Photo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
                3
              </span>
              Foto Outlet
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
              <div className="relative rounded-lg overflow-hidden border border-white/10">
                <img
                  src={img.preview}
                  alt="Preview outlet"
                  className="w-full h-40 object-cover"
                />
                <button
                  onClick={() => {
                    img.clearImage();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {img.loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-24 border-dashed border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white flex flex-col gap-1"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs">Ambil Foto Outlet</span>
              </Button>
            )}
            {img.error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {img.error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <Button
            onClick={handleCheckin}
            disabled={
              !selectedOutlet ||
              !geo.latitude ||
              !geo.longitude ||
              !img.compressedFile ||
              uploading
            }
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/20"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Check-in Sekarang
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
