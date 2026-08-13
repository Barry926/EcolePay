import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { ThemeToggle } from './ThemeToggle';
import { Mail, Lock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onBack }) => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs requis.');
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      
      // Le chargement du profil est géré par AuthContext et la redirection par App.tsx
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMsg = 'Identifiants incorrects ou problème de connexion.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Email ou mot de passe incorrect.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Format d\'adresse email invalide.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Trop de tentatives échouées. Veuillez réespacer vos essais.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('La fenêtre de connexion Google a été fermée.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domaine non autorisé dans votre console Firebase. Vous pouvez aussi utiliser le mode démo.');
      } else {
        setError('Impossible de se connecter avec Google : ' + (err.message || 'Erreur réseau'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Décor arrière-plan */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-[#16A34A]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#15803D]/20 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize:'22px 22px'}} />

      {/* Toggle thème flottant */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle variant="floating" />
      </div>

      {/* Container Principal */}
      <div className="w-full max-w-md relative z-10 animate-riseIn">
        
        {/* En-tête & Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#16A34A] text-white font-black text-2xl shadow-xl border-2 border-white/20 transform hover:scale-105 transition-transform">
            EP
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">EcolePay <span className="text-[#16A34A]">CI</span></h1>
          <p className="text-sm font-medium text-slate-300">
            SaaS de gestion des frais scolaires pour écoles privées en Côte d'Ivoire 🇨🇮
          </p>
        </div>

        {/* Carte Blanche Centrée */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl shadow-black/40 border border-slate-100 dark:border-slate-700/60 p-8 space-y-6">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Connexion à votre espace</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Entrez vos accès fondation ou secrétariat pour accéder au tableau de bord.
            </p>
          </div>

          {/* Affichage des Erreurs */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div className="flex-1">
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Formulaire Email + Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="directeur@ecole.ci"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Mot de passe
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Fonctionnalité de réinitialisation : saisissez votre email pour recevoir un lien.'); }} className="text-xs text-[#16A34A] font-semibold hover:underline">
                  Oublié ?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Bouton de Connexion principal (Bouton Orange) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
            <span className="bg-white dark:bg-[#1E293B] px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute">
              OU
            </span>
          </div>

          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl flex items-center justify-center space-x-3 transition-colors cursor-pointer disabled:opacity-60 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Se connecter avec Google</span>
          </button>

          {/* Lien Créer un compte */}
          <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-300">
            Vous n'avez pas encore de compte école ?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#16A34A] font-bold hover:underline cursor-pointer"
            >
              Créer un compte
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Plateforme sécurisée certifiée pour établissements privés CI</span>
        </div>

      </div>
    </div>
  );
};
