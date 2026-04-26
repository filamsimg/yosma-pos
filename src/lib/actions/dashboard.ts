'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAdminDashboardStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // 1. Get Global Stats
  const { data: globalStats, error: globalError } = await supabase
    .from('dashboard_global_stats')
    .select('*')
    .single();

  if (globalError) {
    console.error('Error fetching global stats:', globalError);
    // Return empty defaults if table doesn't exist yet
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      totalProducts: 0,
      totalSales: 0,
      todayRevenue: 0,
      todayTransactions: 0,
      yesterdayRevenue: 0,
      pendingCount: 0,
      processingCount: 0,
    };
  }

  // 2. Get Today's Stats from Daily Table
  const { data: todayStats } = await supabase
    .from('dashboard_daily_stats')
    .select('revenue, transactions')
    .eq('date', today)
    .single();

  // 3. Get Yesterday's Stats for Comparison
  const { data: yesterdayStats } = await supabase
    .from('dashboard_daily_stats')
    .select('revenue')
    .eq('date', yesterday)
    .single();

  return {
    totalRevenue: Number(globalStats.total_revenue),
    totalTransactions: globalStats.total_transactions,
    totalProducts: globalStats.total_products,
    totalSales: globalStats.total_sales,
    todayRevenue: Number(todayStats?.revenue || 0),
    todayTransactions: todayStats?.transactions || 0,
    yesterdayRevenue: Number(yesterdayStats?.revenue || 0),
    pendingCount: globalStats.pending_orders,
    processingCount: globalStats.processing_orders,
  };
}
