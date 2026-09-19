export type PaymentMode = 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export interface Student {
  id: string;
  name: string;
  register_number: string;
  department: string;
  section: string;
  phone: string;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_mode: PaymentMode;
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
