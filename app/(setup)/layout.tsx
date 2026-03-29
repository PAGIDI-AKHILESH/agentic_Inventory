'use client';

import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body">
      <header className="flex items-center justify-between px-6 py-4 bg-surface sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <ArrowLeft className="text-on-surface w-5 h-5" />
          </Link>
          <h1 className="font-headline font-bold text-lg text-on-surface">Business Setup</h1>
        </div>
        <div className="flex items-center">
          <button className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <HelpCircle className="text-on-surface w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center px-4 md:px-6 lg:px-24 py-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
