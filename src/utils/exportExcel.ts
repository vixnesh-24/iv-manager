import * as XLSX from 'xlsx';
import type { StudentWithStats } from '../types';

export function exportStudentsToExcel(students: StudentWithStats[], filename = 'IV_Payment_Report.xlsx') {
  const data = students.map((s, index) => ({
    'S.No': index + 1,
    'Register Number / Roll No': s.register_number,
    'Student Name': s.name,
    'Section': s.section,
    'Amount to Pay (₹)': s.amount_due,
    'Amount Paid (₹)': s.amount_paid,
    'Balance Amount (₹)': s.balance,
    'Payment Status': s.status,
    'Payment Mode': s.payment_mode || 'N/A',
    'Last Payment Date': s.last_payment_date ? s.last_payment_date : 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = [
    { wch: 6 },
    { wch: 18 },
    { wch: 26 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IV Students');

  XLSX.writeFile(workbook, filename);
}
