'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  MapPin, 
  ClipboardList, 
  UserCog,
  ShoppingCart,
  Wallet,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarItem } from './SidebarItem';
import { SidebarControl } from './SidebarControl';
import { logout } from '@/lib/actions/auth';

const navGroups = [
  {
    title: 'Utama',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ]
  },
  {
    title: 'Manajemen Data',
    items: [
      { href: '/admin/transactions', icon: ClipboardList, label: 'Transaksi', exact: false },
      { href: '/admin/products', icon: Package, label: 'Produk', exact: false },
      { href: '/admin/receivables', icon: Wallet, label: 'Daftar Piutang', exact: false },
      { href: '/admin/outlets', icon: Store, label: 'Outlet', exact: false },
    ]
  },
  {
    title: 'Monitor',
    items: [
      { href: '/admin/map', icon: MapPin, label: 'Peta', exact: false },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { href: '/admin/profiles', icon: UserCog, label: 'Karyawan', exact: false },
    ]
  },
  {
    title: 'Akses Cepat',
    items: [
      { href: '/sales', icon: ShoppingCart, label: 'Mode POS Mobile', exact: false },
    ]
  }
];

interface AdminSidebarProps {
  mode: 'expanded' | 'collapsed' | 'hover';
  onModeChange: (mode: 'expanded' | 'collapsed' | 'hover') => void;
  onNavigate?: () => void;
  hideControls?: boolean;
}

export function AdminSidebar({ mode, onModeChange, onNavigate, hideControls }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // The sidebar is visually collapsed if:
  // 1. Mode is 'collapsed'
  // 2. Mode is 'hover' AND NOT hovering
  const isEffectivelyCollapsed = mode === 'collapsed' || (mode === 'hover' && !isHovered);

  return (
    <div 
      onMouseEnter={() => mode === 'hover' && setIsHovered(true)}
      onMouseLeave={() => mode === 'hover' && setIsHovered(false)}
      className={cn(
        "flex flex-col h-full bg-[#0f172a] text-slate-400 border-r border-[#1e293b] transition-all duration-300",
        isEffectivelyCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-[#1e293b]",
        isEffectivelyCollapsed && "justify-center px-0"
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>
        {!isEffectivelyCollapsed && (
          <div className="flex flex-col animate-in fade-in duration-300">
            <span className="text-sm font-bold text-white tracking-tight leading-none uppercase">
              YOSMA POS
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Admin Dashboard</span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-4 overflow-y-auto custom-scrollbar space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="px-2 space-y-1">
            {!isEffectivelyCollapsed && (
              <h3 className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest animate-in fade-in duration-300">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isActive={item.exact ? (pathname || '') === item.href : (pathname || '').startsWith(item.href)}
                isCollapsed={isEffectivelyCollapsed}
                onClick={onNavigate}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div className="mt-auto px-2 pb-2 space-y-1">
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group",
            isEffectivelyCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className={cn("h-4.5 w-4.5 shrink-0", isEffectivelyCollapsed && "mx-auto")} />
          {!isEffectivelyCollapsed && <span className="animate-in fade-in duration-300">Keluar</span>}
        </button>
        {!hideControls && (
          <SidebarControl mode={mode} isCollapsed={isEffectivelyCollapsed} onModeChange={onModeChange} />
        )}
      </div>
    </div>
  );
}
