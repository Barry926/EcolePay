import jsPDF from 'jspdf';
import { Etablissement, Eleve, Paiement } from '../types';
import { formatPaymentDate } from './dateUtils';

async function addSchoolLogo(doc: jsPDF, logoUrl?: string): Promise<boolean> {
  if (!logoUrl) return false;

  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('LOGO_LOAD_FAILED'));
      image.src = logoUrl;
    });
    doc.addImage(image, 'PNG', 14, 9, 22, 22, undefined, 'FAST');
    return true;
  } catch {
    return false;
  }
}

export const generatePaymentReceiptPDF = async (
  paiement: Paiement,
  eleve: Eleve | null | undefined,
  etablissement: Etablissement | null | undefined,
  caissierNom: string,
) => {
  const doc = new jsPDF();
  const primary = [15, 23, 42] as const;
  const green = [22, 163, 74] as const;
  const slate = [51, 65, 85] as const;
  const light = [248, 250, 252] as const;
  const schoolName = etablissement?.nom || 'Établissement scolaire';
  const schoolAddress = etablissement?.adresse || 'Adresse non renseignée';
  const schoolPhone = etablissement?.telephone || 'Téléphone non renseigné';
  const paymentDate = formatPaymentDate(paiement.paidAt || paiement.createdAt || paiement.datePaiement);
  const studentName = paiement.nomEleveComplete || `${eleve?.nom || ''} ${eleve?.prenoms || ''}`.trim();

  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, 43, 'F');
  doc.setFillColor(...green);
  doc.rect(0, 43, 210, 3, 'F');

  const hasLogo = await addSchoolLogo(doc, etablissement?.logoUrl);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(schoolName.toUpperCase(), hasLogo ? 42 : 14, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(schoolAddress, hasLogo ? 42 : 14, 24, { maxWidth: 108 });
  doc.text(`Tél. ${schoolPhone}`, hasLogo ? 42 : 14, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REÇU DE PAIEMENT', 196, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`N° ${paiement.numeroRecu}`, 196, 24, { align: 'right' });
  doc.text(paymentDate, 196, 30, { align: 'right' });

  let y = 57;
  doc.setFillColor(...light);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 57, 3, 3, 'FD');
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INFORMATIONS ÉLÈVE', 20, y + 10);
  doc.text('DÉTAILS DU PAIEMENT', 111, y + 10);
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y + 13, 100, y + 13);
  doc.line(111, y + 13, 190, y + 13);

  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Élève : ${studentName}`, 20, y + 23, { maxWidth: 76 });
  doc.text(`Matricule : ${paiement.matriculeEleve || eleve?.matricule || 'Non renseigné'}`, 20, y + 33);
  doc.text(`Classe : ${paiement.classe || eleve?.classe || 'Non renseignée'}`, 20, y + 43);
  doc.text(`Tuteur : ${eleve?.nomTuteur || 'Non renseigné'}`, 20, y + 53, { maxWidth: 76 });

  doc.text(`Tranche : ${paiement.libelleTranche}`, 111, y + 23, { maxWidth: 75 });
  doc.text(`Moyen : ${paiement.modePaiement}`, 111, y + 33);
  doc.text(`Référence : ${paiement.referenceTransaction || 'Non renseignée'}`, 111, y + 43, { maxWidth: 75 });
  doc.text(`Enregistré par : ${caissierNom}`, 111, y + 53, { maxWidth: 75 });

  y += 69;
  doc.setFillColor(...primary);
  doc.rect(14, y, 182, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DÉSIGNATION', 20, y + 7);
  doc.text('MONTANT (FCFA)', 190, y + 7, { align: 'right' });

  y += 10;
  const totalScolarite = Number(eleve?.montantTotalScolarite || paiement.montant);
  const cumulApresPaiement = Number(eleve?.montantPaye || paiement.montant);
  const soldeRestant = Math.max(0, Number(eleve?.soldeRestant || totalScolarite - paiement.montant));
  const rows = [
    ['Total frais de scolarité', totalScolarite],
    [`Versement actuel — ${paiement.libelleTranche}`, paiement.montant],
    ['Cumul encaissé', cumulApresPaiement],
  ];

  rows.forEach(([label, amount], index) => {
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(14, y, 182, 10, 'F');
    doc.setTextColor(...slate);
    doc.setFont('helvetica', index === 1 ? 'bold' : 'normal');
    doc.text(String(label), 20, y + 6.5, { maxWidth: 125 });
    doc.text(`${Number(amount).toLocaleString('fr-FR')} FCFA`, 190, y + 6.5, { align: 'right' });
    y += 10;
  });

  y += 5;
  const paidInFull = soldeRestant === 0;
  doc.setFillColor(paidInFull ? 236 : 254, paidInFull ? 253 : 242, paidInFull ? 245 : 242);
  doc.setDrawColor(paidInFull ? 167 : 254, paidInFull ? 243 : 202, paidInFull ? 208 : 202);
  doc.roundedRect(14, y, 182, 17, 3, 3, 'FD');
  doc.setTextColor(paidInFull ? 5 : 190, paidInFull ? 120 : 24, paidInFull ? 95 : 93);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(paidInFull ? 'SCOLARITÉ ENTIÈREMENT RÉGLÉE' : 'SOLDE RESTANT À PAYER', 20, y + 10.5);
  doc.text(`${soldeRestant.toLocaleString('fr-FR')} FCFA`, 190, y + 10.5, { align: 'right' });

  y += 31;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 86, 30, 2, 2, 'D');
  doc.roundedRect(110, y, 86, 30, 2, 2, 'D');
  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SIGNATURE DU PARENT / TUTEUR', 18, y + 8);
  doc.text('CACHET ET SIGNATURE DE L’ÉCOLE', 114, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolName, 153, y + 19, { align: 'center', maxWidth: 70 });
  doc.text(caissierNom, 153, y + 26, { align: 'center', maxWidth: 70 });

  y += 39;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('Ce reçu électronique atteste du règlement enregistré. Conservez-le précieusement.', 105, y + 5, { align: 'center' });

  const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Recu_${paiement.numeroRecu}_${safeStudentName || 'eleve'}.pdf`);
};

export const getWhatsAppReminderUrl = (eleve: Eleve, schoolName = 'Notre Établissement') => {
  let cleanPhone = eleve.telTuteur.replace(/\s+/g, '').replace(/-/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = `225${cleanPhone}`;
  else if (cleanPhone.startsWith('+225')) cleanPhone = cleanPhone.replace('+225', '225');
  else if (!cleanPhone.startsWith('225')) cleanPhone = `225${cleanPhone}`;

  const message = `Bonjour ${eleve.nomTuteur || 'Cher Parent'}, la scolarité de ${eleve.nom} ${eleve.prenoms} (Classe : ${eleve.classe}) de ${eleve.soldeRestant.toLocaleString('fr-FR')} FCFA est due pour le compte de ${schoolName}. Merci de contacter le secrétariat pour le règlement.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
