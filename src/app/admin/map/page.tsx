'use client';

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
import { MapPin, Navigation } from 'lucide-react';
import type { Transaction } from '@/types';

// Dynamically import the Leaflet map component to prevent SSR errors
const MapCanvas = dynamic(() => import('@/components/admin/map-canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-slate-500">
        <Navigation className="h-8 w-8 animate-pulse" />
        <p className="text-sm">Memuat peta...</p>
      </div>
    </div>
  ),
});

export default function AdminMapPage() {
  const [locations, setLocations] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
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
    fetchLocations();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Pemantauan Lokasi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau lokasi check-in transaksi sales hari ini
          </p>
        </div>
      </div>

      <Card className="border-white/5 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5 text-blue-400" /> Peta Transaksi Hari Ini
          </CardTitle>
          <CardDescription className="text-slate-400">
            Titik pada peta menunjukkan lokasi asli sales saat melakukan transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="w-full h-[500px] rounded-xl bg-white/10" />
          ) : (
            <MapCanvas locations={locations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
