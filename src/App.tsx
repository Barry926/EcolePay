import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';

function MainContent() {
  const { currentUser, loading, isDemoMode } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Écran de Chargement pendant l'initialisation de l'Auth Firebase
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-[#FF8200] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide animate-pulse">
          Chargement d'EcolePay...
        </p>
      </div>
    );
  }

  // Si l'utilisateur est connecté (ou en mode démo) -> Afficher le Dashboard
  if (currentUser || isDemoMode) {
    return <Dashboard />;
  }

  // Sinon -> Protection des routes : Redirection vers Login ou Register
  if (authView === 'register') {
    return <Register onSwitchToLogin={() => setAuthView('login')} />;
  }

  return <Login onSwitchToRegister={() => setAuthView('register')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
