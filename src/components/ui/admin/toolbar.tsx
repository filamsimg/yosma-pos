"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AdminToolbarProps {
  children: React.ReactNode
  className?: string
}

export function AdminToolbar({
  children,
  className,
}: AdminToolbarProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-6 p-1 md:p-1.5 bg-white border border-slate-400 rounded-sm shadow-sm",
      className
    )}>
      {children}
    </div>
  )
}

interface AdminToolbarSectionProps {
  children: React.ReactNode
  className?: string
  grow?: boolean
}

export function AdminToolbarSection({
  children,
  className,
  grow = false,
}: AdminToolbarSectionProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 w-full md:w-auto",
      grow && "md:flex-1",
      className
    )}>
      {children}
    </div>
  )
}
