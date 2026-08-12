import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { Etablissement, Utilisateur } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: Utilisateur | null;
  schoolProfile: Etablissement | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, nomEcole: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_CONNECTION_ERROR = 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';

function isConnectionError(error: any): boolean {
  return [
    'auth/network-request-failed',
    'auth/internal-error',
    'auth/invalid-api-key',
    'auth/api-key-not-valid',
  ].includes(error?.code) || error?.message === 'TIMEOUT_EXCEEDED';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Utilisateur | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<Etablissement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (!user) {
        setCurrentUser(null);
        setUserProfile(null);
        setSchoolProfile(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      try {
        const userDocSnap = await getDoc(doc(db, 'utilisateurs', user.uid));

        if (!userDocSnap.exists()) {
          // Le compte Firebase existe mais son profil métier n'est pas encore configuré.
          // Aucun établissement ni profil fictif n'est créé automatiquement.
          setUserProfile(null);
          setSchoolProfile(null);
          setLoading(false);
          return;
        }

        const profile = userDocSnap.data() as Utilisateur;
        setUserProfile(profile);

        const schoolDocSnap = await getDoc(doc(db, 'etablissements', profile.etablissementId));
        if (!schoolDocSnap.exists()) {
          throw new Error('SCHOOL_PROFILE_MISSING');
        }

        setSchoolProfile({ id: schoolDocSnap.id, ...schoolDocSnap.data() } as Etablissement);
      } catch (error) {
        console.error('Impossible de charger le profil de session.', error);
        setUserProfile(null);
        setSchoolProfile(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const withTimeout = <T,>(promise: Promise<T>, ms = 10_000): Promise<T> =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), ms);
      promise.then(
        (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      );
    });

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await withTimeout(signInWithEmailAndPassword(auth, email.trim(), pass));
    } catch (error: any) {
      if (isConnectionError(error)) {
        throw new Error(AUTH_CONNECTION_ERROR);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, nomEcole: string) => {
    setLoading(true);
    try {
      const result = await withTimeout(createUserWithEmailAndPassword(auth, email.trim(), pass));
      const user = result.user;
      const ecoleId = `EP-${crypto.randomUUID()}`;

      const newSchool: Etablissement = {
        id: ecoleId,
        nom: nomEcole.trim(),
        codeEcole: `EP-CI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        adresse: '',
        ville: 'Abidjan',
        telephone: '',
        email: email.trim(),
        devise: 'FCFA',
      };

      const newUser: Utilisateur = {
        uid: user.uid,
        email: email.trim(),
        nom: user.displayName?.split(' ')[0] || 'Administrateur',
        prenom: user.displayName?.split(' ').slice(1).join(' ') || '',
        role: 'admin_fondateur',
        etablissementId: ecoleId,
        photoURL: user.photoURL || undefined,
      };

      await Promise.all([
        setDoc(doc(db, 'etablissements', ecoleId), newSchool),
        setDoc(doc(db, 'utilisateurs', user.uid), newUser),
      ]);

      setUserProfile(newUser);
      setSchoolProfile(newSchool);
    } catch (error: any) {
      if (isConnectionError(error)) {
        throw new Error(AUTH_CONNECTION_ERROR);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await withTimeout(signInWithPopup(auth, googleProvider));
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        throw error;
      }
      if (isConnectionError(error) || error?.code === 'auth/unauthorized-domain') {
        throw new Error(AUTH_CONNECTION_ERROR);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setSchoolProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        schoolProfile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
