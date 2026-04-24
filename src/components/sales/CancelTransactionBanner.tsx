'use client';

import { useState, useEffect, useCallback } from 'react';
import { cancelTransaction } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import { AlertTriangle, Clock, X, Loader2 } from 'lucide-react';

const CANCEL_WINDOW_SECONDS = 15 * 60; // 15 menit

interface CancelTransactionBannerProps {
  transactionId: string;
  invoiceNumber: string;
  createdAt: string;
  onDismiss: () => void;
  onCancelled: () => void;
}

export function CancelTransactionBanner({
  transactionId,
  invoiceNumber,
  createdAt,
  onDismiss,
  onCancelled,
}: CancelTransactionBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [cancelling, setCancelling] = useState(false);
  const [visible, setVisible] = useState(true);

  // Hitung sisa waktu berdasarkan waktu transaksi dibuat
  useEffect(() => {
    function computeSecondsLeft() {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - created) / 1000);
      return Math.max(0, CANCEL_WINDOW_SECONDS - elapsed);
    }

    const initial = computeSecondsLeft();
    if (initial <= 0) {
      onDismiss();
      return;
    }
    setSecondsLeft(initial);

    const interval = setInterval(() => {
      const remaining = computeSecondsLeft();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setVisible(false);
        setTimeout(onDismiss, 500); // beri waktu animasi fade
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onDismiss]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const result = await cancelTransaction(transactionId);
      if (result.error) {
        toast.error('Gagal membatalkan transaksi', { description: result.error });
      } else {
        toast.success('Transaksi berhasil dibatalkan', {
          description: `${invoiceNumber} — Stok produk telah dikembalikan.`,
        });
        setVisible(false);
        setTimeout(onCancelled, 300);
      }
    } finally {
      setCancelling(false);
    }
  }, [transactionId, invoiceNumber, onCancelled]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const urgency = secondsLeft <= 60; // merah jika kurang dari 1 menit

  if (!visible) return null;

  return (
    <div
      className={`mx-5 mt-4 rounded-[24px] border p-4 shadow-lg transition-all duration-500 animate-in slide-in-from-top-4 ${
        urgency
          ? 'bg-red-50 border-red-200 shadow-red-100'
          : 'bg-amber-50 border-amber-200 shadow-amber-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            urgency ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              urgency ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            Transaksi Berhasil Dibuat
          </p>
          <p
            className={`text-xs font-bold mt-0.5 ${
              urgency ? 'text-red-600' : 'text-amber-600'
            }`}
          >
            {invoiceNumber}
          </p>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className={`h-3 w-3 ${urgency ? 'text-red-500' : 'text-amber-500'}`} />
            <span
              className={`text-[10px] font-black tabular-nums ${
                urgency ? 'text-red-500' : 'text-amber-500'
              }`}
            >
              Bisa dibatalkan dalam{' '}
              <span className={urgency ? 'text-red-700' : 'text-amber-700'}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="text-slate-300 hover:text-slate-500 transition-colors p-1 rounded-lg"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Cancel Button */}
      <button
        onClick={handleCancel}
        disabled={cancelling || secondsLeft <= 0}
        className={`mt-3 w-full h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${
          urgency
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200'
            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200'
        }`}
      >
        {cancelling ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Membatalkan...
          </>
        ) : (
          <>
            <AlertTriangle className="h-3.5 w-3.5" />
            Batalkan Transaksi Ini
          </>
        )}
      </button>
    </div>
  );
}
