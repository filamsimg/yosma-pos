"use client"

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, RefreshCcw } from 'lucide-react';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import { Button } from '@/components/ui/button';
import type { Transaction } from '@/types';

// Dynamically import the Leaflet map component to prevent SSR errors
const MapCanvas = dynamic(() => import('@/components/admin/map-canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-sm overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Navigation className="h-8 w-8 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-widest">Memuat peta digital...</p>
      </div>
    </div>
  ),
});

export default function AdminMapPage() {
  const [locations, setLocations] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLocations() {
    setLoading(true);
    const supabase = createClient();
    
    // Get today's start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('transactions')
      .select('*, outlet:outlets(name, address), sales:profiles(full_name)')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (data) setLocations(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Pemantauan Lokasi"
        description="Pantau lokasi check-in transaksi sales secara real-time di peta digital"
        breadcrumbs={[{ label: 'Monitoring' }, { label: 'Lokasi' }]}
        action={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLocations}
            disabled={loading}
            className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest gap-2 rounded-sm"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        }
      />

      <Card className="border-slate-100 bg-white shadow-sm rounded-sm overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-blue-50 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  Peta Transaksi Hari Ini
                </CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Titik koordinat asli sales saat transaksi berlangsung
                </CardDescription>
              </div>
            </div>
            {!loading && (
              <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-sm border border-blue-100 uppercase tracking-widest">
                {locations.length} Lokasi Terdeteksi
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <Skeleton className="w-full h-[400px] sm:h-[600px] rounded-sm bg-slate-50" />
            </div>
          ) : (
            <div className="relative h-[400px] sm:h-[600px] w-full">
              <MapCanvas locations={locations} />
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-sm">
        <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-wide">
          Catatan: Lokasi yang ditampilkan adalah koordinat GPS pada saat tombol "Kirim Transaksi" ditekan oleh sales di aplikasi mobile. Pastikan sales mengaktifkan izin lokasi untuk akurasi data.
        </p>
      </div>
    </div>
  );
}
