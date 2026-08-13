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
import { addDoc, collection, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Paiement, Eleve, ModePaiement } from '../types';
import { generatePaymentReceiptPDF, getWhatsAppReminderUrl } from '../utils/pdfGenerator';
import { formatPaymentDate, isWithinCurrentPeriod, toDate } from '../utils/dateUtils';
import { SchoolSettingsView } from './SchoolSettingsView';

interface DashboardProps {
  onOpenSubscription?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenSubscription }) => {
  const { currentUser, userProfile, schoolProfile, logout } = useAuth();
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
  const [selectedDateFilter, setSelectedDateFilter] = useState<'Toutes' | "Aujourd'hui" | 'Cette semaine' | 'Ce mois' | 'Cette année'>('Toutes');

  // Modals state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [studentBeingEdited, setStudentBeingEdited] = useState<Eleve | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Paiement | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Eleve | null>(null);
  const [showArchivedStudents, setShowArchivedStudents] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

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

  // Formulaire élève : les montants déterminent automatiquement le solde et le statut.
  const [eNom, setENom] = useState('');
  const [ePrenoms, setEPrenoms] = useState('');
  const [eMatricule, setEMatricule] = useState('');
  const [eClasse, setEClasse] = useState('6ème A');
  const [eTelTuteur, setETelTuteur] = useState('');
  const [eWhatsAppTuteur, setEWhatsAppTuteur] = useState('');
  const [eNomTuteur, setENomTuteur] = useState('');
  const [eMontantTotal, setEMontantTotal] = useState('250000');
  const [eMontantDejaPaye, setEMontantDejaPaye] = useState('0');

  // Nom du caissier / directeur connecté
  const directeurNomComplete = userProfile 
    ? `${userProfile.nom} ${userProfile.prenom}`.trim()
    : (currentUser?.displayName || 'Caisse Secrétariat');
  const licenceExpiry = schoolProfile?.licence?.expiresAt ? new Date(schoolProfile.licence.expiresAt) : null;
  const licenceExpiresSoon = Boolean(licenceExpiry && !Number.isNaN(licenceExpiry.getTime()) && licenceExpiry.getTime() >= Date.now() && licenceExpiry.getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000);

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

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [archivedEleves, setArchivedEleves] = useState<Eleve[]>([]);
  const [paiements, setPaiements] = useState<(Paiement & { caissierNom?: string })[]>([]);

  // Synchronisation Firestore en temps réel, structurée par établissement.
  useEffect(() => {
    const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
    if (!etablissementId) {
      setEleves([]);
      setArchivedEleves([]);
      setPaiements([]);
      return;
    }

    const elevesRef = collection(db, 'etablissements', etablissementId, 'eleves');
    const paiementsRef = collection(db, 'etablissements', etablissementId, 'paiements');

    const unsubscribeEleves = onSnapshot(elevesRef, (snapshot) => {
      const actifs: Eleve[] = [];
      const archives: Eleve[] = [];

      snapshot.forEach((docSnap) => {
        const eleve = { id: docSnap.id, ...docSnap.data() } as Eleve;
        if (eleve.archived) archives.push(eleve);
        else actifs.push(eleve);
      });

      setEleves(actifs);
      setArchivedEleves(archives);
    }, () => {
      notify('Impossible de synchroniser les élèves. Vérifiez votre connexion internet.', 'error');
    });

    const unsubscribePaiements = onSnapshot(paiementsRef, (snapshot) => {
      const liste = snapshot.docs.map((docSnap) => {
        const paiement = { id: docSnap.id, ...docSnap.data() } as Paiement & { caissierNom?: string };
        const paidAt = paiement.paidAt || paiement.createdAt;

        // Migration non destructive des anciens enregistrements quand leur date peut être interprétée sans ambiguïté.
        if (!paiement.paidAt) {
          const legacyDate = toDate(paidAt || paiement.datePaiement);
          if (legacyDate) {
            updateDoc(doc(db, 'etablissements', etablissementId, 'paiements', docSnap.id), {
              paidAt: Timestamp.fromDate(legacyDate),
              migratedAt: serverTimestamp(),
            }).catch(() => notify(`La date du paiement ${paiement.numeroRecu} n’a pas pu être migrée automatiquement.`, 'error'));
          }
        }

        return {
          ...paiement,
          datePaiement: formatPaymentDate(paidAt || paiement.datePaiement),
        };
      });
      liste.sort((first, second) => {
        const firstDate = toDate(first.paidAt || first.createdAt || first.datePaiement)?.getTime() || 0;
        const secondDate = toDate(second.paidAt || second.createdAt || second.datePaiement)?.getTime() || 0;
        return secondDate - firstDate;
      });
      setPaiements(liste);
    }, () => {
      notify('Impossible de synchroniser les paiements. Vérifiez votre connexion internet.', 'error');
    });

    return () => {
      unsubscribeEleves();
      unsubscribePaiements();
    };
  }, [schoolProfile?.id, userProfile?.etablissementId, notify]);

  // Formater la date du jour en Français
  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const dateFormattedDisplay = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Calculs financiers et statistiques globaux
  const totalFraisAttendus = eleves.reduce((acc, el) => acc + Number(el.montantTotalScolarite || 0), 0);
  const totalEncaisse = eleves.reduce((acc, el) => acc + Number(el.montantPaye || 0), 0);
  const totalImpayes = eleves.reduce((acc, el) => acc + Math.max(0, Number(el.soldeRestant || 0)), 0);
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

  // Données réelles du graphique, dérivées des dossiers élèves de l’établissement.
  const chartDataParCycle = [
    { name: 'Maternelle', cycle: 'Maternelle' },
    { name: 'Primaire', cycle: 'Primaire' },
    { name: 'Collège', cycle: 'Secondaire Premier Cycle' },
    { name: 'Lycée', cycle: 'Secondaire Second Cycle' },
  ].map((item) => ({
    name: item.name,
    Encaissé: eleves.filter((student) => student.cycle === item.cycle).reduce((sum, student) => sum + Number(student.montantPaye || 0), 0),
    Impayé: eleves.filter((student) => student.cycle === item.cycle).reduce((sum, student) => sum + Math.max(0, Number(student.soldeRestant || 0)), 0),
  }));

  const paymentModeSummary = ['Wave', 'Orange Money', 'MTN MoMo', 'Espèces'] as ModePaiement[];
  const totalRecordedPayments = paiements.reduce((sum, payment) => sum + Number(payment.montant || 0), 0);

  const resetStudentForm = () => {
    setENom('');
    setEPrenoms('');
    setEMatricule('');
    setEClasse('6ème A');
    setETelTuteur('');
    setEWhatsAppTuteur('');
    setENomTuteur('');
    setEMontantTotal('250000');
    setEMontantDejaPaye('0');
  };

  // Inscription d’un élève : l’état financier est calculé au serveur et le montant initial est historisé.
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
    const mTotal = Number(eMontantTotal);
    const mDejaPaye = Number(eMontantDejaPaye || 0);

    if (!etablissementId || !currentUser) {
      notify('Votre session établissement est incomplète. Reconnectez-vous puis réessayez.', 'error');
      return;
    }
    if (!eNom.trim() || !ePrenoms.trim() || !eMatricule.trim() || !eClasse || !eTelTuteur.trim() || !Number.isFinite(mTotal) || mTotal <= 0 || !Number.isFinite(mDejaPaye) || mDejaPaye < 0) {
      notify('Complétez le nom, prénom, matricule, classe, téléphone et les montants valides.', 'error');
      return;
    }
    if (mDejaPaye > mTotal) {
      notify('Le montant déjà payé ne peut pas dépasser le total des frais scolaires.', 'error');
      return;
    }
    if (eleves.some((student) => student.matricule.trim().toLowerCase() === eMatricule.trim().toLowerCase())) {
      notify('Ce matricule existe déjà dans votre établissement.', 'error');
      return;
    }

    setIsCreatingStudent(true);
    try {
      await runTransaction(db, async (transaction) => {
        const studentRef = doc(collection(db, 'etablissements', etablissementId, 'eleves'));
        const counterRef = doc(db, 'etablissements', etablissementId, 'config', 'lastReceiptNumber');
        const paymentRef = doc(collection(db, 'etablissements', etablissementId, 'paiements'));
        const counterSnap = await transaction.get(counterRef);
        const now = Timestamp.now();
        const remaining = Math.max(0, mTotal - mDejaPaye);
        const newStudentData = {
          matricule: eMatricule.trim(),
          nom: eNom.trim(),
          prenoms: ePrenoms.trim(),
          classe: eClasse,
          cycle: getCycleFromClasse(eClasse),
          genre: 'M' as const,
          nomTuteur: eNomTuteur.trim() || 'Tuteur légal',
          telTuteur: eTelTuteur.trim(),
          telWhatsAppTuteur: (eWhatsAppTuteur.trim() || eTelTuteur.trim()),
          montantTotalScolarite: mTotal,
          montantPaye: mDejaPaye,
          soldeRestant: remaining,
          estEnRegle: remaining === 0,
          archived: false,
          createdAt: now,
          updatedAt: now,
        };
        transaction.set(studentRef, newStudentData);

        if (mDejaPaye > 0) {
          const year = now.toDate().getFullYear().toString();
          const counters = (counterSnap.data()?.counters || {}) as Record<string, number>;
          const nextNumber = Number(counters[year] || 0) + 1;
          const numeroRecu = `REC-${year}-${String(nextNumber).padStart(4, '0')}`;
          transaction.set(paymentRef, {
            eleveId: studentRef.id,
            matriculeEleve: eMatricule.trim(),
            nomEleveComplete: `${eNom.trim()} ${ePrenoms.trim()}`,
            classe: eClasse,
            montant: mDejaPaye,
            modePaiement: 'Autre' as ModePaiement,
            referenceTransaction: `INITIAL-${numeroRecu}`,
            numeroRecu,
            datePaiement: formatPaymentDate(now.toDate()),
            paidAt: now,
            createdAt: now,
            statut: 'Validé' as const,
            libelleTranche: 'Montant déjà payé à l’inscription',
            effectueParUid: currentUser.uid,
            caissierNom: directeurNomComplete || 'Direction',
          });
          transaction.set(counterRef, { counters: { [year]: nextNumber }, updatedAt: now }, { merge: true });
        }
      });
      resetStudentForm();
      setShowAddStudentModal(false);
      notify('Élève ajouté. Le solde et le statut ont été calculés automatiquement.', 'success');
    } catch (error) {
      console.error('Inscription élève impossible.', error);
      notify("Impossible d'ajouter l'élève. Vérifiez votre connexion internet et réessayez.", 'error');
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const handleOpenEditStudent = (student: Eleve) => {
    setStudentBeingEdited(student);
    setENom(student.nom || '');
    setEPrenoms(student.prenoms || '');
    setEMatricule(student.matricule || '');
    setEClasse(student.classe || '6ème A');
    setETelTuteur(student.telTuteur || '');
    setEWhatsAppTuteur(student.telWhatsAppTuteur || student.telTuteur || '');
    setENomTuteur(student.nomTuteur || '');
    setEMontantTotal(String(student.montantTotalScolarite || 0));
    setEMontantDejaPaye(String(student.montantPaye || 0));
    setShowEditStudentModal(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
    const total = Number(eMontantTotal);
    if (!studentBeingEdited || !etablissementId || !Number.isFinite(total) || total < studentBeingEdited.montantPaye || !eNom.trim() || !ePrenoms.trim() || !eMatricule.trim() || !eTelTuteur.trim()) {
      notify('Le total doit être supérieur ou égal au montant déjà enregistré et tous les champs requis doivent être complétés.', 'error');
      return;
    }
    try {
      const remaining = Math.max(0, total - studentBeingEdited.montantPaye);
      await updateDoc(doc(db, 'etablissements', etablissementId, 'eleves', studentBeingEdited.id), {
        matricule: eMatricule.trim(), nom: eNom.trim(), prenoms: ePrenoms.trim(), classe: eClasse,
        cycle: getCycleFromClasse(eClasse), nomTuteur: eNomTuteur.trim() || 'Tuteur légal',
        telTuteur: eTelTuteur.trim(), telWhatsAppTuteur: eWhatsAppTuteur.trim() || eTelTuteur.trim(),
        montantTotalScolarite: total, soldeRestant: remaining, estEnRegle: remaining === 0, updatedAt: serverTimestamp(),
      });
      setSelectedStudentDetails(null);
      setShowEditStudentModal(false);
      setStudentBeingEdited(null);
      resetStudentForm();
      notify('Fiche élève mise à jour.', 'success');
    } catch (error) {
      console.error('Mise à jour élève impossible.', error);
      notify("Impossible de modifier l'élève. Réessayez.", 'error');
    }
  };

  const handleArchiveStudent = async (student: Eleve) => {
    const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
    if (!etablissementId || !currentUser) {
      notify('Votre session établissement est incomplète. Reconnectez-vous puis réessayez.', 'error');
      return;
    }
    if (!window.confirm('Archiver l’élève ' + student.nom + ' ' + student.prenoms + ' ? Ses paiements resteront conservés.')) return;

    try {
      await updateDoc(doc(db, 'etablissements', etablissementId, 'eleves', student.id), {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedBy: currentUser.uid,
      });
      setSelectedStudentDetails(null);
      notify('Élève archivé. Les paiements associés sont conservés.', 'success');
    } catch (error) {
      console.error('Archivage élève impossible.', error);
      notify("Impossible d'archiver l'élève. Vérifiez votre connexion internet et réessayez.", 'error');
    }
  };

  const handleRestoreStudent = async (student: Eleve) => {
    const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
    if (!etablissementId || !currentUser) {
      notify('Votre session établissement est incomplète. Reconnectez-vous puis réessayez.', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'etablissements', etablissementId, 'eleves', student.id), {
        archived: false,
        archivedAt: null,
        archivedBy: null,
      });
      setSelectedStudentDetails(null);
      notify('Élève désarchivé avec succès.', 'success');
    } catch (error) {
      console.error('Désarchivage élève impossible.', error);
      notify("Impossible de désarchiver l'élève. Vérifiez votre connexion internet et réessayez.", 'error');
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

  // Paiement atomique : le reçu, l'écriture et le solde de l'élève sont modifiés ensemble.
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const etablissementId = schoolProfile?.id || userProfile?.etablissementId;
    const montantNum = Number(pMontant);
    const selectedStudent = pSelectedStudent || eleves.find((el) => el.id === targetStudentId);

    if (!etablissementId || !currentUser || !selectedStudent) {
      notify('Sélectionnez un élève existant avant de valider le paiement.', 'error');
      return;
    }
    if (!Number.isFinite(montantNum) || montantNum <= 0) {
      notify('Saisissez un montant de paiement strictement positif.', 'error');
      return;
    }
    if (montantNum > selectedStudent.soldeRestant) {
      notify('Le montant ne peut pas dépasser le solde dû de ' + selectedStudent.soldeRestant.toLocaleString('fr-FR') + ' FCFA.', 'error');
      return;
    }
    setIsCreatingPayment(true);
    try {
      const result = await runTransaction(db, async (transaction) => {
        const studentRef = doc(db, 'etablissements', etablissementId, 'eleves', selectedStudent.id);
        const receiptCounterRef = doc(db, 'etablissements', etablissementId, 'config', 'lastReceiptNumber');
        const paymentRef = doc(collection(db, 'etablissements', etablissementId, 'paiements'));
        const studentSnap = await transaction.get(studentRef);
        const counterSnap = await transaction.get(receiptCounterRef);

        if (!studentSnap.exists()) throw new Error('STUDENT_NOT_FOUND');
        const studentData = studentSnap.data() as Eleve;
        if (studentData.archived) throw new Error('STUDENT_ARCHIVED');

        const currentBalance = Number(studentData.soldeRestant || 0);
        if (montantNum > currentBalance) throw new Error('AMOUNT_EXCEEDS_BALANCE');

        const now = Timestamp.now();
        const year = now.toDate().getFullYear().toString();
        const counters = (counterSnap.data()?.counters || {}) as Record<string, number>;
        const nextReceiptNumber = Number(counters[year] || 0) + 1;
        const numeroRecu = 'REC-' + year + '-' + String(nextReceiptNumber).padStart(4, '0');
        const newMontantPaye = Number(studentData.montantPaye || 0) + montantNum;
        const newSoldeRestant = Math.max(0, Number(studentData.montantTotalScolarite || 0) - newMontantPaye);
        const caissierFinal = pCaissier.trim() || directeurNomComplete || 'Caisse / Secrétariat';

        const paymentData = {
          eleveId: selectedStudent.id,
          matriculeEleve: studentData.matricule,
          nomEleveComplete: (studentData.nom + ' ' + studentData.prenoms).trim(),
          classe: studentData.classe,
          montant: montantNum,
          modePaiement: pMode,
          referenceTransaction: pRef.trim() || 'CAISSE-' + numeroRecu,
          numeroRecu,
          datePaiement: formatPaymentDate(now.toDate()),
          paidAt: now,
          createdAt: now,
          statut: 'Validé' as const,
          libelleTranche: pTranche || 'Règlement scolarité',
          effectueParUid: currentUser.uid,
          caissierNom: caissierFinal,
        };

        transaction.set(paymentRef, paymentData);
        transaction.update(studentRef, {
          montantPaye: newMontantPaye,
          soldeRestant: newSoldeRestant,
          estEnRegle: newSoldeRestant === 0,
          updatedAt: now,
        });
        transaction.set(receiptCounterRef, {
          counters: { [year]: nextReceiptNumber },
          updatedAt: now,
        }, { merge: true });

        return {
          payment: { id: paymentRef.id, ...paymentData },
          student: { ...studentData, id: selectedStudent.id, montantPaye: newMontantPaye, soldeRestant: newSoldeRestant, estEnRegle: newSoldeRestant === 0 } as Eleve,
        };
      });

      setSelectedReceipt(result.payment);
      generatePaymentReceiptPDF(result.payment, result.student, schoolProfile, result.payment.caissierNom);
      setPNomEleve('');
      setPMontant('');
      setPRef('');
      setPStudentSearch('');
      setPSelectedStudent(null);
      setTargetStudentId(null);
      setShowAddPaymentModal(false);
      notify('Paiement enregistré. Reçu ' + result.payment.numeroRecu + ' généré.', 'success');
    } catch (error: any) {
      console.error('Transaction de paiement impossible.', error);
      const message = error?.message === 'AMOUNT_EXCEEDS_BALANCE'
        ? 'Le paiement dépasse le solde restant de cet élève.'
        : error?.message === 'STUDENT_ARCHIVED'
          ? 'Cet élève est archivé et ne peut pas recevoir de paiement.'
          : "Impossible d'enregistrer le paiement. Aucune modification n'a été effectuée.";
      notify(message, 'error');
    } finally {
      setIsCreatingPayment(false);
    }
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

  // Les élèves archivés sont isolés de toutes les opérations courantes, mais restent consultables.
  const displayedStudents = showArchivedStudents ? archivedEleves : eleves;
  const filteredEleves = displayedStudents.filter((el) => {
    const nomComplet = [el.nom, el.prenoms, el.matricule, el.telTuteur || ''].join(' ').toLowerCase();
    const matchesSearch = nomComplet.includes(searchTerm.toLowerCase());
    const matchesClasse = selectedClasseFilter === 'Toutes' || el.classe === selectedClasseFilter;
    const status = getStatutPaiement(el);
    const matchesStatus = selectedStatusFilter === 'Tous' || status === selectedStatusFilter;
    return matchesSearch && matchesClasse && matchesStatus;
  });

  const studentSearchDropdownList = eleves.filter((el) => {
    if (!pStudentSearch) return true;
    const term = pStudentSearch.toLowerCase();
    return [el.nom, el.prenoms, el.matricule, el.classe].join(' ').toLowerCase().includes(term);
  });

  const filteredPaiements = paiements.filter((p) => {
    const matchesSearch = [p.nomEleveComplete, p.matriculeEleve, p.numeroRecu, p.referenceTransaction || '', p.caissierNom || ''].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = selectedModeFilter === 'Tous' || p.modePaiement === selectedModeFilter;
    const matchesClasse = selectedClasseFilter === 'Toutes' || p.classe === selectedClasseFilter;
    const matchesDate = selectedDateFilter === 'Toutes'
      || isWithinCurrentPeriod(p.paidAt || p.createdAt || p.datePaiement, selectedDateFilter);
    return matchesSearch && matchesMode && matchesClasse && matchesDate;
  });

  const draftTotal = Math.max(0, Number(eMontantTotal) || 0);
  const draftPaid = showEditStudentModal ? Number(studentBeingEdited?.montantPaye || 0) : Math.max(0, Number(eMontantDejaPaye) || 0);
  const draftRemaining = Math.max(0, draftTotal - draftPaid);
  const draftStatus = draftPaid <= 0 ? 'Impayé' : draftRemaining === 0 ? 'Payé' : 'Partiellement payé';

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
          <div className="p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between bg-emerald-500/20 border-emerald-400/30 text-emerald-200">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 bg-emerald-400 animate-pulse" />
              Synchronisation Firebase active
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

          {onOpenSubscription && (
            <button
              onClick={() => { onOpenSubscription(); setSidebarOpen(false); }}
              className="w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold text-emerald-200 hover:bg-[#1E293B]/60 hover:text-white transition-all cursor-pointer"
            >
              <Wallet className="w-5 h-5 shrink-0" />
              <span>Abonnement</span>
            </button>
          )}

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
                  <span className="truncate">{schoolProfile?.nom || "Établissement scolaire"}</span>
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
          {licenceExpiresSoon && licenceExpiry && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              <div><p className="text-sm font-black">Votre abonnement expire le {licenceExpiry.toLocaleDateString('fr-FR')}.</p><p className="mt-0.5 text-xs font-semibold">Renouvelez maintenant pour ne pas perdre l’accès aux fonctionnalités premium.</p></div>
              {onOpenSubscription && <button onClick={onOpenSubscription} className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black">Renouveler</button>}
            </div>
          )}

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
                                schoolProfile,
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

                    <button
                      type="button"
                      onClick={() => setShowArchivedStudents((value) => !value)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      {showArchivedStudents ? 'Voir les élèves actifs' : 'Voir les élèves archivés (' + archivedEleves.length + ')'}
                    </button>
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      disabled={showArchivedStudents}
                      className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inscrire un Élève</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2" aria-label="Filtres rapides de paiement">
                  {([
                    { value: 'Tous', label: 'Tous', style: 'bg-slate-100 text-slate-700 border-slate-200' },
                    { value: 'Payé', label: `Payés (${countPaye})`, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { value: 'Partiel', label: `Partiellement payés (${countPartiel})`, style: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { value: 'Impayé', label: `Impayés (${countImpaye})`, style: 'bg-rose-50 text-rose-700 border-rose-200' },
                  ] as const).map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSelectedStatusFilter(filter.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${filter.style} ${selectedStatusFilter === filter.value ? 'ring-2 ring-[#16A34A]/25' : 'opacity-80 hover:opacity-100'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
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
                                      href={getWhatsAppReminderUrl(el, schoolProfile?.nom || 'Établissement scolaire')}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-all"
                                      title="Envoyer rappel WhatsApp pré-rempli au parent"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Rappel WA</span>
                                    </a>
                                  )}

                                  {!showArchivedStudents && (
                                    <button
                                      onClick={() => handleOpenPaymentForStudent(el)}
                                      className="px-2.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-all"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Enregistrer</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStudent(el)}
                                    className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl border border-sky-200 dark:border-sky-500/30 inline-flex items-center space-x-1 cursor-pointer transition-all"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Modifier</span>
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
                        <option value="Cette semaine">Cette semaine</option>
                        <option value="Ce mois">Ce mois-ci</option>
                        <option value="Cette année">Cette année</option>
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
                                    schoolProfile,
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
            <SchoolSettingsView onOpenSubscription={onOpenSubscription} />
          )}

        </div>

      </main>

      {/* MODALE : AJOUT / MODIFICATION D’UN ÉLÈVE */}
      {(showAddStudentModal || showEditStudentModal) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] p-5 sm:p-7 shadow-2xl animate-modalIn">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#16A34A]">Dossier élève</p>
                <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{showEditStudentModal ? 'Modifier l’élève' : 'Ajouter un élève'}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Le reste à payer et le statut sont calculés automatiquement.</p>
              </div>
              <button type="button" onClick={() => { setShowAddStudentModal(false); setShowEditStudentModal(false); setStudentBeingEdited(null); resetStudentForm(); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={showEditStudentModal ? handleEditStudent : handleCreateStudent} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nom de l’élève *
                  <input value={eNom} onChange={(e) => setENom(e.target.value)} required placeholder="Kouassi" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/40" />
                </label>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Prénom(s) *
                  <input value={ePrenoms} onChange={(e) => setEPrenoms(e.target.value)} required placeholder="Jean" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/40" />
                </label>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Matricule *
                  <input value={eMatricule} onChange={(e) => setEMatricule(e.target.value)} required placeholder="2026001" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-mono font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/40" />
                </label>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Classe *
                  <select value={eClasse} onChange={(e) => setEClasse(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/40">
                    {listClassesDisponibles.map((classe) => <option key={classe} value={classe}>{classe}</option>)}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Parent ou tuteur</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nom du tuteur
                    <input value={eNomTuteur} onChange={(e) => setENomTuteur(e.target.value)} placeholder="Kouassi Marie" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Téléphone *
                    <input value={eTelTuteur} onChange={(e) => setETelTuteur(e.target.value)} required inputMode="tel" placeholder="07 00 00 00 00" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900" />
                  </label>
                  <label className="text-xs font-bold text-[#168A48] sm:col-span-2">Numéro WhatsApp de relance *
                    <input value={eWhatsAppTuteur} onChange={(e) => setEWhatsAppTuteur(e.target.value)} inputMode="tel" placeholder="07 00 00 00 00" className="mt-1.5 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-500/10" />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Situation financière</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Frais scolaires totaux (FCFA) *
                    <input type="number" min="0" value={eMontantTotal} onChange={(e) => setEMontantTotal(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-black outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Montant déjà payé (FCFA)
                    <input type="number" min="0" max={eMontantTotal || undefined} value={showEditStudentModal ? String(studentBeingEdited?.montantPaye || 0) : eMontantDejaPaye} onChange={(e) => setEMontantDejaPaye(e.target.value)} disabled={showEditStudentModal} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-black outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900" />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900"><span className="block text-slate-400">Payé</span><strong className="mt-1 block text-emerald-600">{draftPaid.toLocaleString('fr-FR')} FCFA</strong></div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900"><span className="block text-slate-400">Reste</span><strong className="mt-1 block text-rose-600">{draftRemaining.toLocaleString('fr-FR')} FCFA</strong></div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900"><span className="block text-slate-400">Statut</span><strong className={`mt-1 block ${draftStatus === 'Payé' ? 'text-emerald-600' : draftStatus === 'Impayé' ? 'text-rose-600' : 'text-amber-600'}`}>{draftStatus}</strong></div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
                <button type="button" onClick={() => { setShowAddStudentModal(false); setShowEditStudentModal(false); setStudentBeingEdited(null); resetStudentForm(); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
                <button type="submit" disabled={isCreatingStudent || draftPaid > draftTotal} className="rounded-xl bg-[#16A34A] px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60">{isCreatingStudent ? 'Enregistrement…' : showEditStudentModal ? 'Enregistrer les modifications' : 'Ajouter l’élève'}</button>
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
                  <span>{selectedStudentDetails.telWhatsAppTuteur || selectedStudentDetails.telTuteur}</span>
                </div>
              </div>

              {selectedStudentDetails.soldeRestant > 0 && (
                <a
                  href={getWhatsAppReminderUrl(selectedStudentDetails, schoolProfile?.nom || 'Établissement scolaire')}
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
                                  schoolProfile,
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
                onClick={() => selectedStudentDetails.archived ? handleRestoreStudent(selectedStudentDetails) : handleArchiveStudent(selectedStudentDetails)}
                className="px-3.5 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-500/30 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{selectedStudentDetails.archived ? "Désarchiver l'élève" : "Archiver l'élève"}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleOpenEditStudent(selectedStudentDetails);
                    setSelectedStudentDetails(null);
                  }}
                  className="px-4 py-2 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl border border-sky-200 dark:border-sky-500/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenPaymentForStudent(selectedStudentDetails);
                    setSelectedStudentDetails(null);
                  }}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Enregistrer un paiement</span>
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
                Enregistrer un paiement reçu
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Montant reçu (FCFA) *</label>
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Moyen de règlement reçu *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Wave', label: 'Wave CI 🟦' },
                    { id: 'Orange Money', label: 'Orange 🟧' },
                    { id: 'MTN MoMo', label: 'MTN 🟨' },
                    { id: 'Espèces', label: 'Espèces 🟩' },
                    { id: 'Moov Money', label: 'Moov' },
                    { id: 'Virement', label: 'Virement' },
                    { id: 'Autre', label: 'Autre' },
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Référence du règlement (facultatif pour espèces)</label>
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
                  disabled={isCreatingPayment}
                  className="px-6 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isCreatingPayment ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Enregistrement…</span></>
                  ) : (
                    <><Check className="w-4 h-4" /><span>Valider & Générer Reçu PDF</span></>
                  )}
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
                  {schoolProfile?.nom || 'Établissement scolaire'}
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
                  schoolProfile,
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
