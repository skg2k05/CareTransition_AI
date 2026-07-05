'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Stethoscope, User, ArrowRight, Loader2, Smartphone, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(role, identifier);
      router.push('/auth/verify');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">CareTransition AI</h1>
          <p className="text-xs text-slate-400 mt-1">Secure OTP Login — No Passwords Needed</p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setRole('doctor')}
            className={`p-3 rounded-xl border transition-all ${
              role === 'doctor'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Doctor</span>
            </div>
          </button>
          <button
            onClick={() => setRole('patient')}
            className={`p-3 rounded-xl border transition-all ${
              role === 'patient'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <User className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Patient</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {role === 'doctor' ? 'Email Address' : 'Mobile Number'}
            </label>
            <div className="relative">
              {role === 'doctor' ? (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              ) : (
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              )}
              <input
                type={role === 'doctor' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'doctor' ? 'dr.name@hospital.com' : '+91 98765 43210'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              {role === 'doctor' 
                ? 'We will send a 6-digit OTP to your email.' 
                : 'We will send a 6-digit OTP via SMS to your mobile.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !identifier}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500">
            🔒 Passwordless login via OTP. Your credentials are never stored.
          </p>
        </div>
      </div>
    </div>
  );
}