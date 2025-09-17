'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabse';

/* ---------------- Helpers ---------------- */
function inDateRange(dateISO, fromISO, toISO) {
  const d = dayjs(dateISO);
  return (
    d.isAfter(dayjs(fromISO).subtract(1, 'day')) &&
    d.isBefore(dayjs(toISO).add(1, 'day'))
  );
}
function currencyLKR(n) {
  return `LKR ${Number(n || 0).toFixed(2)}`;
}

/* ---------------- Component ---------------- */
export default function Reports() {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const thisMonth = dayjs();
  const [range, setRange] = useState({
    from: thisMonth.startOf('month').format('YYYY-MM-DD'),
    to: thisMonth.endOf('month').format('YYYY-MM-DD'),
  });

  /* ---------------- Fetch from Supabase ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (expErr) console.error('Expenses fetch error:', expErr);
      if (payErr) console.error('Payments fetch error:', payErr);

      setExpenses(expData || []);
      setPayments(payData || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  /* ---------------- Filters ---------------- */
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => inDateRange(e.date, range.from, range.to)),
    [expenses, range]
  );
  const filteredPayments = useMemo(
    () => payments.filter((p) => inDateRange(p.date, range.from, range.to)),
    [payments, range]
  );

  /* ---------------- Totals ---------------- */
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [filteredExpenses]
  );
  const totalPayments = useMemo(
    () => filteredPayments.reduce((s, p) => s + Number(p.amount), 0),
    [filteredPayments]
  );
  const net = useMemo(
    () => totalPayments - totalExpenses,
    [totalPayments, totalExpenses]
  );

  /* ---------------- Combined Ledger ---------------- */
  const ledger = useMemo(() => {
    const exp = filteredExpenses.map((e) => ({
      id: e.id,
      type: 'Expense',
      title: e.title,
      categoryOrMethod: e.category,
      amount: -Math.abs(Number(e.amount)),
      date: e.date,
      notes: e.notes || '',
    }));
    const pay = filteredPayments.map((p) => ({
      id: p.id,
      type: 'Payment',
      title: p.type,
      categoryOrMethod: p.method,
      amount: Math.abs(Number(p.amount)),
      date: p.date,
      notes: p.notes || '',
    }));
    return [...exp, ...pay].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
  }, [filteredExpenses, filteredPayments]);

  /* ---------------- CSV + PDF Export ---------------- */
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
    const rows = filteredExpenses.map((e) => ({
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
    const rows = filteredPayments.map((p) => ({
      ID: p.id,
      Reservation: p.reservation_id,
      Type: p.type,
      Method: p.method,
      Amount: p.amount,
      Date: p.date,
    }));
    downloadCSV(rows, `payments_${range.from}_to_${range.to}.csv`);
  };

  const exportLedgerCSV = () => {
    const rows = ledger.map((r) => ({
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

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Hotel Reports', 14, 16);
    doc.setFontSize(10);
    doc.text(`From: ${range.from} To: ${range.to}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Reservation', 'Type', 'Method', 'Amount', 'Date']],
      body: filteredPayments.map((p) => [
        p.id,
        p.reservation_id,
        p.type,
        p.method,
        currencyLKR(p.amount),
        dayjs(p.date).format('YYYY-MM-DD'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['ID', 'Title', 'Category', 'Amount', 'Date', 'Notes']],
      body: filteredExpenses.map((e) => [
        e.id,
        e.title,
        e.category,
        currencyLKR(e.amount),
        dayjs(e.date).format('YYYY-MM-DD'),
        e.notes || '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.setFontSize(12);
    doc.text(
      `Net Cashflow: ${currencyLKR(net)}`,
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
                    {currencyLKR(net)}
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* ✅ KPI glance cards */}
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
              <div className="text-sm text-slate-600">
                Total: {currencyLKR(totalPayments)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    {/* <th className="px-6 py-4 text-left">Reservation</th> */}
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors"
                    >
                      {/* <td className="px-6 py-4">{p.reservation_id}</td> */}
                      <td className="px-6 py-4">{p.type}</td>
                      <td className="px-6 py-4">{p.method}</td>
                      <td className="px-6 py-4">{currencyLKR(p.amount)}</td>
                      <td className="px-6 py-4">{dayjs(p.date).format('MMM D, YYYY')}</td>
                      <td className="px-6 py-4">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-slate-800 font-semibold">Expenses</h3>
              <div className="text-sm text-slate-600">
                Total: {currencyLKR(totalExpenses)}
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
                  {filteredExpenses.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">{e.title}</td>
                      <td className="px-6 py-4">{e.category}</td>
                      <td className="px-6 py-4">{currencyLKR(e.amount)}</td>
                      <td className="px-6 py-4">{dayjs(e.date).format('MMM D, YYYY')}</td>
                      <td className="px-6 py-4">{e.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
