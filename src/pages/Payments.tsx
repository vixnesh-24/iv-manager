import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { dataService } from '../services/dataService';
import type { StudentWithStats, PaymentMode } from '../types';
import {
  CreditCard,
  Plus,
  Search,
  Trash2,
  Calendar,
  X,
  IndianRupee,
  Receipt,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('All');

  // Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    mode: 'UPI' as PaymentMode,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const loadData = () => {
    try {
      setLoading(true);
      const payList = dataService.getPayments();
      const stuList = dataService.getStudents();
      setPayments(payList);
      setStudents(stuList);
      if (stuList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuList[0].id);
      }
    } catch {
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMode = modeFilter === 'All' || p.mode === modeFilter;

      return matchesSearch && matchesMode;
    });
  }, [payments, searchQuery, modeFilter]);

  const totalFilteredAmount = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredPayments]);

  // Handle Form Submit
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    const amountNum = Number(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await dataService.recordPayment({
        student_id: selectedStudentId,
        amount: amountNum,
        mode: paymentForm.mode,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
      });

      toast.success(`Recorded payment of ₹${amountNum.toLocaleString('en-IN')}`);
      setIsRecordModalOpen(false);
      setPaymentForm({
        amount: '',
        mode: 'UPI',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadData();
    } catch {
      toast.error('Failed to save payment record');
    }
  };

  // Handle Delete Payment
  const handleDeletePayment = async (id: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete this payment of ₹${amount}?`)) {
      try {
        await dataService.deletePayment(id);
        toast.success('Payment record removed');
        loadData();
      } catch {
        toast.error('Failed to delete payment');
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Payments & Collections
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Record new receipts, view full transaction logs, and manage payment modes.
            </p>
          </div>
          <button
            onClick={() => {
              if (students.length > 0 && !selectedStudentId) {
                setSelectedStudentId(students[0].id);
              }
              setIsRecordModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Payment</span>
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{payments.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Total Filtered Collection
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{totalFilteredAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Filter
              </p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {modeFilter === 'All' ? 'All Payment Modes' : modeFilter}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Student Name, Roll No, or Notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 border border-slate-200 rounded-xl p-1 bg-slate-50 self-start md:self-auto">
            {(['All', 'UPI', 'Cash', 'Bank Transfer', 'Other'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  modeFilter === m
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-semibold text-slate-700">No payment records found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || modeFilter !== 'All'
                  ? 'Try adjusting your search criteria or mode filter.'
                  : 'Record a payment to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Roll No</th>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Payment Mode</th>
                    <th className="px-5 py-3.5">Reference / Notes</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.payment_date}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {p.register_number}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{p.student_name}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600 whitespace-nowrap">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.mode}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeletePayment(p.id, p.amount)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Record Payment */}
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900">Record New Payment</h3>
                </div>
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 mt-4">
                {/* Select Student */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Student *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedStudentId(id);
                      const stu = students.find((s) => s.id === id);
                      if (stu && stu.balance > 0) {
                        setPaymentForm((prev) => ({ ...prev, amount: String(stu.balance) }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.register_number} - {s.name} (Due: ₹{s.balance})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Student Info Banner */}
                {selectedStudent && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Due</span>
                      <span className="font-bold text-slate-800">
                        ₹{selectedStudent.amount_due.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Paid So Far</span>
                      <span className="font-bold text-emerald-600">
                        ₹{selectedStudent.amount_paid.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Remaining</span>
                      <span className="font-bold text-rose-600">
                        ₹{selectedStudent.balance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Amount */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Payment Amount (₹) *
                    </label>
                    {selectedStudent && selectedStudent.balance > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentForm({ ...paymentForm, amount: String(selectedStudent.balance) })
                        }
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Fill Full Balance (₹{selectedStudent.balance})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="e.g. 1500"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['UPI', 'Cash', 'Bank Transfer', 'Other'] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentForm({ ...paymentForm, mode: m })}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-center ${
                          paymentForm.mode === m
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Optional (e.g. UPI Ref / GPay Transaction ID)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition shadow-sm"
                  >
                    Confirm & Save Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Payments;
