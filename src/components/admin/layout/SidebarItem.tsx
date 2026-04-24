"use client"

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
        isActive
          ? "bg-[#1e293b] text-white shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-[#1e293b]/50"
      )}
    >
      <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
      {!isCollapsed && (
        <span className={cn(
          "truncate text-sm font-medium transition-opacity duration-300",
          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
        )}>
          {label}
        </span>
      )}
      
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
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
          <TooltipContent side="right" className="bg-[#1e293b] border-[#334155] text-white text-xs rounded-md py-1.5 px-3">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
