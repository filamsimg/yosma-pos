'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/components/providers/auth-provider';
import { OutletCheckin } from '@/components/sales/outlet-checkin';
import { ProductCatalog } from '@/components/sales/product-catalog';
import { CartSheet } from '@/components/sales/cart-sheet';
import { toast } from 'sonner';
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
    toast.success(`Check-in berhasil di ${data.outlet.name}`);
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
        `Transaksi berhasil! Invoice: ${transaction.invoice_number}`,
        {
          duration: 5000,
          description: `Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
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
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-white">
          Halo, {user?.full_name?.split(' ')[0] ?? 'Sales'} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Siap untuk transaksi hari ini?
        </p>
      </div>

      {/* Outlet Check-in */}
      <OutletCheckin
        onCheckin={handleCheckin}
        checkedIn={checkedIn}
        checkinData={checkinData}
      />

      {/* Product Catalog - Only show after check-in */}
      {checkedIn ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Katalog Produk
            </h2>
          </div>
          <ProductCatalog />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-slate-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Check-in ke outlet untuk memulai
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Anda perlu check-in terlebih dahulu sebelum membuat transaksi
          </p>
        </div>
      )}

      {/* Cart Sheet (floating) */}
      <CartSheet
        onCheckout={handleCheckout}
        checkoutLoading={checkoutLoading}
        disabled={!checkedIn}
      />
    </div>
  );
}
