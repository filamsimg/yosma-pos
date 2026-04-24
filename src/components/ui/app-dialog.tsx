"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface AppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  subtitle?: string
  variant?: "receipt" | "danger" | "warning" | "success" | "info" | "default"
  children: React.ReactNode
  maxWidth?: string
  showStripe?: boolean
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  variant = "default",
  children,
  maxWidth = "max-w-md lg:max-w-4xl",
  showStripe = true,
}: AppDialogProps) {
  const stripeColor = {
    receipt: "bg-blue-600",
    info: "bg-blue-600",
    danger: "bg-red-600",
    warning: "bg-amber-500",
    success: "bg-emerald-600",
    default: "bg-slate-200",
  }[variant]

  const subtitleColor = {
    receipt: "text-blue-600",
    info: "text-blue-600",
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
    default: "text-slate-400",
  }[variant]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "w-[calc(100%-2rem)] p-0 rounded-sm overflow-hidden border-0 shadow-2xl bg-white transition-all duration-300",
        maxWidth
      )}>
        {showStripe && <div className={cn("h-1.5 w-full shrink-0", stripeColor)} />}
        
        <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {(title || subtitle) && (
            <div className="p-6 bg-white flex items-start justify-between shrink-0">
               <div>
                  {subtitle && (
                    <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5", subtitleColor)}>
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <DialogTitle className="text-xl font-black text-slate-900 leading-none tracking-tight uppercase">
                      {title}
                    </DialogTitle>
                  )}
               </div>
            </div>
          )}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
