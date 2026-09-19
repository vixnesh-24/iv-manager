import { supabase } from '../lib/supabase';
import type { Student, Payment, StudentWithStats, PaymentMode } from '../types';
import { INITIAL_STUDENTS } from '../data/initialStudents';

const STUDENTS_KEY = 'ivpm_students_v2';
const PAYMENTS_KEY = 'ivpm_payments_v2';

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Initialize default local students if none exist
function getInitialLocalStudents(): Student[] {
  return INITIAL_STUDENTS.map((item, index) => ({
    id: `stu_${index + 1}_${item.register_number}`,
    register_number: item.register_number,
    name: item.name,
    section: item.section || 'B',
    amount_due: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function loadLocalStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      const initial = getInitialLocalStudents();
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialLocalStudents();
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return getInitialLocalStudents();
  }
}

function saveLocalStudents(students: Student[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function loadLocalPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalPayments(payments: Payment[]) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export const dataService = {
  // Sync attempt with Supabase if online
  async syncWithSupabase(): Promise<void> {
    try {
      const { data: supaStudents, error: stuErr } = await supabase
        .from('students')
        .select('*');

      if (!stuErr && supaStudents && supaStudents.length > 0) {
        // Map supabase fields
        const mapped: Student[] = supaStudents.map((s: any) => ({
          id: s.id,
          register_number: s.register_number,
          name: s.name,
          section: s.section || 'B',
          amount_due: Number(s.amount_due) || 0,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));
        saveLocalStudents(mapped);
      } else if (!stuErr && (!supaStudents || supaStudents.length === 0)) {
        // Seed Supabase with local students
        const local = loadLocalStudents();
        await supabase.from('students').insert(
          local.map((s) => ({
            id: s.id.startsWith('stu_') ? undefined : s.id,
            register_number: s.register_number,
            name: s.name,
            section: s.section,
            amount_due: s.amount_due,
          }))
        );
      }

      const { data: supaPayments, error: payErr } = await supabase
        .from('payments')
        .select('*');

      if (!payErr && supaPayments && supaPayments.length > 0) {
        const mappedP: Payment[] = supaPayments.map((p: any) => ({
          id: p.id,
          student_id: p.student_id,
          amount: Number(p.amount) || 0,
          mode: p.mode as PaymentMode,
          payment_date: p.payment_date,
          notes: p.notes,
          created_at: p.created_at,
        }));
        saveLocalPayments(mappedP);
      }
    } catch {
      // Offline fallback is fully functional
    }
  },

  getStudents(): StudentWithStats[] {
    const students = loadLocalStudents();
    const payments = loadLocalPayments();

    return students.map((student) => {
      const studentPayments = payments.filter((p) => p.student_id === student.id);
      const amount_paid = studentPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const balance = Math.max(0, student.amount_due - amount_paid);

      let status: 'Paid' | 'Partial' | 'Pending' = 'Pending';
      if (student.amount_due > 0) {
        if (amount_paid >= student.amount_due) {
          status = 'Paid';
        } else if (amount_paid > 0) {
          status = 'Partial';
        } else {
          status = 'Pending';
        }
      } else {
        status = amount_paid > 0 ? 'Paid' : 'Pending';
      }

      // Sort payments by date descending
      studentPayments.sort(
        (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );

      const last_payment = studentPayments[0];

      return {
        ...student,
        amount_paid,
        balance,
        status,
        last_payment_date: last_payment ? last_payment.payment_date : null,
        payment_mode: last_payment ? last_payment.mode : null,
        payments: studentPayments,
      };
    });
  },

  getStudentById(id: string): StudentWithStats | null {
    const all = this.getStudents();
    return all.find((s) => s.id === id) || null;
  },

  async addStudent(data: {
    name: string;
    register_number: string;
    section: string;
    amount_due: number;
  }): Promise<Student> {
    const newStudent: Student = {
      id: generateId(),
      name: data.name.trim(),
      register_number: data.register_number.trim().toUpperCase(),
      section: data.section.trim().toUpperCase() || 'B',
      amount_due: Number(data.amount_due) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const students = loadLocalStudents();
    students.unshift(newStudent);
    saveLocalStudents(students);

    // Try Supabase in background
    try {
      await supabase.from('students').insert([
        {
          name: newStudent.name,
          register_number: newStudent.register_number,
          section: newStudent.section,
          amount_due: newStudent.amount_due,
        },
      ]);
    } catch {
      // Offline fallback
    }

    return newStudent;
  },

  async updateStudent(
    id: string,
    data: {
      name?: string;
      register_number?: string;
      section?: string;
      amount_due?: number;
    }
  ): Promise<boolean> {
    const students = loadLocalStudents();
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) return false;

    students[index] = {
      ...students[index],
      ...data,
      amount_due: data.amount_due !== undefined ? Number(data.amount_due) : students[index].amount_due,
      updated_at: new Date().toISOString(),
    };
    saveLocalStudents(students);

    try {
      await supabase
        .from('students')
        .update({
          name: students[index].name,
          register_number: students[index].register_number,
          section: students[index].section,
          amount_due: students[index].amount_due,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // Offline fallback
    }

    return true;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const students = loadLocalStudents().filter((s) => s.id !== id);
    saveLocalStudents(students);

    const payments = loadLocalPayments().filter((p) => p.student_id !== id);
    saveLocalPayments(payments);

    try {
      await supabase.from('students').delete().eq('id', id);
    } catch {
      // Offline fallback
    }
    return true;
  },

  async setBatchAmountDue(amount: number): Promise<void> {
    const students = loadLocalStudents().map((s) => ({
      ...s,
      amount_due: amount,
      updated_at: new Date().toISOString(),
    }));
    saveLocalStudents(students);

    try {
      await supabase.from('students').update({ amount_due: amount }).neq('id', '00000000-0000-0000-0000-000000000000');
    } catch {
      // Offline fallback
    }
  },

  getPayments(): (Payment & { student_name: string; register_number: string })[] {
    const payments = loadLocalPayments();
    const students = loadLocalStudents();
    const studentMap = new Map<string, Student>();
    students.forEach((s) => studentMap.set(s.id, s));

    return payments
      .map((p) => {
        const student = studentMap.get(p.student_id);
        return {
          ...p,
          student_name: student?.name || 'Unknown Student',
          register_number: student?.register_number || 'N/A',
        };
      })
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  },

  async recordPayment(data: {
    student_id: string;
    amount: number;
    mode: PaymentMode;
    payment_date?: string;
    notes?: string;
  }): Promise<Payment> {
    const newPayment: Payment = {
      id: generateId(),
      student_id: data.student_id,
      amount: Number(data.amount),
      mode: data.mode,
      payment_date: data.payment_date || new Date().toISOString().split('T')[0],
      notes: data.notes ? data.notes.trim() : '',
      created_at: new Date().toISOString(),
    };

    const payments = loadLocalPayments();
    payments.unshift(newPayment);
    saveLocalPayments(payments);

    try {
      await supabase.from('payments').insert([
        {
          student_id: newPayment.student_id,
          amount: newPayment.amount,
          mode: newPayment.mode,
          payment_date: newPayment.payment_date,
          notes: newPayment.notes,
        },
      ]);
    } catch {
      // Offline fallback
    }

    return newPayment;
  },

  async deletePayment(id: string): Promise<boolean> {
    const payments = loadLocalPayments().filter((p) => p.id !== id);
    saveLocalPayments(payments);

    try {
      await supabase.from('payments').delete().eq('id', id);
    } catch {
      // Offline fallback
    }
    return true;
  },

  getSummary() {
    const students = this.getStudents();
    const payments = loadLocalPayments();

    const totalStudents = students.length;
    const totalAmountDue = students.reduce((acc, s) => acc + s.amount_due, 0);
    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalPending = Math.max(0, totalAmountDue - totalCollected);
    const collectionPercentage =
      totalAmountDue > 0 ? Math.min(100, Math.round((totalCollected / totalAmountDue) * 100)) : 0;

    const paidCount = students.filter((s) => s.status === 'Paid').length;
    const partialCount = students.filter((s) => s.status === 'Partial').length;
    const pendingCount = students.filter((s) => s.status === 'Pending').length;

    const modeTotals: Record<PaymentMode, number> = {
      UPI: 0,
      Cash: 0,
      'Bank Transfer': 0,
      Other: 0,
    };

    payments.forEach((p) => {
      if (p.mode in modeTotals) {
        modeTotals[p.mode] += p.amount;
      } else {
        modeTotals.Other += p.amount;
      }
    });

    const recentPayments = this.getPayments().slice(0, 6);

    return {
      totalStudents,
      totalAmountDue,
      totalCollected,
      totalPending,
      collectionPercentage,
      paidCount,
      partialCount,
      pendingCount,
      modeTotals,
      recentPayments,
    };
  },

  resetAllData() {
    localStorage.removeItem(STUDENTS_KEY);
    localStorage.removeItem(PAYMENTS_KEY);
    loadLocalStudents();
  },
};
