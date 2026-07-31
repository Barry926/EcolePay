import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { Utilisateur, Etablissement } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: Utilisateur | null;
  schoolProfile: Etablissement | null;
  loading: boolean;
  isDemoMode: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, nomEcole: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loginDemoUser: (nomEcole?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Utilisateur | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<Etablissement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Synchronisation avec Firebase Auth & Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoMode(false);
        try {
          // Charger le profil utilisateur
          const userDocRef = doc(db, 'utilisateurs', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const uData = userDocSnap.data() as Utilisateur;
            setUserProfile(uData);

            // Charger l'établissement associé
            if (uData.etablissementId) {
              const schoolDocRef = doc(db, 'etablissements', uData.etablissementId);
              const schoolDocSnap = await getDoc(schoolDocRef);
              if (schoolDocSnap.exists()) {
                setSchoolProfile({ id: schoolDocSnap.id, ...schoolDocSnap.data() } as Etablissement);
              }
            }
          } else {
            // Créer un profil utilisateur par défaut si inexistant (ex: première connexion Google)
            const ecoleId = `EP-${Date.now().toString().slice(-6)}`;
            const defaultSchool: Etablissement = {
              id: ecoleId,
              nom: user.displayName ? `Groupe Scolaire ${user.displayName}` : "Collège Saint-Antoine d'Abidjan",
              codeEcole: `EP-ABJ-${Math.floor(100 + Math.random() * 900)}`,
              adresse: 'Boulevard Latrille, Cocody',
              ville: 'Abidjan',
              commune: 'Cocody',
              telephone: '+225 07 08 09 10 11',
              email: user.email || 'contact@ecolepay.ci',
              devise: 'FCFA'
            };

            const defaultUser: Utilisateur = {
              uid: user.uid,
              email: user.email || '',
              nom: user.displayName ? user.displayName.split(' ')[0] : 'Fondateur',
              prenom: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : 'Admin',
              role: 'admin_fondateur',
              etablissementId: ecoleId,
              photoURL: user.photoURL || undefined
            };

            await setDoc(doc(db, 'etablissements', ecoleId), defaultSchool);
            await setDoc(doc(db, 'utilisateurs', user.uid), defaultUser);

            setUserProfile(defaultUser);
            setSchoolProfile(defaultSchool);
          }
        } catch (err) {
          console.warn("Erreur chargement Firestore, passage profil par défaut:", err);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            nom: user.displayName || 'Directeur',
            prenom: 'Admin',
            role: 'admin_fondateur',
            etablissementId: 'EP-DEFAULT-01'
          });
          setSchoolProfile({
            id: 'EP-DEFAULT-01',
            nom: "Lycée d'Excellence d'Abidjan",
            codeEcole: 'EP-ABJ-001',
            adresse: 'Cocody Riviera 3',
            ville: 'Abidjan',
            telephone: '+225 01 02 03 04 05',
            email: user.email || 'directeur@excellence.ci',
            devise: 'FCFA'
          });
        }
      } else {
        if (!isDemoMode) {
          setCurrentUser(null);
          setUserProfile(null);
          setSchoolProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  // Connexion Email + Mot de passe
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Inscription + Création d'établissement dans Firestore
  const registerWithEmail = async (email: string, pass: string, nomEcole: string) => {
    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const user = res.user;

      const ecoleId = `EP-${Date.now().toString().slice(-6)}`;
      const newSchool: Etablissement = {
        id: ecoleId,
        nom: nomEcole,
        codeEcole: `EP-CI-${Math.floor(100 + Math.random() * 900)}`,
        adresse: 'Avenue Chardy, Plateau',
        ville: 'Abidjan',
        telephone: '+225 07 00 00 00 00',
        email: email,
        devise: 'FCFA'
      };

      const newUser: Utilisateur = {
        uid: user.uid,
        email: email,
        nom: 'Directeur',
        prenom: nomEcole,
        role: 'admin_fondateur',
        etablissementId: ecoleId
      };

      // Sauvegarde dans Firestore
      try {
        await setDoc(doc(db, 'etablissements', ecoleId), newSchool);
        await setDoc(doc(db, 'utilisateurs', user.uid), newUser);
      } catch (firestoreErr) {
        console.warn("Notice: Firestore non configuré ou règles strictes:", firestoreErr);
      }

      setUserProfile(newUser);
      setSchoolProfile(newSchool);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Connexion Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setIsDemoMode(false);
      setCurrentUser(null);
      setUserProfile(null);
      setSchoolProfile(null);
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mode Démo Rapide (pour tester l'interface même sans clés API réelles)
  const loginDemoUser = (nomEcole: string = "Groupe Scolaire Sainte-Marie d'Abidjan") => {
    setIsDemoMode(true);
    const demoUid = 'demo-uid-ecolepay-2026';
    const fakeUser = {
      uid: demoUid,
      email: 'fondateur@saintemarie.ci',
      displayName: 'Directeur Kouadio'
    } as User;

    const fakeSchool: Etablissement = {
      id: 'EP-ABJ-101',
      nom: nomEcole,
      codeEcole: 'EP-ABJ-101',
      adresse: 'Riviera 2, Boulevard Mitterrand',
      ville: 'Abidjan',
      commune: 'Cocody',
      telephone: '+225 07 48 29 10 00',
      email: 'fondateur@saintemarie.ci',
      devise: 'FCFA'
    };

    const fakeProfile: Utilisateur = {
      uid: demoUid,
      email: 'fondateur@saintemarie.ci',
      nom: 'Kouadio',
      prenom: 'Jean-Baptiste',
      role: 'admin_fondateur',
      etablissementId: fakeSchool.id
    };

    setCurrentUser(fakeUser);
    setUserProfile(fakeProfile);
    setSchoolProfile(fakeSchool);
    setLoading(false);
  };

  const value = {
    currentUser,
    userProfile,
    schoolProfile,
    loading,
    isDemoMode,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    loginDemoUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
