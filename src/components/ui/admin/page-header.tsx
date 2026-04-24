"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface Breadcrumb {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs = [],
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Link href="/admin" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Home className="h-3 w-3" />
          </Link>
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={bc.label}>
              <ChevronRight className="h-3 w-3 opacity-30" />
              {bc.href ? (
                <Link href={bc.href} className="hover:text-blue-600 transition-colors">
                  {bc.label}
                </Link>
              ) : (
                <span className="text-slate-600">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {title}
          </h1>
          {description && (
            <p className="text-sm font-bold text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-3 shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
