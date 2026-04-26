"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminPaginationProps {
  totalCount: number
  filteredCount: number
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  itemName?: string
  loading?: boolean
  className?: string
}

export function AdminPagination({
  totalCount,
  filteredCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName = "Item",
  loading = false,
  className,
}: AdminPaginationProps) {
  if (totalPages <= 0) return null

  return (
    <div className={cn(
      "p-4 bg-white border border-slate-400 rounded-sm mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm",
      className
    )}>
      {/* Info Section */}
      <div className="flex items-center gap-6">
        <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest whitespace-nowrap">
          Menampilkan <span className="text-xs text-slate-900">{filteredCount}</span> dari <span className="text-xs text-slate-900">{totalCount}</span> {itemName}
        </div>
        
        <div className="flex items-center gap-2 border-l border-slate-400 pl-4">
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Baris:</span>
          <Select 
            value={pageSize.toString()} 
            onValueChange={(val) => {
              if (val) onPageSizeChange(parseInt(val))
            }}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-16 bg-slate-50 border-slate-400 text-[10px] font-black text-slate-600 rounded-sm">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-400 text-slate-900 shadow-xl min-w-[4rem] rounded-sm">
              {[10, 25, 50, 100].map(size => (
                <SelectItem key={size} value={size.toString()} className="text-[10px] font-black uppercase">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Navigation Section */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 p-0 border-slate-400 text-slate-600 hover:bg-slate-50 disabled:opacity-20 rounded-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const showDots = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <div key={p} className="flex items-center gap-1">
                  {showDots && <span className="text-slate-200 px-1 text-[10px] font-black">...</span>}
                  <Button
                    variant={currentPage === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    className={cn(
                      "h-8 w-8 p-0 text-[10px] font-black rounded-sm transition-all",
                      currentPage === p 
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                        : "border-slate-400 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </Button>
                </div>
              );
            })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 p-0 border-slate-400 text-slate-600 hover:bg-slate-50 disabled:opacity-20 rounded-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
