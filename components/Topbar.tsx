'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, LayoutGrid, LogOut, Loader2, Package, Users, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import SearchDetailsModal from './SearchDetailsModal';

interface SearchResult {
  type: 'inventory' | 'supplier';
  id: string;
  title: string;
  subtitle: string;
}

interface Insight {
  id: string;
  type: 'alert' | 'suggestion' | 'insight';
  title: string;
  message: string;
  timestamp: string;
}

export default function Topbar() {
  const { user, token, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2 && token) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.results || []);
            setShowSearchDropdown(true);
          }
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token]);

  const fetchInsights = async () => {
    if (!token) return;
    setIsLoadingInsights(true);
    try {
      const res = await fetch('/api/insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const toggleNotifications = () => {
    const willShow = !showNotifications;
    setShowNotifications(willShow);
    if (willShow && insights.length === 0) {
      fetchInsights();
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSelectedSearchResult(result);
    setIsSearchModalOpen(true);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-error" />;
      case 'suggestion': return <TrendingUp className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-secondary" />;
    }
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-8 bg-surface-container-low/50 backdrop-blur-md border-b border-outline-variant/10 sticky top-0 z-10">
        <div className="flex-1 max-w-xl" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search inventory, suppliers..."
              className="w-full bg-surface-container border-none rounded-full pl-10 pr-10 py-2 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
            )}
            
            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {searchResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left"
                      >
                        <div className="mt-0.5">
                          {result.type === 'inventory' ? (
                            <Package className="w-5 h-5 text-primary" />
                          ) : (
                            <Users className="w-5 h-5 text-secondary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{result.title}</p>
                          <p className="text-xs text-on-surface-variant">{result.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-on-surface-variant">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={toggleNotifications}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {insights.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                    <h3 className="font-bold text-on-surface">Agentic AI Insights</h3>
                    <button onClick={fetchInsights} className="text-xs text-primary hover:underline" disabled={isLoadingInsights}>
                      {isLoadingInsights ? 'Analyzing...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {isLoadingInsights ? (
                      <div className="p-8 flex flex-col items-center justify-center text-on-surface-variant">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-sm text-center">Analyzing your inventory, local market trends, and financial data...</p>
                      </div>
                    ) : insights.length > 0 ? (
                      <div className="py-2">
                        {insights.map((insight) => (
                          <div key={insight.id} className="px-4 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant/5 last:border-0">
                            <div className="flex gap-3">
                              <div className="mt-1 flex-shrink-0">
                                {getInsightIcon(insight.type)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-on-surface mb-1">{insight.title}</h4>
                                <p className="text-xs text-on-surface-variant leading-relaxed">{insight.message}</p>
                                <span className="text-[10px] text-outline mt-2 block">
                                  {new Date(insight.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-on-surface-variant">
                        <p className="text-sm">No new insights at the moment. Your inventory is optimal.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/settings" className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all">
              <Settings className="w-5 h-5" />
            </Link>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all">
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-primary/20 flex items-center justify-center text-primary font-bold text-xs hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
              {getInitials()}
            </Link>
            <button onClick={handleLogout} className="text-on-surface-variant hover:text-red-500 transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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

      <SearchDetailsModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        result={selectedSearchResult} 
        token={token} 
      />
    </>
  );
}
