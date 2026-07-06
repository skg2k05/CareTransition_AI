'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('doctor' | 'patient')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // If we are unauthenticated (no local storage), but middleware sent us here,
      // it means we have a ghost HttpOnly cookie. We MUST destroy it via API.
      fetch('/api/auth/logout', { method: 'POST' }).then(() => {
        window.location.href = '/auth/login';
      });
    }
    
    if (!isLoading && isAuthenticated && allowedRoles && user?.role) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard if wrong role
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, allowedRoles, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-xs text-slate-500 font-mono">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-rose-400 mb-2">Access Denied</h2>
          <p className="text-xs text-slate-400 mb-4">
            You do not have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}