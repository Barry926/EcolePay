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

export const SchoolSettingsView: React.FC = () => {
  const { schoolProfile, isDemoMode } = useAuth();
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

  // Charger la configuration depuis Firestore
  useEffect(() => {
    if (isDemoMode || !db) return;

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
  }, [schoolId, isDemoMode]);

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

    if (!isDemoMode && db) {
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
    } else {
      // Mode démo simulation
      setTimeout(() => {
        setSavingStatus('success');
      }, 500);
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-[#1e3a5f]" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Paramètres & Configuration École
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez les coordonnées de l'établissement, les tranches de paiement, les classes et les accès secrétariat.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveAllSettings}
            disabled={savingStatus === 'saving'}
            className="w-full md:w-auto px-5 py-3 bg-[#FF8200] hover:bg-[#e07200] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Configuration sauvegardée avec succès dans Firestore sous <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900">schools/{schoolId}/settings</code> !</span>
        </div>
      )}

      {savingStatus === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Une erreur est survenue lors de l'enregistrement. Vérifiez votre connexion internet ou vos règles Firebase.</span>
        </div>
      )}

      {/* NAVIGATION TABS MOBILE & DESKTOP */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSection('info')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'info'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Infos Établissement</span>
        </button>

        <button
          onClick={() => setActiveSection('tranches')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'tranches'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>2. Tranches Scolarité ({tranches.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'classes'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>3. Classes ({classesList.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('utilisateurs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-colors cursor-pointer ${
            activeSection === 'utilisateurs'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>4. Secrétariat & Utilisateurs ({personnelList.length})</span>
        </button>
      </div>

      {/* SECTION 1 : INFORMATIONS DE L'ÉCOLE */}
      {(activeSection === 'info' || activeSection === undefined) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-[#FF8200]" />
                Informations Légales de l'Établissement
              </h3>
              <p className="text-xs text-slate-500">Ces informations figureront sur les reçus officiels PDF générés</p>
            </div>
            <span className="text-[11px] font-bold text-[#1e3a5f] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 hidden sm:inline-block">
              Ministère de l'Éducation Nationale 🇨🇮
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nom de l'école */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Nom Officiel de l'Établissement *
              </label>
              <input
                type="text"
                value={nomEtablissement}
                onChange={(e) => setNomEtablissement(e.target.value)}
                placeholder="Ex: Groupe Scolaire Sainte-Marie d'Abidjan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
                required
              />
            </div>

            {/* Code MENA */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#FF8200]" />
                Code MENA (Matricule Ministère) *
              </label>
              <input
                type="text"
                value={codeMena}
                onChange={(e) => setCodeMena(e.target.value)}
                placeholder="Ex: MENA-ABJ-2026-0842"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
              />
            </div>

            {/* Adresse */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Adresse Physique Complète *
              </label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Boulevard Latrille, Cocody Riviera 2, Abidjan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
              />
            </div>

            {/* Téléphone Directeur */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Téléphone Directeur / Secrétariat *
              </label>
              <input
                type="text"
                value={telephoneDirecteur}
                onChange={(e) => setTelephoneDirecteur(e.target.value)}
                placeholder="Ex: +225 07 48 29 10 00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
              />
            </div>

            {/* Email Officiel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Email Officiel d'Établissement *
              </label>
              <input
                type="email"
                value={emailOfficiel}
                onChange={(e) => setEmailOfficiel(e.target.value)}
                placeholder="Ex: direction@saintemarie-abidjan.ci"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
              />
            </div>

            {/* Upload Logo École */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Logo Officiel de l'École (Image)
              </label>
              <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo École" className="w-12 h-12 rounded-lg object-contain border border-slate-200 bg-white" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#1e3a5f] text-white font-black text-sm flex items-center justify-center">
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
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FF8200]" />
                    <span>{logoUrl ? 'Changer le Logo' : 'Uploader Image Logo'}</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Format PNG, JPG recommandé (Max 2 Mo)</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2 : CONFIGURATION DES TRANCHES */}
      {activeSection === 'tranches' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#FF8200]" />
                Échéancier & Tranches de Scolarité
              </h3>
              <p className="text-xs text-slate-500">Configurez les tranches d'encaissement et leurs dates limites d'échéance</p>
            </div>
          </div>

          {/* LISTE DES TRANCHES ACTUELLES */}
          <div className="space-y-3">
            {tranches.map((tr, index) => (
              <div key={tr.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1e3a5f] text-white font-black text-xs flex items-center justify-center shrink-0">
                    T{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={tr.nom}
                      onChange={(e) => handleUpdateTranche(tr.id, 'nom', e.target.value)}
                      className="bg-transparent font-bold text-slate-900 text-xs border-b border-transparent hover:border-slate-300 focus:border-[#FF8200] focus:outline-none w-full"
                    />
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-[#FF8200]" />
                        Échéance: {tr.dateLimite}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <div className="text-right">
                    <input
                      type="number"
                      value={tr.montant}
                      onChange={(e) => handleUpdateTranche(tr.id, 'montant', Number(e.target.value))}
                      className="w-28 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-slate-900 focus:ring-1 focus:ring-[#FF8200]"
                    />
                    <span className="text-[10px] font-bold text-slate-400 ml-1">FCFA</span>
                  </div>

                  <button
                    onClick={() => handleDeleteTranche(tr.id)}
                    className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Supprimer Tranche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FORMULAIRE D'AJOUT DE TRANCHE */}
          <form onSubmit={handleAddTranche} className="p-4 bg-orange-50/50 border border-orange-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-[#FF8200] flex items-center uppercase tracking-wider">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une Nouvelle Tranche de Scolarité
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Libellé Tranche *</label>
                <input
                  type="text"
                  value={newTrancheNom}
                  onChange={(e) => setNewTrancheNom(e.target.value)}
                  placeholder="Ex: 4ème Tranche (Solde Spécial)"
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF8200]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Date Limite Échéance *</label>
                <input
                  type="date"
                  value={newTrancheDate}
                  onChange={(e) => setNewTrancheDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF8200]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Montant Exigé (FCFA) *</label>
                <input
                  type="number"
                  value={newTrancheMontant}
                  onChange={(e) => setNewTrancheMontant(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF8200]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#FF8200] hover:bg-[#e07200] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Valider Nouvelle Tranche</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3 : LISTE DES CLASSES DISPONIBLES */}
      {activeSection === 'classes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-[#1e3a5f]" />
                Répertoire des Classes de l'Établissement
              </h3>
              <p className="text-xs text-slate-500">Ajoutez ou retirez les classes enregistrées dans votre école</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
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
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#162a45] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
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
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors group"
              >
                <span>{cls}</span>
                <button
                  onClick={() => handleDeleteClasse(cls)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-[#FF8200]" />
                Gestion du Personnel & Comptes Secrétariat
              </h3>
              <p className="text-xs text-slate-500">Ajoutez des agents pour la caisse et gérez leurs droits d'accès</p>
            </div>
          </div>

          {/* LISTE DES COMPTES UTILISATEURS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <th className="px-4 py-3">Nom & Email Agent</th>
                  <th className="px-4 py-3">Rôle & Fonction</th>
                  <th className="px-4 py-3">Statut Compte</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {personnelList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.nomComplet}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.role === 'admin_fondateur' 
                          ? 'bg-purple-50 text-purple-800 border-purple-200' 
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {p.role === 'admin_fondateur' ? 'Directeur / Admin' : 'Secrétaire / Caisse'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.actif ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          <UserX className="w-3.5 h-3.5 mr-1 text-slate-400" />
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
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
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
          <form onSubmit={handleAddSecretaire} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center uppercase tracking-wider">
              <UserPlus className="w-4 h-4 mr-1 text-[#FF8200]" />
              Ajouter un Nouveau Secrétaire / Agent de Caisse
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Nom & Prénom Agent *</label>
                <input
                  type="text"
                  value={newSecNom}
                  onChange={(e) => setNewSecNom(e.target.value)}
                  placeholder="Ex: Koné Bintou (Secrétaire)"
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF8200]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Email de Connexion *</label>
                <input
                  type="email"
                  value={newSecEmail}
                  onChange={(e) => setNewSecEmail(e.target.value)}
                  placeholder="Ex: bintou.kone@saintemarie.ci"
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF8200]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Mot de Passe Initial *</label>
                <input
                  type="password"
                  value={newSecPassword}
                  onChange={(e) => setNewSecPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF8200]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#162a45] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
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
