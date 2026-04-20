'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'; // Assuming tooltip exists or I'll add a simple one

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

export function SidebarItem({ href, icon: Icon, label, isActive, isCollapsed, onClick }: SidebarItemProps) {
  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-[#1e293b] text-white shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-[#1e293b]/50"
      )}
    >
      <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
      {!isCollapsed && <span className="truncate">{label}</span>}
      
      {/* Active Indicator (Vertical line on the left) */}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full" />
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#0f172a] border-[#1e293b] text-white text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
