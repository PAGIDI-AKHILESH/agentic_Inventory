'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { UploadInventoryButton } from '@/components/UploadInventoryButton';
import { Database, UploadCloud, Check, Loader2, RefreshCw } from 'lucide-react';

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

export default function UploadPage() {
  const { token } = useAuth();
  const [erpSystem, setErpSystem] = useState('');
  const [erpConnected, setErpConnected] = useState(false);
  const [erpLoading, setErpLoading] = useState(false);
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const fetchInventory = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
    setLoadingItems(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [token, fetchInventory]);

  const handleErpConnect = () => {
    if (!erpSystem) return;
    setErpLoading(true);
    setTimeout(() => {
      setErpConnected(true);
      setErpLoading(false);
      // Simulate fetching data from ERP
      fetchInventory();
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Data Upload & Sync</h1>
        <p className="text-on-surface-variant text-lg font-body">Manage your inventory sources, upload CSVs, and connect ERP/POS systems.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Upload Section */}
        <section className="glass-card p-8 rounded-3xl border border-outline-variant/20 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center">
              <UploadCloud className="text-on-secondary-container w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">Manual Upload</h2>
              <p className="text-on-surface-variant mt-1 text-sm">Upload a CSV file to update inventory.</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex-1 flex flex-col justify-center items-center text-center">
            <p className="font-bold text-on-surface mb-2">Smart CSV Mapping</p>
            <p className="text-sm text-on-surface-variant mb-6">Upload your data in any format. Our AI will automatically map your columns to our standard schema and generate essential data.</p>
            <UploadInventoryButton onUploadSuccess={fetchInventory} />
          </div>
        </section>

        {/* ERP Integration Section */}
        <section className="glass-card p-8 rounded-3xl border border-outline-variant/20 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
              <Database className="text-on-primary-container w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">ERP / POS Integration</h2>
              <p className="text-on-surface-variant mt-1 text-sm">Connect existing systems for automatic sync.</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex-1 flex flex-col justify-center">
            <label className="block text-sm font-bold text-on-surface mb-3">Select System</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={erpSystem}
                onChange={(e) => setErpSystem(e.target.value)}
                disabled={erpConnected}
                className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none disabled:opacity-50"
              >
                <option value="">Select integration...</option>
                <option value="shopify">Shopify</option>
                <option value="quickbooks">QuickBooks Online</option>
                <option value="odoo">Odoo</option>
                <option value="custom">Custom API</option>
              </select>
              {erpConnected ? (
                <button 
                  onClick={() => setErpConnected(false)}
                  className="px-6 py-3 bg-secondary/20 text-secondary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/30 transition-colors"
                >
                  <Check className="w-5 h-5" /> Connected
                </button>
              ) : (
                <button 
                  onClick={handleErpConnect}
                  disabled={!erpSystem || erpLoading}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {erpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Previous Data / Real-time Data View */}
      <section className="glass-card p-8 rounded-3xl border border-outline-variant/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">Current Inventory Data</h2>
            <p className="text-on-surface-variant mt-1">View the latest data from your uploads and integrations.</p>
          </div>
          <button 
            onClick={fetchInventory}
            className="p-2 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loadingItems ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-highest">
                <tr>
                  <th className="px-6 py-4 font-semibold">SKU</th>
                  <th className="px-6 py-4 font-semibold">Product Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Stock</th>
                  <th className="px-6 py-4 font-semibold text-right">Price</th>
                  <th className="px-6 py-4 font-semibold text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {loadingItems ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading inventory data...
                    </td>
                  </tr>
                ) : inventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                      No inventory data found. Upload a CSV or connect an ERP system.
                    </td>
                  </tr>
                ) : (
                  inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{item.sku}</td>
                      <td className="px-6 py-4 font-medium text-on-surface">{item.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{item.category || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium">{item.currentStock}</td>
                      <td className="px-6 py-4 text-right">${item.sellingPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-on-surface-variant">${item.unitCost.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
