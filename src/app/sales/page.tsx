'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/components/providers/auth-provider';
import { OutletCheckin } from '@/components/sales/outlet-checkin';
import { ProductCatalog } from '@/components/sales/product-catalog';
import { CartSheet } from '@/components/sales/cart-sheet';
import { toast } from 'sonner';
import { Terminal, ShoppingBag } from 'lucide-react';
import type { Outlet } from '@/types';

interface CheckinData {
  outlet: Outlet;
  lat: number;
  lng: number;
  photoUrl: string;
}

export default function SalesPOSPage() {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { items, discount, paymentMethod, getSubtotal, getTotalPrice, clearCart } =
    useCartStore();

  function handleCheckin(data: CheckinData) {
    setCheckinData(data);
    setCheckedIn(true);
    toast.success(`Check-in berhasil di ${data.outlet.name}`, {
      description: 'Silakan mulai melayani pesanan.',
      icon: <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
    });
  }

  async function handleCheckout() {
    if (!checkinData || !user || items.length === 0) {
      toast.error('Lengkapi check-in dan tambah produk terlebih dahulu.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const supabase = createClient();
      const subtotal = getSubtotal();
      const totalPrice = getTotalPrice();

      // 1. Create transaction
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          sales_id: user.id,
          outlet_id: checkinData.outlet.id,
          subtotal,
          discount,
          total_price: totalPrice,
          payment_method: paymentMethod,
          status: 'COMPLETED',
          lat: checkinData.lat,
          lng: checkinData.lng,
          photo_url: checkinData.photoUrl,
        })
        .select('id, invoice_number')
        .single();

      if (txnError) throw txnError;

      // 2. Create transaction items
      const txnItems = items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(txnItems);

      if (itemsError) throw itemsError;

      // 3. Success!
      toast.success(
        `Transaksi berhasil!`,
        {
          duration: 5000,
          description: `Invoice: ${transaction.invoice_number} | Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
        }
      );

      // 4. Reset state
      clearCart();
      setCheckedIn(false);
      setCheckinData(null);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      toast.error('Gagal membuat transaksi. Silakan coba lagi.', {
        description: err?.message,
      });
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Sales Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              KASIR SALES <span className="text-blue-600">POS</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Terminal className="h-3 w-3" />
              User: <span className="text-slate-600">{user?.full_name?.split(' ')[0] ?? 'Sales'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-50">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Outlet Check-in Section */}
        <OutletCheckin
          onCheckin={handleCheckin}
          checkedIn={checkedIn}
          checkinData={checkinData}
        />

        {/* Product Catalog Section */}
        {checkedIn ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                Katalog Produk
              </h2>
            </div>
            <ProductCatalog />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all duration-700">
            <div className="w-24 h-24 rounded-[32px] bg-blue-50 flex items-center justify-center mb-6 shadow-xl shadow-blue-50/50 animate-pulse">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800">Mulai Kunjungan</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-[240px]">
              Silakan melakukan <span className="font-bold text-blue-600 underline">Check-in</span> ke outlet terlebih dahulu untuk membuka katalog produk.
            </p>
          </div>
        )}
      </div>

      {/* Cart Sheet (floating) */}
      <CartSheet
        onCheckout={handleCheckout}
        checkoutLoading={checkoutLoading}
        disabled={!checkedIn}
      />
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
