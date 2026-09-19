import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { dataService } from '../services/dataService';
import { exportStudentsToExcel } from '../utils/exportExcel';
import {
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  PieChart as PieIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const loadData = () => {
    try {
      setLoading(true);
      const s = dataService.getSummary();
      const st = dataService.getStudents();
      const p = dataService.getPayments();
      setSummary(s);
      setStudents(st);
      setPayments(p);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    if (students.length === 0) {
      toast.error('No data available to export');
      return;
    }
    exportStudentsToExcel(students, 'IV_Comprehensive_Financial_Report.xlsx');
    toast.success('Report exported to Excel!');
  };

  if (loading || !summary) {
    return (
      <Layout>
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Generating reports...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Export & Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Financial Reports & Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Consolidated audit of student payments, mode-wise distribution, and outstanding receivables.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-sm border border-slate-300"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Excel</span>
            </button>
          </div>
        </div>

        {/* Primary Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fee Target
            </span>
            <p className="text-2xl font-black text-slate-900 mt-2">
              ₹{summary.totalAmountDue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 mt-1">Across {summary.totalStudents} students</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Overall Collection
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              ₹{summary.totalCollected.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-emerald-600/70 mt-1">{summary.collectionPercentage}% collected</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Total Pending Amount
            </span>
            <p className="text-2xl font-black text-rose-600 mt-2">
              ₹{summary.totalPending.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-rose-600/70 mt-1">
              {summary.totalAmountDue > 0
                ? `${100 - summary.collectionPercentage}% remaining`
                : 'No dues pending'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Total Receipts
            </span>
            <p className="text-2xl font-black text-indigo-600 mt-2">{payments.length}</p>
            <p className="text-xs text-indigo-600/70 mt-1">Payment transactions</p>
          </div>
        </div>

        {/* Breakdown Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Student Clearance Summary</h3>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Student Count</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-semibold text-emerald-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Fully Paid Students
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                    {summary.paidCount}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                    {summary.totalStudents > 0
                      ? `${Math.round((summary.paidCount / summary.totalStudents) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-semibold text-amber-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Partially Paid Students
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                    {summary.partialCount}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                    {summary.totalStudents > 0
                      ? `${Math.round((summary.partialCount / summary.totalStudents) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-semibold text-rose-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Pending (Zero Paid)
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                    {summary.pendingCount}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                    {summary.totalStudents > 0
                      ? `${Math.round((summary.pendingCount / summary.totalStudents) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-200 font-bold bg-slate-50 text-slate-900">
                <tr>
                  <td className="px-4 py-3">Total Students</td>
                  <td className="px-4 py-3 text-center">{summary.totalStudents}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Mode Distribution Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Payment Mode Audit</h3>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Amount Collected</th>
                  <th className="px-4 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(summary.modeTotals).map(([mode, amount]) => {
                  const amt = amount as number;
                  const share =
                    summary.totalCollected > 0
                      ? Math.round((amt / summary.totalCollected) * 100)
                      : 0;

                  return (
                    <tr key={mode} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{mode}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        ₹{amt.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 font-bold bg-slate-50 text-slate-900">
                <tr>
                  <td className="px-4 py-3">Total Collections</td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    ₹{summary.totalCollected.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
