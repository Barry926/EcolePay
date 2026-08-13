/** STYLE SCOLÉA — Les données sont synchronisées comme un registre vivant ; les calculs restent déterministes et ne dépendent d’aucun bouton de paiement en ligne. */
import { addDoc, collection, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { Payment, PaymentMethod, Student } from '@/lib/models';
import { useAuth } from './AuthContext';

type NewStudent = Omit<Student, 'id' | 'montantPaye' | 'soldeRestant' | 'createdAt'> & { montantInitial: number };
type SchoolDataValue = { students: Student[]; payments: Payment[]; loading: boolean; addStudent: (data: NewStudent) => Promise<void>; editStudent: (id: string, data: Partial<Student>) => Promise<void>; addPayment: (student: Student, amount: number, method: PaymentMethod, note?: string) => Promise<void>; archiveStudent: (id: string) => Promise<void>; };
const SchoolDataContext = createContext<SchoolDataValue | null>(null);

export function SchoolDataProvider({ children }: { children: React.ReactNode }) {
  const { school, user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school?.id) { setStudents([]); setPayments([]); setLoading(false); return; }
    setLoading(true);
    const studentsUnsub = onSnapshot(collection(db, 'etablissements', school.id, 'eleves'), snap => {
      setStudents(snap.docs.map(item => {
        const raw = item.data() as Record<string, any>;
        const montantTotal = Number(raw.montantTotal ?? raw.montantTotalScolarite ?? 0);
        const montantPaye = Number(raw.montantPaye ?? 0);
        return { id: item.id, ...raw, montantTotal, montantPaye, soldeRestant: Math.max(0, Number(raw.soldeRestant ?? montantTotal - montantPaye)), telWhatsAppTuteur: raw.telWhatsAppTuteur ?? raw.telTuteur ?? '' } as Student;
      }).filter(item => !item.archived));
      setLoading(false);
    }, error => { console.error('Élèves Firebase', error); setLoading(false); });
    const paymentsUnsub = onSnapshot(collection(db, 'etablissements', school.id, 'paiements'), snap => {
      setPayments(snap.docs.map(item => {
        const raw = item.data() as Record<string, any>;
        return { id: item.id, ...raw, effectuePar: raw.effectuePar ?? raw.caissierNom ?? 'Direction' } as Payment;
      }).sort((a, b) => String(b.paidAt ?? b.datePaiement).localeCompare(String(a.paidAt ?? a.datePaiement))));
    }, error => console.error('Paiements Firebase', error));
    return () => { studentsUnsub(); paymentsUnsub(); };
  }, [school?.id]);

  const addStudent = useCallback(async (data: NewStudent) => {
    if (!school?.id || !user) throw new Error('SESSION_INCOMPLETE');
    const total = Number(data.montantTotal); const initial = Number(data.montantInitial || 0);
    if (!Number.isFinite(total) || total <= 0) throw new Error('TOTAL_INVALID');
    if (!Number.isFinite(initial) || initial < 0 || initial > total) throw new Error('INITIAL_INVALID');
    if (students.some(item => item.matricule.toLowerCase() === data.matricule.trim().toLowerCase())) throw new Error('MATRICULE_EXISTS');
    const studentRef = doc(collection(db, 'etablissements', school.id, 'eleves'));
    const student = { ...data, matricule: data.matricule.trim(), nom: data.nom.trim(), prenoms: data.prenoms.trim(), telTuteur: data.telTuteur.trim(), telWhatsAppTuteur: data.telWhatsAppTuteur.trim() || data.telTuteur.trim(), montantTotal: total, montantPaye: initial, soldeRestant: total - initial, createdAt: serverTimestamp(), archived: false };
    await runTransaction(db, async transaction => {
      transaction.set(studentRef, student);
      if (initial > 0) {
        const paymentRef = doc(collection(db, 'etablissements', school.id, 'paiements'));
        transaction.set(paymentRef, { eleveId: studentRef.id, matriculeEleve: student.matricule, nomEleveComplete: `${student.nom} ${student.prenoms}`, classe: student.classe, montant: initial, modePaiement: 'Autre', datePaiement: new Date().toISOString(), paidAt: Timestamp.now(), effectuePar: profile ? `${profile.nom} ${profile.prenom || ''}`.trim() : user.email, commentaire: 'Montant déjà payé à l’inscription' });
      }
    });
  }, [school?.id, user, profile, students]);

  const editStudent = useCallback(async (id: string, data: Partial<Student>) => {
    if (!school?.id) throw new Error('SESSION_INCOMPLETE');
    const current = students.find(item => item.id === id);
    if (!current) throw new Error('STUDENT_NOT_FOUND');
    const total = Number(data.montantTotal ?? current.montantTotal);
    if (total < current.montantPaye) throw new Error('TOTAL_BELOW_PAID');
    await updateDoc(doc(db, 'etablissements', school.id, 'eleves', id), { ...data, montantTotal: total, soldeRestant: Math.max(0, total - current.montantPaye), updatedAt: serverTimestamp() });
  }, [school?.id, students]);

  const addPayment = useCallback(async (student: Student, amount: number, method: PaymentMethod, note?: string) => {
    if (!school?.id || !user) throw new Error('SESSION_INCOMPLETE');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('AMOUNT_INVALID');
    await runTransaction(db, async transaction => {
      const studentRef = doc(db, 'etablissements', school.id, 'eleves', student.id);
      const paymentRef = doc(collection(db, 'etablissements', school.id, 'paiements'));
      const snap = await transaction.get(studentRef);
      if (!snap.exists()) throw new Error('STUDENT_NOT_FOUND');
      const current = snap.data() as Student & { montantTotalScolarite?: number };
      const total = Number(current.montantTotal ?? current.montantTotalScolarite ?? 0);
      const remaining = Math.max(0, total - Number(current.montantPaye));
      if (amount > remaining) throw new Error('AMOUNT_EXCEEDS_BALANCE');
      const nextPaid = Number(current.montantPaye) + amount;
      const now = Timestamp.now();
      transaction.update(studentRef, { montantPaye: nextPaid, soldeRestant: Math.max(0, total - nextPaid), updatedAt: now });
      transaction.set(paymentRef, { eleveId: student.id, matriculeEleve: current.matricule, nomEleveComplete: `${current.nom} ${current.prenoms}`, classe: current.classe, montant: amount, modePaiement: method, datePaiement: new Date().toISOString(), paidAt: now, effectuePar: profile ? `${profile.nom} ${profile.prenom || ''}`.trim() : user.email, commentaire: note || '' });
    });
  }, [school?.id, user, profile]);

  const archiveStudent = useCallback(async (id: string) => {
    if (!school?.id) throw new Error('SESSION_INCOMPLETE');
    await updateDoc(doc(db, 'etablissements', school.id, 'eleves', id), { archived: true, archivedAt: serverTimestamp() });
  }, [school?.id]);

  const value = useMemo(() => ({ students, payments, loading, addStudent, editStudent, addPayment, archiveStudent }), [students, payments, loading, addStudent, editStudent, addPayment, archiveStudent]);
  return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData() {
  const value = useContext(SchoolDataContext);
  if (!value) throw new Error('useSchoolData doit être utilisé dans SchoolDataProvider');
  return value;
}
