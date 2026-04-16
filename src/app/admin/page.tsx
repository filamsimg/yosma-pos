'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  Store,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction } from '@/types';

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalProducts: number;
  totalSales: number;
  todayRevenue: number;
  todayTransactions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all stats in parallel
      const [txnResult, productResult, salesResult, todayTxnResult, recentResult] =
        await Promise.all([
          // Total transactions + revenue
          supabase
            .from('transactions')
            .select('total_price')
            .eq('status', 'COMPLETED'),
          // Total products
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true),
          // Total sales users
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'SALES')
            .eq('is_active', true),
          // Today's transactions
          supabase
            .from('transactions')
            .select('total_price')
            .eq('status', 'COMPLETED')
            .gte('created_at', today.toISOString()),
          // Recent transactions
          supabase
            .from('transactions')
            .select('*, outlet:outlets(name), sales:profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

      const totalRevenue =
        txnResult.data?.reduce((sum, t) => sum + Number(t.total_price), 0) ?? 0;
      const todayRevenue =
        todayTxnResult.data?.reduce(
          (sum, t) => sum + Number(t.total_price),
          0
        ) ?? 0;

      setStats({
        totalRevenue,
        totalTransactions: txnResult.data?.length ?? 0,
        totalProducts: productResult.count ?? 0,
        totalSales: salesResult.count ?? 0,
        todayRevenue,
        todayTransactions: todayTxnResult.data?.length ?? 0,
      });

      if (recentResult.data) setRecentTxns(recentResult.data);
      setLoading(false);
    }

    fetchDashboard();
  }, []);

  const statCards = stats
    ? [
        {
          title: 'Pendapatan Hari Ini',
          value: `Rp ${stats.todayRevenue.toLocaleString('id-ID')}`,
          subtitle: `${stats.todayTransactions} transaksi`,
          icon: TrendingUp,
          colorClass: 'bg-emerald-50 text-emerald-600',
        },
        {
          title: 'Total Pendapatan',
          value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
          subtitle: `${stats.totalTransactions} transaksi total`,
          icon: DollarSign,
          colorClass: 'bg-blue-50 text-blue-600',
        },
        {
          title: 'Produk Aktif',
          value: stats.totalProducts.toString(),
          subtitle: 'Terdaftar di katalog',
          icon: Package,
          colorClass: 'bg-indigo-50 text-indigo-600',
        },
        {
          title: 'Tim Sales',
          value: stats.totalSales.toString(),
          subtitle: 'Pengguna aktif',
          icon: Users,
          colorClass: 'bg-amber-50 text-amber-600',
        },
      ]
    : [];

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ringkasan performa bisnis Anda
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-slate-100 shadow-sm space-y-3">
              <Skeleton className="h-4 w-1/2 bg-slate-200" />
              <Skeleton className="h-8 w-3/4 bg-slate-200" />
              <Skeleton className="h-3 w-1/3 bg-slate-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <Icon className={`h-5 w-5 ${card.colorClass.replace(/bg-[a-z]+-50 /, '')}`} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900">
                      {card.value}
                    </h4>
                    <span className="text-sm font-medium text-slate-500">
                      {card.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Transactions */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">
            Transaksi Terbaru
          </CardTitle>
          <CardDescription className="text-slate-500">
            10 transaksi terakhir di semua outlet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 bg-slate-200" />
                    <Skeleton className="h-3 w-1/2 bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-left">
                    <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider rounded-tl-sm">
                      Invoice
                    </th>
                    <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider border-l border-slate-200/50">
                      Tgl & Waktu
                    </th>
                    <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider border-l border-slate-200/50">
                      Outlet & Sales
                    </th>
                    <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider border-l border-slate-200/50">
                      Total
                    </th>
                    <th className="py-4 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wider rounded-tr-sm border-l border-slate-200/50">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 align-middle">
                        <p className="text-sm font-medium text-slate-900">{txn.invoice_number}</p>
                      </td>
                      <td className="py-4 px-5 align-middle">
                        <p className="text-sm text-slate-500">
                          {format(new Date(txn.created_at), 'dd MMM yyyy', { locale: idLocale })}
                          <span className="block text-xs text-slate-400 mt-0.5">{format(new Date(txn.created_at), 'HH:mm', { locale: idLocale })}</span>
                        </p>
                      </td>
                      <td className="py-4 px-5 align-middle">
                        <p className="text-sm font-medium text-slate-900">{txn.outlet?.name || '-'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{txn.sales?.full_name || '-'}</p>
                      </td>
                      <td className="py-4 px-5 align-middle">
                        <p className="text-sm font-bold text-indigo-600">Rp {txn.total_price.toLocaleString('id-ID')}</p>
                      </td>
                      <td className="py-4 px-5 align-middle">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2.5 py-1 font-medium border-0 rounded-md ${statusColor(txn.status)}`}
                        >
                          {txn.status === 'COMPLETED' ? 'Lunas' : txn.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
