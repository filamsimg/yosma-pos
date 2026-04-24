"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  dashed?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

export function FormSection({
  title,
  subtitle,
  children,
  className,
  contentClassName,
  dashed = true,
  padding = "md",
}: FormSectionProps) {
  const paddingClass = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding]

  return (
    <div className={cn(
      paddingClass,
      dashed && "border-b border-dashed border-slate-200",
      className
    )}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className={cn("space-y-4", contentClassName)}>
        {children}
      </div>
    </div>
  )
}
