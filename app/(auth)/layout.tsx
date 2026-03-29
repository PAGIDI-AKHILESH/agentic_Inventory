import { Box } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background font-body">
      {/* Left Panel - Branding/Marketing */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-surface-container-low relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-tertiary/10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="text-on-primary w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-on-surface">Agentic Inventory</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-headline font-extrabold text-on-surface leading-tight mb-6">
            Intelligence that scales with your supply chain.
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-12">
            Automate reordering, forecast demand with AI, and manage your entire inventory through conversational agents on Telegram.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-surface-container/50 backdrop-blur-sm rounded-2xl border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-on-secondary-container">99%</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Fulfillment Rate</p>
                <p className="text-sm text-on-surface-variant">Achieved by our top MSME clients</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-surface-container/50 backdrop-blur-sm rounded-2xl border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-on-tertiary-container">-30%</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Capital Tied Up</p>
                <p className="text-sm text-on-surface-variant">Reduction in excess stock holding</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-on-surface-variant">
          © 2026 Agentic Inventory Intelligence Platform.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Mobile Branding */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-md shadow-primary/20">
            <Box className="text-on-primary w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-lg tracking-tight text-on-surface">Agentic Inventory</span>
        </div>
        
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
