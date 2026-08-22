'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      window.location.reload();
    }
    
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      backgroundColor: '#f8fafc',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <WifiOff size={80} color="#94a3b8" style={{ marginBottom: '24px', margin: '0 auto' }} />
        <h2 style={{ color: '#0f172a', margin: '0 0 12px 0', fontSize: '24px', fontWeight: 'bold' }}>
          No Internet Connection
        </h2>
        <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px', lineHeight: 1.5 }}>
          Please turn on your mobile data or connect to Wi-Fi and try again.
        </p>
        <button 
          onClick={() => {
            if (navigator.onLine) window.location.reload();
          }}
          style={{
            backgroundColor: '#d97706', color: 'white',
            border: 'none', padding: '14px 32px', borderRadius: '12px',
            fontSize: '16px', fontWeight: 600, width: '100%',
            cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
