'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  SlidersHorizontal,
  Warehouse,
  Loader2
} from 'lucide-react';
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

export default function ForecastingPage() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [demandChange, setDemandChange] = useState(15);
  const [leadTime, setLeadTime] = useState(14);

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

  // Calculate simulation risk based on inventory and inputs
  const totalItems = inventory.length;
  const avgStock = totalItems > 0 ? inventory.reduce((sum, item) => sum + item.currentStock, 0) / totalItems : 0;
  // avgReorder is unused, so removing it
  
  // Simple simulation logic
  const projectedDemand = avgStock * (1 + demandChange / 100);
  const stockoutProb = Math.min(Math.max(((projectedDemand - avgStock) / avgStock) * 100 + (leadTime / 30) * 20, 0), 100);
  
  let riskLevel = 'LOW';
  let riskColor = 'text-secondary';
  if (stockoutProb > 50) {
    riskLevel = 'HIGH';
    riskColor = 'text-error';
  } else if (stockoutProb > 20) {
    riskLevel = 'MEDIUM';
    riskColor = 'text-tertiary';
  }

  // Mock suppliers based on inventory categories
  const categories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
  const suppliers = categories.length > 0 ? categories.map((cat, index) => ({
    id: index,
    name: `${cat} Suppliers Inc.`,
    type: 'Standard Partner',
    reliability: 85 + Math.random() * 10,
    leadTime: 7 + Math.floor(Math.random() * 14),
    avgCost: inventory.filter(i => i.category === cat).reduce((sum, i) => sum + i.unitCost, 0) / inventory.filter(i => i.category === cat).length || 0
  })) : [
    { id: 1, name: 'Global Freight Co.', type: 'Standard Partner', reliability: 92.5, leadTime: 12, avgCost: 10.15 }
  ];

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
          <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">
            Forecasting & Simulation
          </h2>
          <p className="text-on-surface-variant font-body mt-1">
            Stochastic analysis of supply chain resilience and demand volatility.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-all">
            Export JSON
          </button>

          <button className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg text-sm font-bold shadow-lg shadow-primary/10 transition-all flex items-center gap-2">
            <Play className="w-4 h-4" /> Run Live Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Demand Forecast Model Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">
              Demand Forecast Model
            </h3>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-xs text-on-surface-variant">
                  Predicted
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="text-xs text-on-surface-variant">
                  Historical
                </span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full relative flex items-end gap-2 overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 800 300">
                <path
                  className="text-primary"
                  d="M0,250 Q100,200 200,220 T400,150 T600,180 T800,80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                ></path>

                <path
                  className="text-primary/50"
                  d="M0,260 Q100,210 200,230 T400,160 T600,190 T800,90"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="4"
                  strokeWidth="1"
                ></path>
              </svg>
            </div>

            <div className="flex-1 bg-surface-container-high rounded-t h-[40%]"></div>
            <div className="flex-1 bg-surface-container-high rounded-t h-[55%]"></div>
            <div className="flex-1 bg-surface-container-high rounded-t h-[35%]"></div>
            <div className="flex-1 bg-surface-container-high rounded-t h-[70%]"></div>
            <div className="flex-1 bg-surface-container-high rounded-t h-[60%]"></div>
            <div className="flex-1 bg-surface-container-high rounded-t h-[85%]"></div>

            <div className="flex-1 bg-primary/20 border-t-2 border-primary rounded-t h-[92%] relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] whitespace-nowrap">
                Q4 Peak: +24%
              </div>
            </div>

            <div className="flex-1 bg-primary/10 border-t-2 border-primary/40 rounded-t h-[78%]"></div>
            <div className="flex-1 bg-primary/10 border-t-2 border-primary/40 rounded-t h-[65%]"></div>
          </div>

          <div className="flex justify-between mt-4 px-2 text-[10px] text-outline font-medium uppercase tracking-widest">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
          </div>
        </div>

        {/* Reorder Simulation Tool */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <SlidersHorizontal className="text-secondary w-5 h-5" />
              <h3 className="text-lg font-bold font-headline">
                Reorder Simulation
              </h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Demand Change %
                  </label>
                  <span className="text-xs font-bold text-primary">
                    {demandChange > 0 ? '+' : ''}{demandChange}%
                  </span>
                </div>

                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={demandChange}
                  onChange={(e) => setDemandChange(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Lead Time (Days)
                  </label>
                  <span className="text-xs font-bold text-secondary">
                    {leadTime} Days
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="60"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Number(e.target.value))}
                  className="w-full accent-secondary"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-outline font-bold uppercase">
                  Projected Risk
                </p>
                <p className={`text-xl font-headline font-bold ${riskColor}`}>
                  {riskLevel}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-outline font-bold uppercase">
                  Stockout Prob.
                </p>
                <p className="text-xl font-headline font-bold text-on-surface">
                  {stockoutProb.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Ranking Table */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
          <h3 className="text-lg font-bold font-headline mb-6">
            Supplier Ranking
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-outline uppercase tracking-widest border-b border-outline-variant/10">
                  <th className="pb-3 font-semibold">Supplier Name</th>
                  <th className="pb-3 font-semibold text-center">
                    Reliability
                  </th>
                  <th className="pb-3 font-semibold text-center">
                    Avg Lead
                  </th>
                  <th className="pb-3 font-semibold text-right">
                    Avg Unit Cost
                  </th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="group hover:bg-surface-container transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
                          <Warehouse className="w-4 h-4" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {supplier.name}
                          </p>
                          <p className="text-[10px] text-outline">
                            {supplier.type}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${supplier.reliability > 90 ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                        {supplier.reliability.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-4 text-center text-sm font-medium">
                      {supplier.leadTime}d
                    </td>

                    <td className="py-4 text-right text-sm font-mono">
                      ${supplier.avgCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}