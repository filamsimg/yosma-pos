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
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

interface CartSheetProps {
  onCheckout: () => Promise<void>;
  checkoutLoading: boolean;
  disabled: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CartSheet({
  onCheckout,
  checkoutLoading,
  disabled,
  open,
  onOpenChange,
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
    <>
      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <button
          onClick={() => onOpenChange?.(true)}
          className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-sm bg-blue-600 text-white shadow-2xl shadow-blue-400/50 hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-white text-blue-600 text-[10px] font-black w-5 h-5 rounded-sm flex items-center justify-center shadow-md">
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
      )}

      <Sheet open={open} onOpenChange={onOpenChange}>

      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-sm bg-white border-slate-200 p-0 flex flex-col shadow-2xl"
      >
        <SheetHeader className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
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
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-4 rounded-sm font-bold text-xs"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                KOSONGKAN
              </Button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-300">
            <div className="w-24 h-24 rounded-sm bg-slate-50 flex items-center justify-center mb-4">
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
                    className="flex items-center gap-4 p-4 rounded-sm bg-slate-50/50 border border-slate-100 shadow-sm"
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
                    <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-sm shadow-inner shrink-0">
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
            <div className="bg-slate-50 border-t border-slate-200 p-6 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-sm">
            <div className="flex flex-col gap-5">
              {/* Step 1: Payment Type (Lunas vs Tempo) */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Receipt className="h-3 w-3 text-blue-600" /> TIPE TRANSAKSI
                </Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-[18px] border border-slate-200">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      "h-10 rounded-sm text-xs font-black transition-all flex items-center justify-center gap-2",
                      paymentMethod !== 'CREDIT'
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      paymentMethod !== 'CREDIT' ? "bg-blue-600" : "bg-slate-300"
                    )} />
                    LUNAS
                  </button>
                  <button
                    onClick={() => setPaymentMethod('CREDIT')}
                    className={cn(
                      "h-10 rounded-sm text-xs font-black transition-all flex items-center justify-center gap-2",
                      paymentMethod === 'CREDIT'
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      paymentMethod === 'CREDIT' ? "bg-orange-600" : "bg-slate-300"
                    )} />
                    TEMPO
                  </button>
                </div>
              </div>

              {/* Step 2: Payment Channel (Only if Lunas) */}
              {paymentMethod !== 'CREDIT' ? (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <Wallet className="h-3 w-3 text-emerald-600" /> CARA BAYAR (LUNAS)
                  </Label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-[18px] border border-slate-200">
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      className={cn(
                        "h-10 rounded-sm text-xs font-black transition-all flex items-center justify-center gap-2",
                        paymentMethod === 'CASH'
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      TUNAI
                    </button>
                    <button
                      onClick={() => setPaymentMethod('TRANSFER')}
                      className={cn(
                        "h-10 rounded-sm text-xs font-black transition-all flex items-center justify-center gap-2",
                        paymentMethod === 'TRANSFER'
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      TRANSFER
                    </button>
                  </div>
                </div>
              ) : (
                /* Tempo Info Alert */
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm shadow-orange-50">
                  <div className="w-10 h-10 rounded-sm bg-orange-100 flex items-center justify-center text-orange-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest leading-none mb-1">SYARAT PEMBAYARAN</p>
                    <p className="text-xs font-bold text-orange-600">
                      Jatuh Tempo <span className="underline decoration-orange-300 underline-offset-2">{tempoDays} Hari</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

              {/* Summary Totals */}
              <div className="p-4 bg-white/50 border border-slate-200/50 rounded-sm space-y-2">
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
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-xl shadow-blue-200 rounded-sm active:scale-95 transition-all"
              >
                {checkoutLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>MENYIMPAN...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    <span>KONFIRMASI PESANAN</span>
                  </div>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
