'use client';

import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/shared/user-nav';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/transactions', label: 'Transaksi', exact: false },
  { href: '/admin/products', label: 'Produk', exact: false },
  { href: '/admin/outlets', label: 'Outlet', exact: false },
  { href: '/admin/map', label: 'Peta', exact: false },
  { href: '/admin/profiles', label: 'Karyawan', exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hover'>('expanded');

  // Persistence for sidebar mode
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-mode') as any;
    if (saved && ['expanded', 'collapsed', 'hover'].includes(saved)) {
      setSidebarMode(saved);
    }
  }, []);

  const handleSidebarModeChange = (mode: 'expanded' | 'collapsed' | 'hover') => {
    setSidebarMode(mode);
    localStorage.setItem('sidebar-mode', mode);
  };

  const currentPageLabel = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )?.label ?? 'Admin';

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-full">
        <AdminSidebar 
          mode={sidebarMode} 
          onModeChange={handleSidebarModeChange} 
        />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-[#0f172a] border-[#1e293b]" showCloseButton={false}>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">Admin navigation menu</SheetDescription>
                <AdminSidebar 
                  mode="expanded" 
                  onModeChange={() => {}} 
                  onNavigate={() => setMobileOpen(false)} 
                  hideControls={true}
                />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-medium">Admin</span>
              <span className="text-slate-300">/</span>
              <h2 className="text-sm font-bold text-slate-900">
                {currentPageLabel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

