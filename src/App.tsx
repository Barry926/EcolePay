/** STYLE SCOLÉA — Le point d’entrée conserve la séparation nette entre page publique, accès et registre privé. */
import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { BrandMark } from './components/BrandMark';
import { PublicLanding } from './components/PublicLanding';
import { ScoleaDashboard } from './components/ScoleaDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolDataProvider } from './contexts/SchoolDataContext';

type View = 'landing' | 'login' | 'register';

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-ink px-6 text-white"><div className="text-center"><BrandMark light /><div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-saffron" /></div><p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-white/40">Ouverture du cahier…</p></div></div>;
}

function ProfileMissing() {
  const { logout } = useAuth();
  return <div className="grid min-h-screen place-items-center bg-ivory px-5 text-ink"><div className="max-w-md rounded-[26px] border border-ink/10 bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-saffron/15 text-saffron"><BrandMark withName={false} /></div><h1 className="mt-6 font-display text-3xl">Profil à finaliser</h1><p className="mt-3 text-sm leading-relaxed text-ink/55">Votre compte existe, mais aucun établissement ne lui est encore associé. Déconnectez-vous puis recréez un espace pour reprendre l’inscription.</p><button onClick={() => logout()} className="mt-6 rounded-xl bg-forest px-5 py-3 text-sm font-extrabold text-white">Se déconnecter</button></div></div>;
}

function MainContent() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<View>('landing');
  if (loading) return <LoadingScreen />;
  if (user && profile) return <SchoolDataProvider><ScoleaDashboard /></SchoolDataProvider>;
  if (user && !profile) return <ProfileMissing />;
  if (view === 'login') return <AuthScreen mode="login" onBack={() => setView('landing')} onSwitch={() => setView('register')} />;
  if (view === 'register') return <AuthScreen mode="register" onBack={() => setView('landing')} onSwitch={() => setView('login')} />;
  return <PublicLanding onLogin={() => setView('login')} onRegister={() => setView('register')} />;
}

export default function App() {
  return <AuthProvider><MainContent /></AuthProvider>;
}
