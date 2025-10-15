'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabse';
import { formatLKR } from '../utils/currency';

/* ---------------- Component ---------------- */
export default function Reports() {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);

  // Counts for pagination
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [expensesCount, setExpensesCount] = useState(0);

  const itemsPerPage = 10;

  const thisMonth = dayjs();
  const [range, setRange] = useState({
    from: thisMonth.startOf('month').format('YYYY-MM-DD'),
    to: thisMonth.endOf('month').format('YYYY-MM-DD'),
  });

  // Calculate total pages
  const paymentsTotalPages = Math.ceil(paymentsCount / itemsPerPage) || 1;
  const expensesTotalPages = Math.ceil(expensesCount / itemsPerPage) || 1;

  /* ---------------- Fetch from Supabase with Pagination ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch payments with pagination
      const paymentsStart = (currentPage - 1) * itemsPerPage;
      const paymentsEnd = paymentsStart + itemsPerPage - 1;

      const { data: payData, error: payErr, count: payCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .gte('date', range.from)
        .lte('date', range.to)
        .order('date', { ascending: false })
        .range(paymentsStart, paymentsEnd);

      // Fetch expenses with pagination
      const expensesStart = (expensesPage - 1) * itemsPerPage;
      const expensesEnd = expensesStart + itemsPerPage - 1;

      const { data: expData, error: expErr, count: expCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .gte('date', range.from)
        .lte('date', range.to)
        .order('date', { ascending: false })
        .range(expensesStart, expensesEnd);

      if (expErr) console.error('Expenses fetch error:', expErr);
      if (payErr) console.error('Payments fetch error:', payErr);

      setExpenses(expData || []);
      setPayments(payData || []);
      setPaymentsCount(payCount || 0);
      setExpensesCount(expCount || 0);
      setLoading(false);
    };

    fetchData();
  }, [range.from, range.to, currentPage, expensesPage]);

  /* ---------------- Fetch Totals (for summary cards) ---------------- */
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    const fetchTotals = async () => {
      // Get all payments in date range for totals
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('date', range.from)
        .lte('date', range.to);

      // Get all expenses in date range for totals
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', range.from)
        .lte('date', range.to);

      const payTotal = (allPayments || []).reduce((s, p) => s + Number(p.amount), 0);
      const expTotal = (allExpenses || []).reduce((s, e) => s + Number(e.amount), 0);

      setTotalPayments(payTotal);
      setTotalExpenses(expTotal);
    };

    fetchTotals();
  }, [range.from, range.to]);

  const net = useMemo(
    () => totalPayments - totalExpenses,
    [totalPayments, totalExpenses]
  );

  /* ---------------- Reset pages when date changes ---------------- */
  useEffect(() => {
    setCurrentPage(1);
    setExpensesPage(1);
  }, [range.from, range.to]);

  /* ---------------- CSV + PDF Export (fetch all data) ---------------- */
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

  const exportExpensesCSV = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', range.from)
      .lte('date', range.to)
      .order('date', { ascending: false });

    const rows = (data || []).map((e) => ({
      ID: e.id,
      Title: e.title,
      Category: e.category,
      Amount: e.amount,
      Date: e.date,
      Notes: e.notes || '',
    }));
    downloadCSV(rows, `expenses_${range.from}_to_${range.to}.csv`);
  };

  const exportPaymentsCSV = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .gte('date', range.from)
      .lte('date', range.to)
      .order('date', { ascending: false });

    const rows = (data || []).map((p) => ({
      ID: p.id,
      Reservation: p.reservation_id,
      Type: p.type,
      Method: p.method,
      Amount: p.amount,
      Date: p.date,
    }));
    downloadCSV(rows, `payments_${range.from}_to_${range.to}.csv`);
  };

  const exportLedgerCSV = async () => {
    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', range.from)
      .lte('date', range.to);

    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .gte('date', range.from)
      .lte('date', range.to);

    const exp = (expData || []).map((e) => ({
      ID: e.id,
      Type: 'Expense',
      Title: e.title,
      CategoryOrMethod: e.category,
      Amount: -Math.abs(Number(e.amount)),
      Date: e.date,
      Notes: e.notes || '',
    }));

    const pay = (payData || []).map((p) => ({
      ID: p.id,
      Type: 'Payment',
      Title: p.type,
      CategoryOrMethod: p.method,
      Amount: Math.abs(Number(p.amount)),
      Date: p.date,
      Notes: p.notes || '',
    }));

    const ledger = [...exp, ...pay].sort(
      (a, b) => dayjs(a.Date).valueOf() - dayjs(b.Date).valueOf()
    );

    downloadCSV(ledger, `ledger_${range.from}_to_${range.to}.csv`);
  };

  const exportPDF = async () => {
    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .gte('date', range.from)
      .lte('date', range.to)
      .order('date', { ascending: false });

    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', range.from)
      .lte('date', range.to)
      .order('date', { ascending: false });

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Hotel Reports', 14, 16);
    doc.setFontSize(10);
    doc.text(`From: ${range.from} To: ${range.to}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Reservation', 'Type', 'Method', 'Amount', 'Date']],
      body: (payData || []).map((p) => [
        p.id,
        p.reservation_id,
        p.type,
        p.method,
        formatLKR(p.amount),
        dayjs(p.date).format('YYYY-MM-DD'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['ID', 'Title', 'Category', 'Amount', 'Date', 'Notes']],
      body: (expData || []).map((e) => [
        e.id,
        e.title,
        e.category,
        formatLKR(e.amount),
        dayjs(e.date).format('YYYY-MM-DD'),
        e.notes || '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.setFontSize(12);
    doc.text(
      `Net Cashflow: ${formatLKR(net)}`,
      14,
      doc.lastAutoTable.finalY + 15
    );

    doc.save(`report_${range.from}_to_${range.to}.pdf`);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {loading ? (
        <div className="text-center text-slate-500">Loading reports...</div>
      ) : (
        <>
          {/* Filters + Export */}
          <div className="bg-yellow-50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <input
                  type="date"
                  value={range.from}
                  onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                />
                <input
                  type="date"
                  value={range.to}
                  onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportPaymentsCSV} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Icon icon="lucide:download" className="w-4 h-4" /> Payments CSV
                </button>
                <button onClick={exportExpensesCSV} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  <Icon icon="lucide:download" className="w-4 h-4" /> Expenses CSV
                </button>
                <button onClick={exportLedgerCSV} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-sm">
                  <Icon icon="lucide:download" className="w-4 h-4" /> Ledger CSV
                </button>
                <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                  <Icon icon="lucide:file" className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Date + Net Cards */}
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
                    {formatLKR(net)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI glance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                  <Icon icon="lucide:credit-card" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Total Payments</div>
                  <div className="text-xl font-semibold text-slate-800">{formatLKR(totalPayments)}</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 text-rose-700 p-2 rounded-full">
                  <Icon icon="lucide:receipt" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Total Expenses</div>
                  <div className="text-xl font-semibold text-slate-800">{formatLKR(totalExpenses)}</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 text-slate-700 p-2 rounded-full">
                  <Icon icon="lucide:scale" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Total Entries</div>
                  <div className="text-xl font-semibold text-slate-800">{paymentsCount + expensesCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-slate-800 font-semibold">Payments</h3>
              <div className="text-sm text-slate-600">
                Total: {formatLKR(totalPayments)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        No payments found for this date range
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">{p.type}</td>
                        <td className="px-6 py-4">{p.method}</td>
                        <td className="px-6 py-4">{formatLKR(p.amount)}</td>
                        <td className="px-6 py-4">{dayjs(p.date).format('MMM D, YYYY')}</td>
                        <td className="px-6 py-4">{p.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50">
              <div className="text-sm text-slate-600">
                Page {currentPage} of {paymentsTotalPages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === paymentsTotalPages}
                  onClick={() => setCurrentPage((p) => Math.min(paymentsTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-slate-800 font-semibold">Expenses</h3>
              <div className="text-sm text-slate-600">
                Total: {formatLKR(totalExpenses)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left">Title</th>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        No expenses found for this date range
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr
                        key={e.id}
                        className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">{e.title}</td>
                        <td className="px-6 py-4">{e.category}</td>
                        <td className="px-6 py-4">{formatLKR(e.amount)}</td>
                        <td className="px-6 py-4">{dayjs(e.date).format('MMM D, YYYY')}</td>
                        <td className="px-6 py-4">{e.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50">
              <div className="text-sm text-slate-600">
                Page {expensesPage} of {expensesTotalPages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={expensesPage === 1}
                  onClick={() => setExpensesPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  disabled={expensesPage === expensesTotalPages}
                  onClick={() => setExpensesPage((p) => Math.min(expensesTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}