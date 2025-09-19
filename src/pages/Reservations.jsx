'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabse';

const statusOptions = ['All', 'Confirmed', 'Pending', 'Cancelled'];

export default function ReservationsPage() {
    const navigate = useNavigate();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const thisMonth = dayjs();
    const [dateFilter, setDateFilter] = useState({
        from: thisMonth.startOf('month').format('YYYY-MM-DD'),
        to: thisMonth.endOf('month').format('YYYY-MM-DD'),
    });

    /* ---------------- Fetch Reservations ---------------- */
    useEffect(() => {
        const fetchReservations = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .order('check_in_date', { ascending: false });

            if (error) console.error('Error fetching reservations:', error);
            else setReservations(data);
            setLoading(false);
        };

        fetchReservations();
    }, []);

    /* ---------------- Filters ---------------- */
    const filteredReservations = useMemo(() => {
        return reservations.filter((r) => {
            const matchesStatus =
                statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
            const matchesSearch =
                r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
                r.room_type?.toLowerCase().includes(search.toLowerCase());
            const inDateRange =
                dayjs(r.check_in_date).isAfter(dayjs(dateFilter.from).subtract(1, 'day')) &&
                dayjs(r.check_in_date).isBefore(dayjs(dateFilter.to).add(1, 'day'));
            return matchesStatus && matchesSearch && inDateRange;
        });
    }, [reservations, statusFilter, search, dateFilter]);

    /* ---------------- Summary ---------------- */
    const summary = useMemo(() => {
        const total = filteredReservations.length;
        const confirmed = filteredReservations.filter((r) => r.status === 'confirmed').length;
        const guests = filteredReservations.reduce((sum, r) => sum + (r.guest_count || 1), 0);
        const revenue = filteredReservations.reduce((sum, r) => sum + (r.amount || 0), 0);
        return { total, confirmed, guests, revenue };
    }, [filteredReservations]);

    /* ---------------- Render ---------------- */
    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Filters */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Icon
                                icon="lucide:search"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                                width="20"
                                height="20"
                            />
                            <input
                                type="text"
                                placeholder="Search reservations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring focus:ring-emerald-100"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring focus:ring-emerald-100"
                        >
                            {statusOptions.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>

                        {/* Date Range */}
                        <input
                            type="date"
                            value={dateFilter.from}
                            onChange={(e) =>
                                setDateFilter((prev) => ({ ...prev, from: e.target.value }))
                            }
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                        />
                        <input
                            type="date"
                            value={dateFilter.to}
                            onChange={(e) =>
                                setDateFilter((prev) => ({ ...prev, to: e.target.value }))
                            }
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                        />
                    </div>

                    {/* Navigate to Reservation Form */}
                    <button
                        onClick={() => navigate('/dashboard/reservations/new')}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-900 hover:bg-slate-950 text-white shadow-sm"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" />
                        New Reservation
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon="lucide:calendar" label="Total Reservations" value={summary.total} color="bg-emerald-100 text-emerald-700" />
                <SummaryCard icon="lucide:badge-check" label="Confirmed" value={summary.confirmed} color="bg-blue-100 text-blue-700" />
                <SummaryCard icon="lucide:users" label="Guests" value={summary.guests} color="bg-indigo-100 text-indigo-700" />
                <SummaryCard icon="lucide:wallet" label="Revenue" value={`LKR ${summary.revenue.toFixed(2)}`} color="bg-pink-100 text-pink-700" />
            </div>

            {/* Table */}
            <div className="bg-white/70 rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Guest</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Check-In</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Check-Out</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Room</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                                        No reservations found
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-800">{r.guest_name}</td>
                                        <td className="px-6 py-4 text-slate-800">{dayjs(r.check_in_date).format('MMM D, YYYY')}</td>
                                        <td className="px-6 py-4 text-slate-800">{dayjs(r.check_out_date).format('MMM D, YYYY')}</td>
                                        <td className="px-6 py-4 text-slate-800">{r.room_type}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium
                        ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                    r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-800">LKR {Number(r.amount).toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        Showing {filteredReservations.length}{' '}
                        {filteredReservations.length === 1 ? 'reservation' : 'reservations'}
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                        Total Revenue: LKR {summary.revenue.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---- Small Summary Card Component ---- */
function SummaryCard({ icon, label, value, color }) {
    return (
        <div className="p-4 rounded-xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`${color} p-2 rounded-full`}>
                    <Icon icon={icon} className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="text-xl font-semibold text-slate-800">{value}</div>
                </div>
            </div>
        </div>
    );
}
