'use client';

import { useState, useRef } from 'react';
import { Store, Package, Users, CheckCircle, ArrowRight, Loader2, UploadCloud, Check, MessageCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SetupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    companyName: '',
    industry: 'Retail & E-commerce',
    revenue: 'Under $1M',
    inventoryItems: [] as Record<string, string | number>[],
    enableTelegram: true,
    telegramConnected: false,
    erpSystem: '',
    erpConnected: false,
  });

  const [phoneVerification, setPhoneVerification] = useState({
    status: 'idle', // idle, sending, sent, verifying, verified
    otp: '',
  });

  const [emailVerification, setEmailVerification] = useState({
    status: 'idle', // idle, sending, sent, verifying, verified
    otp: '',
  });

  const handleSendOtp = async (type: 'phone' | 'email') => {
    const target = type === 'phone' ? formData.phoneNumber : formData.email;
    if (!target) return;
    
    if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'sending' });
    else setEmailVerification({ ...emailVerification, status: 'sending' });

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'phone' ? { phoneNumber: target } : { email: target })
      });
      if (res.ok) {
        if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'sent' });
        else setEmailVerification({ ...emailVerification, status: 'sent' });
        setError(`OTP sent to your ${type}!`);
      } else {
        if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'idle' });
        else setEmailVerification({ ...emailVerification, status: 'idle' });
        setError(`Failed to send OTP to ${type}`);
      }
    } catch {
      if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'idle' });
      else setEmailVerification({ ...emailVerification, status: 'idle' });
      setError(`Error sending OTP to ${type}`);
    }
  };

  const handleVerifyOtp = async (type: 'phone' | 'email') => {
    const otp = type === 'phone' ? phoneVerification.otp : emailVerification.otp;
    const target = type === 'phone' ? formData.phoneNumber : formData.email;
    if (!otp) return;

    if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'verifying' });
    else setEmailVerification({ ...emailVerification, status: 'verifying' });

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'phone' ? { phoneNumber: target, otp } : { email: target, otp })
      });
      if (res.ok) {
        if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'verified' });
        else setEmailVerification({ ...emailVerification, status: 'verified' });
        setError('');
      } else {
        const data = await res.json();
        if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'sent' });
        else setEmailVerification({ ...emailVerification, status: 'sent' });
        setError(data.error || 'Invalid OTP');
      }
    } catch {
      if (type === 'phone') setPhoneVerification({ ...phoneVerification, status: 'sent' });
      else setEmailVerification({ ...emailVerification, status: 'sent' });
      setError('Error verifying OTP');
    }
  };

  const handleErpConnect = () => {
    if (!formData.erpSystem) return;
    setLoading(true);
    // Simulate API call to connect ERP and fetch initial data
    setTimeout(() => {
      setFormData({
        ...formData,
        erpConnected: true,
        inventoryItems: [
          { sku: 'ERP-001', name: 'Imported Widget A', category: 'Hardware', currentStock: 150, unitCost: 12.5, sellingPrice: 24.99 },
          { sku: 'ERP-002', name: 'Imported Gadget B', category: 'Electronics', currentStock: 45, unitCost: 45.0, sellingPrice: 89.99 },
          { sku: 'ERP-003', name: 'Imported Tool C', category: 'Hardware', currentStock: 300, unitCost: 5.25, sellingPrice: 15.00 },
        ]
      });
      setLoading(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) return; // Need at least headers and one row

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const parsedItems = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const item: Record<string, string | number> = {};
        headers.forEach((header, index) => {
          if (header === 'sku') item.sku = values[index];
          if (header === 'name') item.name = values[index];
          if (header === 'category') item.category = values[index];
          if (header === 'stock' || header === 'currentstock') item.currentStock = parseInt(values[index]) || 0;
          if (header === 'cost' || header === 'unitcost') item.unitCost = parseFloat(values[index]) || 0;
          if (header === 'price' || header === 'sellingprice') item.sellingPrice = parseFloat(values[index]) || 0;
        });
        // Ensure required fields
        if (!item.sku) item.sku = `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        if (!item.name) item.name = 'Unknown Item';
        return item;
      });

      setFormData({ ...formData, inventoryItems: parsedItems });
    };
    reader.readAsText(file);
  };

  const handleNext = async () => {
    setError('');
    
    if (step === 1) {
      // Basic validation for Step 1
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.password || !formData.companyName) {
        setError('Please fill in all required fields to create your account.');
        return;
      }
      if (phoneVerification.status !== 'verified' || emailVerification.status !== 'verified') {
        setError('Please verify both your email address and phone number to continue.');
        return;
      }
      setStep(step + 1);
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      // Final Step: Register the user
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            companyName: formData.companyName,
            industry: formData.industry,
            revenue: formData.revenue,
            isPhoneVerified: phoneVerification.status === 'verified',
            inventoryItems: formData.inventoryItems,
            integrations: {
              telegram: formData.enableTelegram,
              erpSystem: formData.erpConnected ? formData.erpSystem : null
            }
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.stack) console.error('Server error stack:', data.stack);
          throw new Error(data.details || data.error || 'Failed to register');
        }

        // Save tokens and user
        login(data.user, data.tokens);
        
        router.push('/dashboard');
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred during registration.');
        }
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center pb-20">
      {/* Progress Bar */}
      <div className="w-full mb-12">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-variant -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map((num) => (
            <div 
              key={num} 
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-300 ${
                step >= num 
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' 
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {step > num ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">{num}</span>}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          <span>Business Info</span>
          <span>Inventory Setup</span>
          <span>Integrations</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="w-full bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline-variant/10 shadow-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                <Store className="text-on-primary-container w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold text-on-surface">Tell us about your business</h2>
                <p className="text-on-surface-variant mt-1">This helps the AI tailor recommendations to your industry.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">First Name *</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Email Address *</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={emailVerification.status === 'verified'}
                      className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                      placeholder="jane@acme.com"
                    />
                    {emailVerification.status === 'verified' ? (
                      <button disabled className="px-4 py-3 bg-secondary/20 text-secondary font-bold rounded-xl flex items-center gap-2 whitespace-nowrap">
                        <Check className="w-4 h-4" /> Verified
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSendOtp('email')}
                        disabled={!formData.email || emailVerification.status === 'sending'}
                        className="px-4 py-3 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                      >
                        {emailVerification.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                    )}
                  </div>
                  {(emailVerification.status === 'sent' || emailVerification.status === 'verifying') && (
                    <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        value={emailVerification.otp}
                        onChange={(e) => setEmailVerification({ ...emailVerification, otp: e.target.value })}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="Enter 123456 (Mock OTP)"
                        maxLength={6}
                      />
                      <button 
                        onClick={() => handleVerifyOtp('email')}
                        disabled={emailVerification.otp.length < 6 || emailVerification.status === 'verifying'}
                        className="px-4 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                      >
                        {emailVerification.status === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Phone Number *</label>
                  <div className="flex gap-2">
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      disabled={phoneVerification.status === 'verified'}
                      className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                      placeholder="+1 (555) 000-0000"
                    />
                    {phoneVerification.status === 'verified' ? (
                      <button disabled className="px-4 py-3 bg-secondary/20 text-secondary font-bold rounded-xl flex items-center gap-2 whitespace-nowrap">
                        <Check className="w-4 h-4" /> Verified
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSendOtp('phone')}
                        disabled={!formData.phoneNumber || phoneVerification.status === 'sending'}
                        className="px-4 py-3 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                      >
                        {phoneVerification.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                    )}
                  </div>
                  {(phoneVerification.status === 'sent' || phoneVerification.status === 'verifying') && (
                    <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        value={phoneVerification.otp}
                        onChange={(e) => setPhoneVerification({ ...phoneVerification, otp: e.target.value })}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="Enter 123456 (Mock OTP)"
                        maxLength={6}
                      />
                      <button 
                        onClick={() => handleVerifyOtp('phone')}
                        disabled={phoneVerification.otp.length < 6 || phoneVerification.status === 'verifying'}
                        className="px-4 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                      >
                        {phoneVerification.status === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Password *</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Business Name *</label>
                <input 
                  type="text" 
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Industry</label>
                <select 
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                >
                  <option>Retail & E-commerce</option>
                  <option>Manufacturing</option>
                  <option>Food & Beverage</option>
                  <option>Healthcare & Pharma</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Annual Revenue Range</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Under $1M', '$1M - $5M', '$5M - $20M', '$20M+'].map((range) => (
                    <button 
                      key={range}
                      onClick={() => setFormData({ ...formData, revenue: range })}
                      className={`py-3 border rounded-xl text-sm font-medium transition-all ${
                        formData.revenue === range 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'border-outline-variant/30 hover:bg-surface-container-highest hover:border-primary/50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center">
                <Package className="text-on-secondary-container w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold text-on-surface">Initial Inventory Setup</h2>
                <p className="text-on-surface-variant mt-1">Upload your current stock to give the AI context.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
              
              {formData.inventoryItems.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-surface-container-highest transition-colors cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="text-secondary w-8 h-8" />
                  </div>
                  <p className="font-bold text-lg text-on-surface mb-1">Upload CSV File</p>
                  <p className="text-sm text-on-surface-variant text-center max-w-xs">
                    Import your existing product catalog and stock levels. Must include SKU, Name, and Stock columns.
                  </p>
                </div>
              ) : (
                <div className="p-6 border border-secondary/30 bg-secondary/5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Upload Successful</p>
                      <p className="text-sm text-on-surface-variant">{formData.inventoryItems.length} items parsed and ready for import.</p>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-2">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-highest">
                        <tr>
                          <th className="px-3 py-2 rounded-tl-lg">SKU</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2 rounded-tr-lg">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.inventoryItems.slice(0, 5).map((item, i) => (
                          <tr key={i} className="border-b border-outline-variant/10 last:border-0">
                            <td className="px-3 py-2 font-mono text-xs">{item.sku}</td>
                            <td className="px-3 py-2 truncate max-w-[150px]">{item.name}</td>
                            <td className="px-3 py-2">{item.currentStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {formData.inventoryItems.length > 5 && (
                      <p className="text-center text-xs text-on-surface-variant mt-2 py-1">
                        + {formData.inventoryItems.length - 5} more items
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setFormData({ ...formData, inventoryItems: [] })}
                    className="mt-4 text-sm text-error font-medium hover:underline"
                  >
                    Remove and upload different file
                  </button>
                </div>
              )}
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-outline uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Connect ERP / POS System</label>
                <div className="flex gap-3">
                  <select 
                    name="erpSystem"
                    value={formData.erpSystem}
                    onChange={handleChange}
                    disabled={formData.erpConnected}
                    className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="">Select integration...</option>
                    <option value="shopify">Shopify</option>
                    <option value="quickbooks">QuickBooks Online</option>
                    <option value="odoo">Odoo</option>
                    <option value="custom">Custom API</option>
                  </select>
                  {formData.erpConnected ? (
                    <button 
                      disabled
                      className="px-6 py-3 bg-secondary/20 text-secondary font-bold rounded-xl flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Connected
                    </button>
                  ) : (
                    <button 
                      onClick={handleErpConnect}
                      disabled={!formData.erpSystem || loading}
                      className="px-6 py-3 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && formData.erpSystem ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-2">
                  You can also connect your systems later from the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-container flex items-center justify-center">
                <Users className="text-on-tertiary-container w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold text-on-surface">AI Assistant Integrations</h2>
                <p className="text-on-surface-variant mt-1">Connect messaging apps to talk to your inventory AI.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className={`p-5 border rounded-2xl transition-all ${formData.enableTelegram ? 'border-tertiary bg-tertiary/5' : 'border-outline-variant/20 bg-surface-container-lowest'}`}>
                <div className="flex items-start gap-4">
                  <input 
                    type="checkbox" 
                    name="enableTelegram"
                    checked={formData.enableTelegram}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 rounded border-outline-variant/30 text-tertiary focus:ring-tertiary/50" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[#0088cc]" />
                      <p className="font-bold text-on-surface">Telegram Bot</p>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1">Query stock levels, get alerts, and ask for forecasts directly via Telegram.</p>
                    
                    {formData.enableTelegram && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/20">
                        {formData.telegramConnected ? (
                          <div className="flex items-center gap-2 text-sm font-bold text-secondary">
                            <CheckCircle className="w-4 h-4" /> Connected successfully
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              if (!formData.phoneNumber) {
                                setError('Please enter a phone number in step 1 first.');
                                return;
                              }
                              window.open(`https://t.me/MsmeAutopilotBot?start=LINK_${formData.phoneNumber.replace(/\+/g, '')}`, '_blank');
                              setFormData({ ...formData, telegramConnected: true });
                            }}
                            className="px-4 py-2 bg-[#0088cc] text-white text-sm font-bold rounded-lg hover:bg-[#0077b3] transition-colors"
                          >
                            Connect Telegram Now
                          </button>
                        )}
                        <p className="text-xs text-on-surface-variant mt-2">We will use your phone number ({formData.phoneNumber || 'provided in step 1'}) to link your account.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between items-center pt-6 border-t border-outline-variant/10">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
          >
            Back
          </button>
          <button 
            onClick={handleNext}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing...</>
            ) : (
              <>{step === 3 ? 'Complete Setup' : 'Continue'} <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
