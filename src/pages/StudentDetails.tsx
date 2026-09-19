import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { dataService } from '../services/dataService';
import type { StudentWithStats, PaymentMode } from '../types';
import {
  ArrowLeft,
  User,
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  X,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    mode: 'UPI' as PaymentMode,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [newFee, setNewFee] = useState<string>('');

  const loadStudent = () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = dataService.getStudentById(id);
      setStudent(data);
      if (data) {
        setNewFee(String(data.amount_due));
      }
    } catch {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [id]);

  // Open Record Payment Modal
  const openPayModal = () => {
    if (!student) return;
    setPaymentForm({
      amount: student.balance > 0 ? String(student.balance) : '',
      mode: 'UPI',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsPayModalOpen(true);
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const amountNum = Number(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await dataService.recordPayment({
        student_id: student.id,
        amount: amountNum,
        mode: paymentForm.mode,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
      });

      toast.success(`Payment of ₹${amountNum} recorded!`);
      setIsPayModalOpen(false);
      loadStudent();
    } catch {
      toast.error('Failed to record payment');
    }
  };

  // Submit Fee Change
  const handleFeeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const feeNum = Number(newFee);
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error('Please enter a valid fee amount');
      return;
    }

    try {
      await dataService.updateStudent(student.id, { amount_due: feeNum });
      toast.success('IV Fee updated successfully');
      setIsEditFeeModalOpen(false);
      loadStudent();
    } catch {
      toast.error('Failed to update fee');
    }
  };

  // Delete Payment
  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (window.confirm(`Delete payment of ₹${amount}?`)) {
      try {
        await dataService.deletePayment(paymentId);
        toast.success('Payment removed');
        loadStudent();
      } catch {
        toast.error('Failed to delete payment');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Loading student profile...</p>
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <p className="text-base font-bold text-slate-800">Student not found</p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Students</span>
          </button>
        </div>
      </Layout>
    );
  }

  const paymentsList = student.payments || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back navigation & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Students</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditFeeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition border border-slate-200 text-sm shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modify Fee</span>
            </button>
            <button
              onClick={openPayModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-100 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    student.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : student.status === 'Partial'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                <span>
                  Roll No:{' '}
                  <strong className="font-mono text-slate-800">{student.register_number}</strong>
                </span>
                <span>•</span>
                <span>
                  Section: <strong className="text-slate-800">{student.section}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total IV Fee
            </span>
            <p className="text-2xl font-black text-slate-900 mt-2">
              ₹{student.amount_due.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 mt-1">Assigned target amount</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <span className="text-xs font-semibold uppercase text-emerald-700 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Total Paid
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              ₹{student.amount_paid.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-emerald-600/70 mt-1">
              {student.amount_due > 0
                ? `${Math.round((student.amount_paid / student.amount_due) * 100)}% of total fee`
                : 'Receipts verified'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
            <span className="text-xs font-semibold uppercase text-rose-700 tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Remaining Balance
            </span>
            <p className="text-2xl font-black text-rose-600 mt-2">
              ₹{student.balance.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-rose-600/70 mt-1">
              {student.balance === 0 ? 'All dues cleared' : 'Outstanding payment needed'}
            </p>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Payment History & Receipts</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {paymentsList.length} {paymentsList.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {paymentsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No payments recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Record a payment above to add a receipt for this student.
              </p>
              <button
                onClick={openPayModal}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                + Record First Payment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Payment Date</th>
                    <th className="px-6 py-3.5">Amount Paid</th>
                    <th className="px-6 py-3.5">Payment Mode</th>
                    <th className="px-6 py-3.5">Notes / Ref</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.payment_date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 whitespace-nowrap">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeletePayment(p.id, p.amount)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Payment"
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
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Payment Amount (₹) *
                    </label>
                    {student.balance > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentForm({ ...paymentForm, amount: String(student.balance) })
                        }
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Fill Balance (₹{student.balance})
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
                      placeholder="Amount"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentForm.mode}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMode })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Optional (UTR / Reference)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition shadow-sm"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Modify Fee */}
        {isEditFeeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Modify Target IV Fee</h3>
                <button
                  onClick={() => setIsEditFeeModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFeeUpdate} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New IV Fee Amount for {student.name} (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditFeeModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm"
                  >
                    Update Fee
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

export default StudentDetails;
