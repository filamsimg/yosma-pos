'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/shared/user-nav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MapPin,
  Store,
  ClipboardList,
  Menu,
  Settings,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/lib/actions/auth';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/transactions', icon: ClipboardList, label: 'Transaksi', exact: false },
  { href: '/admin/products', icon: Package, label: 'Produk', exact: false },
  { href: '/admin/outlets', icon: Store, label: 'Outlet', exact: false },
  { href: '/admin/map', icon: MapPin, label: 'Peta', exact: false },
];

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 tracking-tight">
            YOSMA <span className="text-blue-600">POS</span>
          </p>
          <p className="text-[10px] text-slate-500 -mt-0.5">Admin Panel</p>
        </div>
      </div>

      <Separator className="bg-slate-100" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-100" />

      {/* Footer with Logout */}
      <div className="p-3 shrink-0 space-y-2">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-sm text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
        <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
          YOSMA POS v1.0
        </p>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-slate-200 bg-white">
        <NavContent pathname={pathname} />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-white border-slate-200" showCloseButton={false}>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">Admin navigation menu</SheetDescription>
                <NavContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Page Title */}
            <h2 className="text-sm font-semibold text-slate-900">
              {navItems.find((item) =>
                item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
              )?.label ?? 'Admin'}
            </h2>
          </div>

          <UserNav />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
