import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

// Module-level flag to prevent re-initializing GSI on every render
let gsiInitialized = false;

export default function GoogleSignInButton({ onAuthSuccess, className = "" }) {
  const [clientId] = useState(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedClientId, setResolvedClientId] = useState(clientId);
  const googleBtnContainerRef = useRef(null);
  const callbackRef = useRef(null);

  // Keep callback ref updated so GSI can always call the latest version
  callbackRef.current = onAuthSuccess;

  // Fetch client ID from backend if not set in env
  useEffect(() => {
    if (resolvedClientId && !resolvedClientId.startsWith('your_')) return;
    let isMounted = true;
    fetch('/api/auth/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (isMounted && data?.google_client_id && !data.google_client_id.startsWith('your_')) {
          setResolvedClientId(data.google_client_id);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const hasRealClientId = resolvedClientId && !resolvedClientId.startsWith('your_') && resolvedClientId.length > 10;

  // Credential response handler (stable via ref)
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError("No credential returned from Google");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, client_id: resolvedClientId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Google verification failed");
      if (callbackRef.current && data.user) callbackRef.current(data.user, data.token);
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  // Initialize GSI — only once globally
  useEffect(() => {
    if (!hasRealClientId || !googleBtnContainerRef.current) return;

    const initGSI = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return;
      if (!gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: resolvedClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gsiInitialized = true;
      }
      // Always render the button (safe to call multiple times)
      window.google.accounts.id.renderButton(
        googleBtnContainerRef.current,
        { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 280 }
      );
    };

    if (window.google?.accounts?.id) {
      initGSI();
    } else if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGSI;
      document.body.appendChild(script);
    } else {
      // Script already loading — wait for it
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGSI();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [hasRealClientId, resolvedClientId]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {error && (
        <div className="w-full max-w-[280px] mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center flex flex-col items-center gap-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hasRealClientId ? (
        <div className="relative flex items-center justify-center min-h-[44px]">
          <div ref={googleBtnContainerRef} className="shadow-sm rounded-full overflow-hidden" />
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
              Verifying...
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-[280px] p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-medium">Google Sign-In not configured.</p>
          <p className="text-[10px] text-slate-500">Set VITE_GOOGLE_CLIENT_ID in your .env file to enable it.</p>
        </div>
      )}
    </div>
  );
}
