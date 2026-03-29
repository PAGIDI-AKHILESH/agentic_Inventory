'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, Search, Filter, Loader2 } from 'lucide-react';
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

export default function SuppliersPage() {
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

  // Mock suppliers based on inventory categories
  const categories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
  const suppliers = categories.length > 0 ? categories.map((cat, index) => {
    const reliability = 70 + Math.random() * 28;
    let riskLevel = 'Low';
    let riskColor = 'text-secondary bg-secondary/10';
    let barColor = 'bg-secondary';
    if (reliability < 80) {
      riskLevel = 'High';
      riskColor = 'text-error bg-error/10';
      barColor = 'bg-error';
    } else if (reliability < 90) {
      riskLevel = 'Medium';
      riskColor = 'text-tertiary bg-tertiary/10';
      barColor = 'bg-tertiary';
    }

    return {
      id: `SUP-00${index + 1}`,
      name: `${cat} Suppliers Inc.`,
      category: cat,
      reliability: reliability,
      leadTime: 3 + Math.floor(Math.random() * 14),
      riskLevel,
      riskColor,
      barColor
    };
  }) : [
    { id: 'SUP-001', name: 'Nexus Logistics', category: 'Dairy & Perishables', reliability: 98, leadTime: 4, riskLevel: 'Low', riskColor: 'text-secondary bg-secondary/10', barColor: 'bg-secondary' },
    { id: 'SUP-042', name: 'Global Sourcing Ltd.', category: 'Dry Goods', reliability: 84, leadTime: 12, riskLevel: 'Medium', riskColor: 'text-tertiary bg-tertiary/10', barColor: 'bg-tertiary' },
    { id: 'SUP-019', name: 'Express Fabri', category: 'Packaging', reliability: 71, leadTime: 3, riskLevel: 'High', riskColor: 'text-error bg-error/10', barColor: 'bg-error' }
  ];

  const avgReliability = suppliers.reduce((sum, s) => sum + s.reliability, 0) / suppliers.length || 0;
  const activeRisks = suppliers.filter(s => s.riskLevel === 'High').length;

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
          <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Supplier Intelligence</h2>
          <p className="text-on-surface-variant font-body mt-1">AI-driven evaluation of vendor reliability and risk.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Avg Reliability</p>
            <p className="text-2xl font-headline font-bold text-on-surface">{avgReliability.toFixed(1)}%</p>
            <p className="text-xs text-secondary mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +2.1% this quarter</p>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Active Risks</p>
            <p className="text-2xl font-headline font-bold text-on-surface">{activeRisks}</p>
            <p className="text-xs text-error mt-1">Port delays detected</p>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Total Vendors</p>
            <p className="text-2xl font-headline font-bold text-on-surface">{suppliers.length}</p>
            <p className="text-xs text-on-surface-variant mt-1">Across multiple regions</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-xs text-on-surface-variant uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Reliability Score</th>
                <th className="px-6 py-4 font-semibold">Avg Lead Time</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-surface-container transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-on-surface">{supplier.name}</p>
                    <p className="text-xs text-on-surface-variant">ID: {supplier.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{supplier.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className={`h-full ${supplier.barColor}`} style={{ width: `${supplier.reliability.toFixed(0)}%` }}></div>
                      </div>
                      <span className={`text-xs font-bold ${supplier.riskColor.split(' ')[0]}`}>{supplier.reliability.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">{supplier.leadTime} Days</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full ${supplier.riskColor} text-[10px] font-bold uppercase`}>{supplier.riskLevel}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-bold text-primary hover:text-primary-container transition-colors">View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
