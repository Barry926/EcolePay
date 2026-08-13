/** STYLE SCOLÉA — Aucun composant visuel ici ; la session alimente les écrans avec une hiérarchie de données sobre et vérifiable. */
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '@/lib/firebase';
import { SchoolProfile, UserProfile } from '@/lib/models';

type AuthValue = {
  user: User | null;
  profile: UserProfile | null;
  school: SchoolProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    if (!nextUser) {
      setProfile(null); setSchool(null); setLoading(false); return;
    }
    try {
      const profileSnap = await getDoc(doc(db, 'utilisateurs', nextUser.uid));
      if (profileSnap.exists()) {
        const nextProfile = profileSnap.data() as UserProfile;
        setProfile(nextProfile);
        const schoolSnap = await getDoc(doc(db, 'etablissements', nextProfile.etablissementId));
        setSchool(schoolSnap.exists() ? { id: schoolSnap.id, ...schoolSnap.data() } as SchoolProfile : null);
      } else {
        setProfile(null); setSchool(null);
      }
    } catch (error) {
      console.error('Profil Firebase indisponible', error);
      setProfile(null); setSchool(null);
    } finally {
      setLoading(false);
    }
  }), []);

  const createSchool = async (nextUser: User, name: string) => {
    const schoolId = `SC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const nextSchool: SchoolProfile = { id: schoolId, nom: name.trim(), codeEcole: schoolId, ville: 'Abidjan', email: nextUser.email || '', devise: 'FCFA' };
    const nextProfile: UserProfile = { uid: nextUser.uid, email: nextUser.email || '', nom: nextUser.displayName?.split(' ')[0] || 'Directeur', prenom: nextUser.displayName?.split(' ').slice(1).join(' '), role: 'directeur', etablissementId: schoolId };
    await Promise.all([setDoc(doc(db, 'etablissements', schoolId), nextSchool), setDoc(doc(db, 'utilisateurs', nextUser.uid), nextProfile)]);
    setProfile(nextProfile); setSchool(nextSchool);
  };

  const value: AuthValue = {
    user, profile, school, loading,
    login: async (email, password) => { await signInWithEmailAndPassword(auth, email.trim(), password); },
    register: async (name, email, password) => { const result = await createUserWithEmailAndPassword(auth, email.trim(), password); await createSchool(result.user, name); },
    loginWithGoogle: async () => {
      const result = await signInWithPopup(auth, googleProvider);
      const existing = await getDoc(doc(db, 'utilisateurs', result.user.uid));
      if (!existing.exists()) await createSchool(result.user, 'Mon établissement');
    },
    logout: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return value;
}

