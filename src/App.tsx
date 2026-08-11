import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fadeIn">
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
            EP
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-white">EcolePay <span className="text-[#16A34A]">CI</span></div>
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Chargement de votre espace…</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

type View = 'landing' | 'login' | 'register';

function MainContent() {
  const { currentUser, loading, isDemoMode } = useAuth();
  const [view, setView] = useState<View>('landing');

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentUser || isDemoMode) {
    return <Dashboard />;
  }

  if (view === 'login') {
    return (
      <Login
        onSwitchToRegister={() => setView('register')}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'register') {
    return (
      <Register
        onSwitchToLogin={() => setView('login')}
        onBack={() => setView('landing')}
      />
    );
  }

  return <Landing onLogin={() => setView('login')} onRegister={() => setView('register')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
