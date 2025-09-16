// Expenses Page Component — Hotel Expense Tracker
// Design: Matches Hotel Dashboard (Guests, Rooms, Services)
// Features: Add expense, filter by category/search/date, track total (auto-selected to this month)

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';

const initialExpenses = [
    { id: 'EXP001', title: 'Electricity Bill', category: 'Utilities', amount: 150, date: '2025-09-01', notes: 'August usage' },
    { id: 'EXP002', title: 'Room Repairs', category: 'Maintenance', amount: 300, date: '2025-09-05', notes: 'AC leak' },
    { id: 'EXP003', title: 'Kitchen Groceries', category: 'Food Supplies', amount: 220, date: '2025-09-07', notes: 'Weekly restock' },
    { id: 'EXP004', title: 'Social Media Ads', category: 'Marketing', amount: 100, date: '2025-08-25', notes: 'August campaign' },
    { id: 'EXP005', title: 'Staff Salaries', category: 'Staff Salary', amount: 900, date: '2025-09-02', notes: 'Monthly payout' },
];

const categories = [
    'All Categories',
    'Utilities',
    'Maintenance',
    'Food Supplies',
    'Staff Salary',
    'Cleaning',
    'Marketing',
    'Other'
];

export default function Expenses() {
    const [expenses, setExpenses] = useState(initialExpenses);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');

    // Default: current month
    const thisMonth = dayjs();
    const [dateFilter, setDateFilter] = useState({
        from: thisMonth.startOf('month').format('YYYY-MM-DD'),
        to: thisMonth.endOf('month').format('YYYY-MM-DD'),
    });

    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        title: '',
        category: 'Utilities',
        amount: '',
        date: dayjs().format('YYYY-MM-DD'),
        notes: '',
    });

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const inCategory = categoryFilter === 'All Categories' || e.category === categoryFilter;
            const inSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.notes.toLowerCase().includes(search.toLowerCase());
            const inDateRange = dayjs(e.date).isAfter(dayjs(dateFilter.from).subtract(1, 'day')) && dayjs(e.date).isBefore(dayjs(dateFilter.to).add(1, 'day'));
            return inCategory && inSearch && inDateRange;
        });
    }, [expenses, categoryFilter, search, dateFilter]);

    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    }, [filteredExpenses]);

    const handleAddExpense = () => {
        const id = `EXP LKR {(expenses.length + 1).toString().padStart(3, '0')}`;
        setExpenses(prev => [...prev, { id, ...newExpense, amount: parseFloat(newExpense.amount) }]);
        setShowModal(false);
        setNewExpense({ title: '', category: 'Utilities', amount: '', date: dayjs().format('YYYY-MM-DD'), notes: '' });
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                            <Icon icon="lucide:credit-card" className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Total Expenses</div>
                            <div className="text-xl font-semibold text-slate-800">LKR {totalAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
                            <Icon icon="lucide:calendar" className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">From</div>
                            <div className="text-base font-medium text-slate-800">{dateFilter.from}</div>
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
                            <div className="text-base font-medium text-slate-800">{dateFilter.to}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 flex-1">
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring focus:ring-emerald-100"
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring focus:ring-emerald-100"
                        >
                            {categories.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input
                            type="date"
                            value={dateFilter.from}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                        />
                        <input
                            type="date"
                            value={dateFilter.to}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" />
                        New Expense
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
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
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4 text-slate-800 font-medium">{exp.id}</td>
                                    <td className="px-6 py-4 text-slate-800">{exp.title}</td>
                                    <td className="px-6 py-4 text-slate-800">{exp.category}</td>
                                    <td className="px-6 py-4 text-slate-800">LKR {exp.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-800">{dayjs(exp.date).format('MMM D, YYYY')}</td>
                                    <td className="px-6 py-4 text-slate-800">{exp.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                        Total: LKR {totalAmount.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">Add New Expense</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700">
                                <Icon icon="lucide:x" width="20" height="20" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Title" value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                            <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                {categories.filter(c => c !== 'All Categories').map(c => <option key={c}>{c}</option>)}
                            </select>
                            <input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                            <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                            <textarea placeholder="Notes" value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg"></textarea>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800">Cancel</button>
                            <button onClick={handleAddExpense} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Add Expense</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}