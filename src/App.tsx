import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Abonnement } from './pages/Abonnement';
import { AbonnementAnnule } from './pages/AbonnementAnnule';
import { AbonnementSucces } from './pages/AbonnementSucces';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Register } from './components/Register';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fadeIn">
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">EP</div>
          <div><div className="text-2xl font-black tracking-tight text-white">EcolePay <span className="text-[#16A34A]">CI</span></div><div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Chargement de votre espace…</div></div>
        </div>
        <div className="space-y-3"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-4 w-full" /><div className="skeleton h-24 w-full rounded-2xl" /></div>
      </div>
    </div>
  );
}

type View = 'landing' | 'login' | 'register' | 'subscription' | 'subscription-success' | 'subscription-cancel';

function getViewFromPath(): View | null {
  if (window.location.pathname === '/abonnement/succes') return 'subscription-success';
  if (window.location.pathname === '/abonnement/annule') return 'subscription-cancel';
  if (window.location.pathname === '/abonnement') return 'subscription';
  return null;
}

function MainContent() {
  const { currentUser, userProfile, loading, schoolProfile } = useAuth();
  const [view, setView] = useState<View>(() => getViewFromPath() || 'landing');

  useEffect(() => {
    const onPopState = () => setView(getViewFromPath() || 'landing');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextView: View, path = '/') => {
    window.history.pushState({}, '', path);
    setView(nextView);
  };

  if (loading) return <LoadingScreen />;

  const returnToDashboard = () => navigate(currentUser ? 'landing' : 'landing', '/');

  if (view === 'subscription-success') return <AbonnementSucces onBack={returnToDashboard} />;
  if (view === 'subscription-cancel') return <AbonnementAnnule onRetry={() => navigate('subscription', '/abonnement')} onBack={returnToDashboard} />;

  if (currentUser && view === 'subscription') {
    return <Abonnement schoolId={schoolProfile?.id} initialEmail={currentUser.email || ''} onBack={returnToDashboard} />;
  }

  if (currentUser) {
    // Si l'utilisateur est connecté mais n'a pas de profil Firestore, on le force à s'enregistrer
    if (!userProfile && !loading) {
      return <Register onSwitchToLogin={() => navigate('login')} onBack={() => navigate('landing')} />;
    }
    return <Dashboard onOpenSubscription={() => navigate('subscription', '/abonnement')} />;
  }

  if (view === 'login') return <Login onSwitchToRegister={() => navigate('register')} onBack={() => navigate('landing')} />;
  if (view === 'register') return <Register onSwitchToLogin={() => navigate('login')} onBack={() => navigate('landing')} />;
  if (view === 'subscription') return <Login onSwitchToRegister={() => navigate('register')} onBack={() => navigate('landing')} />;

  return <Landing onLogin={() => navigate('login')} onRegister={() => navigate('register')} />;
}

export default function App() {
  return <AuthProvider><MainContent /></AuthProvider>;
}
