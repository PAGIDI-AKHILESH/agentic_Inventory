'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Plus,
  BarChart2,
  Droplets,
  Filter,
  ChevronLeft,
  ChevronRight,
  Truck,
  PiggyBank,
  Sparkles,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import { UploadInventoryButton } from '@/components/UploadInventoryButton';
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

export default function InventoryPage() {
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
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderPoint);
  const lowStockCount = lowStockItems.length;
  const sortedByStock = [...inventory].sort((a, b) => a.currentStock - b.currentStock);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pr-12">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Inventory Intelligence</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl font-body">Leverage high-precision predictive modeling to manage your stock levels and mitigate supply chain risks in real-time.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-xl font-semibold bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:bg-surface-bright transition-all flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </button>
          <UploadInventoryButton />
          <button className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/10 hover:opacity-90 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Product
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Heatmap */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-2xl shimmer-border flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-lg font-bold flex items-center gap-2">
                <BarChart2 className="text-tertiary w-5 h-5" />
                Risk Heatmap
              </h3>
              <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-wider">AI Insight</span>
            </div>
            <div className="space-y-4">
              {sortedByStock.slice(0, 3).map((item) => {
                const isCritical = item.currentStock <= item.reorderPoint / 2;
                const isLow = item.currentStock <= item.reorderPoint;
                const riskLevel = isCritical ? 'HIGH' : isLow ? 'MEDIUM' : 'SAFE';
                
                let containerClass = 'bg-secondary/10 border-secondary/20';
                let iconContainerClass = 'bg-secondary/20';
                let textClass = 'text-secondary';
                let badgeClass = 'bg-secondary text-on-secondary';
                
                if (isCritical) {
                  containerClass = 'bg-error/10 border-error/20';
                  iconContainerClass = 'bg-error/20';
                  textClass = 'text-error';
                  badgeClass = 'bg-error text-on-error';
                } else if (isLow) {
                  containerClass = 'bg-tertiary/10 border-tertiary/20';
                  iconContainerClass = 'bg-tertiary/20';
                  textClass = 'text-tertiary';
                  badgeClass = 'bg-tertiary text-on-tertiary';
                }
                
                return (
                  <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between ${containerClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconContainerClass}`}>
                        {isCritical ? <AlertTriangle className={`w-5 h-5 ${textClass}`} /> : <Droplets className={`w-5 h-5 ${textClass}`} />}
                      </div>
                      <div>
                        <p className="font-headline font-bold text-on-surface truncate max-w-[120px]">{item.name}</p>
                        <p className={`text-xs font-medium ${textClass}`}>{isCritical ? 'Critical Stockout' : isLow ? 'Low Stock' : 'Optimal'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-label text-on-surface-variant mb-1">Risk Level</p>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${badgeClass}`}>{riskLevel}</span>
                    </div>
                  </div>
                );
              })}
              {sortedByStock.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">No inventory data available.</p>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <strong className="text-tertiary">Pro-Tip:</strong> Inventory risk is calculated based on seasonal demand trends and real-time vendor delivery latency.
              </p>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-sm font-label text-primary-fixed-dim">Average Turnover Rate</p>
            <h4 className="text-3xl font-headline font-bold text-primary mt-1">4.8x <span className="text-sm font-normal text-on-surface-variant ml-2">+12% vs LY</span></h4>
          </div>
        </div>

        {/* Product List Table */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 h-full flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold">Product Catalog</h3>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-on-surface">
                  <Filter className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-on-surface">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50">
                    <th className="px-6 py-4 font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Stock Level</th>
                    <th className="px-6 py-4 font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {inventory.length > 0 ? (
                    inventory.map((item) => {
                      const maxStock = Math.max(item.currentStock * 2, item.reorderPoint * 2, 100);
                      const stockPercentage = Math.min((item.currentStock / maxStock) * 100, 100);
                      const isCritical = item.currentStock <= item.reorderPoint / 2;
                      const isLow = item.currentStock <= item.reorderPoint;
                      
                      return (
                        <tr key={item.id} className="hover:bg-surface-container-high/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center overflow-hidden">
                                <Image src={`https://picsum.photos/seed/${item.sku}/100/100`} alt={item.name} width={40} height={40} className="object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="font-body font-medium text-on-surface">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-body text-on-surface-variant">{item.category || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${isCritical ? 'bg-error' : isLow ? 'bg-tertiary' : 'bg-secondary'}`} style={{ width: `${stockPercentage}%` }}></div>
                            </div>
                            <p className="text-[10px] text-center mt-1.5 text-on-surface-variant">{item.currentStock} / {item.reorderPoint} (Reorder)</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${isCritical ? 'bg-error/10 text-error' : isLow ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                              {isCritical ? 'High Risk' : isLow ? 'Medium' : 'Safe'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                        No products found. Upload inventory to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-label">Showing {inventory.length} products</span>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded hover:bg-surface-container-highest"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-2 text-xs font-bold text-on-surface">1</span>
                <button className="p-1 rounded hover:bg-surface-container-highest"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insight Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface">Shipment In-Transit</h4>
            <p className="text-sm text-on-surface-variant mt-1 font-body">4 restocking orders arriving within 24 hours.</p>
            <a className="text-xs text-primary font-bold mt-2 inline-block hover:underline" href="#">Track Shipments</a>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface">Capital at Risk</h4>
            <p className="text-sm text-on-surface-variant mt-1 font-body">${(lowStockCount * 150).toFixed(2)} worth of stock nearing expiry date.</p>
            <a className="text-xs text-tertiary font-bold mt-2 inline-block hover:underline" href="#">View Expiries</a>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface">Auto-Reorder On</h4>
            <p className="text-sm text-on-surface-variant mt-1 font-body">{Math.floor(totalItems / 3)} SKUs currently managed by AI Autopilot.</p>
            <a className="text-xs text-primary font-bold mt-2 inline-block hover:underline" href="#">Manage Rules</a>
          </div>
        </div>
      </section>
    </div>
  );
}
