import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Building2, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onBack }) => {
  const { registerWithEmail, currentUser } = useAuth();

  const [nomEcole, setNomEcole] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nomEcole.trim()) {
      setError('Veuillez saisir le nom de votre établissement.');
      return;
    }
    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      await registerWithEmail(email, password, nomEcole);
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMsg = 'Une erreur est survenue lors de la création du compte.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Cette adresse email est déjà utilisée par un autre compte.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Format d\'adresse email invalide.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Le mot de passe choisi est trop faible.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
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
            Inscription Établissement Scolaire
          </p>
        </div>

        {/* Carte Blanche Centrée */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl shadow-black/40 border border-slate-100 dark:border-slate-700/60 p-8 space-y-6">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Créer votre compte école</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configurez votre profil d'établissement pour débuter la collecte des frais.
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

          {/* Formulaire Inscription */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nom de l'école */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Nom de l'école
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nomEcole}
                  onChange={(e) => setNomEcole(e.target.value)}
                  placeholder="Ex: Groupe Scolaire Les Lauriers d'Abidjan"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Email professionnel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="administration@lauriers.ci"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Confirmation Mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Confirmation mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Avantages inclus */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inclus gratuitement avec votre compte :</span>
              </div>
              <ul className="pl-5 list-disc space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Gestion illimitée des élèves & classes</li>
                <li>Historique des paiements Wave, OM, MTN</li>
                <li>Génération de reçus de scolarité officiels</li>
              </ul>
            </div>

            {/* Bouton Inscription (Bouton Orange) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Lien Se connecter */}
          <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-300">
            Déjà un compte inscrit ?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#16A34A] font-bold hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Données sécurisées conformément aux normes de l'Éducation Nationale CI</span>
        </div>

      </div>
    </div>
  );
};
