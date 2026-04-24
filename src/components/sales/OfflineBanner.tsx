"use client"

import { Wifi, WifiOff, CloudSync, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfflineBannerProps {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
}

export function OfflineBanner({ isOnline, pendingCount, isSyncing }: OfflineBannerProps) {
  if (isOnline && pendingCount === 0) return null

  return (
    <div className={cn(
      "sticky top-0 z-[60] w-full px-4 py-2 flex items-center justify-between transition-all duration-300",
      !isOnline ? "bg-red-600 text-white" : "bg-amber-500 text-white"
    )}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mode Offline</span>
          </>
        ) : (
          <>
            <CloudSync className="h-4 w-4 animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi...</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-sm">
            <span className="text-[10px] font-black">{pendingCount}</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Antrean Pesanan</span>
          </div>
        )}
        
        {!isOnline && (
          <span className="text-[9px] font-bold opacity-80 italic">Simpanan Lokal Aktif</span>
        )}
      </div>
    </div>
  )
}
