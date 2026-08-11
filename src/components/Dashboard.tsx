import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserCheck, 
  Printer, 
  Calendar, 
  Smartphone, 
  DollarSign, 
  X, 
  ChevronRight, 
  Filter, 
  PieChart as PieChartIcon, 
  Sparkles,
  ShieldCheck,
  Eye,
  Trash2,
  Phone,
  User,
  Check,
  FileText,
  MessageSquare,
  Download,
  Send,
  UserCheck2,
  Wallet,
  Menu
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from './Toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Paiement, Eleve, ModePaiement } from '../types';
import { generatePaymentReceiptPDF, getWhatsAppReminderUrl } from '../utils/pdfGenerator';
import { SchoolSettingsView } from './SchoolSettingsView';

export const Dashboard: React.FC = () => {
  const { currentUser, userProfile, schoolProfile, logout, isDemoMode } = useAuth();
  const { notify } = useToast();

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'eleves' | 'paiements' | 'parametres'>('overview');
  // Sidebar mobile (hamburger)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Recherche & Filtres Globaux
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasseFilter, setSelectedClasseFilter] = useState('Toutes');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'Tous' | 'Payé' | 'Partiel' | 'Impayé'>('Tous');
  const [selectedModeFilter, setSelectedModeFilter] = useState('Tous');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'Toutes' | "Aujourd'hui" | 'Ce mois'>('Toutes');

  // Modals state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Paiement | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Eleve | null>(null);

  // Formulaire Enregistrer un Paiement
  const [pStudentSearch, setPStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [pSelectedStudent, setPSelectedStudent] = useState<Eleve | null>(null);
  const [pNomEleve, setPNomEleve] = useState('');
  const [pClasse, setPClasse] = useState('6ème A');
  const [pMontant, setPMontant] = useState('');
  const [pMode, setPMode] = useState<ModePaiement>('Wave');
  const [pTranche, setPTranche] = useState('2ème Tranche');
  const [pRef, setPRef] = useState('');
  const [pCaissier, setPCaissier] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);

  // Formulaire Nouvel Élève (Inscrire un élève)
  const [eNomComplet, setENomComplet] = useState('');
  const [eClasse, setEClasse] = useState('6ème A');
  const [eTelTuteur, setETelTuteur] = useState('');
  const [eNomTuteur, setENomTuteur] = useState('');
  const [eMontantTotal, setEMontantTotal] = useState('250000');

  // Nom du caissier / directeur connecté
  const directeurNomComplete = userProfile 
    ? `${userProfile.nom} ${userProfile.prenom}`.trim()
    : (currentUser?.displayName || 'Caisse Secrétariat');

  useEffect(() => {
    if (directeurNomComplete && !pCaissier) {
      setPCaissier(directeurNomComplete);
    }
  }, [directeurNomComplete]);

  // Liste exhaustive des classes scolaires de Côte d'Ivoire
  const listClassesDisponibles = [
    'Maternelle Petite Section',
    'Maternelle Moyenne Section',
    'Maternelle Grande Section',
    'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème A', '6ème B', '6ème C',
    '5ème 1', '5ème 2',
    '4ème 1', '4ème 2',
    '3ème 1', '3ème 2',
    '2nde A', '2nde C',
    '1ère A', '1ère D1', '1ère D2',
    'Terminale A1', 'Terminale A2', 'Terminale D', 'Terminale C'
  ];

  // Liste initiale d'élèves de démonstration
  const initialEleves: Eleve[] = [
    {
      id: 'EL-001',
      matricule: '26-ABJ-101',
      nom: 'Kouassi',
      prenoms: 'Marc-Antoine',
      classe: 'Terminale A1',
      cycle: 'Secondaire Second Cycle',
      genre: 'M',
      nomTuteur: 'Kouassi Jean',
      telTuteur: '+225 07 08 09 10 11',
      montantTotalScolarite: 350000,
      montantPaye: 250000,
      soldeRestant: 100000,
      estEnRegle: false,
      createdAt: '2026-01-15'
    },
    {
      id: 'EL-002',
      matricule: '26-ABJ-102',
      nom: 'Diabaté',
      prenoms: 'Fatoumata',
      classe: '6ème C',
      cycle: 'Secondaire Premier Cycle',
      genre: 'F',
      nomTuteur: 'Diabaté Ibrahim',
      telTuteur: '+225 05 44 33 22 11',
      montantTotalScolarite: 250000,
      montantPaye: 250000,
      soldeRestant: 0,
      estEnRegle: true,
      createdAt: '2026-01-16'
    },
    {
      id: 'EL-003',
      matricule: '26-ABJ-103',
      nom: 'Yao',
      prenoms: 'Marie-Ange',
      classe: '3ème 1',
      cycle: 'Secondaire Premier Cycle',
      genre: 'F',
      nomTuteur: 'Yao Patricia',
      telTuteur: '+225 07 55 66 77 88',
      montantTotalScolarite: 280000,
      montantPaye: 140000,
      soldeRestant: 140000,
      estEnRegle: false,
      createdAt: '2026-01-18'
    },
    {
      id: 'EL-004',
      matricule: '26-ABJ-104',
      nom: 'Bakayoko',
      prenoms: 'Moussa',
      classe: '1ère D2',
      cycle: 'Secondaire Second Cycle',
      genre: 'M',
      nomTuteur: 'Bakayoko Amadou',
      telTuteur: '+225 01 02 03 04 05',
      montantTotalScolarite: 320000,
      montantPaye: 320000,
      soldeRestant: 0,
      estEnRegle: true,
      createdAt: '2026-01-20'
    },
    {
      id: 'EL-005',
      matricule: '26-ABJ-105',
      nom: 'Gnamien',
      prenoms: 'Koffi Emmanuel',
      classe: '4ème 2',
      cycle: 'Secondaire Premier Cycle',
      genre: 'M',
      nomTuteur: 'Gnamien Paul',
      telTuteur: '+225 07 11 22 33 44',
      montantTotalScolarite: 250000,
      montantPaye: 0,
      soldeRestant: 250000,
      estEnRegle: false,
      createdAt: '2026-01-22'
    },
    {
      id: 'EL-006',
      matricule: '26-ABJ-106',
      nom: 'Koné',
      prenoms: 'Awa Sephora',
      classe: 'CM2',
      cycle: 'Primaire',
      genre: 'F',
      nomTuteur: 'Koné Sekou',
      telTuteur: '+225 05 99 88 77 66',
      montantTotalScolarite: 180000,
      montantPaye: 180000,
      soldeRestant: 0,
      estEnRegle: true,
      createdAt: '2026-01-25'
    }
  ];

  // Liste initiale de paiements
  const initialPaiements: (Paiement & { caissierNom?: string })[] = [
    {
      id: 'PAY-2026-001',
      eleveId: 'EL-001',
      matriculeEleve: '26-ABJ-101',
      nomEleveComplete: 'Kouassi Marc-Antoine',
      classe: 'Terminale A1',
      montant: 75000,
      modePaiement: 'Orange Money',
      referenceTransaction: 'OM-CI-98214',
      numeroRecu: 'REC-2026-0012',
      datePaiement: "Aujourd'hui, 14:20",
      statut: 'Validé',
      libelleTranche: '2ème Tranche',
      effectueParUid: currentUser?.uid || 'admin-1',
      caissierNom: 'Kouadio Jean (Comptable)'
    },
    {
      id: 'PAY-2026-002',
      eleveId: 'EL-002',
      matriculeEleve: '26-ABJ-102',
      nomEleveComplete: 'Diabaté Fatoumata',
      classe: '6ème C',
      montant: 120000,
      modePaiement: 'Wave',
      referenceTransaction: 'WAVE-CI-77391',
      numeroRecu: 'REC-2026-0011',
      datePaiement: "Aujourd'hui, 10:45",
      statut: 'Validé',
      libelleTranche: '1ère Tranche',
      effectueParUid: currentUser?.uid || 'admin-1',
      caissierNom: 'Kouadio Jean (Comptable)'
    },
    {
      id: 'PAY-2026-003',
      eleveId: 'EL-003',
      matriculeEleve: '26-ABJ-103',
      nomEleveComplete: 'Yao Marie-Ange',
      classe: '3ème 1',
      montant: 45000,
      modePaiement: 'MTN MoMo',
      referenceTransaction: 'MTN-88421',
      numeroRecu: 'REC-2026-0010',
      datePaiement: 'Hier, 16:30',
      statut: 'Validé',
      libelleTranche: 'Acompte Frais Annexes',
      effectueParUid: currentUser?.uid || 'admin-1',
      caissierNom: 'Secrétariat Caisse'
    },
    {
      id: 'PAY-2026-004',
      eleveId: 'EL-004',
      matriculeEleve: '26-ABJ-104',
      nomEleveComplete: 'Bakayoko Moussa',
      classe: '1ère D2',
      montant: 150000,
      modePaiement: 'Moov Money',
      referenceTransaction: 'MOOV-99212',
      numeroRecu: 'REC-2026-0009',
      datePaiement: '28 Jul 2026',
      statut: 'Validé',
      libelleTranche: 'Solde Inscription',
      effectueParUid: currentUser?.uid || 'admin-1',
      caissierNom: 'Secrétariat Caisse'
    }
  ];

  const [eleves, setEleves] = useState<Eleve[]>(initialEleves);
  const [paiements, setPaiements] = useState<(Paiement & { caissierNom?: string })[]>(initialPaiements);

  // Synchronisation Firestore en temps réel
  useEffect(() => {
    if (!db || isDemoMode) return;

    try {
      const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
      
      if (etablissementId) {
        // Synchronisation des paiements
        const qPaiements = query(collection(db, 'paiements'), where('etablissementId', '==', etablissementId));
        const unsubscribePaiements = onSnapshot(qPaiements, (snapshot) => {
          if (!snapshot.empty) {
            const list: (Paiement & { caissierNom?: string })[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as any);
            });
            setPaiements(list);
          }
        }, (err) => {
          console.warn("Notice: Sync Firestore paiements fallback locale:", err);
        });

        // Synchronisation des élèves
        const qEleves = query(collection(db, 'eleves'), where('etablissementId', '==', etablissementId));
        const unsubscribeEleves = onSnapshot(qEleves, (snapshot) => {
          if (!snapshot.empty) {
            const list: Eleve[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Eleve);
            });
            setEleves(list);
          }
        }, (err) => {
          console.warn("Notice: Sync Firestore eleves fallback locale:", err);
        });

        return () => {
          unsubscribePaiements();
          unsubscribeEleves();
        };
      }
    } catch (e) {
      console.warn("Erreur d'écoute Firestore temps réel:", e);
    }
  }, [schoolProfile, userProfile, isDemoMode]);

  // Formater la date du jour en Français
  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const dateFormattedDisplay = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Calculs financiers et statistiques globaux
  const totalFraisAttendus = eleves.reduce((acc, el) => acc + (el.montantTotalScolarite || 0), 0);
  const totalEncaisse = paiements.reduce((acc, p) => acc + (p.montant || 0), 0);
  const totalImpayes = Math.max(0, totalFraisAttendus - totalEncaisse);
  const nombreElevesTotal = eleves.length;

  // Calcul du statut de paiement pour un élève
  const getStatutPaiement = (el: Eleve): 'Payé' | 'Partiel' | 'Impayé' => {
    if (el.soldeRestant <= 0 || (el.montantPaye && el.montantPaye >= el.montantTotalScolarite)) {
      return 'Payé';
    }
    if (el.montantPaye && el.montantPaye > 0) {
      return 'Partiel';
    }
    return 'Impayé';
  };

  // Déterminer le cycle d'enseignement selon la classe
  const getCycleFromClasse = (c: string): Eleve['cycle'] => {
    if (c.includes('Maternelle') || c.includes('Section')) return 'Maternelle';
    if (c.includes('CP') || c.includes('CE') || c.includes('CM')) return 'Primaire';
    if (c.includes('6ème') || c.includes('5ème') || c.includes('4ème') || c.includes('3ème')) return 'Secondaire Premier Cycle';
    return 'Secondaire Second Cycle';
  };

  // Compteurs par statut d'élève
  const countPaye = eleves.filter(el => getStatutPaiement(el) === 'Payé').length;
  const countPartiel = eleves.filter(el => getStatutPaiement(el) === 'Partiel').length;
  const countImpaye = eleves.filter(el => getStatutPaiement(el) === 'Impayé').length;

  // 5 Derniers Paiements
  const derniersCinqPaiements = paiements.slice(0, 5);

  // Données pour le Graphique Encaissé vs Impayé ce mois
  const chartDataParCycle = [
    { name: 'Maternelle', Encaissé: 4500000, Impayé: 1200000 },
    { name: 'Primaire', Encaissé: 12800000, Impayé: 3400000 },
    { name: 'Collège (1er C.)', Encaissé: 18200000, Impayé: 7100000 },
    { name: 'Lycée (2nd C.)', Encaissé: 10750000, Impayé: 6800000 }
  ];

  // Soumission d'un nouvel Élève (Formulaire "Inscrire un élève")
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eNomComplet) return;

    const mTotal = Number(eMontantTotal) || 0;
    const etablissementId = schoolProfile?.id || 'EP-ABJ-101';
    const newMatricule = `26-ABJ-${Math.floor(100 + Math.random() * 900)}`;

    const parts = eNomComplet.trim().split(' ');
    const nomPart = parts[0] || eNomComplet;
    const prenomsPart = parts.slice(1).join(' ') || '';

    const newStudentData: Omit<Eleve, 'id'> & { etablissementId: string } = {
      matricule: newMatricule,
      nom: nomPart,
      prenoms: prenomsPart,
      classe: eClasse,
      cycle: getCycleFromClasse(eClasse),
      genre: 'M',
      nomTuteur: eNomTuteur || 'Tuteur Légal',
      telTuteur: eTelTuteur || '+225 07 00 00 00 00',
      montantTotalScolarite: mTotal,
      montantPaye: 0,
      soldeRestant: mTotal,
      estEnRegle: false,
      createdAt: new Date().toISOString().split('T')[0],
      etablissementId
    };

    let createdId = `EL-${Date.now()}`;

    if (!isDemoMode && db) {
      try {
        const docRef = await addDoc(collection(db, 'eleves'), {
          ...newStudentData,
          createdAt: serverTimestamp()
        });
        createdId = docRef.id;
      } catch (err) {
        console.warn("Notice: Firestore addDoc eleve failed, local update only:", err);
      }
    }

    const createdEleveObj: Eleve = {
      id: createdId,
      ...newStudentData
    };

    setEleves(prev => [createdEleveObj, ...prev]);
    setENomComplet('');
    setEClasse('6ème A');
    setETelTuteur('');
    setENomTuteur('');
    setEMontantTotal('250000');
    setShowAddStudentModal(false);
    notify(`Élève ${createdEleveObj.nom} ${createdEleveObj.prenoms} inscrit avec succès.`, 'success');
  };

  // Suppression d'un élève avec confirmation & Firestore
  const handleDeleteStudent = async (student: Eleve) => {
    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement l'élève ${student.nom} ${student.prenoms} (${student.matricule}) ?`
    );
    if (!confirmation) return;

    if (!isDemoMode && db && student.id) {
      try {
        await deleteDoc(doc(db, 'eleves', student.id));
      } catch (err) {
        console.warn("Notice: Firestore deleteDoc eleve failed, local update only:", err);
      }
    }

    setEleves(prev => prev.filter(e => e.id !== student.id));
    if (selectedStudentDetails?.id === student.id) {
      setSelectedStudentDetails(null);
    }
  };

  // Sélectionner un élève dans la recherche du modal de paiement
  const handleSelectStudentForPayment = (el: Eleve) => {
    setPSelectedStudent(el);
    setTargetStudentId(el.id);
    setPNomEleve(`${el.nom} ${el.prenoms}`.trim());
    setPClasse(el.classe);
    setPMontant(el.soldeRestant > 0 ? el.soldeRestant.toString() : '');
    setPTranche(el.soldeRestant > 0 ? 'Règlement Scolarité' : 'Scolarité Complémentaire');
    setPStudentSearch(`${el.nom} ${el.prenoms} (${el.matricule})`);
    setShowStudentDropdown(false);
  };

  // Ouvrir le modal de paiement rapide pré-rempli pour un élève spécifique
  const handleOpenPaymentForStudent = (el: Eleve) => {
    handleSelectStudentForPayment(el);
    setShowAddPaymentModal(true);
  };

  // Soumission d'un nouveau Paiement (Firestore + State + Reçu PDF)
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNomEleve || !pMontant) return;

    const montantNum = Number(pMontant);
    const generatedRecu = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const etablissementId = schoolProfile?.id || 'EP-ABJ-101';
    
    // Horodatage automatique
    const now = new Date();
    const currentDateFormatted = `${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const caissierFinal = pCaissier || directeurNomComplete || 'Caissier / Secrétariat';

    const newPaymentData = {
      eleveId: targetStudentId || `EL-${Date.now().toString().slice(-4)}`,
      matriculeEleve: pSelectedStudent?.matricule || `26-ABJ-${Math.floor(100 + Math.random() * 900)}`,
      nomEleveComplete: pNomEleve,
      classe: pClasse,
      montant: montantNum,
      modePaiement: pMode,
      referenceTransaction: pRef || `${pMode.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      numeroRecu: generatedRecu,
      datePaiement: currentDateFormatted,
      statut: 'Validé' as const,
      libelleTranche: pTranche || 'Règlement Scolarité',
      effectueParUid: currentUser?.uid || 'admin',
      caissierNom: caissierFinal,
      etablissementId
    };

    // 1. Tente écriture Firestore du paiement
    if (!isDemoMode && db) {
      try {
        await addDoc(collection(db, 'paiements'), {
          ...newPaymentData,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Notice: Firestore addDoc payment failed, local update only:", err);
      }
    }

    // 2. Mise à jour de l'élève correspondant dans Firestore & State
    const matchingStudent = pSelectedStudent || eleves.find(el => 
      el.id === targetStudentId || 
      `${el.nom} ${el.prenoms}`.toLowerCase().trim() === pNomEleve.toLowerCase().trim()
    );

    let updatedEleve: Eleve | null = null;

    if (matchingStudent) {
      const newMontantPaye = (matchingStudent.montantPaye || 0) + montantNum;
      const newSoldeRestant = Math.max(0, matchingStudent.montantTotalScolarite - newMontantPaye);
      const isEnRegle = newSoldeRestant <= 0;

      updatedEleve = {
        ...matchingStudent,
        montantPaye: newMontantPaye,
        soldeRestant: newSoldeRestant,
        estEnRegle: isEnRegle
      };

      if (!isDemoMode && db && matchingStudent.id) {
        try {
          const eleveRef = doc(db, 'eleves', matchingStudent.id);
          await updateDoc(eleveRef, {
            montantPaye: newMontantPaye,
            soldeRestant: newSoldeRestant,
            estEnRegle: isEnRegle
          });
        } catch (err) {
          console.warn("Notice: Firestore updateDoc eleve failed:", err);
        }
      }

      setEleves(prev => prev.map(el => el.id === matchingStudent.id ? updatedEleve! : el));
    }

    const createdPaymentObj: Paiement & { caissierNom?: string } = {
      id: `PAY-${Date.now()}`,
      ...newPaymentData
    };

    setPaiements(prev => [createdPaymentObj, ...prev]);

    // Afficher directement le reçu après validation
    setSelectedReceipt(createdPaymentObj);

    // Téléchargement automatique immédiat du reçu PDF
    generatePaymentReceiptPDF(
      createdPaymentObj,
      updatedEleve || matchingStudent,
      schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan",
      caissierFinal
    );

    // Réinitialisation des formulaires
    setPNomEleve('');
    setPMontant('');
    setPRef('');
    setPStudentSearch('');
    setPSelectedStudent(null);
    setTargetStudentId(null);
    setShowAddPaymentModal(false);
    notify(`Paiement de ${montantNum.toLocaleString('fr-FR')} FCFA enregistré · Reçu ${generatedRecu} généré.`, 'success');
  };

  // Badge Couleur pour Mode de paiement
  const getModeBadgeClass = (mode: ModePaiement) => {
    switch (mode) {
      case 'Wave':
        return 'bg-sky-100 text-sky-800 dark:text-sky-300 border-sky-300 font-bold';
      case 'Orange Money':
        return 'bg-orange-100 text-orange-900 dark:text-orange-300 border-orange-300 font-bold';
      case 'MTN MoMo':
        return 'bg-amber-100 text-amber-900 dark:text-amber-300 border-amber-300 font-bold';
      case 'Moov Money':
        return 'bg-purple-100 text-purple-800 dark:text-purple-300 border-purple-300 font-bold';
      case 'Espèces':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600';
    }
  };

  // Élèves filtrés pour la recherche
  const filteredEleves = eleves.filter(el => {
    const nomComplet = `${el.nom} ${el.prenoms} ${el.matricule} ${el.telTuteur || ''}`.toLowerCase();
    const matchesSearch = nomComplet.includes(searchTerm.toLowerCase());
    const matchesClasse = selectedClasseFilter === 'Toutes' || el.classe === selectedClasseFilter;
    
    const status = getStatutPaiement(el);
    const matchesStatus = selectedStatusFilter === 'Tous' || status === selectedStatusFilter;

    return matchesSearch && matchesClasse && matchesStatus;
  });

  // Élèves filtrés pour le dropdown du modal de paiement
  const studentSearchDropdownList = eleves.filter(el => {
    if (!pStudentSearch) return true;
    const term = pStudentSearch.toLowerCase();
    return `${el.nom} ${el.prenoms} ${el.matricule} ${el.classe}`.toLowerCase().includes(term);
  });

  // Paiements filtrés avec Filtres Avancés Date, Classe, Mode, Recherche
  const filteredPaiements = paiements.filter(p => {
    const matchesSearch = `${p.nomEleveComplete} ${p.matriculeEleve} ${p.numeroRecu} ${p.referenceTransaction || ''} ${p.caissierNom || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = selectedModeFilter === 'Tous' || p.modePaiement === selectedModeFilter;
    const matchesClasse = selectedClasseFilter === 'Toutes' || p.classe === selectedClasseFilter;
    
    let matchesDate = true;
    if (selectedDateFilter === "Aujourd'hui") {
      matchesDate = p.datePaiement.includes("Aujourd'hui") || p.datePaiement.includes(new Date().toLocaleDateString('fr-FR'));
    } else if (selectedDateFilter === 'Ce mois') {
      matchesDate = true; // Tous les récents
    }

    return matchesSearch && matchesMode && matchesClasse && matchesDate;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row antialiased">

      {/* Overlay mobile pour la sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
        />
      )}

      {/* 1. SIDEBAR DE NAVIGATION */}
      <aside
        data-testid="sidebar"
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 lg:w-64 bg-[#0F172A] text-white flex flex-col shrink-0 shadow-2xl border-r border-[#1E293B] transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        
        {/* En-tête Sidebar avec Logo EcolePay */}
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white font-black text-lg shadow-lg border border-white/20">
                EP
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#16A34A]">EcolePay</h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">
                  Frais Scolaires CI 🇨🇮
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            data-testid="sidebar-close-btn"
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pt-4">
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            isDemoMode 
              ? 'bg-amber-500/20 border-amber-400/30 text-amber-200' 
              : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
          }`}>
            <span className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              {isDemoMode ? 'Mode Démo Actif' : 'Firebase Sync Actif'}
            </span>
          </div>
        </div>

        {/* Menu principal */}
        <nav className="flex-1 p-4 space-y-2">
          
          <button
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-[#16A34A] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-200 hover:bg-[#1E293B]/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => { setActiveTab('eleves'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'eleves' 
                ? 'bg-[#16A34A] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-200 hover:bg-[#1E293B]/60 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span>Élèves & Classes</span>
          </button>

          <button
            onClick={() => { setActiveTab('paiements'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'paiements' 
                ? 'bg-[#16A34A] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-200 hover:bg-[#1E293B]/60 hover:text-white'
            }`}
          >
            <CreditCard className="w-5 h-5 shrink-0" />
            <span>Paiements & Reçus</span>
          </button>

          <button
            onClick={() => { setActiveTab('parametres'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'parametres' 
                ? 'bg-[#16A34A] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-200 hover:bg-[#1E293B]/60 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Paramètres École</span>
          </button>

        </nav>

        {/* Bouton Déconnexion en bas avec résumé du compte */}
        <div className="p-4 bg-[#0B1120] border-t border-[#1E293B] space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-black text-sm shrink-0">
              {directeurNomComplete.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{directeurNomComplete}</p>
              <p className="text-[11px] text-slate-300 truncate">{schoolProfile?.nom || "Lycée Privé d'Abidjan"}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-600 border border-rose-400/30 text-rose-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>

      </aside>

      {/* ZONE PRINCIPALE CONTENU */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* 2. HEADER */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#1E293B]/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              data-testid="sidebar-open-btn"
              className="lg:hidden h-10 w-10 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:text-[#16A34A] cursor-pointer transition-colors active:scale-90"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight truncate">
                  Bonjour, {directeurNomComplete} 👋
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-bold text-[#16A34A] flex items-center min-w-0">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-[#16A34A] shrink-0" />
                  <span className="truncate">{schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan"}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center text-slate-600 dark:text-slate-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                  {dateFormattedDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Action Rapide Header */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <button
              onClick={() => setShowAddStudentModal(true)}
              data-testid="header-add-student-btn"
              className="hidden sm:flex px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>+ Inscrire Élève</span>
            </button>

            <button
              onClick={() => {
                setTargetStudentId(null);
                setPSelectedStudent(null);
                setPStudentSearch('');
                setPNomEleve('');
                setPClasse('6ème A');
                setPMontant('');
                setShowAddPaymentModal(true);
              }}
              data-testid="header-add-payment-btn"
              className="px-3 sm:px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau Paiement</span>
              <span className="sm:hidden">Paiement</span>
            </button>
          </div>
        </header>

        {/* CONTENU SELON ONGLET SELECTIONNE */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* VUE 1 : TABLEAU DE BORD (OVERVIEW) */}
          {activeTab === 'overview' && (
            <>
              {/* CARTES DE STATISTIQUES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                
                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-900/5 space-y-2 relative overflow-hidden card-hover hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Total frais attendus</span>
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#0F172A]">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
                    {totalFraisAttendus.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">FCFA</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Budget prévisionnel scolarités {nombreElevesTotal} élèves
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-900/5 space-y-2 relative overflow-hidden card-hover hover:shadow-lg hover:shadow-emerald-500/5 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Total encaissé</span>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-emerald-600">
                    {totalEncaisse.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">FCFA</span>
                  </p>
                  <div className="flex items-center text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    <span>{totalFraisAttendus > 0 ? ((totalEncaisse / totalFraisAttendus) * 100).toFixed(1) : 0}% du budget perçu</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-900/5 space-y-2 relative overflow-hidden card-hover hover:shadow-lg hover:shadow-emerald-500/5 border-l-4 border-l-rose-500">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Total impayés</span>
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-rose-600">
                    {totalImpayes.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">FCFA</span>
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Solde restant à recouvrir
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-900/5 space-y-2 relative overflow-hidden card-hover hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Nombre d'élèves</span>
                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-[#16A34A]">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
                    {nombreElevesTotal} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">inscrits</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Répartis de la Maternelle à la Terminale
                  </p>
                </div>

              </div>

              {/* GRAPHIQUE + RESUME VISUEL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                        <PieChartIcon className="w-5 h-5 mr-2 text-[#0F172A]" />
                        Recouvrement Ce Mois (Encaissé vs Impayé)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Répartition financière par cycle d'enseignement en FCFA
                      </p>
                    </div>

                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                      Session 2025-2026
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataParCycle} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip 
                          formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, '']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="Encaissé" fill="#16A34A" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Impayé" fill="#E11D48" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                      <Smartphone className="w-5 h-5 mr-2 text-[#16A34A]" />
                      Canaux de Paiement
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Modes de règlement privilégiés par les parents</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-xs">
                      <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-2" /> Wave Mobile Money
                      </span>
                      <span className="font-black text-sky-900 dark:text-sky-300">45%</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-xs">
                      <span className="font-bold text-orange-900 dark:text-orange-300 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2" /> Orange Money
                      </span>
                      <span className="font-black text-orange-900 dark:text-orange-300">30%</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" /> MTN MoMo
                      </span>
                      <span className="font-black text-amber-900 dark:text-amber-300">15%</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-xs">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" /> Espèces (Caisse)
                      </span>
                      <span className="font-black text-emerald-900 dark:text-emerald-300">10%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* TABLEAU DES 5 DERNIERS PAIEMENTS */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40/50">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-[#16A34A]" />
                      5 Derniers Paiements Enregistrés
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mises à jour en direct depuis l'application</p>
                  </div>

                  <button
                    onClick={() => { setActiveTab('paiements'); setSidebarOpen(false); }}
                    className="text-xs font-bold text-[#16A34A] hover:underline flex items-center cursor-pointer"
                  >
                    <span>Voir tout l'historique</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-3.5">Élève & Matricule</th>
                        <th className="px-6 py-3.5">Classe</th>
                        <th className="px-6 py-3.5">Montant</th>
                        <th className="px-6 py-3.5">Mode</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">N° Reçu</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {derniersCinqPaiements.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-slate-50">{p.nomEleveComplete}</div>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{p.matriculeEleve}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">{p.classe}</td>
                          <td className="px-6 py-4 font-black text-slate-900 dark:text-slate-50">
                            {p.montant.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">FCFA</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${getModeBadgeClass(p.modePaiement)}`}>
                              {p.modePaiement}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">{p.datePaiement}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{p.numeroRecu}</td>
                          <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedReceipt(p)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Voir Reçu"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              <span>Aperçu</span>
                            </button>

                            <button
                              onClick={() => generatePaymentReceiptPDF(
                                p, 
                                eleves.find(e => e.id === p.eleveId || e.matricule === p.matriculeEleve),
                                schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan",
                                p.caissierNom || directeurNomComplete
                              )}
                              className="px-2.5 py-1.5 bg-[#0F172A] hover:bg-[#0B1120] text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Télécharger Reçu PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-white" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* VUE 2 : PAGE "ÉLÈVES & CLASSES" COMPLÈTE */}
          {activeTab === 'eleves' && (
            <div className="space-y-6">
              
              {/* CARTES RECAPITULATIVES RECOUUVREMENT ELEVES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between card-hover hover:shadow-lg">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Élèves Inscrits</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">{nombreElevesTotal}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-[#0F172A] rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between card-hover hover:shadow-lg border-l-4 border-l-emerald-500">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Scolarité Solde (Payé ✅)</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{countPaye} élèves</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between card-hover hover:shadow-lg border-l-4 border-l-amber-500">
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Paiement Partiel (Partiel 🟡)</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{countPartiel} élèves</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between card-hover hover:shadow-lg border-l-4 border-l-rose-500">
                  <div>
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">Aucun Vers. (Impayé 🔴)</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">{countImpaye} élèves</p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* TABLEAU ET BARRE DE FILTRES ELEVES */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
                
                {/* En-tête & Filtres */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Répertoire Officiel des Élèves & Suivi des Scolarités</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gestion en temps réel avec relances WhatsApp, reçus PDF et synchronisation Firestore</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Barre de recherche par nom */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Recherche nom, matricule, tuteur..."
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A] w-64"
                      />
                    </div>

                    {/* Filtre par classe */}
                    <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <select
                        value={selectedClasseFilter}
                        onChange={(e) => setSelectedClasseFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Toutes">Toutes les classes</option>
                        {Array.from(new Set(eleves.map(e => e.classe))).concat(listClassesDisponibles).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre par statut de paiement */}
                    <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Statut:</span>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Tous">Tous les statuts</option>
                        <option value="Payé">Payé ✅</option>
                        <option value="Partiel">Partiel 🟡</option>
                        <option value="Impayé">Impayé 🔴</option>
                      </select>
                    </div>

                    {/* Bouton "Inscrire un élève" */}
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inscrire un Élève</span>
                    </button>
                  </div>
                </div>

                {/* Tableau complet des élèves */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-3.5">Élève & Matricule</th>
                        <th className="px-6 py-3.5">Classe</th>
                        <th className="px-6 py-3.5">Frais Total</th>
                        <th className="px-6 py-3.5">Montant Payé</th>
                        <th className="px-6 py-3.5">Reste Dû</th>
                        <th className="px-6 py-3.5">Statut</th>
                        <th className="px-6 py-3.5 text-right">Actions & Relance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredEleves.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
                            Aucun élève trouvé selon les critères de recherche actuels.
                          </td>
                        </tr>
                      ) : (
                        filteredEleves.map((el) => {
                          const statut = getStatutPaiement(el);

                          return (
                            <tr key={el.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                              
                              {/* Nom complet & Matricule */}
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">{el.nom} {el.prenoms}</div>
                                <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{el.matricule}</div>
                              </td>

                              {/* Classe */}
                              <td className="px-6 py-4">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700">
                                  {el.classe}
                                </span>
                              </td>

                              {/* Frais Total */}
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-50">
                                {el.montantTotalScolarite.toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">FCFA</span>
                              </td>

                              {/* Montant Payé */}
                              <td className="px-6 py-4 font-bold text-emerald-600">
                                {(el.montantPaye || 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">FCFA</span>
                              </td>

                              {/* Reste Dû */}
                              <td className="px-6 py-4 font-black text-rose-600">
                                {el.soldeRestant.toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">FCFA</span>
                              </td>

                              {/* Badge Statut */}
                              <td className="px-6 py-4">
                                {statut === 'Payé' && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Payé
                                  </span>
                                )}
                                {statut === 'Partiel' && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200">
                                    <Clock className="w-3.5 h-3.5 mr-1" /> Partiel
                                  </span>
                                )}
                                {statut === 'Impayé' && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Impayé
                                  </span>
                                )}
                              </td>

                              {/* Actions & WhatsApp */}
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  
                                  {/* Bouton Rappel WhatsApp pour impayés */}
                                  {el.soldeRestant > 0 && (
                                    <a
                                      href={getWhatsAppReminderUrl(el, schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan")}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-all"
                                      title="Envoyer rappel WhatsApp pré-rempli au parent"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Rappel WA</span>
                                    </a>
                                  )}

                                  {/* Bouton Règlement Rapide */}
                                  <button
                                    onClick={() => handleOpenPaymentForStudent(el)}
                                    className="px-2.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-all"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Régler</span>
                                  </button>

                                  {/* Voir Fiche Élève */}
                                  <button
                                    onClick={() => setSelectedStudentDetails(el)}
                                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1 cursor-pointer transition-all"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                    <span>Fiche</span>
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VUE 3 : HISTORIQUE PAIEMENTS & RECUS */}
          {activeTab === 'paiements' && (
            <div className="space-y-6">

              {/* CARTES RECAPITULATIVES PAIEMENTS & MODES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 card-hover hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Encaissé Filtré</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {filteredPaiements.reduce((acc, p) => acc + p.montant, 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">FCFA</span>
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{filteredPaiements.length} transaction(s) enregistrée(s)</p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 card-hover hover:shadow-lg border-l-4 border-l-sky-500">
                  <p className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase">Encaissé par Wave</p>
                  <p className="text-2xl font-black text-sky-900 dark:text-sky-300">
                    {paiements.filter(p => p.modePaiement === 'Wave').reduce((acc, p) => acc + p.montant, 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">FCFA</span>
                  </p>
                  <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">Frais 0% direct CI</p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 card-hover hover:shadow-lg border-l-4 border-l-orange-500">
                  <p className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase">Orange Money</p>
                  <p className="text-2xl font-black text-orange-900 dark:text-orange-300">
                    {paiements.filter(p => p.modePaiement === 'Orange Money').reduce((acc, p) => acc + p.montant, 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">FCFA</span>
                  </p>
                  <p className="text-[11px] text-orange-700 dark:text-orange-300 font-medium">Validations SMS</p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 card-hover hover:shadow-lg border-l-4 border-l-amber-500">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">MTN MoMo & Espèces</p>
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-300">
                    {paiements.filter(p => p.modePaiement === 'MTN MoMo' || p.modePaiement === 'Espèces').reduce((acc, p) => acc + p.montant, 0).toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">FCFA</span>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Règlements comptants</p>
                </div>
              </div>

              {/* TABLEAU PAIEMENTS ET FILTRES DATE / CLASSE */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                      Historique des Encaissements & Reçus de Scolarité
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Traçabilité complète avec référence d'opérateur Télécom CI et réémission de reçus PDF</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Recherche */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Élève, reçu, référence, caissier..."
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A] w-64"
                      />
                    </div>

                    {/* Filtre par Date */}
                    <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <select
                        value={selectedDateFilter}
                        onChange={(e) => setSelectedDateFilter(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Toutes">Toutes les dates</option>
                        <option value="Aujourd'hui">Aujourd'hui</option>
                        <option value="Ce mois">Ce mois-ci</option>
                      </select>
                    </div>

                    {/* Filtre par Classe */}
                    <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <select
                        value={selectedClasseFilter}
                        onChange={(e) => setSelectedClasseFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Toutes">Toutes les classes</option>
                        {Array.from(new Set(eleves.map(e => e.classe))).concat(listClassesDisponibles).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre par Mode de paiement */}
                    <select
                      value={selectedModeFilter}
                      onChange={(e) => setSelectedModeFilter(e.target.value)}
                      className="py-2 px-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    >
                      <option value="Tous">Tous les modes</option>
                      <option value="Wave">Wave Mobile Money</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="MTN MoMo">MTN MoMo</option>
                      <option value="Moov Money">Moov Money</option>
                      <option value="Espèces">Espèces</option>
                    </select>

                    <button
                      onClick={() => {
                        setTargetStudentId(null);
                        setPSelectedStudent(null);
                        setPStudentSearch('');
                        setPNomEleve('');
                        setPMontant('');
                        setShowAddPaymentModal(true);
                      }}
                      className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Enregistrer un Règlement</span>
                    </button>
                  </div>
                </div>

                {/* Table Paiements */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-3.5">Matricule & Élève</th>
                        <th className="px-6 py-3.5">Classe</th>
                        <th className="px-6 py-3.5">Montant Versé</th>
                        <th className="px-6 py-3.5">Mode & Réf</th>
                        <th className="px-6 py-3.5">Date & Heure</th>
                        <th className="px-6 py-3.5">Agent / Caissier</th>
                        <th className="px-6 py-3.5">N° Reçu</th>
                        <th className="px-6 py-3.5 text-right">Actions Reçu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredPaiements.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
                            Aucun paiement trouvé pour les filtres sélectionnés.
                          </td>
                        </tr>
                      ) : (
                        filteredPaiements.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-slate-50">{p.nomEleveComplete}</div>
                              <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{p.matriculeEleve}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-200 font-semibold">{p.classe}</td>
                            <td className="px-6 py-4 font-black text-slate-900 dark:text-slate-50">
                              {p.montant.toLocaleString('fr-FR')} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">FCFA</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${getModeBadgeClass(p.modePaiement)}`}>
                                {p.modePaiement}
                              </span>
                              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">{p.referenceTransaction || '—'}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">{p.datePaiement}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">{p.caissierNom || directeurNomComplete}</td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{p.numeroRecu}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSelectedReceipt(p)}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1 cursor-pointer transition-colors"
                                  title="Aperçu Reçu"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                  <span>Voir</span>
                                </button>

                                <button
                                  onClick={() => generatePaymentReceiptPDF(
                                    p,
                                    eleves.find(e => e.id === p.eleveId || e.matricule === p.matriculeEleve),
                                    schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan",
                                    p.caissierNom || directeurNomComplete
                                  )}
                                  className="px-2.5 py-1.5 bg-[#0F172A] hover:bg-[#0B1120] text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-colors"
                                  title="Re-télécharger Reçu PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Reçu PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VUE 4 : PARAMETRES ETABLISSEMENT */}
          {activeTab === 'parametres' && (
            <SchoolSettingsView />
          )}

        </div>

      </main>

      {/* MODAL : 2. INSCRIRE UN ÉLÈVE */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl animate-modalIn max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                <UserCheck className="w-5 h-5 mr-1.5 text-[#0F172A]" />
                Inscrire un Nouvel Élève
              </h3>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              
              {/* Nom complet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Nom Complet de l'Élève *</label>
                <input
                  type="text"
                  value={eNomComplet}
                  onChange={(e) => setENomComplet(e.target.value)}
                  placeholder="Ex: Kouassi Marc-Antoine"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              {/* Classe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Classe *</label>
                <select
                  value={eClasse}
                  onChange={(e) => setEClasse(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                >
                  {listClassesDisponibles.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Téléphone parent */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Téléphone Parent / Tuteur *</label>
                <input
                  type="text"
                  value={eTelTuteur}
                  onChange={(e) => setETelTuteur(e.target.value)}
                  placeholder="Ex: +225 07 08 09 10 11"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              {/* Montant total des frais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Montant Total des Frais de Scolarité (FCFA) *</label>
                <input
                  type="number"
                  value={eMontantTotal}
                  onChange={(e) => setEMontantTotal(e.target.value)}
                  placeholder="Ex: 250000"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              {/* Nom du tuteur */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Nom du Parent / Tuteur (Optionnel)</label>
                <input
                  type="text"
                  value={eNomTuteur}
                  onChange={(e) => setENomTuteur(e.target.value)}
                  placeholder="Ex: Kouassi Jean-Baptiste"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F172A] hover:bg-[#0B1120] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Valider l'Inscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : VOIR DETAILS ELEVE + RAPPEL WHATSAPP */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl animate-modalIn max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#0F172A] text-white font-black text-lg flex items-center justify-center shadow-md">
                  {selectedStudentDetails.nom.charAt(0)}{selectedStudentDetails.prenoms.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">
                    {selectedStudentDetails.nom} {selectedStudentDetails.prenoms}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Matricule: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedStudentDetails.matricule}</span> • Classe: <span className="font-bold text-[#16A34A]">{selectedStudentDetails.classe}</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStudentDetails(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resume Financement Élève */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Frais Total</span>
                <p className="text-base font-black text-slate-900 dark:text-slate-50 mt-0.5">
                  {selectedStudentDetails.montantTotalScolarite.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Montant Versé</span>
                <p className="text-base font-black text-emerald-600 mt-0.5">
                  {selectedStudentDetails.montantPaye.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Reste Dû</span>
                <p className="text-base font-black text-rose-600 mt-0.5">
                  {selectedStudentDetails.soldeRestant.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>

            {/* Infos Contact Tuteur & Bouton Rappel WhatsApp */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10/50 border border-blue-100 dark:border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#0F172A]" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">Tuteur Légal: {selectedStudentDetails.nomTuteur}</span>
                </div>
                <div className="flex items-center space-x-1 font-mono font-bold text-[#0F172A] mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedStudentDetails.telTuteur}</span>
                </div>
              </div>

              {selectedStudentDetails.soldeRestant > 0 && (
                <a
                  href={getWhatsAppReminderUrl(selectedStudentDetails, schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-xs inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Rappel WhatsApp</span>
                </a>
              )}
            </div>

            {/* Historique des paiements de cet élève */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-[#16A34A]" />
                Historique des Versements Enregistrés
              </h4>

              {paiements.filter(p => p.eleveId === selectedStudentDetails.id || p.matriculeEleve === selectedStudentDetails.matricule || p.nomEleveComplete.toLowerCase().includes(selectedStudentDetails.nom.toLowerCase())).length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Aucun versement n'a encore été effectué pour cet élève.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Tranche</th>
                        <th className="px-4 py-2.5">Montant</th>
                        <th className="px-4 py-2.5">Mode</th>
                        <th className="px-4 py-2.5">N° Reçu</th>
                        <th className="px-4 py-2.5 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {paiements
                        .filter(p => p.eleveId === selectedStudentDetails.id || p.matriculeEleve === selectedStudentDetails.matricule || p.nomEleveComplete.toLowerCase().includes(selectedStudentDetails.nom.toLowerCase()))
                        .map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{p.datePaiement}</td>
                            <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{p.libelleTranche}</td>
                            <td className="px-4 py-2 font-bold text-emerald-600">{p.montant.toLocaleString('fr-FR')} FCFA</td>
                            <td className="px-4 py-2">{p.modePaiement}</td>
                            <td className="px-4 py-2 font-mono text-slate-500 dark:text-slate-400">{p.numeroRecu}</td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => generatePaymentReceiptPDF(
                                  p,
                                  selectedStudentDetails,
                                  schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan",
                                  p.caissierNom || directeurNomComplete
                                )}
                                className="px-2 py-1 bg-[#0F172A] hover:bg-[#0B1120] text-white text-[11px] font-bold rounded-md inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions Modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteStudent(selectedStudentDetails)}
                className="px-3.5 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-500/30 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer l'Élève</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleOpenPaymentForStudent(selectedStudentDetails);
                    setSelectedStudentDetails(null);
                  }}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Enregistrer un Règlement</span>
                </button>

                <button
                  onClick={() => setSelectedStudentDetails(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1 : ENREGISTRER UN PAIEMENT (EXHAUSTIF AVEC RECHERCHE ELEVE, MOYENS CI, CAISSIER ET PDF) */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl animate-modalIn max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[95vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                <CreditCard className="w-5 h-5 mr-1.5 text-[#16A34A]" />
                Enregistrer un Règlement de Scolarité
              </h3>
              <button 
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setTargetStudentId(null);
                  setPSelectedStudent(null);
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              
              {/* 1. Recherche et Sélection de l'Élève */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                  1. Rechercher & Sélectionner l'Élève *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={pStudentSearch}
                    onChange={(e) => {
                      setPStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                      if (pSelectedStudent && e.target.value !== `${pSelectedStudent.nom} ${pSelectedStudent.prenoms} (${pSelectedStudent.matricule})`) {
                        setPSelectedStudent(null);
                        setPNomEleve(e.target.value);
                      }
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Tapez le nom, prénom ou matricule de l'élève..."
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                  {pSelectedStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        setPSelectedStudent(null);
                        setPStudentSearch('');
                        setPNomEleve('');
                        setPMontant('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown de recherche d'élèves */}
                {showStudentDropdown && !pSelectedStudent && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800">
                    {studentSearchDropdownList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                        Aucun élève correspondant trouvé.
                      </div>
                    ) : (
                      studentSearchDropdownList.map((el) => (
                        <div
                          key={el.id}
                          onClick={() => handleSelectStudentForPayment(el)}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-50">{el.nom} {el.prenoms}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{el.matricule} • Classe: {el.classe}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-rose-600">Reste: {el.soldeRestant.toLocaleString('fr-FR')} FCFA</div>
                            <span className="text-[10px] text-emerald-600 font-semibold">Cliquer pour choisir</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Fiche récapitulative de l'élève sélectionné */}
              {pSelectedStudent && (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10/60 rounded-xl border border-blue-100 dark:border-blue-500/20 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A] flex items-center">
                      <UserCheck2 className="w-4 h-4 mr-1 text-[#16A34A]" />
                      Élève sélectionné: {pSelectedStudent.nom} {pSelectedStudent.prenoms}
                    </span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{pSelectedStudent.classe}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Frais Totaux: <strong>{pSelectedStudent.montantTotalScolarite.toLocaleString('fr-FR')} FCFA</strong></span>
                    <span>Déjà Payé: <strong className="text-emerald-700 dark:text-emerald-300">{pSelectedStudent.montantPaye.toLocaleString('fr-FR')} FCFA</strong></span>
                    <span className="font-bold text-rose-600">Solde Dû: {pSelectedStudent.soldeRestant.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  {pSelectedStudent.soldeRestant > 0 && (
                    <button
                      type="button"
                      onClick={() => setPMontant(pSelectedStudent.soldeRestant.toString())}
                      className="w-full mt-1 py-1 bg-white dark:bg-[#1E293B] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-500/30 cursor-pointer transition-colors"
                    >
                      ⚡ Pré-remplir avec le montant exact du solde dû ({pSelectedStudent.soldeRestant.toLocaleString('fr-FR')} FCFA)
                    </button>
                  )}
                </div>
              )}

              {/* 2. Montant à encaisser */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Montant à Encaisser (FCFA) *</label>
                  <input
                    type="number"
                    value={pMontant}
                    onChange={(e) => setPMontant(e.target.value)}
                    placeholder="Ex: 75000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Motif / Libellé Tranche</label>
                  <select
                    value={pTranche}
                    onChange={(e) => setPTranche(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  >
                    <option value="Frais d'Inscription">Frais d'Inscription</option>
                    <option value="1ère Tranche">1ère Tranche</option>
                    <option value="2ème Tranche">2ème Tranche</option>
                    <option value="3ème Tranche">3ème Tranche</option>
                    <option value="Solde Scolarité">Solde Scolarité</option>
                    <option value="Frais Annexes / Cantine">Frais Annexes / Cantine</option>
                  </select>
                </div>
              </div>

              {/* 3. Mode de paiement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">3. Mode de Paiement (MoMo CI / Espèces) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Wave', label: 'Wave CI 🟦' },
                    { id: 'Orange Money', label: 'Orange 🟧' },
                    { id: 'MTN MoMo', label: 'MTN 🟨' },
                    { id: 'Espèces', label: 'Espèces 🟩' },
                  ].map((modeItem) => (
                    <button
                      type="button"
                      key={modeItem.id}
                      onClick={() => setPMode(modeItem.id as ModePaiement)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        pMode === modeItem.id 
                          ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {modeItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Référence transaction Mobile Money */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Réf. Transaction (Optionnel)</label>
                <input
                  type="text"
                  value={pRef}
                  onChange={(e) => setPRef(e.target.value)}
                  placeholder="Ex: WAVE-CI-998123 / OM-98122"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              {/* 4. Nom du Caissier & Date Automatique */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Nom du Caissier / Agent</label>
                  <input
                    type="text"
                    value={pCaissier}
                    onChange={(e) => setPCaissier(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Horodatage Automatique</label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
                    Aujourd'hui, {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPaymentModal(false);
                    setTargetStudentId(null);
                    setPSelectedStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider & Générer Reçu PDF</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL : APERÇU ET TÉLÉCHARGEMENT REÇU PDF SCOLARITÉ */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl animate-modalIn max-w-lg w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 text-slate-900 dark:text-slate-50 relative">
            
            {/* Bouton Fermer */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Reçu Officiel Header */}
            <div className="border-b-2 border-slate-900 dark:border-slate-200 pb-4 text-center space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-[#16A34A] text-white font-black text-xs flex items-center justify-center">
                  EP
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">
                  {schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan"}
                </h3>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Code Établissement : {schoolProfile?.codeEcole || 'EP-ABJ-101'} • Abidjan, Côte d'Ivoire
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-slate-900 dark:bg-slate-950 text-white font-black text-xs uppercase tracking-widest rounded-md">
                REÇU DE SCOLARITÉ N° {selectedReceipt.numeroRecu}
              </div>
            </div>

            {/* Corps du Reçu */}
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Nom & Prénoms :</span>
                <span className="font-bold text-slate-900 dark:text-slate-50">{selectedReceipt.nomEleveComplete}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Matricule Élève :</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-50">{selectedReceipt.matriculeEleve}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Classe :</span>
                <span className="font-bold text-slate-900 dark:text-slate-50">{selectedReceipt.classe}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Libellé Tranche :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedReceipt.libelleTranche}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Mode de Règlement :</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{selectedReceipt.modePaiement}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Réf. Opérateur :</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{selectedReceipt.referenceTransaction || 'CASH-VALID'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Agent Caissier :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedReceipt.caissierNom || directeurNomComplete}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex justify-between items-center my-4">
                <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Montant Encaissé :</span>
                <span className="text-2xl font-black text-[#16A34A]">
                  {selectedReceipt.montant.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Signature & Validation */}
            <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="text-slate-500 dark:text-slate-400 space-y-0.5">
                <p>Émis le : {selectedReceipt.datePaiement}</p>
                <p className="font-mono text-[10px]">Mention: Cachet & Signature école</p>
              </div>
              <div className="text-center font-bold text-slate-800 dark:text-slate-100">
                <p>Le Comptable / Caisse</p>
                <div className="h-8 w-28 border-b border-slate-300 dark:border-slate-600 mt-1 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  [ Cachet Électronique ]
                </div>
              </div>
            </div>

            {/* Action Télécharger PDF & Imprimer */}
            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={() => generatePaymentReceiptPDF(
                  selectedReceipt,
                  eleves.find(e => e.id === selectedReceipt.eleveId || e.matricule === selectedReceipt.matriculeEleve),
                  schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan",
                  selectedReceipt.caissierNom || directeurNomComplete
                )}
                className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger Reçu PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
