'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/components/providers/auth-provider';
import { OutletCheckin } from '@/components/sales/outlet-checkin';
import { ProductCatalog } from '@/components/sales/product-catalog';
import { CartSheet } from '@/components/sales/cart-sheet';
import { toast } from 'sonner';
import { Terminal, ShoppingBag, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays } from 'date-fns';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { OfflineBanner } from '@/components/sales/OfflineBanner';
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
  const [cartOpen, setCartOpen] = useState(false);

  const { items, discount, paymentMethod, getSubtotal, getTotalPrice, clearCart } =
    useCartStore();

  // --- Offline Sync Integration ---
  const handleSyncItem = async (item: any) => {
    const supabase = createClient();
    
    if (item.type === 'ORDER') {
      const { transactionData, itemsData } = item.payload;
      
      // 1. Create transaction
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select('id, invoice_number')
        .single();

      if (txnError) throw txnError;

      // 2. Create transaction items with the new ID
      const txnItems = itemsData.map((it: any) => ({
        ...it,
        transaction_id: transaction.id
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(txnItems);

      if (itemsError) throw itemsError;
      
      return transaction;
    }
    throw new Error('Unknown sync type');
  };

  const { isOnline, addToQueue, pendingCount, queue } = useOfflineSync(handleSyncItem);
  const isSyncing = queue.some(i => i.status === 'SYNCING');
  const [isDataSyncing, setIsDataSyncing] = useState(false);

  // Function to manually sync all catalogs for offline use
  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("Tidak dapat sinkronisasi saat offline.");
      return;
    }

    setIsDataSyncing(true);
    const syncToastId = toast.loading("Sedang memperbarui data offline...");

    try {
      const supabase = createClient();
      
      // 1. Sync Products & Categories
      const [pRes, cRes, oRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('outlets').select('*').eq('is_active', true).order('name')
      ]);

      if (pRes.data) localStorage.setItem('yosma_products_cache', JSON.stringify(pRes.data));
      if (cRes.data) localStorage.setItem('yosma_categories_cache', JSON.stringify(cRes.data));
      if (oRes.data) localStorage.setItem('yosma_outlets_cache', JSON.stringify(oRes.data));
      
      localStorage.setItem('yosma_last_sync', new Date().toISOString());

      toast.success("Data berhasil diperbarui!", {
        id: syncToastId,
        description: "Aplikasi siap digunakan dalam mode offline."
      });
      
      // Refresh components by reloading (or we could use a state/event)
      window.location.reload();
    } catch (error) {
      toast.error("Gagal sinkronisasi data.", { id: syncToastId });
    } finally {
      setIsDataSyncing(false);
    }
  };

  // Load last sync time on mount
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  useEffect(() => {
    const time = localStorage.getItem('yosma_last_sync');
    if (time) {
      setLastSyncTime(new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [isDataSyncing]); // Update when manual sync completes

  function handleCheckin(data: CheckinData) {
    setCheckinData(data);
    setCheckedIn(true);
    const isRemote = data.photoUrl === 'REMOTE_ORDER';
    
    toast.success(`${isRemote ? 'Remote Order' : 'Check-in'} berhasil di ${data.outlet.type ? `${data.outlet.type} ${data.outlet.name}` : data.outlet.name}`, {
      description: isRemote ? 'Mode pesanan jarak jauh aktif.' : 'Silakan mulai melayani pesanan.',
      icon: isRemote ? <ShoppingBag className="h-4 w-4 text-orange-500" /> : <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
    });
  }

  async function handleCheckout() {
    if (!checkinData || !user || items.length === 0) {
      toast.error('Lengkapi check-in dan tambah produk terlebih dahulu.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const subtotal = getSubtotal();
      const totalPrice = getTotalPrice();

      // Calculate Due Date and Payment status
      const isCredit = paymentMethod === 'CREDIT';
      const tempoDays = totalPrice >= 100000 ? 30 : 14;
      const dueDate = isCredit ? addDays(new Date(), tempoDays).toISOString() : null;
      const paymentStatus = isCredit ? 'UNPAID' : 'PAID';
      const paidAmount = isCredit ? 0 : totalPrice;

      // Prepare payload for offline sync
      const payload = {
        transactionData: {
          sales_id: user.id,
          outlet_id: checkinData.outlet.id,
          subtotal,
          discount,
          total_price: totalPrice,
          payment_method: paymentMethod,
          status: 'PENDING',
          payment_status: paymentStatus,
          paid_amount: paidAmount,
          due_date: dueDate,
          lat: checkinData.lat,
          lng: checkinData.lng,
          photo_url: checkinData.photoUrl,
        },
        itemsData: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price_at_sale: item.price_at_sale,
        }))
      };

      // Add to local sync queue (Instant completion)
      addToQueue('ORDER', payload);

      // Success Feedback (Instant)
      toast.success(`Pesanan Disimpan!`, {
        duration: 4000,
        description: !isOnline 
          ? "Tersimpan lokal. Akan otomatis terkirim saat Anda mendapat sinyal." 
          : "Sedang mengirim ke server...",
      });

      // Reset state & close cart immediately
      setCartOpen(false);
      clearCart();
      setCheckedIn(false);
      setCheckinData(null);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      toast.error('Gagal memproses transaksi.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Offline/Sync Banner */}
      <OfflineBanner 
        isOnline={isOnline} 
        pendingCount={pendingCount} 
        isSyncing={isSyncing} 
      />

      {/* Sales Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-5 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              KASIR SALES <span className="text-blue-600">POS</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Terminal className="h-3 w-3" />
              User: <span className="text-slate-600">{user?.full_name?.split(' ')[0] ?? 'Sales'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleManualSync}
                disabled={isDataSyncing || !isOnline}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all h-8",
                  isOnline 
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100" 
                    : "bg-slate-50 text-slate-400 border border-slate-100 opacity-50"
                )}
              >
                <RefreshCw className={cn("h-3 w-3", isDataSyncing && "animate-spin")} />
                {isDataSyncing ? 'Syncing...' : 'Sync Data'}
              </button>
              {lastSyncTime && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mr-1">
                  Updated: {lastSyncTime}
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-sm bg-blue-600 border border-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <ShoppingBag className="h-5 w-5" />
            </div>
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
            {checkinData?.photoUrl === 'REMOTE_ORDER' && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-sm flex items-center gap-3 shadow-sm shadow-orange-50/50">
                <div className="w-10 h-10 rounded-sm bg-orange-100 flex items-center justify-center text-orange-600">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">MODE PESANAN JARAK JAUH</p>
                  <p className="text-xs font-bold text-orange-600/80">Lokasi GPS & Foto dinonaktifkan untuk transaksi ini.</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-sm" />
                Katalog Produk
              </h2>
            </div>
            <ProductCatalog />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white rounded-sm border border-slate-100 shadow-sm transition-all duration-700">
            <div className="w-24 h-24 rounded-sm bg-blue-50 flex items-center justify-center mb-6 shadow-xl shadow-blue-50/50 animate-pulse">
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
        open={cartOpen}
        onOpenChange={setCartOpen}
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
