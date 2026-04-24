"use client"

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { UserNav } from '@/components/shared/user-nav';
import Link from 'next/link';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  navItems: { href: string; label: string; exact: boolean }[];
}

export function AdminLayoutClient({ children, navItems }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hover'>('expanded');

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
    item.exact ? (pathname || '') === item.href : (pathname || '').startsWith(item.href)
  )?.label ?? 'Admin';

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar - Moved to its own layer to prevent full page re-renders */}
      <aside className="hidden lg:block shrink-0 h-full">
        <AdminSidebar 
          mode={sidebarMode} 
          onModeChange={handleSidebarModeChange} 
        />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar - Minimalist and Optimized */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <button className="lg:hidden flex items-center justify-center w-9 h-9 rounded-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-200">
                    <Menu className="h-5 w-5" />
                  </button>
                }
              />
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

            {/* Breadcrumb / Title - Visible on mobile */}
            <div className="flex lg:hidden items-center gap-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Admin</span>
              <span className="text-slate-200">/</span>
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                {currentPageLabel}
              </h2>
            </div>
            
            {/* Desktop Quick Link */}
            <Link 
              href="/sales" 
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all group"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 duration-150" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mode Sales</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sales" className="lg:hidden h-9 w-9 flex items-center justify-center rounded-sm bg-blue-600 text-white shadow-lg shadow-blue-100">
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />
            <UserNav />
          </div>
        </header>

        {/* Page Content - Static wrapper around dynamic children */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="container mx-auto p-4 lg:p-8 max-w-7xl animate-in fade-in duration-150">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
