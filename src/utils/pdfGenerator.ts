import jsPDF from 'jspdf';
import { Paiement, Eleve } from '../types';

export const generatePaymentReceiptPDF = (
  paiement: Paiement,
  eleve?: Eleve | null,
  etablissementNom: string = "Groupe Scolaire Sainte-Marie d'Abidjan",
  caissierNom: string = "Agent Caisse / Comptabilité"
) => {
  const doc = new jsPDF();

  // Colors
  const primaryBlue = [30, 58, 95]; // #1e3a5f
  const accentOrange = [255, 130, 0]; // #FF8200
  const darkGray = [30, 41, 59];
  const lightBg = [248, 250, 252];

  // Header Banner
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Orange accent strip
  doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
  doc.rect(0, 36, 210, 3, 'F');

  // School Title & Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ECOLEPAY CI - REÇU DE PAIEMENT', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(etablissementNom.toUpperCase(), 14, 27);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE • MINISTÈRE DE L'ÉDUCATION NATIONALE", 14, 32);

  // Receipt Number & Date (Right aligned in header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`N° REÇU: ${paiement.numeroRecu}`, 196, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${paiement.datePaiement}`, 196, 26, { align: 'right' });

  // Body Container
  let y = 48;

  // Student & Payment Info Card
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 54, 3, 3, 'FD');

  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("INFORMATIONS DE L'ÉLÈVE", 20, y + 10);
  doc.text("DÉTAILS DU PAIEMENT", 110, y + 10);

  doc.setDrawColor(203, 213, 225);
  doc.line(20, y + 13, 100, y + 13);
  doc.line(110, y + 13, 190, y + 13);

  // Left Column - Student
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Élève: ${paiement.nomEleveComplete}`, 20, y + 22);
  doc.text(`Matricule: ${paiement.matriculeEleve || (eleve?.matricule || 'N/A')}`, 20, y + 30);
  doc.text(`Classe: ${paiement.classe}`, 20, y + 38);
  doc.text(`Tuteur/Contact: ${eleve?.nomTuteur || 'Tuteur Légal'} (${eleve?.telTuteur || 'Non renseigné'})`, 20, y + 46);

  // Right Column - Payment Details
  doc.text(`Motif / Tranche: ${paiement.libelleTranche}`, 110, y + 22);
  doc.text(`Mode de paiement: ${paiement.modePaiement}`, 110, y + 30);
  doc.text(`Réf. Transaction: ${paiement.referenceTransaction || 'N/A'}`, 110, y + 38);
  doc.text(`Caissier / Agent: ${caissierNom}`, 110, y + 46);

  y += 64;

  // Financial Summary Table Header
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(14, y, 182, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("DÉSIGNATION SCOLARITÉ", 20, y + 7);
  doc.text("MONTANT (FCFA)", 190, y + 7, { align: 'right' });

  y += 10;

  // Table Rows
  const totalScolarite = eleve?.montantTotalScolarite || (paiement.montant + (eleve?.soldeRestant || 0));
  const versementActuel = paiement.montant;
  const cumulApresPaiement = eleve ? (eleve.montantPaye) : versementActuel;
  const soldeRestantDu = eleve ? eleve.soldeRestant : Math.max(0, totalScolarite - versementActuel);

  const tableData = [
    { label: "Total Frais de Scolarité Annuelle", value: `${totalScolarite.toLocaleString('fr-FR')} FCFA` },
    { label: `Versement Actuel (${paiement.libelleTranche})`, value: `${versementActuel.toLocaleString('fr-FR')} FCFA`, isHighlight: true },
    { label: "Cumul des Versements Encaissés à ce jour", value: `${cumulApresPaiement.toLocaleString('fr-FR')} FCFA` },
  ];

  tableData.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, y, 182, 9, 'F');

    doc.setFont('helvetica', row.isHighlight ? 'bold' : 'normal');
    doc.setTextColor(row.isHighlight ? accentOrange[0] : darkGray[0], row.isHighlight ? accentOrange[1] : darkGray[1], row.isHighlight ? accentOrange[2] : darkGray[2]);
    doc.text(row.label, 20, y + 6);
    doc.text(row.value, 190, y + 6, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 9, 196, y + 9);

    y += 9;
  });

  // Balance Box (Reste Dû)
  y += 4;
  const isSoldeRegle = soldeRestantDu <= 0;
  doc.setFillColor(isSoldeRegle ? 236 : 254, isSoldeRegle ? 253 : 242, isSoldeRegle ? 245 : 242); // emerald or rose tint
  doc.setDrawColor(isSoldeRegle ? 167 : 254, isSoldeRegle ? 243 : 202, isSoldeRegle ? 208 : 202);
  doc.roundedRect(14, y, 182, 16, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isSoldeRegle ? 5 : 225, isSoldeRegle ? 150 : 29, isSoldeRegle ? 105 : 72);
  doc.text(isSoldeRegle ? "STATUT : SCOLARITÉ COMPLÈTEMENT RÉGLÉE (0 FCFA DÛ) ✅" : "RESTE À PAYER (SOLDE DÛ) :", 20, y + 10);

  if (!isSoldeRegle) {
    doc.setFontSize(13);
    doc.text(`${soldeRestantDu.toLocaleString('fr-FR')} FCFA`, 190, y + 10, { align: 'right' });
  }

  y += 24;

  // Signatures & Stamp section
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);

  // Left box: Parent Signature
  doc.roundedRect(14, y, 86, 34, 2, 2, 'D');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text("SIGNATURE DU PARENT / TUTEUR", 18, y + 8);

  // Right box: School Stamp & Signature
  doc.roundedRect(110, y, 86, 34, 2, 2, 'D');
  doc.text("CACHET ET SIGNATURE DE L'ÉCOLE", 114, y + 8);

  // Stamp simulation
  doc.setDrawColor(30, 58, 95);
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("GROUPE SCOLAIRE SAINTE-MARIE", 153, y + 20, { align: 'center' });
  doc.setFontSize(7);
  doc.text("DIRECTION DES FINANCES & CAISSE", 153, y + 25, { align: 'center' });
  doc.text("PAIEMENT ENREGISTRÉ PAR ECOLEPAY", 153, y + 30, { align: 'center' });

  y += 42;

  // Security Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text("Ce reçu électronique fait foi de preuve de règlement. Conservez-le précieusement.", 105, y + 5, { align: 'center' });
  doc.text("Généré par EcolePay CI • Plateforme de gestion scolaire et recouvrement Mobile Money 🇨🇮", 105, y + 9, { align: 'center' });

  // Save the PDF file
  const fileName = `Recu_${paiement.numeroRecu}_${paiement.nomEleveComplete.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};

// Function to generate WhatsApp link for unpaid student reminder
export const getWhatsAppReminderUrl = (eleve: Eleve, schoolName: string = "Notre Établissement") => {
  // Clean phone number (remove spaces, ensure country code +225)
  let cleanPhone = eleve.telTuteur.replace(/\s+/g, '').replace(/-/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = `225${cleanPhone}`;
  } else if (cleanPhone.startsWith('+225')) {
    cleanPhone = cleanPhone.replace('+225', '225');
  } else if (!cleanPhone.startsWith('225')) {
    cleanPhone = `225${cleanPhone}`;
  }

  const message = `Bonjour ${eleve.nomTuteur || 'Cher Parent'}, la scolarité de ${eleve.nom} ${eleve.prenoms} (Classe: ${eleve.classe}) de ${eleve.soldeRestant.toLocaleString('fr-FR')} FCFA est due pour le compte de ${schoolName}. Merci de contacter le secrétariat pour le règlement.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
