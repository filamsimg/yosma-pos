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
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  Store,
  Calendar,
  History,
  ShoppingCart,
  XCircle,
  Clock,
  Receipt,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PAYMENT_STATUSES } from '@/lib/constants';
import type { Transaction } from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalProducts: number;
  totalSales: number;
  todayRevenue: number;
  todayTransactions: number;
  yesterdayRevenue: number;
  pendingCount: number;
  processingCount: number;
  topProducts: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Fetch all stats in parallel
      const [txnResult, productResult, salesResult, todayTxnResult, yesterdayTxnResult, recentResult, topProductsResult] =
        await Promise.all([
          // Total transactions + revenue
          supabase
            .from('transactions')
            .select('total_price')
            .neq('status', 'CANCELLED'),
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
            .select('total_price, status')
            .gte('created_at', today.toISOString()),
          // Yesterday's transactions
          supabase
            .from('transactions')
            .select('total_price')
            .gte('created_at', yesterday.toISOString())
            .lt('created_at', today.toISOString())
            .neq('status', 'CANCELLED'),
          // Recent transactions
          supabase
            .from('transactions')
            .select('*, outlet:outlets(name, type), sales:profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(10),
          // Top products (simplified fetch, logic below)
          supabase
            .from('transaction_items')
            .select('product_id, quantity, product:products(name, sku)')
            .limit(100)
        ]);

      const totalRevenue = txnResult.data?.reduce((sum, t) => sum + Number(t.total_price), 0) ?? 0;
      const todayRevenue = todayTxnResult.data?.filter(t => t.status !== 'CANCELLED').reduce((sum, t) => sum + Number(t.total_price), 0) ?? 0;
      const yesterdayRevenue = yesterdayTxnResult.data?.reduce((sum, t) => sum + Number(t.total_price), 0) ?? 0;

      const pendingCount = todayTxnResult.data?.filter(t => t.status === 'PENDING').length ?? 0;
      const processingCount = todayTxnResult.data?.filter(t => t.status === 'PROCESSING').length ?? 0;

      // Group top products
      const topMap = new Map();
      topProductsResult.data?.forEach(item => {
        const id = item.product_id;
        const p = Array.isArray(item.product) ? item.product[0] : item.product;
        const current = topMap.get(id) || { name: p?.name, sku: p?.sku, qty: 0 };
        topMap.set(id, { ...current, qty: current.qty + item.quantity });
      });
      const topList = Array.from(topMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalTransactions: txnResult.data?.length ?? 0,
        totalProducts: productResult.count ?? 0,
        totalSales: salesResult.count ?? 0,
        todayRevenue,
        todayTransactions: todayTxnResult.data?.length ?? 0,
        yesterdayRevenue,
        pendingCount,
        processingCount,
        topProducts: topList
      });

      if (recentResult.data) setRecentTxns(recentResult.data);
      setLoading(false);
    }

    fetchDashboard();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING':     return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'PROCESSING':  return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'COMPLETED':   return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'CANCELLED':   return 'bg-red-50 text-red-600 border-red-200';
      default:            return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            DASHBOARD <span className="text-blue-600">MODERN</span>
        </h1>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
          Ringkasan performa bisnis dan monitoring transaksi harian
        </p>
      </div>

      {/* Stat Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-[12px] bg-white border border-slate-100" />
              ))
        ) : (
            <>
                <StatCard 
                    label="Omzet Hari Ini"
                    value={`Rp ${stats.todayRevenue.toLocaleString('id-ID')}`}
                    icon={TrendingUp}
                    subValue={`vs Kemarin: Rp ${stats.yesterdayRevenue.toLocaleString('id-ID')}`}
                    iconBgColor="bg-emerald-50"
                    iconColor="text-emerald-600"
                />
                <StatCard 
                    label="Pesanan Baru"
                    value={stats.pendingCount}
                    icon={ShoppingCart}
                    subValue={`${stats.todayTransactions} Total Hari Ini`}
                    iconBgColor="bg-amber-50"
                    iconColor="text-amber-600"
                />
                <StatCard 
                    label="Dalam Proses"
                    value={stats.processingCount}
                    icon={ArrowUpRight}
                    subValue="Pengiriman Aktif"
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatCard 
                    label="Produk Aktif"
                    value={stats.totalProducts}
                    icon={Package}
                    subValue="Dalam Katalog"
                    iconBgColor="bg-indigo-50"
                    iconColor="text-indigo-600"
                />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Section */}
        <Card className="lg:col-span-2 border border-slate-100 bg-white shadow-sm rounded-[12px] overflow-hidden">
            <CardHeader className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-blue-600" />
                    <div>
                        <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            Transaksi Terbaru
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
            {loading ? (
                <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg bg-slate-50" />
                    ))}
                </div>
            ) : recentTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Transaksi</p>
                </div>
            ) : (
                <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-100">
                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100/50">Waktu</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100/50">Total</th>
                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100/50 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentTxns.map((txn) => (
                                <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-6 align-middle">
                                        <p className="text-xs font-black text-slate-800 tracking-tight">{txn.invoice_number}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase truncate max-w-[120px]">{txn.outlet?.name}</p>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <p className="text-[10px] font-bold text-slate-600">{format(new Date(txn.created_at), 'dd MMM', { locale: idLocale })}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{format(new Date(txn.created_at), 'HH:mm')}</p>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <p className="text-xs font-black text-blue-600">Rp {txn.total_price.toLocaleString('id-ID')}</p>
                                    </td>
                                    <td className="py-3 px-6 align-middle text-right">
                                        <Badge variant="outline" className={cn("text-[8px] font-black px-2 py-0 h-5 border rounded-full uppercase tracking-widest", statusColor(txn.status))}>
                                            {txn.status === 'PENDING' ? 'MENUNGGU' : txn.status === 'PROCESSING' ? 'DIPROSES' : txn.status === 'COMPLETED' ? 'SELESAI' : 'BATAL'}
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

        {/* Top Products Section */}
        <Card className="border border-slate-100 bg-white shadow-sm rounded-[12px] overflow-hidden">
            <CardHeader className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight">Produk Terlaris</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg bg-slate-50" />
                        ))}
                    </div>
                ) : (stats as any)?.topProducts?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 italic">
                        <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Data</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(stats as any)?.topProducts?.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-xs font-black text-slate-800 truncate uppercase leading-none mb-1">{p.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SKU: {p.sku}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-slate-900 leading-none">{p.qty}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">UNIT</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
