'use client';

import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

interface CartSheetProps {
  onCheckout: () => Promise<void>;
  checkoutLoading: boolean;
  disabled: boolean;
}

export function CartSheet({
  onCheckout,
  checkoutLoading,
  disabled,
}: CartSheetProps) {
  const {
    items,
    discount,
    paymentMethod,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    setPaymentMethod,
    clearCart,
    getSubtotal,
    getTotalPrice,
    getItemCount,
  } = useCartStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const totalPrice = getTotalPrice();

  return (
    <Sheet>
      <SheetTrigger
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95"
        style={{ display: itemCount > 0 ? 'flex' : 'none' }}
      >
        <ShoppingCart className="h-5 w-5" />
        <div className="text-left">
          <p className="text-xs font-bold">{itemCount} item</p>
          <p className="text-[10px] opacity-80">
            Rp {totalPrice.toLocaleString('id-ID')}
          </p>
        </div>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl bg-slate-900 border-white/10 p-0"
      >
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-white text-lg">
                Keranjang
              </SheetTitle>
              <SheetDescription className="text-slate-400 text-sm">
                {itemCount} item — Rp {subtotal.toLocaleString('id-ID')}
              </SheetDescription>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Hapus Semua
              </Button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">Keranjang kosong</p>
            <p className="text-xs mt-1">Tambah produk dari katalog</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 h-[calc(85vh-320px)]">
              <div className="p-4 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-blue-400 font-semibold">
                        Rp {item.price_at_sale.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity - 1
                          )
                        }
                        className="flex items-center justify-center w-7 h-7 rounded-md bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold text-white min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem(item.product)}
                        disabled={item.quantity >= item.product.stock}
                        className="flex items-center justify-center w-7 h-7 rounded-md bg-white/5 text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Item Subtotal */}
                    <div className="text-right shrink-0 min-w-16">
                      <p className="text-sm font-bold text-white">
                        Rp{' '}
                        {(
                          item.price_at_sale * item.quantity
                        ).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Checkout Section */}
            <div className="border-t border-white/5 p-4 space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-400 shrink-0 w-16">
                  Diskon
                </Label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={subtotal}
                    value={discount || ''}
                    onChange={(e) =>
                      setDiscount(parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="pl-8 bg-white/5 border-white/10 text-white h-9 text-sm"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-400 shrink-0 w-16">
                  Bayar
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>
                        {pm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-white/5" />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Diskon</span>
                    <span className="text-red-400">
                      - Rp {discount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-blue-400">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={onCheckout}
                disabled={checkoutLoading || disabled || items.length === 0}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-base shadow-lg shadow-green-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses Transaksi...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-5 w-5" />
                    Bayar Rp {totalPrice.toLocaleString('id-ID')}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
