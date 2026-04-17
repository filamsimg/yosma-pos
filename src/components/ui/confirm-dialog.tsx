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
      <DialogContent className="max-w-[400px] bg-white border-slate-200 p-6 flex flex-col gap-6 rounded-xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'} animate-in zoom-in duration-300`}>
            <AlertTriangle className={`h-8 w-8 ${variant === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex flex-row gap-3 sm:justify-center -mx-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-semibold h-11"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 font-bold h-11 shadow-sm transition-all active:scale-95 ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' 
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100'
            }`}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
