import React, { useEffect, useState } from 'react';
import {
  GraduationCap, CreditCard, FileText, MessageSquare, LayoutDashboard, Users,
  ShieldCheck, Check, ArrowRight, Menu, X, Star, Sparkles, TrendingUp,
  Smartphone, Wallet, ChevronDown, Zap, Clock, BellRing, Building2
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

const useReveal = () => {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

const NAV = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  { icon: Users, title: 'Gestion des élèves', desc: "Répertoire complet par classe et cycle, du préscolaire à la Terminale. Suivi du solde de scolarité en temps réel." },
  { icon: Smartphone, title: 'Paiements enregistrés', desc: 'Enregistrez les règlements reçus en espèces, Wave, Orange Money, MTN MoMo, Moov Money, virement ou autre moyen.' },
  { icon: FileText, title: 'Reçus PDF officiels', desc: "Générez un reçu de scolarité professionnel en un clic, avec le cachet et les informations de l'établissement." },
  { icon: MessageSquare, title: 'Rappels WhatsApp', desc: 'Relancez les parents des élèves en impayé avec un message WhatsApp pré-rempli, directement depuis la fiche.' },
  { icon: LayoutDashboard, title: 'Tableau de bord', desc: "Visualisez l'encaissé, les impayés et le recouvrement par cycle avec des graphiques clairs et instantanés." },
  { icon: ShieldCheck, title: 'Multi-utilisateurs sécurisé', desc: 'Créez des comptes secrétariat / caisse avec des droits contrôlés. Données synchronisées et sauvegardées.' },
];

const STEPS = [
  { n: '01', title: 'Créez votre école', desc: "Inscrivez votre établissement, configurez vos classes et vos tranches de scolarité en quelques minutes." },
  { n: '02', title: 'Enregistrez les règlements', desc: 'Saisissez les montants réellement reçus, quel que soit le moyen utilisé. Le solde de chaque élève se met à jour automatiquement.' },
  { n: '03', title: 'Éditez reçus & relances', desc: 'Téléchargez les reçus PDF et relancez les impayés par WhatsApp. Tout est centralisé et traçable.' },
];

const PLANS = [
  {
    name: 'Découverte', price: '0', period: 'Gratuit', highlight: false,
    desc: "Pour tester la plateforme et démarrer.",
    features: ['Jusqu\u2019à 50 élèves', 'Paiements Mobile Money & espèces', 'Reçus PDF illimités', 'Tableau de bord'],
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Établissement', price: '15 000', period: '/ mois', highlight: true,
    desc: "La solution complète pour les écoles privées.",
    features: ['Élèves illimités', 'Rappels WhatsApp', 'Comptes secrétariat multiples', 'Statistiques avancées', 'Support prioritaire'],
    cta: 'Choisir ce plan',
  },
  {
    name: 'Groupe scolaire', price: 'Sur devis', period: '', highlight: false,
    desc: "Pour les réseaux et groupes multi-sites.",
    features: ['Multi-établissements', 'Rapports consolidés', 'Accompagnement dédié', 'Formation du personnel'],
    cta: 'Nous contacter',
  },
];

const FAQS = [
  { q: 'EcolePay CI fonctionne-t-il avec Wave et Orange Money ?', a: 'Oui. Vous enregistrez les règlements réellement reçus via Wave, Orange Money, MTN MoMo, Moov Money, virement, espèces ou autre moyen. EcolePay ne lance pas le paiement des frais scolaires des parents.' },
  { q: 'Les reçus sont-ils officiels ?', a: 'Chaque paiement génère un reçu PDF professionnel reprenant les informations de votre établissement (nom, code MENA, adresse), l\u2019élève, la tranche et le mode de règlement.' },
  { q: 'Puis-je gérer plusieurs secrétaires ?', a: 'Oui. Depuis les paramètres, vous ajoutez des comptes secrétariat / caisse et gérez leurs accès. Chaque encaissement indique l\u2019agent responsable.' },
  { q: 'Mes données sont-elles en sécurité ?', a: 'Vos données sont synchronisées et sauvegardées en continu. Vous restez propriétaire de l\u2019ensemble des informations de votre école.' },
  { q: 'Comment relancer les parents en impayé ?', a: 'Depuis la liste des élèves, un bouton « Rappel WhatsApp » ouvre un message pré-rempli et courtois à envoyer au tuteur, en un clic.' },
];

const CLASSROOM_IMG = 'https://images.unsplash.com/photo-1632215861513-130b66fe97f4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
const DIRECTOR_IMG = 'https://images.unsplash.com/photo-1637684666587-91e51b10a555?crop=entropy&cs=srgb&fm=jpg&q=85&w=400';

export const Landing: React.FC<LandingProps> = ({ onLogin, onRegister }) => {
  useReveal();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500/20 overflow-x-hidden">

      {/* ============ NAV ============ */}
      <header
        data-testid="landing-header"
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2.5 cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/30">EP</div>
            <span className="text-xl font-black tracking-tight">EcolePay <span className="text-[#16A34A]">CI</span></span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <button key={n.href} onClick={() => goTo(n.href)} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#16A34A] dark:hover:text-[#16A34A] transition-colors cursor-pointer">
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button onClick={onLogin} data-testid="nav-login-btn" className="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-[#16A34A] transition-colors cursor-pointer">
              Se connecter
            </button>
            <button onClick={onRegister} data-testid="nav-register-btn" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-lg shadow-md shadow-emerald-500/25 transition-all hover:-translate-y-0.5 cursor-pointer">
              Commencer <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center cursor-pointer" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-1 animate-fadeIn">
            {NAV.map((n) => (
              <button key={n.href} onClick={() => goTo(n.href)} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                {n.label}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={onLogin} className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">Se connecter</button>
              <button onClick={onRegister} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#16A34A] rounded-lg cursor-pointer">Commencer</button>
            </div>
          </div>
        )}
      </header>

      {/* ============ HERO ============ */}
      <section id="top" className="relative pt-28 sm:pt-36 pb-16 sm:pb-24">
        {/* decor */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-20 w-[32rem] h-[32rem] rounded-full bg-[#16A34A]/15 blur-[130px]" />
          <div className="absolute top-10 right-0 w-[28rem] h-[28rem] rounded-full bg-emerald-400/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25]" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="animate-riseIn">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Conçu pour les écoles privées de Côte d'Ivoire 🇨🇮
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              La gestion des <span className="text-[#16A34A]">frais scolaires</span>, enfin simple.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              EcolePay CI centralise vos élèves, enregistre les règlements réellement reçus, calcule les soldes et facilite les relances WhatsApp. Aucun parent ne paie ses frais scolaires sur la plateforme.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={onRegister} data-testid="hero-register-btn" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 cursor-pointer">
                Créer mon école gratuitement <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onLogin} data-testid="hero-demo-btn" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer">
                <Zap className="w-4 h-4 text-[#16A34A]" /> Se connecter
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#16A34A]" /> Sans engagement</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#16A34A]" /> Prêt en 5 min</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#16A34A]" /> Support en français</span>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative animate-riseIn" style={{ animationDelay: '0.15s' }}>
            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 p-4 sm:p-5">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] font-bold text-slate-400">Tableau de bord — EcolePay CI</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Encaissé', v: '12,8M', c: 'text-emerald-600' },
                  { l: 'Impayés', v: '3,4M', c: 'text-rose-500' },
                  { l: 'Élèves', v: '412', c: 'text-slate-900 dark:text-slate-50' },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400">{s.l}</div>
                    <div className={`text-lg font-black ${s.c}`}>{s.v}<span className="text-[10px] font-semibold text-slate-400 ml-0.5">FCFA</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                <div className="flex items-end gap-2 h-24">
                  {[45, 68, 52, 80, 62, 90, 74].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#16A34A] to-emerald-400" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { n: 'Kouassi Marc-Antoine', c: 'Tle A1', m: 'Wave', s: 'Payé' },
                  { n: 'Diabaté Fatoumata', c: '6ème C', m: 'Orange', s: 'Payé' },
                  { n: 'Yao Marie-Ange', c: '3ème 1', m: 'MTN', s: 'Partiel' },
                ].map((r) => (
                  <div key={r.n} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{r.n}</div>
                      <div className="text-[10px] text-slate-400">{r.c} · {r.m}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.s === 'Payé' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>{r.s}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* floating badges */}
            <div className="hidden sm:flex absolute -left-6 top-16 animate-floaty items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl px-3.5 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-[#25D366]" /></div>
              <div><div className="text-[10px] text-slate-400 font-bold">Rappel envoyé</div><div className="text-xs font-black">WhatsApp ✓</div></div>
            </div>
            <div className="hidden sm:flex absolute -right-4 bottom-10 animate-floaty items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl px-3.5 py-2.5" style={{ animationDelay: '1.2s' }}>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><FileText className="w-4 h-4 text-[#16A34A]" /></div>
              <div><div className="text-[10px] text-slate-400 font-bold">Reçu généré</div><div className="text-xs font-black">REC-2026-0042</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST / PAYMENT METHODS ============ */}
      <section className="py-8 border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Enregistrez tous les moyens de règlement utilisés par votre école</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              { n: 'Wave', c: 'text-sky-500' },
              { n: 'Orange Money', c: 'text-orange-500' },
              { n: 'MTN MoMo', c: 'text-amber-500' },
              { n: 'Moov Money', c: 'text-blue-500' },
              { n: 'Espèces', c: 'text-emerald-500' },
            ].map((p) => (
              <div key={p.n} className="flex items-center gap-2 text-base font-black text-slate-500 dark:text-slate-400">
                <Wallet className={`w-5 h-5 ${p.c}`} /> {p.n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center reveal">
            <span className="text-sm font-bold text-[#16A34A] uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Tout ce qu'il faut pour piloter la scolarité</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Une plateforme pensée avec et pour les fondateurs, directeurs et secrétaires d'écoles privées.</p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="reveal group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] p-6 card-hover hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-500/40" style={{ transitionDelay: `${i * 40}ms` }}>
                <div className="h-12 w-12 rounded-xl bg-[#DCFCE7] dark:bg-emerald-500/10 flex items-center justify-center text-[#16A34A] group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-lg font-black">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="py-20 sm:py-28 bg-white dark:bg-[#0B1120]/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center reveal">
            <span className="text-sm font-bold text-[#16A34A] uppercase tracking-wider">Comment ça marche</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Opérationnel en trois étapes</h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="reveal relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#F9FAFB] dark:bg-[#1E293B] p-7" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-5xl font-black text-emerald-500/20 dark:text-emerald-500/25">{s.n}</div>
                <h3 className="mt-2 text-xl font-black">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 text-emerald-400/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS BAND ============ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal rounded-3xl bg-[#0F172A] dark:bg-[#1E293B] border border-slate-800 dark:border-slate-700 overflow-hidden relative">
            <div className="pointer-events-none absolute -top-20 -right-16 w-80 h-80 rounded-full bg-[#16A34A]/25 blur-[110px]" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 p-10 sm:p-14 text-center">
              {[
                  { v: '1 clic', l: 'pour enregistrer un règlement' },
                  { v: '0 calcul', l: 'de solde à faire à la main' },
                  { v: '1 fiche', l: 'complète par élève' },
                  { v: 'Mobile', l: 'adapté au terrain' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl sm:text-4xl font-black text-white">{s.v}</div>
                  <div className="mt-2 text-xs sm:text-sm font-semibold text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTEXT / BENEFITS ============ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal relative">
            <div className="absolute -inset-3 rounded-3xl bg-[#16A34A]/10 blur-2xl" />
            <img src={CLASSROOM_IMG} alt="Salle de classe en Côte d'Ivoire" loading="lazy" className="relative rounded-3xl object-cover w-full h-[380px] sm:h-[460px] border border-slate-200 dark:border-slate-700 shadow-2xl" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3 shadow-xl">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-[#16A34A]" /></div>
              <div><div className="text-xs font-bold text-slate-500 dark:text-slate-400">Taux de recouvrement</div><div className="text-base font-black">+38% en moyenne</div></div>
            </div>
          </div>

          <div className="reveal">
            <span className="text-sm font-bold text-[#16A34A] uppercase tracking-wider">Pourquoi EcolePay CI</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Moins d'administratif, plus de recouvrement</h2>
            <div className="mt-8 space-y-5">
              {[
                  { icon: Clock, t: 'Gagnez des heures chaque semaine', d: 'Fini les cahiers et tableurs. Chaque règlement reçu met à jour le solde de l’élève instantanément.' },
                { icon: BellRing, t: 'Relancez sans effort', d: 'Identifiez les impayés en un coup d\u2019œil et envoyez des rappels WhatsApp personnalisés.' },
                { icon: ShieldCheck, t: 'Transparence totale', d: 'Chaque reçu est numéroté et daté, avec l\u2019agent caissier. Une traçabilité irréprochable.' },
              ].map((b) => (
                <div key={b.t} className="flex gap-4">
                  <div className="shrink-0 h-11 w-11 rounded-xl bg-[#DCFCE7] dark:bg-emerald-500/10 flex items-center justify-center text-[#16A34A]"><b.icon className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-black">{b.t}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIAL ============ */}
      <section className="py-8 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] p-8 sm:p-12 text-center">
            <div className="flex justify-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-xl sm:text-2xl font-bold leading-snug">
              « EcolePay CI nous permet de savoir immédiatement qui a payé, ce qu’il reste à recouvrer et quels parents relancer. »
            </blockquote>
            <div className="mt-7 flex items-center justify-center gap-3">
              <img src={DIRECTOR_IMG} alt="Directeur" loading="lazy" className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500/30" />
              <div className="text-left">
                <div className="font-black text-sm">M. Kouadio Jean-Baptiste</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Fondateur, Groupe Scolaire Sainte-Marie · Abidjan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center reveal">
            <span className="text-sm font-bold text-[#16A34A] uppercase tracking-wider">Tarifs</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Des prix clairs, adaptés à votre école</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Commencez gratuitement, évoluez quand vous voulez.</p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div key={p.name} className={`reveal relative rounded-2xl p-7 border ${p.highlight ? 'border-[#16A34A] bg-white dark:bg-[#1E293B] shadow-2xl shadow-emerald-500/10 md:-translate-y-3' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B]'}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#16A34A] text-white text-[11px] font-black uppercase tracking-wider shadow-lg">Le plus choisi</div>
                )}
                <h3 className="text-lg font-black">{p.name}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.desc}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className="mb-1.5 text-sm font-semibold text-slate-400">{p.period || (p.price !== 'Sur devis' ? 'FCFA' : '')}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                      <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-[#DCFCE7] dark:bg-emerald-500/15 flex items-center justify-center"><Check className="w-3 h-3 text-[#16A34A]" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onRegister} className={`mt-7 w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${p.highlight ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5' : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="py-20 sm:py-28 bg-white dark:bg-[#0B1120]/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center reveal">
            <span className="text-sm font-bold text-[#16A34A] uppercase tracking-wider">FAQ</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Questions fréquentes</h2>
          </div>
          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="reveal rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#F9FAFB] dark:bg-[#1E293B] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer">
                  <span className="font-bold text-sm sm:text-base">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 shrink-0 text-[#16A34A] transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal relative rounded-3xl bg-[#16A34A] overflow-hidden text-center px-6 py-14 sm:py-20 shadow-2xl shadow-emerald-500/20">
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative">
              <GraduationCap className="w-12 h-12 mx-auto text-white/90" />
              <h2 className="mt-5 text-3xl sm:text-4xl font-black text-white tracking-tight">Prêt à moderniser votre école ?</h2>
              <p className="mt-4 text-white/90 max-w-xl mx-auto">Rejoignez les établissements qui ont simplifié leur gestion des frais scolaires avec EcolePay CI.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={onRegister} data-testid="cta-register-btn" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-[#16A34A] bg-white hover:bg-emerald-50 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                  Commencer gratuitement <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={onLogin} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl transition-all cursor-pointer">
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white font-black text-lg">EP</div>
              <span className="text-xl font-black tracking-tight">EcolePay <span className="text-[#16A34A]">CI</span></span>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">SaaS de gestion des frais scolaires pour les écoles privées de Côte d'Ivoire.</p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Produit</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li><button onClick={() => goTo('#features')} className="hover:text-[#16A34A] cursor-pointer">Fonctionnalités</button></li>
              <li><button onClick={() => goTo('#pricing')} className="hover:text-[#16A34A] cursor-pointer">Tarifs</button></li>
              <li><button onClick={onLogin} className="hover:text-[#16A34A] cursor-pointer">Se connecter</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Entreprise</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Abidjan, Côte d'Ivoire</li>
              <li><button onClick={() => goTo('#faq')} className="hover:text-[#16A34A] cursor-pointer">FAQ</button></li>
              <li><a href="mailto:contact@ecolepay.ci" className="hover:text-[#16A34A]">contact@ecolepay.ci</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Commencer</h4>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={onLogin} className="px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Se connecter</button>
              <button onClick={onRegister} className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] cursor-pointer">Créer mon école</button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} EcolePay CI. Tous droits réservés.</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Plateforme sécurisée pour établissements privés</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
