// Types principaux pour le SaaS EcolePay (Côte d'Ivoire)

export type ModePaiement = 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Espèces' | 'Chèque' | 'Virement' | 'Autre';
export type StatutPaiement = 'Validé' | 'En attente' | 'Rejeté' | 'Remboursé';
export type RoleUtilisateur = 'admin_fondateur' | 'comptable' | 'secretaire' | 'parent';

export interface Etablissement {
  id: string;
  nom: string;
  codeEcole: string; // Ex: EP-ABJ-001
  adresse: string;
  ville: string; // Ex: Abidjan, Bouaké, Yamoussoukro
  commune?: string; // Ex: Cocody, Yopougon
  telephone: string;
  email: string;
  logoUrl?: string;
  devise: 'XOF' | 'FCFA';
  licence?: {
    keyMasked: string;
    status: 'active' | 'expired' | 'invalid';
    expiresAt?: string | null;
    validatedAt?: string;
  };
}

export interface Eleve {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  classe: string; // Ex: 6ème A, 3ème 2, Tle D
  cycle: 'Maternelle' | 'Primaire' | 'Secondaire Premier Cycle' | 'Secondaire Second Cycle';
  dateNaissance?: string;
  genre: 'M' | 'F';
  nomTuteur: string;
  telTuteur: string;
  telWhatsAppTuteur?: string;
  emailTuteur?: string;
  montantTotalScolarite: number;
  montantPaye: number;
  soldeRestant: number;
  estEnRegle: boolean;
  createdAt: string;
  archived?: boolean;
  archivedAt?: unknown;
  archivedBy?: string;
}

export interface Paiement {
  id: string;
  eleveId: string;
  matriculeEleve: string;
  nomEleveComplete: string;
  classe: string;
  montant: number;
  modePaiement: ModePaiement;
  referenceTransaction?: string; // Ex: Réf Wave / OM / MTN
  numeroRecu: string;
  datePaiement: string;
  paidAt?: unknown;
  createdAt?: unknown;
  statut: StatutPaiement;
  libelleTranche: string; // Ex: Inscription, 1ère Tranche
  effectueParUid: string;
  commentaire?: string;
}

export interface TrancheScolarite {
  id: string;
  libelle: string; // Ex: "Frais d'inscription", "1ère Tranche (30 Nov)"
  montantExige: number;
  dateEcheance: string;
  classeOuCycle: string;
}

export interface TrancheConfig {
  id: string;
  nom: string;
  dateLimite: string;
  montant: number;
}

export interface ComptePersonnel {
  id: string;
  email: string;
  nomComplet: string;
  role: 'secretaire' | 'comptable' | 'admin_fondateur';
  actif: boolean;
  createdAt: string;
}

export interface SchoolSettings {
  nomEtablissement: string;
  adresse: string;
  telephoneDirecteur: string;
  emailOfficiel: string;
  logoUrl?: string;
  codeMena: string;
  licence?: {
    keyMasked: string;
    status: 'active' | 'expired' | 'invalid';
    expiresAt?: string | null;
    validatedAt?: string;
  };
  tranches: TrancheConfig[];
  classes: string[];
  personnel: ComptePersonnel[];
}

export interface Utilisateur {
  uid: string;
  email: string;
  nom: string;
  prenom: string;
  role: RoleUtilisateur;
  etablissementId: string;
  photoURL?: string;
}
