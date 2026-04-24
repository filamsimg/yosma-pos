"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AdminTableProps {
  headers: React.ReactNode[]
  children: React.ReactNode
  className?: string
  containerClassName?: string
  stickyHeader?: boolean
  zebra?: boolean
}

export function AdminTable({
  headers,
  children,
  className,
  containerClassName,
  stickyHeader = true,
  zebra = true,
}: AdminTableProps) {
  return (
    <div className={cn(
      "rounded-sm border border-slate-200 bg-white shadow-sm overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200",
      containerClassName
    )}>
      <Table className={cn("text-xs font-medium", className)}>
        <TableHeader className={cn(
          "bg-slate-100 border-b-2 border-slate-200",
          stickyHeader && "sticky top-0 z-10"
        )}>
          <TableRow className="hover:bg-transparent border-none">
            {headers.map((header, i) => (
              <TableHead 
                key={i} 
                className="h-12 text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 border-r border-slate-200/50 last:border-r-0"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={cn(zebra && "[&_tr:nth-child(even)]:bg-slate-50/50")}>
          {children}
        </TableBody>
      </Table>
    </div>
  )
}
