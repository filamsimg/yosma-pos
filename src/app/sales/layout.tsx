'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/shared/user-nav';
import { ShoppingCart, ClipboardList, Home } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());

  const navItems = [
    { href: '/sales', icon: Home, label: 'POS', exact: true },
    { href: '/sales/history', icon: ClipboardList, label: 'Riwayat', exact: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <span className="text-slate-900 font-semibold text-sm tracking-tight">
            YOSMA <span className="text-blue-600">POS</span>
          </span>
        </div>
        <UserNav />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.label === 'POS' && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold text-white bg-blue-500 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
