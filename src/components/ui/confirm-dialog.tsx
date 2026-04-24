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
import { cn } from "@/lib/utils"
import { AppDialog } from "./app-dialog"

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
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={variant}
      title={title}
      maxWidth="max-w-[400px]"
    >
      <div className="p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={cn(
            "p-4 rounded-sm animate-in zoom-in duration-300",
            variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
          )}>
            <AlertTriangle className={cn(
              "h-10 w-10",
              variant === 'danger' ? 'text-red-600' : 'text-amber-600'
            )} />
          </div>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "w-full font-black h-12 rounded-sm shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest",
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' 
                : variant === 'info'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
            )}
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
    </AppDialog>
  );
}
