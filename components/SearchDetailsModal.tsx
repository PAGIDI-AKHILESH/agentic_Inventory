import { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp, AlertTriangle, Lightbulb, Calendar, Package, Users, DollarSign } from 'lucide-react';

interface SearchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: { type: 'inventory' | 'supplier'; id: string; title: string; subtitle: string } | null;
  token: string | null;
}

interface AnalysisData {
  performance: string;
  forecast: string;
  expiryInfo: string;
  suggestions: string[];
}

export default function SearchDetailsModal({ isOpen, onClose, result, token }: SearchDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && result && token) {
      setLoading(true);
      setError(null);
      setAnalysis(null);

      fetch(`/api/search/details?type=${result.type}&id=${result.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setAnalysis(data.analysis);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load detailed analysis. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, result, token]);

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-outline-variant/20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${result.type === 'inventory' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
              {result.type === 'inventory' ? <Package className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">{result.title}</h2>
              <p className="text-sm text-on-surface-variant">{result.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-medium">Generating AI Analysis...</p>
              <p className="text-sm mt-2 text-center max-w-sm">Analyzing historical data, predicting future trends, and formulating strategic suggestions.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-error">
              <AlertTriangle className="w-10 h-10 mb-4" />
              <p>{error}</p>
            </div>
          ) : analysis ? (
            <div className="space-y-8">
              {/* Performance Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-on-surface">Past Performance & Profitability</h3>
                </div>
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed">{analysis.performance}</p>
                </div>
              </section>

              {/* Forecast Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-on-surface">Future Forecast</h3>
                </div>
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed">{analysis.forecast}</p>
                </div>
              </section>

              {/* Expiry / Lifecycle Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-on-surface">Lifecycle & Expiry Management</h3>
                </div>
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed">{analysis.expiryInfo}</p>
                </div>
              </section>

              {/* Suggestions Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-on-surface">Strategic Suggestions & Replacements</h3>
                </div>
                <div className="grid gap-3">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full hover:bg-primary/90 transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
