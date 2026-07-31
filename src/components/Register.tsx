import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { registerWithEmail } = useAuth();

  const [nomEcole, setNomEcole] = useState('');
  const [email, setEmail] = useState('');
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
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      {/* Container Principal */}
      <div className="w-full max-w-md">
        
        {/* En-tête & Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#FF8200] text-white font-black text-2xl shadow-xl border-2 border-white/20 transform hover:scale-105 transition-transform">
            EP
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">EcolePay</h1>
          <p className="text-sm font-medium text-slate-300">
            Inscription Établissement Scolaire
          </p>
        </div>

        {/* Carte Blanche Centrée */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Créer votre compte école</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configurez votre profil d'établissement pour débuter la collecte des frais.
            </p>
          </div>

          {/* Affichage des Erreurs */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-fadeIn">
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nom de l'école
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nomEcole}
                  onChange={(e) => setNomEcole(e.target.value)}
                  placeholder="Ex: Groupe Scolaire Les Lauriers d'Abidjan"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email professionnel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="administration@lauriers.ci"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Confirmation Mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirmation mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Avantages inclus */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inclus gratuitement avec votre compte :</span>
              </div>
              <ul className="pl-5 list-disc space-y-0.5 text-[11px] text-slate-500">
                <li>Gestion illimitée des élèves & classes</li>
                <li>Historique des paiements Wave, OM, MTN</li>
                <li>Génération de reçus de scolarité officiels</li>
              </ul>
            </div>

            {/* Bouton Inscription (Bouton Orange) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#FF8200] hover:bg-[#e07200] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60 mt-2"
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
          <div className="text-center pt-2 text-xs text-slate-600">
            Déjà un compte inscrit ?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#FF8200] font-bold hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Données sécurisées conformément aux normes de l'Éducation Nationale CI</span>
        </div>

      </div>
    </div>
  );
};
