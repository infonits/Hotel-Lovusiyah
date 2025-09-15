// Reports.jsx (or .tsx)
// Design: matches your dashboard cards/filters
// Features: Date filter (default: current month), totals, simple tables,
// CSV + PDF export (jsPDF + autoTable, PapaParse), dummy payments fallback.

import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import Papa from 'papaparse';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// Optional: accept expenses from parent (fallback to initial if not provided)
const fallbackExpenses = [
  { id: 'EXP001', title: 'Electricity Bill', category: 'Utilities', amount: 150, date: '2025-09-01', notes: 'August usage' },
  { id: 'EXP002', title: 'Room Repairs', category: 'Maintenance', amount: 300, date: '2025-09-05', notes: 'AC leak' },
  { id: 'EXP003', title: 'Kitchen Groceries', category: 'Food Supplies', amount: 220, date: '2025-09-07', notes: 'Weekly restock' },
  { id: 'EXP004', title: 'Social Media Ads', category: 'Marketing', amount: 100, date: '2025-08-25', notes: 'August campaign' },
  { id: 'EXP005', title: 'Staff Salaries', category: 'Staff Salary', amount: 900, date: '2025-09-02', notes: 'Monthly payout' },
];

// Dummy payments (replace with real data later)
const dummyPayments = [
  { id: 'PAY001', title: 'Room 203 - Checkout', method: 'Cash', amount: 1200, date: '2025-09-03', notes: '2 nights' },
  { id: 'PAY002', title: 'Room 105 - Advance', method: 'Card', amount: 500, date: '2025-09-06', notes: 'Advance payment' },
  { id: 'PAY003', title: 'Banquet Booking', method: 'Bank Transfer', amount: 3000, date: '2025-08-28', notes: 'Corporate event' },
  { id: 'PAY004', title: 'Room 210 - Checkout', method: 'Cash', amount: 1500, date: '2025-09-07', notes: 'Late checkout fee included' },
];

function inDateRange(dateISO, fromISO, toISO) {
  const d = dayjs(dateISO);
  return d.isAfter(dayjs(fromISO).subtract(1, 'day')) && d.isBefore(dayjs(toISO).add(1, 'day'));
}

function currencyLKR(n) {
  // Keep simple to match your existing UI style
  return `LKR ${Number(n || 0).toFixed(2)}`;
}

export default function Reports({ expenses: incomingExpenses }) {
  const expenses = incomingExpenses?.length ? incomingExpenses : fallbackExpenses;
  const payments = dummyPayments;

  // Default to current month
  const thisMonth = dayjs();
  const [range, setRange] = useState({
    from: thisMonth.startOf('month').format('YYYY-MM-DD'),
    to: thisMonth.endOf('month').format('YYYY-MM-DD'),
  });

  // Filters
  const filteredExpenses = useMemo(
    () => expenses.filter(e => inDateRange(e.date, range.from, range.to)),
    [expenses, range]
  );
  const filteredPayments = useMemo(
    () => payments.filter(p => inDateRange(p.date, range.from, range.to)),
    [payments, range]
  );

  // Totals
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [filteredExpenses]
  );
  const totalPayments = useMemo(
    () => filteredPayments.reduce((s, p) => s + Number(p.amount), 0),
    [filteredPayments]
  );
  const net = useMemo(() => totalPayments - totalExpenses, [totalPayments, totalExpenses]);

  // Combined ledger (optional view, sorted by date)
  const ledger = useMemo(() => {
    const exp = filteredExpenses.map(e => ({
      id: e.id,
      type: 'Expense',
      title: e.title,
      categoryOrMethod: e.category,
      amount: -Math.abs(Number(e.amount)),
      date: e.date,
      notes: e.notes || '',
    }));
    const pay = filteredPayments.map(p => ({
      id: p.id,
      type: 'Payment',
      title: p.title,
      categoryOrMethod: p.method,
      amount: Math.abs(Number(p.amount)),
      date: p.date,
      notes: p.notes || '',
    }));
    return [...exp, ...pay].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [filteredExpenses, filteredPayments]);

  // CSV helpers
  const downloadCSV = (rows, filename) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExpensesCSV = () => {
    const rows = filteredExpenses.map(e => ({
      ID: e.id,
      Title: e.title,
      Category: e.category,
      Amount: e.amount,
      Date: e.date,
      Notes: e.notes || '',
    }));
    downloadCSV(rows, `expenses_${range.from}_to_${range.to}.csv`);
  };

  const exportPaymentsCSV = () => {
    const rows = filteredPayments.map(p => ({
      ID: p.id,
      Title: p.title,
      Method: p.method,
      Amount: p.amount,
      Date: p.date,
      Notes: p.notes || '',
    }));
    downloadCSV(rows, `payments_${range.from}_to_${range.to}.csv`);
  };

  const exportLedgerCSV = () => {
    const rows = ledger.map(r => ({
      ID: r.id,
      Type: r.type,
      Title: r.title,
      CategoryOrMethod: r.categoryOrMethod,
      Amount: r.amount,
      Date: r.date,
      Notes: r.notes,
    }));
    downloadCSV(rows, `ledger_${range.from}_to_${range.to}.csv`);
  };

  // PDF export (summary + tables)


  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
              <Icon icon="lucide:calendar" className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-slate-500">From</div>
              <div className="text-base font-medium text-slate-800">{range.from}</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-pink-100 text-pink-700 p-2 rounded-full">
              <Icon icon="lucide:calendar-range" className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-slate-500">To</div>
              <div className="text-base font-medium text-slate-800">{range.to}</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
              <Icon icon="lucide:wallet" className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Net Cashflow</div>
              <div className={`text-xl font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {currencyLKR(net)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Export */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
            />
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">

            <button onClick={exportPaymentsCSV} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Icon icon="lucide:download" className="w-4 h-4" />
              Payments CSV
            </button>
            <button onClick={exportExpensesCSV} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Icon icon="lucide:download" className="w-4 h-4" />
              Expenses CSV
            </button>
            <button onClick={exportLedgerCSV} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-sm">
              <Icon icon="lucide:download" className="w-4 h-4" />
              Ledger CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI glance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full"><Icon icon="lucide:credit-card" className="w-5 h-5" /></div>
            <div>
              <div className="text-sm text-slate-500">Total Payments</div>
              <div className="text-xl font-semibold text-slate-800">{currencyLKR(totalPayments)}</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 text-rose-700 p-2 rounded-full"><Icon icon="lucide:receipt" className="w-5 h-5" /></div>
            <div>
              <div className="text-sm text-slate-500">Total Expenses</div>
              <div className="text-xl font-semibold text-slate-800">{currencyLKR(totalExpenses)}</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-700 p-2 rounded-full"><Icon icon="lucide:scale" className="w-5 h-5" /></div>
            <div>
              <div className="text-sm text-slate-500">Entries</div>
              <div className="text-xl font-semibold text-slate-800">{filteredPayments.length + filteredExpenses.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-slate-800 font-semibold">Payments</h3>
          <div className="text-sm text-slate-600">Total: {currencyLKR(totalPayments)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Method</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 text-slate-800 font-medium">{p.id}</td>
                  <td className="px-6 py-4 text-slate-800">{p.title}</td>
                  <td className="px-6 py-4 text-slate-800">{p.method}</td>
                  <td className="px-6 py-4 text-slate-800">{currencyLKR(p.amount)}</td>
                  <td className="px-6 py-4 text-slate-800">{dayjs(p.date).format('MMM D, YYYY')}</td>
                  <td className="px-6 py-4 text-slate-800">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30 flex items-center justify-between">
          <div className="text-sm text-slate-600">Showing {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}</div>
          <div className="text-sm font-semibold text-slate-800">Total: {currencyLKR(totalPayments)}</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-slate-800 font-semibold">Expenses</h3>
          <div className="text-sm text-slate-600">Total: {currencyLKR(totalExpenses)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 text-slate-800 font-medium">{e.id}</td>
                  <td className="px-6 py-4 text-slate-800">{e.title}</td>
                  <td className="px-6 py-4 text-slate-800">{e.category}</td>
                  <td className="px-6 py-4 text-slate-800">{currencyLKR(e.amount)}</td>
                  <td className="px-6 py-4 text-slate-800">{dayjs(e.date).format('MMM D, YYYY')}</td>
                  <td className="px-6 py-4 text-slate-800">{e.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30 flex items-center justify-between">
          <div className="text-sm text-slate-600">Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}</div>
          <div className="text-sm font-semibold text-slate-800">Total: {currencyLKR(totalExpenses)}</div>
        </div>
      </div>

      {/* (Optional) Ledger preview – uncomment if you want it visible on page
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-200/50 bg-slate-50/30">
          <h3 className="text-slate-800 font-semibold">Combined Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Category/Method</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount (+/-)</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(row => (
                <tr key={`${row.type}-${row.id}`} className="border-t border-slate-200/50 hover:bg-slate-50/30">
                  <td className="px-6 py-4 text-slate-800">{dayjs(row.date).format('MMM D, YYYY')}</td>
                  <td className="px-6 py-4 text-slate-800">{row.type}</td>
                  <td className="px-6 py-4 text-slate-800">{row.title}</td>
                  <td className="px-6 py-4 text-slate-800">{row.categoryOrMethod}</td>
                  <td className={`px-6 py-4 font-medium ${row.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {row.amount >= 0 ? '+' : ''}{row.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-slate-800">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      */}
    </div>
  );
}
