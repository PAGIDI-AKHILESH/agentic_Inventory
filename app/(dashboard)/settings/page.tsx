'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Send,
  MessageCircle,
  Settings as SettingsIcon,
  User,
  Lock,
  Phone,
  LogOut,
  Info,
  HelpCircle,
  Loader2,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [error, setError] = useState('');

  const handleTelegramConnect = () => {
    setTelegramLoading(true);
    setError('');
    if (user?.phone) {
      // NOTE: Replace 'MsmeAutopilotBot' with your actual Telegram bot username if it's different.
      window.open(`https://t.me/MsmeAutopilotBot?start=LINK_${user.phone.replace(/\+/g, '')}`, '_blank');
    } else {
      setError("Please update your phone number in the profile section first.");
      setTelegramLoading(false);
      return;
    }
    setTimeout(() => {
      setTelegramConnected(true);
      setTelegramLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div>
        <h1 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Settings</h1>
        <p className="text-on-surface-variant text-lg font-body">Manage your account, security, and communication channels.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
            {error}
          </div>
        )}
        
        {/* Account Settings */}
        <section className="glass-card p-8 rounded-3xl border border-outline-variant/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
              <User className="text-on-primary-container w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">Account Settings</h2>
              <p className="text-on-surface-variant mt-1">Manage your profile and security preferences.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <User className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Edit Profile</h3>
                  <p className="text-sm text-on-surface-variant">Update your name, company details, and email.</p>
                </div>
              </div>
              <a href="/profile" className="px-4 py-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-lg transition-all">
                Edit
              </a>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <Lock className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Change Password</h3>
                  <p className="text-sm text-on-surface-variant">Update your account password.</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-lg transition-all">
                Update
              </button>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <Phone className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Change Phone Number</h3>
                  <p className="text-sm text-on-surface-variant">Update the number used for AI interactions.</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-lg transition-all">
                Update
              </button>
            </div>
          </div>
        </section>

        {/* Messaging Integrations */}
        <section className="glass-card p-8 rounded-3xl border border-outline-variant/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-tertiary-container flex items-center justify-center">
              <MessageCircle className="text-on-tertiary-container w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">Communication Hub</h2>
              <p className="text-on-surface-variant mt-1">Connect messaging apps to talk to your inventory AI.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Telegram */}
            <div className="p-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
                  <Send className="text-[#0088cc] w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Telegram Bot</h3>
                  <p className="text-sm text-on-surface-variant">Chat with your AI assistant via Telegram.</p>
                </div>
              </div>
              {telegramConnected ? (
                <button 
                  onClick={() => setTelegramConnected(false)}
                  className="px-4 py-2 bg-secondary/20 text-secondary font-bold rounded-lg flex items-center gap-2 hover:bg-secondary/30 transition-colors"
                >
                  <Check className="w-4 h-4" /> Connected
                </button>
              ) : (
                <button 
                  onClick={handleTelegramConnect}
                  disabled={telegramLoading}
                  className="px-4 py-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* System & Support */}
        <section className="glass-card p-8 rounded-3xl border border-outline-variant/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center">
              <SettingsIcon className="text-on-secondary-container w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">System & Support</h2>
              <p className="text-on-surface-variant mt-1">App information and session management.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <User className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Switch Accounts</h3>
                  <p className="text-sm text-on-surface-variant">Log into a different tenant or business.</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <Info className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">About</h3>
                  <p className="text-sm text-on-surface-variant">Version 1.0.0 • MSME Autopilot</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Help & Support</h3>
                  <p className="text-sm text-on-surface-variant">View documentation and contact support.</p>
                </div>
              </div>
            </div>

            <div 
              onClick={handleLogout}
              className="bg-error/10 p-6 rounded-2xl border border-error/20 flex items-center justify-between hover:bg-error/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h3 className="font-bold text-error">Log Out</h3>
                  <p className="text-sm text-error/80">Securely sign out of your account.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6 mx-auto">
              <LogOut className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface text-center mb-2">Confirm Logout</h3>
            <p className="text-on-surface-variant text-center mb-8">Are you sure you want to log out of your account?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl bg-error hover:bg-error/90 text-on-error font-bold transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
