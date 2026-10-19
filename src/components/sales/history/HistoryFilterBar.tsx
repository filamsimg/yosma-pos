'use client';

import { Search, History, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

const FILTER_OPTIONS = [
  { id: 'ALL', label: 'SEMUA', icon: History },
  { id: 'PENDING', label: 'MENUNGGU', icon: Clock },
  { id: 'COMPLETED', label: 'SELESAI', icon: CheckCircle2 },
  { id: 'CANCELLED', label: 'DIBATALKAN', icon: XCircle },
] as const;

export function HistoryFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: HistoryFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Cari No. Invoice atau Nama Outlet..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 h-12 bg-white border border-slate-200 rounded-sm text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => onStatusChange(f.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border',
              statusFilter === f.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600'
            )}
          >
            <f.icon className="h-3 w-3" />
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
