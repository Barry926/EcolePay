import React from 'react';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  onBack: () => void;
  pageName?: string;
}

interface PageErrorBoundaryState {
  error: Error | null;
}

export class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  declare props: Readonly<PageErrorBoundaryProps>;
  state: PageErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`Erreur de rendu dans ${this.props.pageName || 'la page'}.`, { message: error.message, stack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center p-5 text-slate-900 dark:text-slate-100">
        <section className="w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#1E293B] p-7 shadow-xl text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-black flex items-center justify-center text-xl">!</div>
          <h1 className="mt-5 text-xl font-black">La page n’a pas pu s’ouvrir.</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Aucune donnée ni aucun paiement n’a été enregistré. Vous pouvez revenir à votre tableau de bord et réessayer.</p>
          <button onClick={this.props.onBack} className="mt-6 w-full rounded-xl bg-[#16A34A] hover:bg-[#15803D] py-3 text-sm font-black text-white">Retour au tableau de bord</button>
          <p className="mt-4 break-words text-[11px] text-slate-400">Référence technique : {this.state.error.message || 'erreur de rendu'}</p>
        </section>
      </main>
    );
  }
}
