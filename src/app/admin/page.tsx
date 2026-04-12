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
          gradient: 'from-emerald-500 to-green-600',
          bgGlow: 'bg-emerald-500/10',
        },
        {
          title: 'Total Pendapatan',
          value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
          subtitle: `${stats.totalTransactions} transaksi total`,
          icon: DollarSign,
          gradient: 'from-blue-500 to-indigo-600',
          bgGlow: 'bg-blue-500/10',
        },
        {
          title: 'Produk Aktif',
          value: stats.totalProducts.toString(),
          subtitle: 'Terdaftar di katalog',
          icon: Package,
          gradient: 'from-violet-500 to-purple-600',
          bgGlow: 'bg-violet-500/10',
        },
        {
          title: 'Tim Sales',
          value: stats.totalSales.toString(),
          subtitle: 'Pengguna aktif',
          icon: Users,
          gradient: 'from-amber-500 to-orange-600',
          bgGlow: 'bg-amber-500/10',
        },
      ]
    : [];

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ringkasan performa bisnis Anda
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-white/5 space-y-3">
              <Skeleton className="h-4 w-1/2 bg-white/10" />
              <Skeleton className="h-8 w-3/4 bg-white/10" />
              <Skeleton className="h-3 w-1/3 bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors overflow-hidden relative"
              >
                {/* Decorative glow */}
                <div
                  className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${card.bgGlow} blur-2xl`}
                />
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {card.title}
                    </p>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient}`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-500">{card.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Transactions */}
      <Card className="border-white/5 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base text-white">
            Transaksi Terbaru
          </CardTitle>
          <CardDescription className="text-slate-400">
            10 transaksi terakhir di semua outlet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 bg-white/10" />
                    <Skeleton className="h-3 w-1/2 bg-white/10" />
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
            <div className="space-y-2">
              {recentTxns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/10 shrink-0">
                    <Store className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {txn.invoice_number}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${statusColor(txn.status)}`}
                      >
                        {txn.status === 'COMPLETED' ? 'Lunas' : txn.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{txn.outlet?.name || '-'}</span>
                      <span>•</span>
                      <span>{txn.sales?.full_name || '-'}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(txn.created_at), 'dd MMM HH:mm', {
                          locale: idLocale,
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-400 shrink-0">
                    Rp {txn.total_price.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
