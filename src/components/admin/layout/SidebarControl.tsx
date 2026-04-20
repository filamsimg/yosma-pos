'use client';

import { Settings, PanelLeft, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SidebarControlProps {
  mode: 'expanded' | 'collapsed' | 'hover';
  isCollapsed: boolean;
  onModeChange: (mode: 'expanded' | 'collapsed' | 'hover') => void;
}

export function SidebarControl({ mode, isCollapsed, onModeChange }: SidebarControlProps) {

  return (
    <div className="mt-auto border-t border-[#1e293b] p-2 space-y-1">
      <LinkItem 
        href="/admin/settings" 
        icon={Settings} 
        label="Project Settings" 
        isCollapsed={isCollapsed} 
      />
      
      <Popover>
        <PopoverTrigger className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1e293b]/50 transition-all group cursor-pointer text-left focus:outline-none">
          <PanelLeft className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span className="flex-1 animate-in fade-in duration-300">Sidebar control</span>}
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-56 p-1 bg-[#0f172a] border-[#1e293b] text-white shadow-2xl">
          <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1e293b] mb-1">
            Sidebar control
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onModeChange('expanded')}
              className="flex items-center justify-between w-full px-2 py-2 rounded-md text-sm hover:bg-[#1e293b] transition-colors group"
            >
              <span className={cn(mode === 'expanded' ? "text-white font-semibold" : "text-slate-400 group-hover:text-slate-200")}>Expanded</span>
              {mode === 'expanded' && <Check className="h-4 w-4 text-blue-500" />}
            </button>
            <button
              onClick={() => onModeChange('collapsed')}
              className="flex items-center justify-between w-full px-2 py-2 rounded-md text-sm hover:bg-[#1e293b] transition-colors group"
            >
              <span className={cn(mode === 'collapsed' ? "text-white font-semibold" : "text-slate-400 group-hover:text-slate-200")}>Collapsed</span>
              {mode === 'collapsed' && <Check className="h-4 w-4 text-blue-500" />}
            </button>
            <button
              onClick={() => onModeChange('hover')}
              className="flex items-center justify-between w-full px-2 py-2 rounded-md text-sm hover:bg-[#1e293b] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className={cn(mode === 'hover' ? "text-white font-semibold" : "text-slate-400 group-hover:text-slate-200")}>Expand on hover</span>
                {mode === 'hover' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </div>
              {mode === 'hover' && <Check className="h-4 w-4 text-blue-500" />}
            </button>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Small collapse toggle button at the very bottom */}
      <button 
        onClick={() => onModeChange(mode === 'expanded' ? 'collapsed' : 'expanded')}
        className="flex items-center justify-center p-2 w-9 h-9 rounded-md text-slate-400 hover:text-white hover:bg-[#1e293b] transition-all self-start"
        title={mode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <PanelLeft className={cn("h-4.5 w-4.5 transition-transform duration-300", isCollapsed && "rotate-180")} />
      </button>
    </div>
  );
}

// Internal helper for settings link
import Link from 'next/link';

function LinkItem({ href, icon: Icon, label, isCollapsed }: { href: string; icon: any; label: string; isCollapsed: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-[#2b2b2b]/50 transition-all group"
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
}
