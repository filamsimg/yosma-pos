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
} from '@/components/ui/sheet';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  X,
  Loader2,
  Wallet,
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
    updateQuantity,
    setDiscount,
    setPaymentMethod,
    clearCart,
    getSubtotal,
    getTotalPrice,
    getTotalDiscount,
    getItemCount,
  } = useCartStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const totalPrice = getTotalPrice();

  const tempoDays = totalPrice >= 100000 ? 30 : 14;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[28px] bg-blue-600 text-white shadow-2xl shadow-blue-400/50 hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group"
            style={{ display: itemCount > 0 ? 'flex' : 'none' }}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-2 -right-2 bg-white text-blue-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {itemCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">TOTAL BAYAR</p>
              <p className="text-sm font-black leading-none">
                Rp {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
          </button>
        }
      />

      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-[40px] bg-white border-slate-200 p-0 flex flex-col shadow-2xl"
      >
        <SheetHeader className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black text-slate-900 tracking-tight">
                  KERANJANG BELANJA
                </SheetTitle>
                <SheetDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                  {itemCount} ITEM TERPILIH
                </SheetDescription>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-4 rounded-xl font-bold text-xs"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                KOSONGKAN
              </Button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-300">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <ShoppingCart className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Keranjang Kosong</p>
            <p className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-tight">Silakan tambah produk dari katalog</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 py-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tighter">
                        {item.product.name}
                      </p>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        Rp {item.price_at_sale.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-inner shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-black text-slate-900 min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem(item.product)}
                        disabled={item.quantity >= item.product.stock}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90 disabled:opacity-20"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Item Subtotal */}
                    <div className="text-right shrink-0 min-w-[100px]">
                      <p className="text-sm font-black text-slate-900">
                        Rp {(item.price_at_sale * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Checkout Section */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[32px]">
              <div className="flex flex-col gap-4">
                {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <Wallet className="h-3 w-3" /> METODE PEMBAYARAN
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-11 rounded-xl font-bold text-sm shadow-sm focus:ring-blue-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                      {PAYMENT_METHODS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value} className="font-bold text-xs">
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tempo Info Alert */}
                {paymentMethod === 'KREDIT' && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest leading-none mb-1">SYARAT PEMBAYARAN</p>
                      <p className="text-xs font-bold text-blue-600">Terhitung Tempo <span className="underline decoration-blue-300 underline-offset-2">{tempoDays} Hari</span></p>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Totals */}
              <div className="p-4 bg-white/50 border border-slate-200/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">SUBTOTAL</span>
                  <span className="text-slate-600">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">DISKON REGULER</span>
                    <span className="text-emerald-500">- Rp {totalDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-black text-slate-900">HASIL AKHIR</span>
                  <span className="text-lg font-black text-blue-600">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={onCheckout}
                disabled={checkoutLoading || disabled || items.length === 0}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-xl shadow-blue-200 rounded-2xl active:scale-95 transition-all"
              >
                {checkoutLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>MENYIMPAN...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    <span>KONFIRMASI BAYAR</span>
                  </div>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
