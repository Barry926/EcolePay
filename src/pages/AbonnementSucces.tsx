import React from 'react';
import { CheckCircle2, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const AbonnementSucces: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen flex items-center justify-center p-5 bg-[#F9FAFB] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100">
    <div className="absolute top-5 right-5"><ThemeToggle variant="floating" /></div>
    <main className="w-full max-w-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl p-8 sm:p-10 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-[#16A34A] flex items-center justify-center"><CheckCircle2 className="w-9 h-9" /></div>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] font-black text-[#16A34A]">Paiement confirmé</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Votre abonnement EcolePay CI est en cours d’activation.</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">Vous allez recevoir votre clé de licence par email. Saisissez-la ensuite dans les paramètres de votre école pour activer l’accès complet.</p>
      <div className="mt-6 p-4 flex gap-3 text-left rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <Mail className="w-5 h-5 text-[#16A34A] shrink-0" /><p className="text-sm text-slate-600 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Conseil :</strong> vérifiez également les courriers indésirables si la clé n’arrive pas dans quelques minutes.</p>
      </div>
      <div className="mt-4 flex gap-2 items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400"><ShieldCheck className="w-4 h-4 text-[#16A34A]" /> La validation de licence s’effectue de manière sécurisée.</div>
      <button onClick={onBack} className="mt-8 w-full py-3 bg-[#16A34A] hover:bg-[#15803D] rounded-xl text-white font-black flex items-center justify-center gap-2">Retour au tableau de bord <ArrowRight className="w-4 h-4" /></button>
    </main>
  </div>
);
