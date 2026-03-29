'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  LineChart,
  Users,
  FileText,
  UploadCloud,
  BrainCircuit,
  Settings,
  Rocket,
  ShoppingCart
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Forecasting', href: '/forecasting', icon: LineChart },
  { name: 'Supplier Intel', href: '/suppliers', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Upload', href: '/upload', icon: UploadCloud },
  { name: 'AI Activity', href: '/ai-activity', icon: BrainCircuit },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const companyName = user?.companyName || 'Company Acme';
  const companyInitials = companyName.substring(0, 2).toUpperCase();

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-container-low flex flex-col border-r border-outline-variant/10 h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
          <Rocket className="w-5 h-5 text-on-primary" />
        </div>
        <h1 className="text-on-surface font-headline font-bold text-lg leading-tight">MSME Autopilot</h1>
      </div>
      <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-label text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 m-4 rounded-2xl bg-surface-container-highest flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
          {companyInitials}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-label text-on-surface-variant">Active Instance</p>
          <p className="text-sm font-semibold truncate text-on-surface">{companyName}</p>
        </div>
      </div>
    </aside>
  );
}
