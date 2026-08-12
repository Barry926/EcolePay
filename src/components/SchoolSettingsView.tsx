import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Upload, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  GraduationCap, 
  Lock, 
  Sparkles, 
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SchoolSettings, TrancheConfig, ComptePersonnel } from '../types';

interface SchoolSettingsViewProps {
  onOpenSubscription?: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({ onOpenSubscription }) => {
  const { schoolProfile } = useAuth();
  const schoolId = schoolProfile?.id || 'EP-ABJ-101';

  // 1. Informations de l'école
  const [nomEtablissement, setNomEtablissement] = useState(
    schoolProfile?.nom || "Groupe Scolaire Sainte-Marie d'Abidjan"
  );
  const [adresse, setAdresse] = useState(
    schoolProfile?.adresse || "Riviera 2, Boulevard Mitterrand, Cocody"
  );
  const [telephoneDirecteur, setTelephoneDirecteur] = useState(
    schoolProfile?.telephone || "+225 07 48 29 10 00"
  );
  const [emailOfficiel, setEmailOfficiel] = useState(
    schoolProfile?.email || "direction@saintemarie-abidjan.ci"
  );
  const [codeMena, setCodeMena] = useState("MENA-ABJ-2026-0842");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(
    schoolProfile?.logoUrl || undefined
  );

  // 2. Configuration des tranches de scolarité
  const [tranches, setTranches] = useState<TrancheConfig[]>([
    { id: 'tr-1', nom: '1ère Tranche (Inscription / Acompte)', dateLimite: '2026-09-15', montant: 100000 },
    { id: 'tr-2', nom: '2ème Tranche (Mi-Trimestre 1)', dateLimite: '2026-11-30', montant: 80000 },
    { id: 'tr-3', nom: '3ème Tranche (Solde Annuel)', dateLimite: '2027-02-15', montant: 70000 },
  ]);

  // Formulaire Nouvelle Tranche
  const [newTrancheNom, setNewTrancheNom] = useState('');
  const [newTrancheDate, setNewTrancheDate] = useState('');
  const [newTrancheMontant, setNewTrancheMontant] = useState('');

  // 3. Liste des classes disponibles
  const [classesList, setClassesList] = useState<string[]>([
    'Maternelle Petite Section', 'Maternelle Moyenne Section', 'Maternelle Grande Section',
    'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème A', '6ème B', '6ème C',
    '5ème 1', '5ème 2',
    '4ème 1', '4ème 2',
    '3ème 1', '3ème 2',
    '2nde A', '2nde C',
    '1ère A', '1ère D1', '1ère D2',
    'Terminale A1', 'Terminale A2', 'Terminale D', 'Terminale C'
  ]);
  const [newClasseInput, setNewClasseInput] = useState('');

  // 4. Gestion des utilisateurs (Secrétaires, Comptables)
  const [personnelList, setPersonnelList] = useState<ComptePersonnel[]>([
    {
      id: 'pers-1',
      email: 'directeur@saintemarie.ci',
      nomComplet: 'Directeur Kouadio Jean',
      role: 'admin_fondateur',
      actif: true,
      createdAt: '2026-01-10'
    },
    {
      id: 'pers-2',
      email: 'secretaire.caisse@saintemarie.ci',
      nomComplet: 'Koffi Amenan Chantal (Secrétariat Caisse)',
      role: 'secretaire',
      actif: true,
      createdAt: '2026-02-01'
    }
  ]);

  // Formulaire Ajouter un secrétaire
  const [newSecNom, setNewSecNom] = useState('');
  const [newSecEmail, setNewSecEmail] = useState('');
  const [newSecPassword, setNewSecPassword] = useState('');

  // Feedbacks
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeSection, setActiveSection] = useState<'info' | 'tranches' | 'classes' | 'utilisateurs'>('info');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<{ status: 'active' | 'expired' | 'invalid'; expiresAt?: string | null; keyMasked?: string } | null>(schoolProfile?.licence || null);
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  // Charger la configuration depuis Firestore
  useEffect(() => {
    if (!db) return;

    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'schools', schoolId, 'settings', 'config');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data() as SchoolSettings;
          if (data.nomEtablissement) setNomEtablissement(data.nomEtablissement);
          if (data.adresse) setAdresse(data.adresse);
          if (data.telephoneDirecteur) setTelephoneDirecteur(data.telephoneDirecteur);
          if (data.emailOfficiel) setEmailOfficiel(data.emailOfficiel);
          if (data.codeMena) setCodeMena(data.codeMena);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.tranches && data.tranches.length > 0) setTranches(data.tranches);
          if (data.classes && data.classes.length > 0) setClassesList(data.classes);
          if (data.personnel && data.personnel.length > 0) setPersonnelList(data.personnel);
        }
      } catch (err) {
        console.warn("Notice: Impossibilité de charger Firestore settings (mode fallback local):", err);
      }
    };

    loadSettings();
  }, [schoolId]);

  // Sauvegarder dans Firestore (schools/{schoolId}/settings/config)
  const handleSaveAllSettings = async () => {
    setSavingStatus('saving');

    const payload: SchoolSettings = {
      nomEtablissement,
      adresse,
      telephoneDirecteur,
      emailOfficiel,
      logoUrl,
      codeMena,
      tranches,
      classes: classesList,
      personnel: personnelList
    };

    if (db) {
      try {
        // Sauvegarde principale dans schools/{schoolId}/settings/config
        await setDoc(doc(db, 'schools', schoolId, 'settings', 'config'), payload);
        // Synchronisation du profil de l'établissement
        await setDoc(doc(db, 'etablissements', schoolId), {
          nom: nomEtablissement,
          adresse,
          telephone: telephoneDirecteur,
          email: emailOfficiel,
          logoUrl,
          codeMena
        }, { merge: true });

        setSavingStatus('success');
      } catch (err) {
        console.error("Erreur sauvegarde Firestore:", err);
        setSavingStatus('error');
      }
    }

    setTimeout(() => {
      setSavingStatus('idle');
    }, 3500);
  };

  // Upload du Logo (base64 pour prévisualisation immédiate)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActivateLicense = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedKey = licenseKey.trim();
    if (!normalizedKey) {
      setLicenseError('Saisissez votre clé de licence avant de l’activer.');
      return;
    }

    setIsActivatingLicense(true);
    setLicenseError(null);
    try {
      const response = await fetch('/api/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: normalizedKey }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.valid) {
        setLicenseError(result.error || 'Licence expirée ou invalide. Veuillez renouveler votre abonnement.');
        return;
      }

      const licence = {
        keyMasked: `••••${normalizedKey.slice(-4)}`,
        status: 'active' as const,
        expiresAt: result.license?.expiresAt || null,
        validatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'etablissements', schoolId), { licence }, { merge: true });
      setLicenseStatus(licence);
      setLicenseKey('');
    } catch (error) {
      console.error('Activation de licence impossible.', error);
      setLicenseError('Impossible d’activer la licence. Vérifiez votre connexion internet et réessayez.');
    } finally {
      setIsActivatingLicense(false);
    }
  };

  // Gestion des Tranches
  const handleAddTranche = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrancheNom || !newTrancheMontant) return;

    const newTr: TrancheConfig = {
      id: `tr-${Date.now()}`,
      nom: newTrancheNom,
      dateLimite: newTrancheDate || '2026-12-31',
      montant: Number(newTrancheMontant) || 0
    };

    setTranches(prev => [...prev, newTr]);
    setNewTrancheNom('');
    setNewTrancheDate('');
    setNewTrancheMontant('');
  };

  const handleDeleteTranche = (id: string) => {
    setTranches(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTranche = (id: string, key: keyof TrancheConfig, value: any) => {
    setTranches(prev => prev.map(t => t.id === id ? { ...t, [key]: value } : t));
  };

  // Gestion des Classes
  const handleAddClasse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClasseInput.trim()) return;

    const formatted = newClasseInput.trim();
    if (!classesList.includes(formatted)) {
      setClassesList(prev => [...prev, formatted]);
    }
    setNewClasseInput('');
  };

  const handleDeleteClasse = (classeName: string) => {
    setClassesList(prev => prev.filter(c => c !== classeName));
  };

  // Gestion du Personnel (Secrétaires)
  const handleAddSecretaire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecEmail || !newSecNom) return;

    const newPers: ComptePersonnel = {
      id: `pers-${Date.now()}`,
      email: newSecEmail.trim(),
      nomComplet: newSecNom.trim(),
      role: 'secretaire',
      actif: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setPersonnelList(prev => [...prev, newPers]);
    setNewSecNom('');
    setNewSecEmail('');
    setNewSecPassword('');
  };

  const handleToggleUserStatus = (id: string) => {
    setPersonnelList(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, actif: !p.actif };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* EN-TETE PRINCIPAL AVEC AVERTISSEMENT / BOUTON ENREGISTRER */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-[#0F172A]" />
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Paramètres & Configuration École
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gérez les coordonnées de l'établissement, les tranches de paiement, les classes et les accès secrétariat.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveAllSettings}
            disabled={savingStatus === 'saving'}
            className="w-full md:w-auto px-5 py-3 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingStatus === 'saving' ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Sauvegarder la Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK MESSAGE DE CONFIRMATION */}
      {savingStatus === 'success' && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Configuration sauvegardée avec succès dans Firestore sous <code className="bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-300">schools/{schoolId}/settings</code> !</span>
        </div>
      )}

      {savingStatus === 'error' && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Une erreur est survenue lors de l'enregistrement. Vérifiez votre connexion internet ou vos règles Firebase.</span>
        </div>
      )}

      {/* NAVIGATION TABS MOBILE & DESKTOP */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSection('info')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'info'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Infos Établissement</span>
        </button>

        <button
          onClick={() => setActiveSection('tranches')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'tranches'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>2. Tranches Scolarité ({tranches.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'classes'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>3. Classes ({classesList.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('utilisateurs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'utilisateurs'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>4. Secrétariat & Utilisateurs ({personnelList.length})</span>
        </button>
      </div>

      {/* SECTION 1 : INFORMATIONS DE L'ÉCOLE */}
      {(activeSection === 'info' || activeSection === undefined) && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-[#16A34A]" />
                Informations Légales de l'Établissement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ces informations figureront sur les reçus officiels PDF générés</p>
            </div>
            <span className="text-[11px] font-bold text-[#0F172A] bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-500/30 hidden sm:inline-block">
              Ministère de l'Éducation Nationale 🇨🇮
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nom de l'école */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                Nom Officiel de l'Établissement *
              </label>
              <input
                type="text"
                value={nomEtablissement}
                onChange={(e) => setNomEtablissement(e.target.value)}
                placeholder="Ex: Groupe Scolaire Sainte-Marie d'Abidjan"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                required
              />
            </div>

            {/* Code MENA */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#16A34A]" />
                Code MENA (Matricule Ministère) *
              </label>
              <input
                type="text"
                value={codeMena}
                onChange={(e) => setCodeMena(e.target.value)}
                placeholder="Ex: MENA-ABJ-2026-0842"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {/* Adresse */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                Adresse Physique Complète *
              </label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Boulevard Latrille, Cocody Riviera 2, Abidjan"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {/* Téléphone Directeur */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                Téléphone Directeur / Secrétariat *
              </label>
              <input
                type="text"
                value={telephoneDirecteur}
                onChange={(e) => setTelephoneDirecteur(e.target.value)}
                placeholder="Ex: +225 07 48 29 10 00"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {/* Email Officiel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                Email Officiel d'Établissement *
              </label>
              <input
                type="email"
                value={emailOfficiel}
                onChange={(e) => setEmailOfficiel(e.target.value)}
                placeholder="Ex: direction@saintemarie-abidjan.ci"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {/* Upload Logo École */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                Logo Officiel de l'École (Image)
              </label>
              <div className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo École" className="w-12 h-12 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B]" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] text-white font-black text-sm flex items-center justify-center">
                    EP
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    id="logo-upload-input"
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="px-3 py-1.5 bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{logoUrl ? 'Changer le Logo' : 'Uploader Image Logo'}</span>
                  </label>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Format PNG, JPG recommandé (Max 2 Mo)</p>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/5 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-50 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Abonnement EcolePay CI</h4>
                  {licenseStatus?.status === 'active' ? (
                    <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300">Licence {licenseStatus.keyMasked || ''} active{licenseStatus.expiresAt ? ` jusqu'au ${new Date(licenseStatus.expiresAt).toLocaleDateString('fr-FR')}` : ''}.</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">Activez la clé reçue par email après votre paiement pour bénéficier de l’accès complet.</p>
                  )}
                </div>
                {onOpenSubscription && <button type="button" onClick={onOpenSubscription} className="shrink-0 px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-black">{licenseStatus?.status === 'active' ? 'Renouveler' : 'Voir les abonnements'}</button>}
              </div>

              <form onSubmit={handleActivateLicense} className="mt-4 flex flex-col sm:flex-row gap-2">
                <label className="sr-only" htmlFor="license-key">Clé de licence</label>
                <input id="license-key" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="Entrez votre clé de licence" className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#16A34A]" />
                <button type="submit" disabled={isActivatingLicense} className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#0B1120] text-white text-xs font-black disabled:opacity-50">{isActivatingLicense ? 'Validation…' : 'Activer'}</button>
              </form>
              {licenseError && <p role="alert" className="mt-3 text-xs font-bold text-rose-700 dark:text-rose-300">{licenseError}</p>}
            </section>

          </div>
        </div>
      )}

      {/* SECTION 2 : CONFIGURATION DES TRANCHES */}
      {activeSection === 'tranches' && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#16A34A]" />
                Échéancier & Tranches de Scolarité
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configurez les tranches d'encaissement et leurs dates limites d'échéance</p>
            </div>
          </div>

          {/* LISTE DES TRANCHES ACTUELLES */}
          <div className="space-y-3">
            {tranches.map((tr, index) => (
              <div key={tr.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-white font-black text-xs flex items-center justify-center shrink-0">
                    T{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={tr.nom}
                      onChange={(e) => handleUpdateTranche(tr.id, 'nom', e.target.value)}
                      className="bg-transparent font-bold text-slate-900 dark:text-slate-50 text-xs border-b border-transparent hover:border-slate-300 focus:border-[#16A34A] focus:outline-none w-full"
                    />
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-[#16A34A]" />
                        Échéance: {tr.dateLimite}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <input
                      type="number"
                      value={tr.montant}
                      onChange={(e) => handleUpdateTranche(tr.id, 'montant', Number(e.target.value))}
                      className="w-28 text-right bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-[#16A34A]"
                    />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1">FCFA</span>
                  </div>

                  <button
                    onClick={() => handleDeleteTranche(tr.id)}
                    className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Supprimer Tranche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FORMULAIRE D'AJOUT DE TRANCHE */}
          <form onSubmit={handleAddTranche} className="p-4 bg-orange-50 dark:bg-orange-500/10/50 border border-orange-200 dark:border-orange-500/30 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-[#16A34A] flex items-center uppercase tracking-wider">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une Nouvelle Tranche de Scolarité
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Libellé Tranche *</label>
                <input
                  type="text"
                  value={newTrancheNom}
                  onChange={(e) => setNewTrancheNom(e.target.value)}
                  placeholder="Ex: 4ème Tranche (Solde Spécial)"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Date Limite Échéance *</label>
                <input
                  type="date"
                  value={newTrancheDate}
                  onChange={(e) => setNewTrancheDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Montant Exigé (FCFA) *</label>
                <input
                  type="number"
                  value={newTrancheMontant}
                  onChange={(e) => setNewTrancheMontant(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Valider Nouvelle Tranche</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3 : LISTE DES CLASSES DISPONIBLES */}
      {activeSection === 'classes' && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-[#0F172A]" />
                Répertoire des Classes de l'Établissement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ajoutez ou retirez les classes enregistrées dans votre école</p>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {classesList.length} Classes Actives
            </span>
          </div>

          {/* Formulaire ajout rapide classe */}
          <form onSubmit={handleAddClasse} className="flex gap-2">
            <input
              type="text"
              value={newClasseInput}
              onChange={(e) => setNewClasseInput(e.target.value)}
              placeholder="Ex: Terminale C2, 5ème 3, CP1 B..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#0F172A] hover:bg-[#0B1120] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Classe</span>
            </button>
          </form>

          {/* Badge Grid des classes */}
          <div className="flex flex-wrap gap-2 pt-2">
            {classesList.map((cls) => (
              <div
                key={cls}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors group"
              >
                <span>{cls}</span>
                <button
                  onClick={() => handleDeleteClasse(cls)}
                  className="text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors p-0.5"
                  title="Supprimer la classe"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4 : GESTION DES UTILISATEURS (SECRETAIRES) */}
      {activeSection === 'utilisateurs' && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-[#16A34A]" />
                Gestion du Personnel & Comptes Secrétariat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ajoutez des agents pour la caisse et gérez leurs droits d'accès</p>
            </div>
          </div>

          {/* LISTE DES COMPTES UTILISATEURS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3">Nom & Email Agent</th>
                  <th className="px-4 py-3">Rôle & Fonction</th>
                  <th className="px-4 py-3">Statut Compte</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {personnelList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-slate-50">{p.nomComplet}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.role === 'admin_fondateur' 
                          ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' 
                          : 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                      }`}>
                        {p.role === 'admin_fondateur' ? 'Directeur / Admin' : 'Secrétaire / Caisse'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.actif ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                          <UserX className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                          Désactivé
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.role !== 'admin_fondateur' && (
                        <button
                          onClick={() => handleToggleUserStatus(p.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                            p.actif 
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                          }`}
                        >
                          {p.actif ? 'Désactiver le compte' : 'Réactiver le compte'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FORMULAIRE D'AJOUT D'UN SECRETAIRE */}
          <form onSubmit={handleAddSecretaire} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50 flex items-center uppercase tracking-wider">
              <UserPlus className="w-4 h-4 mr-1 text-[#16A34A]" />
              Ajouter un Nouveau Secrétaire / Agent de Caisse
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Nom & Prénom Agent *</label>
                <input
                  type="text"
                  value={newSecNom}
                  onChange={(e) => setNewSecNom(e.target.value)}
                  placeholder="Ex: Koné Bintou (Secrétaire)"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Email de Connexion *</label>
                <input
                  type="email"
                  value={newSecEmail}
                  onChange={(e) => setNewSecEmail(e.target.value)}
                  placeholder="Ex: bintou.kone@saintemarie.ci"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Mot de Passe Initial *</label>
                <input
                  type="password"
                  value={newSecPassword}
                  onChange={(e) => setNewSecPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#0F172A] hover:bg-[#0B1120] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer le Compte Secrétaire</span>
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
