import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { dataService } from '../services/dataService';
import { exportStudentsToExcel } from '../utils/exportExcel';
import {
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Download,
  PlusCircle,
  ArrowRight,
  Clock,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [s, allStudents] = await Promise.all([
        dataService.getSummary(),
        dataService.getStudents(),
      ]);
      setSummary(s);
      setStudents(allStudents);
    } catch (err: any) {
      console.error('Failed to load dashboard data from Supabase:', err);
      const msg = err?.message || 'Failed to connect to Supabase database';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    if (!students || students.length === 0) {
      toast.error('No student data to export');
      return;
    }
    exportStudentsToExcel(students);
    toast.success('Excel report downloaded!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Syncing with Supabase database...</p>
        </div>
      </Layout>
    );
  }

  if (errorMessage) {
    return (
      <Layout>
        <div className="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm text-center max-w-2xl mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Database Connection Required</h2>
          <p className="text-sm text-slate-600 mt-2">
            Could not query the Supabase tables: <code className="bg-slate-100 px-2 py-1 rounded text-rose-600 font-mono text-xs">{errorMessage}</code>
          </p>
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">To create the required tables in Supabase:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">Supabase Dashboard</a>.</li>
              <li>Go to <strong>SQL Editor</strong> → click <strong>New query</strong>.</li>
              <li>Run the migration script located at <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">supabase/migrations/20241001_create_tables.sql</code>.</li>
            </ol>
          </div>
          <button
            onClick={loadData}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </Layout>
    );
  }

  // Status Chart Data
  const statusData = [
    { name: 'Paid', value: summary?.paidCount || 0, color: '#10b981' },
    { name: 'Partial', value: summary?.partialCount || 0, color: '#f59e0b' },
    { name: 'Pending', value: summary?.pendingCount || 0, color: '#ef4444' },
  ];

  // Mode Chart Data
  const modeData = Object.entries(summary?.modeTotals || {}).map(([mode, total]) => ({
    name: mode,
    value: total as number,
  }));

  const MODE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                IV Payment Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase Synced
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Live multi-device monitoring of student fees, collections, and outstanding dues.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition border border-slate-300/80 text-sm"
              title="Refresh from Supabase"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              to="/payments"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition shadow-sm text-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </Link>
            <Link
              to="/students"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manage Students</span>
            </Link>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition border border-slate-300/80 text-sm"
              title="Download Excel Report"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* 5 Primary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Students
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{summary?.totalStudents || 0}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Batch enrolled in Supabase</p>
          </div>

          {/* Total Amount Due */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Amount Due
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">
              ₹{(summary?.totalAmountDue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Target collection</p>
          </div>

          {/* Amount Collected */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Amount Collected
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-3">
              ₹{(summary?.totalCollected || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-emerald-600/80 mt-1 font-medium">Verified receipts</p>
          </div>

          {/* Pending Amount */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group hover:border-rose-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                Pending Amount
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-rose-600 mt-3">
              ₹{(summary?.totalPending || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-rose-600/80 mt-1 font-medium">Remaining balance</p>
          </div>

          {/* Collection Percentage */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group hover:border-amber-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Progress
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 mt-3">
              {summary?.collectionPercentage || 0}%
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary?.collectionPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Payment Status</h3>
                <p className="text-xs text-slate-500">Breakdown of Paid, Partial, and Pending students</p>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`status-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around pt-4 border-t border-slate-100 text-center text-xs font-semibold">
              <div className="text-emerald-600">
                <span className="block text-lg font-bold">{summary?.paidCount || 0}</span>
                <span>Fully Paid</span>
              </div>
              <div className="text-amber-600">
                <span className="block text-lg font-bold">{summary?.partialCount || 0}</span>
                <span>Partial Paid</span>
              </div>
              <div className="text-rose-600">
                <span className="block text-lg font-bold">{summary?.pendingCount || 0}</span>
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Payment Modes Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Collection by Payment Mode</h3>
                <p className="text-xs text-slate-500">Distribution across UPI, Cash, and Bank transfers</p>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              {(summary?.totalCollected || 0) === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No payment records in Supabase yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeData.filter((m) => m.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {modeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={MODE_COLORS[index % MODE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
              {Object.entries(summary?.modeTotals || {}).map(([mode, total]) => (
                <div key={mode} className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500 block font-medium">{mode}</span>
                  <span className="font-bold text-slate-900">
                    ₹{(total as number).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Payment Transactions</h3>
            </div>
            <Link
              to="/payments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(summary?.recentPayments || []).length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No recent payments recorded in Supabase.</p>
              <Link
                to="/payments"
                className="mt-3 inline-block text-xs text-indigo-600 hover:underline font-semibold"
              >
                + Record the first payment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Roll No</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Mode</th>
                    <th className="px-6 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.recentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap font-medium">
                        {p.payment_date}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {p.register_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{p.student_name}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 whitespace-nowrap">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.payment_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
