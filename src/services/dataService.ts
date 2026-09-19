import { supabase } from '../lib/supabase';
import type { Student, Payment, StudentWithStats, PaymentMode } from '../types';
import { INITIAL_STUDENTS } from '../data/initialStudents';

export const dataService = {
  // Fetch all students and compute their dynamic financial stats from Supabase
  async getStudents(): Promise<StudentWithStats[]> {
    const { data: supaStudents, error: stuErr } = await supabase
      .from('students')
      .select('*')
      .order('register_number', { ascending: true });

    if (stuErr) {
      console.error('Error fetching students from Supabase:', stuErr);
      throw new Error(stuErr.message);
    }

    let students: Student[] = (supaStudents || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      register_number: s.register_number,
      department: s.department || 'CSE',
      section: s.section || 'B',
      phone: s.phone || '',
      total_amount: Number(s.total_amount) || 0,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    // Auto-seed initial 62 students if Supabase table is completely empty
    if (students.length === 0) {
      console.log('Seeding initial 62 students into Supabase...');
      const seedData = INITIAL_STUDENTS.map((item) => ({
        name: item.name,
        register_number: item.register_number,
        department: 'CSE',
        section: item.section || 'B',
        phone: '',
        total_amount: 0,
      }));

      const { data: inserted, error: seedErr } = await supabase
        .from('students')
        .insert(seedData)
        .select('*')
        .order('register_number', { ascending: true });

      if (seedErr) {
        console.error('Error seeding students into Supabase:', seedErr);
      } else if (inserted) {
        students = inserted.map((s: any) => ({
          id: s.id,
          name: s.name,
          register_number: s.register_number,
          department: s.department || 'CSE',
          section: s.section || 'B',
          phone: s.phone || '',
          total_amount: Number(s.total_amount) || 0,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));
      }
    }

    // Fetch all payments from Supabase
    const { data: supaPayments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (payErr) {
      console.error('Error fetching payments from Supabase:', payErr);
      throw new Error(payErr.message);
    }

    const payments: Payment[] = (supaPayments || []).map((p: any) => ({
      id: p.id,
      student_id: p.student_id,
      amount: Number(p.amount) || 0,
      payment_mode: p.payment_mode as PaymentMode,
      payment_date: p.payment_date,
      notes: p.notes || '',
      created_at: p.created_at,
    }));

    // Map computed stats per student
    return students.map((student) => {
      const studentPayments = payments.filter((p) => p.student_id === student.id);
      const amount_paid = studentPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const balance = Math.max(0, student.total_amount - amount_paid);

      let status: 'Paid' | 'Partial' | 'Pending' = 'Pending';
      if (student.total_amount > 0) {
        if (amount_paid >= student.total_amount) {
          status = 'Paid';
        } else if (amount_paid > 0) {
          status = 'Partial';
        } else {
          status = 'Pending';
        }
      } else {
        status = amount_paid > 0 ? 'Paid' : 'Pending';
      }

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
        payment_mode: last_payment ? last_payment.payment_mode : null,
        payments: studentPayments,
      };
    });
  },

  // Fetch individual student with payments by ID directly from Supabase
  async getStudentById(id: string): Promise<StudentWithStats | null> {
    const { data: s, error: stuErr } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (stuErr || !s) {
      console.error('Error fetching student by ID:', stuErr);
      return null;
    }

    const student: Student = {
      id: s.id,
      name: s.name,
      register_number: s.register_number,
      department: s.department || 'CSE',
      section: s.section || 'B',
      phone: s.phone || '',
      total_amount: Number(s.total_amount) || 0,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };

    const { data: supaPayments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', id)
      .order('payment_date', { ascending: false });

    if (payErr) {
      console.error('Error fetching payments for student:', payErr);
    }

    const studentPayments: Payment[] = (supaPayments || []).map((p: any) => ({
      id: p.id,
      student_id: p.student_id,
      amount: Number(p.amount) || 0,
      payment_mode: p.payment_mode as PaymentMode,
      payment_date: p.payment_date,
      notes: p.notes || '',
      created_at: p.created_at,
    }));

    const amount_paid = studentPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = Math.max(0, student.total_amount - amount_paid);

    let status: 'Paid' | 'Partial' | 'Pending' = 'Pending';
    if (student.total_amount > 0) {
      if (amount_paid >= student.total_amount) {
        status = 'Paid';
      } else if (amount_paid > 0) {
        status = 'Partial';
      } else {
        status = 'Pending';
      }
    } else {
      status = amount_paid > 0 ? 'Paid' : 'Pending';
    }

    const last_payment = studentPayments[0];

    return {
      ...student,
      amount_paid,
      balance,
      status,
      last_payment_date: last_payment ? last_payment.payment_date : null,
      payment_mode: last_payment ? last_payment.payment_mode : null,
      payments: studentPayments,
    };
  },

  // Insert student directly into Supabase
  async addStudent(data: {
    name: string;
    register_number: string;
    department?: string;
    section?: string;
    phone?: string;
    total_amount: number;
  }): Promise<Student> {
    const payload = {
      name: data.name.trim(),
      register_number: data.register_number.trim().toUpperCase(),
      department: (data.department || 'CSE').trim(),
      section: (data.section || 'B').trim().toUpperCase(),
      phone: (data.phone || '').trim(),
      total_amount: Number(data.total_amount) || 0,
    };

    const { data: inserted, error } = await supabase
      .from('students')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase addStudent error:', error);
      throw new Error(error.message);
    }

    return {
      id: inserted.id,
      name: inserted.name,
      register_number: inserted.register_number,
      department: inserted.department,
      section: inserted.section,
      phone: inserted.phone,
      total_amount: Number(inserted.total_amount),
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
    };
  },

  // Update student in Supabase
  async updateStudent(
    id: string,
    data: {
      name?: string;
      register_number?: string;
      department?: string;
      section?: string;
      phone?: string;
      total_amount?: number;
    }
  ): Promise<void> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.register_number !== undefined)
      updatePayload.register_number = data.register_number.trim().toUpperCase();
    if (data.department !== undefined) updatePayload.department = data.department.trim();
    if (data.section !== undefined) updatePayload.section = data.section.trim().toUpperCase();
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.total_amount !== undefined) updatePayload.total_amount = Number(data.total_amount);

    const { error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Supabase updateStudent error:', error);
      throw new Error(error.message);
    }
  },

  // Delete student from Supabase
  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteStudent error:', error);
      throw new Error(error.message);
    }
  },

  // Batch update total_amount for all students in Supabase
  async setBatchAmountDue(amount: number): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update({
        total_amount: Number(amount),
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Supabase setBatchAmountDue error:', error);
      throw new Error(error.message);
    }
  },

  // Fetch all payments with joined student information
  async getPayments(): Promise<(Payment & { student_name: string; register_number: string })[]> {
    const { data: supaPayments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (payErr) {
      console.error('Supabase getPayments error:', payErr);
      throw new Error(payErr.message);
    }

    const { data: supaStudents, error: stuErr } = await supabase
      .from('students')
      .select('id, name, register_number');

    if (stuErr) {
      console.error('Supabase getPayments student fetch error:', stuErr);
      throw new Error(stuErr.message);
    }

    const studentMap = new Map<string, { name: string; register_number: string }>();
    (supaStudents || []).forEach((s: any) => {
      studentMap.set(s.id, { name: s.name, register_number: s.register_number });
    });

    return (supaPayments || []).map((p: any) => {
      const student = studentMap.get(p.student_id);
      return {
        id: p.id,
        student_id: p.student_id,
        amount: Number(p.amount) || 0,
        payment_mode: p.payment_mode as PaymentMode,
        payment_date: p.payment_date,
        notes: p.notes || '',
        created_at: p.created_at,
        student_name: student?.name || 'Unknown Student',
        register_number: student?.register_number || 'N/A',
      };
    });
  },

  // Record a new payment directly in Supabase
  async recordPayment(data: {
    student_id: string;
    amount: number;
    payment_mode: PaymentMode;
    payment_date?: string;
    notes?: string;
  }): Promise<Payment> {
    const payload = {
      student_id: data.student_id,
      amount: Number(data.amount),
      payment_mode: data.payment_mode,
      payment_date: data.payment_date || new Date().toISOString().split('T')[0],
      notes: (data.notes || '').trim(),
    };

    const { data: inserted, error } = await supabase
      .from('payments')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase recordPayment error:', error);
      throw new Error(error.message);
    }

    return {
      id: inserted.id,
      student_id: inserted.student_id,
      amount: Number(inserted.amount),
      payment_mode: inserted.payment_mode as PaymentMode,
      payment_date: inserted.payment_date,
      notes: inserted.notes,
      created_at: inserted.created_at,
    };
  },

  // Delete payment directly from Supabase
  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) {
      console.error('Supabase deletePayment error:', error);
      throw new Error(error.message);
    }
  },

  // Calculate dashboard & report metrics dynamically from Supabase
  async getSummary() {
    const students = await this.getStudents();
    const payments = await this.getPayments();

    const totalStudents = students.length;
    const totalAmountDue = students.reduce((acc, s) => acc + s.total_amount, 0);
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
      if (p.payment_mode in modeTotals) {
        modeTotals[p.payment_mode] += p.amount;
      } else {
        modeTotals.Other += p.amount;
      }
    });

    const recentPayments = payments.slice(0, 6);

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
};
