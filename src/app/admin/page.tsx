"use client"

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
  TrendingUp,
  ArrowUpRight,
  Store,
  History,
  ShoppingCart,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction } from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { AdminPageHeader } from '@/components/ui/admin/page-header';
import Link from 'next/link';

import { getAdminDashboardStats } from '@/lib/actions/dashboard';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const supabase = createClient();
      
      // 1. Fetch optimized stats from summary tables
      const dashboardStats = await getAdminDashboardStats();
      
      // 2. Fetch recent transactions (only 8 items, so it's fast)
      const { data: recentResult } = await supabase
        .from('transactions')
        .select('*, outlet:outlets(name, type), sales:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(8);

      // 3. Fetch top products (this is still raw but we can optimize later)
      // For now we keep it simple as it only scans top 100 recent items
      const { data: topProductsResult } = await supabase
        .from('transaction_items')
        .select('product_id, quantity, product:products(name, sku)')
        .order('created_at', { ascending: false })
        .limit(100);

      const topMap = new Map();
      topProductsResult?.forEach(item => {
        const id = item.product_id;
        const p = Array.isArray(item.product) ? item.product[0] : item.product;
        const current = topMap.get(id) || { name: p?.name, sku: p?.sku, qty: 0 };
        topMap.set(id, { ...current, qty: current.qty + item.quantity });
      });
      const topList = Array.from(topMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

      setStats({
        ...dashboardStats,
        topProducts: topList
      });

      if (recentResult) setRecentTxns(recentResult as any);
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
      <AdminPageHeader 
        title="DASHBOARD MODERN"
        description="Ringkasan performa bisnis dan monitoring transaksi harian perusahaan Anda secara real-time"
        breadcrumbs={[]} // Home page
      />

      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-sm bg-slate-50 border border-slate-100" />
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
        <Card className="lg:col-span-2 border-slate-100 bg-white shadow-sm rounded-sm overflow-hidden">
            <CardHeader className="px-6 py-4 bg-slate-50/50 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-sm bg-blue-50 flex items-center justify-center">
                            <History className="h-4 w-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">
                            Transaksi Terbaru
                        </CardTitle>
                    </div>
                    <Link href="/admin/transactions" className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest">
                        Semua <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
            {loading ? (
                <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-sm bg-slate-50" />
                    ))}
                </div>
            ) : recentTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                    <Receipt className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Transaksi</p>
                </div>
            ) : (
                <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-100 text-center border-b-2 border-slate-200">
                                <th className="py-3 px-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Invoice</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest border-l border-slate-200/50">Waktu</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest border-l border-slate-200/50">Total</th>
                                <th className="py-3 px-6 text-[10px] font-black text-slate-600 uppercase tracking-widest border-l border-slate-200/50 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentTxns.map((txn) => (
                                <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-3 px-6 align-middle">
                                        <p className="text-[11px] font-black text-slate-800 tracking-tight font-mono uppercase">{txn.invoice_number}</p>
                                        <p className="text-[9px] font-bold text-slate-600 mt-0.5 uppercase truncate max-w-[150px]">{txn.outlet?.name}</p>
                                    </td>
                                    <td className="py-3 px-4 align-middle border-l border-slate-50/50">
                                        <p className="text-[10px] font-bold text-slate-600">{format(new Date(txn.created_at), 'dd MMM', { locale: idLocale })}</p>
                                        <p className="text-[9px] font-bold text-slate-600 uppercase">{format(new Date(txn.created_at), 'HH:mm')}</p>
                                    </td>
                                    <td className="py-3 px-4 align-middle border-l border-slate-50/50">
                                        <p className="text-[11px] font-black text-blue-600 font-mono">Rp {txn.total_price.toLocaleString('id-ID')}</p>
                                    </td>
                                    <td className="py-3 px-6 align-middle text-center border-l border-slate-50/50">
                                        <Badge variant="outline" className={cn("text-[8px] font-black px-2 py-0 h-5 border rounded-sm uppercase tracking-widest", statusColor(txn.status))}>
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
        <Card className="border-slate-100 bg-white shadow-sm rounded-sm overflow-hidden">
            <CardHeader className="px-6 py-4 bg-slate-50/50 border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-sm bg-indigo-50 flex items-center justify-center">
                        <Package className="h-4 w-4 text-indigo-600" />
                    </div>
                    <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">Produk Terlaris</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-sm bg-slate-50" />
                        ))}
                    </div>
                ) : (stats as any)?.topProducts?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 opacity-60">
                        <Package className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Data</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(stats as any)?.topProducts?.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-sm bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-blue-100 transition-all group">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-[11px] font-black text-slate-800 truncate uppercase leading-none mb-1">{p.name}</p>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">{p.sku}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[12px] font-black text-blue-600 leading-none">{p.qty}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">UNIT</p>
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
