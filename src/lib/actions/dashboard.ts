'use server';

import { sql } from '@/lib/db';

export async function getAdminDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  try {
    const [globalRows, todayRows, yesterdayRows] = await Promise.all([
      sql`SELECT * FROM public.dashboard_global_stats WHERE id = 1 LIMIT 1;`,
      sql`SELECT revenue, transactions FROM public.dashboard_daily_stats WHERE date = ${today}::date LIMIT 1;`,
      sql`SELECT revenue FROM public.dashboard_daily_stats WHERE date = ${yesterday}::date LIMIT 1;`,
    ]);

    const globalStats = globalRows[0] || {};
    const todayStats = todayRows[0] || {};
    const yesterdayStats = yesterdayRows[0] || {};

    return {
      totalRevenue: Number(globalStats.total_revenue || 0),
      totalTransactions: Number(globalStats.total_transactions || 0),
      totalProducts: Number(globalStats.total_products || 0),
      totalSales: Number(globalStats.total_sales || 0),
      todayRevenue: Number(todayStats.revenue || 0),
      todayTransactions: Number(todayStats.transactions || 0),
      yesterdayRevenue: Number(yesterdayStats.revenue || 0),
      pendingCount: Number(globalStats.pending_orders || 0),
      processingCount: Number(globalStats.processing_orders || 0),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats from Neon:', error);
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
}

export async function getAdminDashboardData() {
  try {
    const stats = await getAdminDashboardStats();

    const [recentRows, topProductRows] = await Promise.all([
      sql`
        SELECT 
          t.*,
          json_build_object('name', o.name, 'type', o.type) as outlet,
          json_build_object('full_name', p.full_name) as sales
        FROM public.transactions t
        LEFT JOIN public.outlets o ON t.outlet_id = o.id
        LEFT JOIN public.profiles p ON t.sales_id = p.id
        ORDER BY t.created_at DESC
        LIMIT 8;
      `,
      sql`
        SELECT 
          p.name,
          p.sku,
          COALESCE(SUM(ti.quantity), 0)::int as qty
        FROM public.transaction_items ti
        JOIN public.products p ON ti.product_id = p.id
        GROUP BY p.id, p.name, p.sku
        ORDER BY qty DESC
        LIMIT 5;
      `,
    ]);

    return {
      stats: {
        ...stats,
        topProducts: topProductRows as any[],
      },
      recentTxns: recentRows as any[],
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return {
      stats: {
        totalRevenue: 0,
        totalTransactions: 0,
        totalProducts: 0,
        totalSales: 0,
        todayRevenue: 0,
        todayTransactions: 0,
        yesterdayRevenue: 0,
        pendingCount: 0,
        processingCount: 0,
        topProducts: [],
      },
      recentTxns: [],
    };
  }
}

