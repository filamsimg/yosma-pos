"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Plus, Minus, Loader2 } from "lucide-react"
import type { Product } from "@/types"

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (data: { quantity: number; reason: string; notes: string }) => Promise<void>;
  loading?: boolean;
}

export function StockAdjustDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  loading = false,
}: StockAdjustDialogProps) {
  const [type, setType] = useState<"ADD" | "SUBTRACT">("ADD")
  const [quantity, setQuantity] = useState<string>("1")
  const [notes, setNotes] = useState("")

  // Reset state when dialog opens with a new product
  useEffect(() => {
    if (open) {
      setType("ADD")
      setQuantity("1")
      setNotes("")
    }
  }, [open, product])

  const handleConfirm = async () => {
    if (!product) return
    const qty = parseInt(quantity) || 0
    if (qty <= 0) return

    const reason = type === "ADD" ? "RESTOCK" : "CORRECTION"
    const finalQty = qty // We'll send absolute quantity, server handles the sign based on reason

    await onConfirm({
      quantity: finalQty,
      reason,
      notes: notes.trim() || `Penyesuaian stok ${type === "ADD" ? "masuk" : "keluar"} via tabel`
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] bg-white border-slate-200 p-0 overflow-hidden rounded-xl shadow-2xl">
        <div className="bg-slate-50 border-b border-slate-100 p-6">
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
                Update Stok
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                {product?.name || "Pilih Produk"}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Stock Indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-500 font-medium">Stok Saat Ini:</span>
            <span className="text-lg font-bold text-slate-900">
              {product?.stock ?? 0} <span className="text-xs text-slate-400 font-normal uppercase">{product?.unit?.name}</span>
            </span>
          </div>

          {/* Adjustment Toggle */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe Penyesuaian</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setType("ADD")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all ${
                  type === "ADD" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
              <button
                onClick={() => setType("SUBTRACT")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all ${
                  type === "SUBTRACT" 
                    ? "bg-white text-red-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Minus className="h-4 w-4" />
                Kurangi
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Unit</Label>
            <div className="relative">
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="bg-white border-slate-200 text-slate-900 h-14 text-2xl font-bold text-center focus-visible:ring-blue-600 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-xs">
                {product?.unit?.name}
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan (Opsional)</Label>
            <Input
              placeholder="Contoh: Stok masuk baru, Koreksi selisih..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50/50 border-slate-200 text-slate-900 h-11 focus-visible:bg-white transition-all"
            />
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 sm:justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500 hover:text-slate-900 font-semibold h-11 px-6"
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !quantity || parseInt(quantity) <= 0}
            className={`font-bold h-11 px-8 shadow-md transition-all active:scale-95 ${
              type === "ADD" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100" 
                : "bg-red-600 hover:bg-red-700 text-white shadow-red-100"
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update Stok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
