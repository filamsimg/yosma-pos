'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { editTransactionItems } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Loader2,
  ShoppingCart,
  Package,
  CheckCircle2,
} from 'lucide-react';

interface EditItem {
  product_id: string;
  name: string;
  price_at_sale: number;
  quantity: number;
  maxStock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image_url?: string;
}

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  invoiceNumber: string;
  discount: number;
  paymentMethod: string;
  initialItems: {
    product_id: string;
    product: { name: string; price: number; stock: number } | null;
    quantity: number;
    price_at_sale: number;
  }[];
  onSaved: () => void;
}

export function EditOrderDialog({
  open,
  onOpenChange,
  transactionId,
  invoiceNumber,
  discount,
  paymentMethod,
  initialItems,
  onSaved,
}: EditOrderDialogProps) {
  const [items, setItems] = useState<EditItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize items dari props
  useEffect(() => {
    if (open) {
      // Consolidate initialItems in case of DB duplicates or previous bugs
      const consolidated = initialItems.reduce((acc: EditItem[], i) => {
        const existing = acc.find(item => item.product_id === i.product_id);
        if (existing) {
          existing.quantity += i.quantity;
        } else {
          acc.push({
            product_id: i.product_id,
            name: i.product?.name ?? 'Produk',
            price_at_sale: i.price_at_sale,
            quantity: i.quantity,
            maxStock: (i.product?.stock ?? 0) + i.quantity,
          });
        }
        return acc;
      }, []);

      setItems(consolidated);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, initialItems]);

  // Search produk
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, price, stock')
        .eq('is_active', true)
        .gt('stock', 0)
        .ilike('name', `%${searchQuery}%`)
        .limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Kalkulasi subtotal & total
  const subtotal = items.reduce((sum, i) => sum + i.price_at_sale * i.quantity, 0);
  const totalPrice = subtotal - (discount || 0);
  const isCredit = paymentMethod === 'CREDIT';
  const tempoDays = totalPrice >= 100000 ? 30 : 14;

  function updateQty(product_id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product_id === product_id
            ? { ...item, quantity: Math.max(0, Math.min(item.maxStock, item.quantity + delta)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(product_id: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));
  }

  function addProduct(product: Product) {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product_id === product.id);
      if (existingIndex > -1) {
        const newItems = [...prev];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: Math.min(newItems[existingIndex].maxStock, newItems[existingIndex].quantity + 1)
        };
        return newItems;
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            price_at_sale: product.price,
            quantity: 1,
            maxStock: product.stock,
          },
        ];
      }
    });
    setSearchQuery('');
    setSearchResults([]);
  }

  const handleSave = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Pesanan tidak boleh kosong');
      return;
    }
    setSaving(true);
    try {
      const result = await editTransactionItems(
        transactionId,
        items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price_at_sale: i.price_at_sale,
        }))
      );
      if (result.error) {
        toast.error('Gagal menyimpan perubahan', { description: result.error });
      } else {
        toast.success('Pesanan berhasil diperbarui', {
          description: `${invoiceNumber} — Total: Rp ${(result.totalPrice ?? totalPrice).toLocaleString('id-ID')}`,
        });
        onSaved();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  }, [items, transactionId, invoiceNumber, totalPrice, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col p-0 rounded-[32px] overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base font-black text-slate-900 tracking-tight">
            Edit Pesanan
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Search Produk */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari produk untuk ditambahkan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
              />
              {searching && <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin shrink-0" />}
            </div>

            {/* Hasil pencarian */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 overflow-hidden">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{product.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{product.sku} · Stok: {product.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">Rp {product.price.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Plus className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600">Tambah</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Daftar Item */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-400">Belum ada produk</p>
              <p className="text-xs text-slate-300 mt-1">Cari produk di atas untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Item Pesanan ({items.length})
              </p>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs font-bold text-blue-600">
                      Rp {item.price_at_sale.toLocaleString('id-ID')} / pcs
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Qty controls */}
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-slate-800 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>

                    {/* Hapus */}
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Total & Simpan */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Baru</p>
              <p className="text-xl font-black text-blue-600 tracking-tighter">
                Rp {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
            {isCredit && (
              <Badge
                variant="outline"
                className={`font-black text-xs border-none px-3 py-1.5 rounded-full ${
                  tempoDays === 30
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                Tempo {tempoDays} Hari
              </Badge>
            )}
          </div>

          {/* Simpan */}
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Simpan Perubahan</>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
