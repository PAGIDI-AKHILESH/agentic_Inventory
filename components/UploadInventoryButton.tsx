'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export function UploadInventoryButton({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
          alert('Invalid CSV format. Need at least headers and one row.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/inventory/upload/smart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ csvText: csv }),
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message || 'Upload successful');
          if (onUploadSuccess) onUploadSuccess();
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('An error occurred during upload.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl font-semibold bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:bg-surface-bright transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
        Upload CSV
      </button>
    </>
  );
}
