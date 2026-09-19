export type PaymentMode = 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export interface Student {
  id: string;
  register_number: string;
  name: string;
  section: string;
  amount_due: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  mode: PaymentMode;
  payment_date: string;
  notes?: string;
  created_at?: string;
}

export interface StudentWithStats extends Student {
  amount_paid: number;
  balance: number;
  status: PaymentStatus;
  last_payment_date: string | null;
  payment_mode: string | null;
  payments?: Payment[];
}
