'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Droplets,
  Filter,
  MoreVertical,
  Loader2,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardData {
  metrics: {
    totalItems: number;
    lowStockCount: number;
    totalInventoryValue: number;
    totalRevenue7d: number;
    healthScore: number;
  };
  lowStockItems: { id: string; name: string; sku: string; currentStock: number; reorderPoint: number }[];
  salesTrend: { date: string; revenue: number }[];
  topSellers: { id: string; name: string; sku: string; category: string; soldQty: number; revenue: number; risk: string; status: string; trend: string }[];
  recentInsights: { id: string; type: string; title: string; message: string; createdAt: string }[];
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { metrics, lowStockItems, salesTrend, topSellers, recentInsights } = data;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface">
            Welcome back, {user?.firstName || 'User'}
          </h2>
          <p className="text-on-surface-variant mt-1">Real-time supply chain health and intelligent forecasting.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-surface-container-high rounded-xl font-semibold text-sm hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            Download PDF
          </button>
          <button className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container rounded-xl text-on-primary font-bold text-sm shadow-lg shadow-primary/10 flex items-center gap-2">
            Re-run Forecast
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-low p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Items</span>
          </div>
          <p className="text-3xl font-extrabold text-on-surface">{metrics.totalItems}</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-error/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-error" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Low Stock</span>
          </div>
          <p className="text-3xl font-extrabold text-on-surface">{metrics.lowStockCount}</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Inventory Value</span>
          </div>
          <p className="text-3xl font-extrabold text-on-surface">${metrics.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-tertiary/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-tertiary" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">7D Revenue</span>
          </div>
          <p className="text-3xl font-extrabold text-on-surface">${metrics.totalRevenue7d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Inventory Health Score Widget */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Inventory Health</span>
          </div>
          <div className="mt-8 flex items-baseline gap-2">
            <span className="font-headline text-6xl font-extrabold text-on-surface">{metrics.healthScore}</span>
            <span className="text-2xl text-on-surface-variant">/100</span>
          </div>
          <div className="mt-4 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full shadow-[0_0_12px_rgba(137,206,255,0.4)]" style={{ width: `${metrics.healthScore}%` }}></div>
          </div>
          <p className="mt-6 text-sm text-on-surface-variant leading-relaxed">
            Your inventory health is <span className="text-secondary font-bold">{metrics.healthScore >= 80 ? 'Excellent' : metrics.healthScore >= 50 ? 'Fair' : 'Poor'}</span>. {metrics.lowStockCount} items require immediate attention.
          </p>
        </div>

        {/* AI Recommendations Card */}
        <div className="col-span-12 lg:col-span-8 glass-card p-8 rounded-3xl shimmer-border relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-tertiary/20 rounded-lg">
              <Sparkles className="text-tertiary w-6 h-6" />
            </div>
            <h3 className="font-headline text-xl font-bold">Autopilot Recommendations</h3>
          </div>
          <div className="space-y-4">
            {recentInsights.length > 0 ? (
              recentInsights.map((insight, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 rounded-2xl bg-surface-container-lowest/50">
                  <Sparkles className="text-tertiary mt-1 w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-on-surface font-semibold">{insight.title || 'Insight'}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{insight.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                {metrics.lowStockCount > 0 ? (
                  <div className="flex gap-4 items-start p-4 rounded-2xl bg-surface-container-lowest/50">
                    <AlertTriangle className="text-error mt-1 w-5 h-5" />
                    <div>
                      <p className="text-on-surface font-semibold">Low Stock Alert</p>
                      <p className="text-sm text-on-surface-variant mt-1">You have {metrics.lowStockCount} items running low on stock. Consider reordering soon to avoid stockouts.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-start p-4 rounded-2xl bg-surface-container-lowest/50">
                    <div>
                      <p className="text-on-surface font-semibold">All Stock Levels Optimal</p>
                      <p className="text-sm text-on-surface-variant mt-1">Your inventory is well-balanced. No immediate action required.</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 items-start p-4 rounded-2xl bg-surface-container-lowest/50">
                  <div>
                    <p className="text-on-surface font-semibold">Demand Forecasting Active</p>
                    <p className="text-sm text-on-surface-variant mt-1">AI is analyzing your recent uploads to predict future demand trends.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Forecasted Demand Graph */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-lg font-bold">7-Day Revenue Trend</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts Panel */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-3xl flex flex-col">
          <h3 className="font-headline text-lg font-bold mb-6">Low Stock Alerts</h3>
          <div className="flex-1 space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, index) => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-2xl ${index === 0 ? 'bg-error-container/10 border border-error/10' : 'bg-surface-container-high'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-surface-container-high' : 'bg-surface-container-highest'}`}>
                      {index === 0 ? <AlertTriangle className="text-error w-5 h-5" /> : <Droplets className="text-on-surface-variant w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface truncate max-w-[150px]">{item.name}</p>
                      <p className={`text-xs ${index === 0 ? 'text-error' : 'text-on-surface-variant'}`}>{item.currentStock} units left</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">No low stock alerts.</p>
            )}
          </div>
          <button className="mt-6 w-full py-3 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all">View All Alerts</button>
        </div>

        {/* Top Selling Products Table */}
        <div className="col-span-12 bg-surface-container-low rounded-3xl overflow-hidden">
          <div className="p-6 flex justify-between items-center">
            <h3 className="font-headline text-lg font-bold">Top Selling Products</h3>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant"><Filter className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant"><MoreVertical className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high/50 text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Sold (Qty)</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {topSellers.length > 0 ? (
                  topSellers.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-high/30 transition-colors">
                      <td className="px-6 py-5 font-semibold">{item.name}</td>
                      <td className="px-6 py-5 text-on-surface-variant">{item.category || '-'}</td>
                      <td className="px-6 py-5">{item.soldQty}</td>
                      <td className="px-6 py-5">${item.revenue.toFixed(2)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.status === 'Low Stock' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                          {item.status || 'Healthy'}
                        </span>
                      </td>
                      <td className={`px-6 py-5 ${item.trend === 'Up' ? 'text-secondary' : 'text-on-surface-variant'}`}>{item.trend}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                      No sales data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

