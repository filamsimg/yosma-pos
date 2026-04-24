import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  subValue?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  subValue,
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-white border border-slate-100 p-4 rounded-[12px] shadow-sm flex items-center gap-4",
      className
    )}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBgColor, iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">
          {label}
        </p>
        <p className="text-lg font-black text-slate-900 leading-tight">
          {value}
        </p>
        {subValue && (
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate uppercase">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}
