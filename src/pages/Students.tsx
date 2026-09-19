import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { dataService } from '../services/dataService';
import type { StudentWithStats, PaymentMode } from '../types';
import { exportStudentsToExcel } from '../utils/exportExcel';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Download,
  Filter,
  Eye,
  X,
  IndianRupee,
  Layers,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Pending'>('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isBatchFeeModalOpen, setIsBatchFeeModalOpen] = useState(false);

  // Form states
  const [currentStudent, setCurrentStudent] = useState<StudentWithStats | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    register_number: '',
    department: 'CSE',
    section: 'B',
    phone: '',
    total_amount: 0,
  });

  // Payment modal state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    mode: 'UPI' as PaymentMode,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Batch Fee state
  const [batchAmount, setBatchAmount] = useState<string>('');

  const navigate = useNavigate();

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await dataService.getStudents();
      setStudents(data);
    } catch (err: any) {
      console.error('Failed to load students from Supabase:', err);
      toast.error(err?.message || 'Failed to load students from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(searchQuery));

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Handle Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.register_number.trim()) {
      toast.error('Please enter name and register number');
      return;
    }

    try {
      setActionLoading(true);
      await dataService.addStudent({
        name: studentForm.name,
        register_number: studentForm.register_number,
        department: studentForm.department,
        section: studentForm.section,
        phone: studentForm.phone,
        total_amount: Number(studentForm.total_amount) || 0,
      });
      toast.success('Student saved directly to Supabase!');
      setIsAddModalOpen(false);
      setStudentForm({
        name: '',
        register_number: '',
        department: 'CSE',
        section: 'B',
        phone: '',
        total_amount: 0,
      });
      await loadStudents();
    } catch (err: any) {
      console.error('Add student error:', err);
      toast.error(err?.message || 'Error saving student to Supabase');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (student: StudentWithStats) => {
    setCurrentStudent(student);
    setStudentForm({
      name: student.name,
      register_number: student.register_number,
      department: student.department || 'CSE',
      section: student.section,
      phone: student.phone || '',
      total_amount: student.total_amount,
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    try {
      setActionLoading(true);
      await dataService.updateStudent(currentStudent.id, {
        name: studentForm.name,
        register_number: studentForm.register_number,
        department: studentForm.department,
        section: studentForm.section,
        phone: studentForm.phone,
        total_amount: Number(studentForm.total_amount),
      });
      toast.success('Student updated in Supabase!');
      setIsEditModalOpen(false);
      await loadStudents();
    } catch (err: any) {
      console.error('Update student error:', err);
      toast.error(err?.message || 'Error updating student in Supabase');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${name}? All associated payments will be deleted from Supabase.`
      )
    ) {
      try {
        setActionLoading(true);
        await dataService.deleteStudent(id);
        toast.success('Student deleted from Supabase');
        await loadStudents();
      } catch (err: any) {
        console.error('Delete student error:', err);
        toast.error(err?.message || 'Error deleting student from Supabase');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Open Record Payment for specific student
  const openPaymentModal = (student: StudentWithStats) => {
    setCurrentStudent(student);
    setPaymentForm({
      amount: student.balance > 0 ? String(student.balance) : '',
      mode: 'UPI',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsPayModalOpen(true);
  };

  // Handle Payment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    const amountNum = Number(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setActionLoading(true);
      await dataService.recordPayment({
        student_id: currentStudent.id,
        amount: amountNum,
        payment_mode: paymentForm.mode,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
      });
      toast.success(`Payment of ₹${amountNum} saved to Supabase for ${currentStudent.name}!`);
      setIsPayModalOpen(false);
      await loadStudents();
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err?.message || 'Failed to record payment in Supabase');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Batch Set Fee for All
  const handleBatchFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = Number(batchAmount);
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error('Please enter a valid fee amount');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to set the IV Fee to ₹${feeNum.toLocaleString(
          'en-IN'
        )} for ALL ${students.length} students in Supabase?`
      )
    ) {
      try {
        setActionLoading(true);
        await dataService.setBatchAmountDue(feeNum);
        toast.success(`IV Fee set to ₹${feeNum} for all students in Supabase!`);
        setIsBatchFeeModalOpen(false);
        setBatchAmount('');
        await loadStudents();
      } catch (err: any) {
        console.error('Batch fee error:', err);
        toast.error(err?.message || 'Failed to update fees in Supabase');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle Excel Export
  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.error('No student records to export');
      return;
    }
    exportStudentsToExcel(filteredStudents, 'IV_Students_List.xlsx');
    toast.success('Excel exported successfully');
  };

  const getStatusBadge = (status: 'Paid' | 'Partial' | 'Pending') => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Paid
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Partial
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Pending
          </span>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Student Directory
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {students.length} in PostgreSQL
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Synced across all devices via Supabase PostgreSQL.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadStudents}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition border border-slate-300 text-sm shadow-sm"
              title="Refresh from Supabase"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsBatchFeeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl transition border border-indigo-200 text-sm shadow-sm"
              title="Set same IV fee for all students"
            >
              <Layers className="w-4 h-4" />
              <span>Set Fee For All</span>
            </button>
            <button
              onClick={() => {
                setStudentForm({
                  name: '',
                  register_number: '',
                  department: 'CSE',
                  section: 'B',
                  phone: '',
                  total_amount: 0,
                });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition border border-slate-300 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Roll No (e.g. 24CSB01), Phone, Dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 border border-slate-200 rounded-xl p-1 bg-slate-50 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {(['All', 'Paid', 'Partial', 'Pending'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === tab
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
                <span className="ml-1 opacity-70">
                  (
                  {tab === 'All'
                    ? students.length
                    : students.filter((s) => s.status === tab).length}
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Fetching student records from Supabase...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-semibold text-slate-700">No students found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'All'
                  ? 'Try clearing your search or status filter.'
                  : 'Get started by adding your first student.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Roll No</th>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-3 py-3.5">Dept</th>
                    <th className="px-3 py-3.5">Sec</th>
                    <th className="px-4 py-3.5">Phone</th>
                    <th className="px-4 py-3.5">Fee (Due)</th>
                    <th className="px-4 py-3.5">Paid</th>
                    <th className="px-4 py-3.5">Balance</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {s.register_number}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        <button
                          onClick={() => navigate(`/students/${s.id}`)}
                          className="hover:text-indigo-600 text-left transition"
                        >
                          {s.name}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-slate-600 text-xs font-semibold">{s.department || 'CSE'}</td>
                      <td className="px-3 py-4 text-slate-600 font-medium">{s.section}</td>
                      <td className="px-4 py-4 text-slate-500 text-xs font-mono">{s.phone || '-'}</td>
                      <td className="px-4 py-4 font-semibold text-slate-800 whitespace-nowrap">
                        ₹{s.total_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-600 whitespace-nowrap">
                        ₹{s.amount_paid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 font-bold whitespace-nowrap">
                        {s.balance > 0 ? (
                          <span className="text-rose-600">₹{s.balance.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-emerald-600">₹0</span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">{getStatusBadge(s.status)}</td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openPaymentModal(s)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/students/${s.id}`)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Student */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Add New Student</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="e.g. SAKKTHI A"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.register_number}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, register_number: e.target.value })
                      }
                      placeholder="e.g. 24CSB29"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      placeholder="B"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      placeholder="CSE"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IV Fee Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={studentForm.total_amount}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, total_amount: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Student */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Edit Student</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.register_number}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, register_number: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IV Fee Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={studentForm.total_amount}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, total_amount: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Update Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Record Payment for Student */}
        {isPayModalOpen && currentStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
                  <p className="text-xs text-slate-500">
                    {currentStudent.name} ({currentStudent.register_number})
                  </p>
                </div>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student balance preview */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl flex justify-between text-xs font-semibold">
                <div>
                  <span className="text-slate-500 block">Total Due:</span>
                  <span className="text-slate-800 font-bold">
                    ₹{currentStudent.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Already Paid:</span>
                  <span className="text-emerald-600 font-bold">
                    ₹{currentStudent.amount_paid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Balance:</span>
                  <span className="text-rose-600 font-bold">
                    ₹{currentStudent.balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Payment Amount (₹) *
                    </label>
                    {currentStudent.balance > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentForm({ ...paymentForm, amount: String(currentStudent.balance) })
                        }
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Fill Balance (₹{currentStudent.balance})
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
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
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
                    <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Optional (e.g. UTR / Receipt No.)"
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
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Recording...' : 'Confirm & Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Set Batch Fee For All Students */}
        {isBatchFeeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-indigo-700">
                  <Layers className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-slate-900">Set IV Fee for All Students</h3>
                </div>
                <button
                  onClick={() => setIsBatchFeeModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                This will update the Target Amount Due in Supabase PostgreSQL for all{' '}
                <strong className="text-slate-800">{students.length} students</strong>.
              </p>
              <form onSubmit={handleBatchFeeSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard IV Amount per Student (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={batchAmount}
                      onChange={(e) => setBatchAmount(e.target.value)}
                      placeholder="e.g. 2000"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBatchFeeModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating Supabase...' : 'Apply to All in Supabase'}
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

export default Students;
