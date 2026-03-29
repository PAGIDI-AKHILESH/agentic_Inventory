'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Filter, BarChart2, PieChart, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  unitCost: number;
  sellingPrice: number;
  salesVelocity: number; // calculated field
  leadTimeDays: number;
  lastUploadedAt: string;
  status?: string;
  risk?: string;
}

export default function ReportsPage() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [token, fetchInventory]);

  // Calculate metrics
  const inventoryValuation = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const totalItems = inventory.length;
  const stockoutItems = inventory.filter(item => item.currentStock === 0).length;
  const stockoutRate = totalItems > 0 ? (stockoutItems / totalItems) * 100 : 0;
  const deadStockValue = inventory.filter(item => item.status === 'OUT_OF_STOCK' || item.currentStock === 0).reduce((sum, item) => sum + (item.reorderPoint * item.unitCost), 0); // Mocking dead stock as value of items that are out of stock but should have been reordered

  const handleExportAll = () => {
    if (inventory.length === 0) {
      alert('No inventory data to export.');
      return;
    }
    
    const headers = ['SKU', 'Name', 'Category', 'Current Stock', 'Reorder Point', 'Unit Cost', 'Selling Price', 'Lead Time (Days)', 'Sales Velocity'];
    const csvContent = [
      headers.join(','),
      ...inventory.map(item => [
        item.sku,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        item.currentStock,
        item.reorderPoint,
        item.unitCost,
        item.sellingPrice,
        item.leadTimeDays,
        item.salesVelocity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Reports & Analytics</h2>
          <p className="text-on-surface-variant font-body mt-1">Generate and export comprehensive inventory performance data.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button 
            onClick={handleExportAll}
            className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg text-sm font-bold shadow-lg shadow-primary/10 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-on-surface">Inventory Valuation</h3>
          </div>
          <p className="text-2xl font-headline font-bold text-on-surface">${inventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-secondary mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +5.2% vs last month</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-on-surface">Turnover Rate</h3>
          </div>
          <p className="text-2xl font-headline font-bold text-on-surface">4.8x</p>
          <p className="text-xs text-secondary mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +0.4 vs last month</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-on-surface">Stockout Rate</h3>
          </div>
          <p className="text-2xl font-headline font-bold text-on-surface">{stockoutRate.toFixed(1)}%</p>
          <p className="text-xs text-secondary mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> -0.5% vs last month</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-on-surface">Dead Stock</h3>
          </div>
          <p className="text-2xl font-headline font-bold text-on-surface">${deadStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-error mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +1.2% vs last month</p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="text-lg font-bold font-headline">Available Reports</h3>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Calendar className="w-4 h-4" />
            <span>Last 30 Days</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-xs text-on-surface-variant uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Report Name</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Last Generated</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              <tr className="hover:bg-surface-container transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm text-on-surface">Monthly Inventory Summary</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">Overview of stock levels, valuation, and key metrics for the month.</td>
                <td className="px-6 py-4 text-sm font-mono">Oct 1, 2023</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center justify-end gap-1 ml-auto">
                    <Download className="w-3 h-3" /> PDF
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-sm text-on-surface">Supplier Performance Analysis</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">Detailed breakdown of supplier reliability, lead times, and costs.</td>
                <td className="px-6 py-4 text-sm font-mono">Oct 5, 2023</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center justify-end gap-1 ml-auto">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-tertiary" />
                    <span className="font-bold text-sm text-on-surface">Demand Forecast Projection</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">AI-generated predictions for future demand across all product categories.</td>
                <td className="px-6 py-4 text-sm font-mono">Oct 10, 2023</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center justify-end gap-1 ml-auto">
                    <Download className="w-3 h-3" /> JSON
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
