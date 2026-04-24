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

function AdminTableComponent({
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
      {/* Meningkatkan basis font ke text-sm (14px) untuk legibilitas maksimal */}
      <Table className={cn("text-sm font-semibold", className)}>
        <TableHeader className={cn(
          "bg-slate-100 border-b-2 border-slate-200",
          stickyHeader && "sticky top-0 z-10"
        )}>
          <TableRow className="hover:bg-transparent border-none">
            {headers.map((header, i) => (
              <TableHead 
                key={i} 
                className="h-14 text-[11px] font-black text-slate-700 uppercase tracking-widest px-4 border-r border-slate-200/50 last:border-r-0"
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

// Memoize the table to prevent redundant re-renders during parent state updates
export const AdminTable = React.memo(AdminTableComponent);
