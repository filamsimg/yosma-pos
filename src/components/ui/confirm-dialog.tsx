"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] bg-white border-0 p-0 flex flex-col gap-0 rounded-sm shadow-2xl overflow-hidden">
        <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-red-600' : 'bg-amber-500'}`} />
        
        <div className="p-8 flex flex-col gap-6">
          <DialogHeader className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-sm ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'} animate-in zoom-in duration-300`}>
              <AlertTriangle className={`h-10 w-10 ${variant === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={handleConfirm}
              className={`w-full font-black h-12 rounded-sm shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest ${
                variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' 
                  : variant === 'info'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
              }`}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {confirmText}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black text-[10px] h-10 uppercase tracking-widest"
              disabled={loading}
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
