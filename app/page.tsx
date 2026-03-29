'use client';

import Link from 'next/link';
import { ArrowRight, Box, BrainCircuit, MessageSquare, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-body selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 lg:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="text-on-primary w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-on-surface">Agentic Inventory</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-on-surface hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/setup" className="px-5 py-2.5 bg-on-surface text-surface rounded-full text-sm font-bold hover:bg-on-surface-variant transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32 flex flex-col items-center text-center relative">
        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Platform v1.0 Live</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-headline font-extrabold text-on-surface tracking-tight leading-[1.1] max-w-4xl mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Inventory intelligence that <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">thinks for you.</span>
        </h1>
        
        <p className="text-lg lg:text-xl text-on-surface-variant max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Empower your MSME with multi-agent AI. Automate reordering, forecast demand, and manage stock directly from Telegram.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link href="/setup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-lg">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-surface-container-low border border-outline-variant/20 text-on-surface rounded-2xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 text-lg">
            View Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="p-8 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:border-primary/30 transition-colors group">
            <div className="w-14 h-14 rounded-2xl bg-primary-container/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BrainCircuit className="text-primary w-7 h-7" />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-3">Multi-Agent AI</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Specialized AI agents monitor stock, analyze supplier reliability, and predict demand surges autonomously.
            </p>
          </div>
          
          <div className="p-8 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:border-secondary/30 transition-colors group">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-secondary w-7 h-7" />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-3">Predictive Forecasting</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Stop guessing. Our stochastic models analyze historical data and external factors to optimize your reorder points.
            </p>
          </div>
          
          <div className="p-8 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:border-tertiary/30 transition-colors group">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-container/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="text-tertiary w-7 h-7" />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-3">Conversational UI</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Manage your entire supply chain through natural language via Telegram. No training required.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}