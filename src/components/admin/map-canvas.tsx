'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Fix Leaflet's default icon path issues in Next.js
import L from 'leaflet';
import type { Transaction } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Override default marker icons to avoid 404s
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface MapCanvasProps {
  locations: Transaction[];
}

export default function MapCanvas({ locations }: MapCanvasProps) {
  // Center of Indonesia as fallback
  const defaultCenter: [number, number] = [-0.7893, 113.9213];
  const defaultZoom = 5;

  // Use the most recent location to center the map if available
  const center: [number, number] =
    locations.length > 0 && locations[0].lat && locations[0].lng
      ? [locations[0].lat, locations[0].lng]
      : defaultCenter;

  const zoom = locations.length > 0 ? 12 : defaultZoom;

  return (
    <div className="w-full h-[350px] sm:h-[500px] rounded-xl overflow-hidden border border-white/10 z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        // The container needs this z-index so dropdowns stay on top of the map
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((txn) => {
          if (!txn.lat || !txn.lng) return null;
          return (
            <Marker key={txn.id} position={[txn.lat, txn.lng]} icon={icon}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{txn.outlet?.name || 'Outlet Tidak Diketahui'}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {txn.outlet?.address || 'Alamat tidak tersedia'}
                  </p>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-gray-500">Sales:</span>
                    <span>{txn.sales?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-gray-500">Waktu:</span>
                    <span>{format(new Date(txn.created_at), 'HH:mm', { locale: idLocale })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-semibold text-gray-500">Total:</span>
                    <span className="font-bold text-blue-600">
                      Rp {txn.total_price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {txn.photo_url && (
                    <div className="mt-2 text-center">
                      <a 
                        href={txn.photo_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-md text-xs font-medium inline-block w-full transition-colors"
                      >
                        Lihat Foto Outlet
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
