'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'doctor' | 'patient' | null;

interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (role: UserRole, identifier: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOTP, setPendingOTP] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('caretransition_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setRole(parsed.role);
      } catch {
        localStorage.removeItem('caretransition_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (selectedRole: UserRole, identifier: string) => {
    const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 MOCK OTP for ${identifier} (${selectedRole}): ${mockOTP}`);
    setPendingOTP(mockOTP);
    
    localStorage.setItem('caretransition_pending', JSON.stringify({
      role: selectedRole,
      identifier,
      otp: mockOTP,
      timestamp: Date.now()
    }));
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    const pending = localStorage.getItem('caretransition_pending');
    if (!pending) return false;
    
    const { role: pendingRole, identifier, otp: correctOTP } = JSON.parse(pending);
    
    if (otp === correctOTP) {
      const newUser: AuthUser = {
        id: `user_${Date.now()}`,
        role: pendingRole,
        name: pendingRole === 'doctor' ? 'Dr. User' : 'Patient User',
        [pendingRole === 'doctor' ? 'email' : 'phone']: identifier,
        isVerified: true
      };
      
      setUser(newUser);
      setRole(pendingRole);
      localStorage.setItem('caretransition_auth', JSON.stringify(newUser));
      localStorage.removeItem('caretransition_pending');
      document.cookie = `caretransition_auth=${newUser.id}; path=/; max-age=604800; samesite=lax`;
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('caretransition_auth');
    localStorage.removeItem('caretransition_pending');
    document.cookie = 'caretransition_auth=; path=/; max-age=0; samesite=lax';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isLoading, 
      isAuthenticated: !!user,
      login, 
      verifyOTP, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};