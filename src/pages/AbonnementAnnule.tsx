import React from 'react';
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

interface AbonnementAnnuleProps {
  onRetry: () => void;
  onBack: () => void;
}

export const AbonnementAnnule: React.FC<AbonnementAnnuleProps> = ({ onRetry, onBack }) => (
  <div className="min-h-screen flex items-center justify-center p-5 bg-[#F9FAFB] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100">
    <div className="absolute top-5 right-5"><ThemeToggle variant="floating" /></div>
    <main className="w-full max-w-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl p-8 sm:p-10 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center"><XCircle className="w-9 h-9" /></div>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] font-black text-rose-600">Paiement annulé</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Votre abonnement n’a pas été activé.</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">Aucun accès payant n’a été accordé. Vous pouvez réessayer le paiement ou revenir à votre tableau de bord.</p>
      <button onClick={onRetry} className="mt-8 w-full py-3 bg-[#16A34A] hover:bg-[#15803D] rounded-xl text-white font-black flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Réessayer</button>
      <button onClick={onBack} className="mt-3 w-full py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Retour au tableau de bord</button>
    </main>
  </div>
);
