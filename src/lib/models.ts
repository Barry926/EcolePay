/** STYLE SCOLÉA — Modèles métier simples et lisibles, pensés comme les colonnes d’un registre et non comme des objets de paiement en ligne. */
export type PaymentMethod = 'Espèces' | 'Wave' | 'Orange Money' | 'MTN Money' | 'Moov Money' | 'Virement bancaire' | 'Autre';
export type PaymentStatus = 'Payé' | 'Partiel' | 'Impayé';

export interface SchoolProfile {
  id: string;
  nom: string;
  codeEcole: string;
  ville?: string;
  email?: string;
  devise?: 'FCFA' | 'XOF';
}

export interface UserProfile {
  uid: string;
  email: string;
  nom: string;
  prenom?: string;
  role: 'directeur' | 'comptable' | 'secretaire';
  etablissementId: string;
}

export interface Student {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  classe: string;
  nomTuteur: string;
  telTuteur: string;
  telWhatsAppTuteur: string;
  montantTotal: number;
  montantPaye: number;
  soldeRestant: number;
  createdAt?: unknown;
  archived?: boolean;
}

export interface Payment {
  id: string;
  eleveId: string;
  matriculeEleve: string;
  nomEleveComplete: string;
  classe: string;
  montant: number;
  modePaiement: PaymentMethod;
  datePaiement: string;
  paidAt?: unknown;
  effectuePar: string;
  commentaire?: string;
}

export const CLASSES = [
  'Maternelle Petite Section', 'Maternelle Moyenne Section', 'Maternelle Grande Section',
  'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2', '6e 1', '6e 2', '5e 1', '5e 2',
  '4e 1', '4e 2', '3e 1', '3e 2', '2nde A', '2nde C', '1ère A', '1ère D', 'Terminale A', 'Terminale D',
];

export const PAYMENT_METHODS: PaymentMethod[] = ['Espèces', 'Wave', 'Orange Money', 'MTN Money', 'Moov Money', 'Virement bancaire', 'Autre'];

export function paymentStatus(student: Pick<Student, 'montantPaye' | 'montantTotal' | 'soldeRestant'>): PaymentStatus {
  const paid = Number(student.montantPaye || 0);
  const total = Number(student.montantTotal || 0);
  const remaining = Math.max(0, Number(student.soldeRestant ?? total - paid));
  if (remaining === 0 || paid >= total) return 'Payé';
  if (paid > 0) return 'Partiel';
  return 'Impayé';
}

export function formatFcfa(value: number) {
  return `${Math.round(value || 0).toLocaleString('fr-FR')} FCFA`;
}

export function formatShortDate(value: unknown) {
  if (!value) return '—';
  const raw = typeof value === 'object' && value && 'toDate' in value ? (value as { toDate: () => Date }).toDate() : value;
  const date = new Date(raw as string | number | Date);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function whatsappUrl(student: Student, schoolName: string) {
  const digits = (student.telWhatsAppTuteur || student.telTuteur || '').replace(/[^0-9]/g, '');
  const message = `Bonjour, concernant les frais scolaires de ${student.nom} ${student.prenoms}, un montant de ${formatFcfa(student.soldeRestant)} reste à payer. Merci.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

