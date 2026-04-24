'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { editTransactionItems } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormSection } from '@/components/ui/form-section';
import { cn } from '@/lib/utils';

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
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<{ id: string; name: string } | null>(null);

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

  function removeItem(product_id: string, name: string) {
    setConfirmRemoveItem({ id: product_id, name });
  }

  function executeRemoveItem() {
    if (confirmRemoveItem) {
      setItems((prev) => prev.filter((i) => i.product_id !== confirmRemoveItem.id));
      setConfirmRemoveItem(null);
    }
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
    <AppDialog 
      open={open} 
      onOpenChange={onOpenChange}
      variant="info"
      title="Koreksi Pesanan"
      subtitle="Order Modification"
      maxWidth="max-w-lg"
    >
      <div className="absolute top-6 right-16">
        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-black text-[9px] px-2 py-1 rounded-sm uppercase tracking-widest bg-white">
          {invoiceNumber}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search Section */}
        <FormSection padding="md">
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-4 py-3">
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-sm shadow-xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
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
        </FormSection>

        {/* Daftar Item */}
        <FormSection 
          title={`Item Pesanan (${items.length})`}
          padding="md"
          dashed={false}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <Package className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada produk</p>
              <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tight">Cari produk di atas untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white border border-slate-100 rounded-sm p-4 flex items-center gap-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-blue-600 mt-0.5">
                      Rp {item.price_at_sale.toLocaleString('id-ID')} / pcs
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-100 rounded-sm">
                      <button
                        onClick={() => updateQty(item.product_id, -1)}
                        className="w-7 h-7 rounded-sm bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 transition-all active:scale-90 flex items-center justify-center shadow-sm"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product_id, 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-7 h-7 rounded-sm bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-90 disabled:opacity-30 flex items-center justify-center shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id, item.name)}
                      className="w-8 h-8 rounded-sm bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors shadow-sm shadow-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      </div>

      {/* Footer */}
      <FormSection padding="lg" className="bg-slate-50/50" dashed={false}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Akhir Baru</p>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-sm uppercase tracking-tighter">IDR</span>
              <p className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">
                {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          {isCredit && (
            <Badge
              variant="outline"
              className={cn(
                "font-black text-[10px] border px-3 py-1.5 rounded-sm uppercase tracking-widest bg-white shadow-sm",
                tempoDays === 30 ? "text-emerald-600 border-emerald-100" : "text-orange-600 border-orange-100"
              )}
            >
              Tempo {tempoDays} Hari
            </Badge>
          )}
        </div>

        <button
          onClick={() => setConfirmSaveOpen(true)}
          disabled={saving || items.length === 0}
          className="w-full h-12 rounded-sm bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...</>
          ) : (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Simpan Perubahan</>
          )}
        </button>
      </FormSection>

      <ConfirmDialog
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title="Simpan Perubahan?"
        description="Apakah Anda yakin ingin memperbarui pesanan ini? Perubahan akan langsung disimpan ke database."
        onConfirm={handleSave}
        confirmText="Ya, Simpan"
        variant="info"
        loading={saving}
      />

      <ConfirmDialog
        open={!!confirmRemoveItem}
        onOpenChange={(open) => !open && setConfirmRemoveItem(null)}
        title="Hapus Item?"
        description={`Hapus ${confirmRemoveItem?.name} dari pesanan?`}
        onConfirm={executeRemoveItem}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </AppDialog>
  );
}
