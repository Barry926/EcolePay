import React, { useState } from 'react';
import { ArrowLeft, Check, CreditCard, LoaderCircle, ShieldCheck, Smartphone } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

type PlanId = 'starter' | 'standard' | 'premium';

const PLANS: Array<{ id: PlanId; nom: string; prix: string; limite: string; atouts: string[]; populaire?: boolean }> = [
  { id: 'starter', nom: 'Starter', prix: '15 000', limite: "Jusqu'à 100 élèves", atouts: ['Reçus PDF', 'Suivi des paiements', 'Rappels WhatsApp'] },
  { id: 'standard', nom: 'Standard', prix: '25 000', limite: "Jusqu'à 300 élèves", atouts: ['Tout Starter', 'Statistiques avancées', 'Support prioritaire'], populaire: true },
  { id: 'premium', nom: 'Premium', prix: '40 000', limite: 'Élèves illimités', atouts: ['Tout Standard', 'Accompagnement dédié', 'Rapports consolidés'] },
];

interface AbonnementProps {
  schoolId?: string;
  initialEmail?: string;
  onBack: () => void;
}

export const Abonnement: React.FC<AbonnementProps> = ({ schoolId, initialEmail = '', onBack }) => {
  const [plan, setPlan] = useState<PlanId>('standard');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Veuillez renseigner tous les champs pour poursuivre le paiement.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, firstName, lastName, email, phone, schoolId }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || 'Impossible de démarrer le paiement. Réessayez plus tard.');
        return;
      }

      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      if (result.completed) {
        window.location.assign('/abonnement/succes');
        return;
      }

      setError('La session de paiement est indisponible. Réessayez plus tard.');
    } catch {
      setError('Erreur de connexion. Vérifiez votre accès internet et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#16A34A] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
          </button>
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-[#16A34A] text-white font-black flex items-center justify-center">EP</span>
            <span className="font-black tracking-tight">EcolePay <span className="text-[#16A34A]">CI</span></span>
            <ThemeToggle variant="inline" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 lg:py-14">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-[#15803D] dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Paiement Mobile Money sécurisé
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight">Abonnement EcolePay CI</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Choisissez le niveau d’accompagnement adapté à votre établissement. Vous serez redirigé vers une page de paiement sécurisée.</p>
        </div>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPlan(item.id)}
              className={`text-left relative rounded-2xl border p-6 transition-all ${plan === item.id ? 'border-[#16A34A] ring-2 ring-emerald-500/20 bg-white dark:bg-[#1E293B] shadow-lg' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:border-emerald-300'}`}
            >
              {item.populaire && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-wider">Le plus choisi</span>}
              <p className="font-black text-lg">{item.nom}</p>
              <p className="mt-2 text-3xl font-black text-[#16A34A]">{item.prix} <span className="text-sm text-slate-500 dark:text-slate-400">FCFA/mois</span></p>
              <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">{item.limite}</p>
              <ul className="mt-5 space-y-2.5">
                {item.atouts.map((atout) => <li key={atout} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200"><Check className="w-4 h-4 text-[#16A34A] shrink-0" /> {atout}</li>)}
              </ul>
            </button>
          ))}
        </section>

        <section className="mt-10 max-w-2xl mx-auto bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-[#16A34A]"><CreditCard className="w-5 h-5" /></div>
            <div><h2 className="font-black">Finaliser mon abonnement</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Le plan {PLANS.find((item) => item.id === plan)?.nom} est sélectionné.</p></div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} required className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} required className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]" /></label>
            </div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Email professionnel<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]" /></label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Téléphone Mobile Money<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 00 00 00 00" required className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]" /></label>

            {error && <p role="alert" className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}

            <button disabled={loading} type="submit" className="w-full mt-2 px-5 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><LoaderCircle className="w-5 h-5 animate-spin" /> Redirection vers le paiement…</> : <><Smartphone className="w-5 h-5" /> Payer avec Mobile Money</>}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};
