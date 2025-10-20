'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabse';
import { formatLKR } from '../utils/currency';

const statusOptions = ['All', 'Confirmed', 'Checked_in', 'Pending', 'Cancelled'];

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
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        reservationId: null,
        reservationNumber: null
    });

    // pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    /* ---------------- Fetch Reservations with Guests + Rooms ---------------- */
    useEffect(() => {
        const fetchReservations = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    id,
                    status,
                    reservation_number,
                    estimated_total,
                    check_in_date,
                    check_out_date,
                    reservation_guests (
                        guest:guests (
                            id,
                            name,
                            email,
                            phone,
                            nic
                        )
                    ),
                    reservation_rooms (
                        room:rooms (
                            id,
                            number,
                            type,
                            price
                        )
                    )
                `)
                .order('check_in_date', { ascending: false });

            if (error) {
                console.error('Error fetching reservations:', error);
                setReservations([]);
            } else {
                setReservations(data || []);
            }
            setLoading(false);
        };

        fetchReservations();
    }, []);

    /* ---------------- Filters ---------------- */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return reservations.filter((r) => {
            const statusOk =
                statusFilter === 'All'
                    ? true
                    : String(r.status || '').toLowerCase() === statusFilter.toLowerCase();

            const searchOk =
                !q || `res-${r.reservation_number?.toString().padStart(4, '0')}`.includes(q.toLowerCase()) ||
                r.reservation_guests?.some((g) =>
                    g.guest?.name?.toLowerCase().includes(q)
                ) ||
                r.reservation_rooms?.some(
                    (rr) =>
                        rr.room?.type?.toLowerCase().includes(q) ||
                        rr.room?.number?.toLowerCase().includes(q)
                );

            const d = dayjs(r.check_in_date);
            const fromOk = !dateFilter.from || d.isAfter(dayjs(dateFilter.from).subtract(1, 'day'));
            const toOk = !dateFilter.to || d.isBefore(dayjs(dateFilter.to).add(1, 'day'));
            const rangeOk = fromOk && toOk;

            return statusOk && searchOk && rangeOk;
        });
    }, [reservations, statusFilter, search, dateFilter]);

    /* ---------------- Pagination ---------------- */
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    /* ---------------- Summary ---------------- */
    const summary = useMemo(() => {
        const nonCancelled = filtered.filter(
            (r) => String(r.status || '').toLowerCase() !== 'cancelled'
        );
        const total = filtered.length;
        const confirmed = filtered.filter(
            (r) => String(r.status || '').toLowerCase() === 'confirmed'
        ).length;
        const chekedIn = filtered.filter(
            (r) => String(r.status || '').toLowerCase() === 'checked_in'
        ).length;
        const guests = filtered.reduce(
            (sum, r) => sum + (r.reservation_guests?.length || 0),
            0
        );
        const revenue = nonCancelled.reduce(
            (sum, r) => sum + (Number(r.estimated_total) || 0),
            0
        );
        return { total, confirmed, guests, revenue, chekedIn };
    }, [filtered]);


    const handleDeleteClick = (reservationId, reservationNumber) => {
        setDeleteModal({
            isOpen: true,
            reservationId,
            reservationNumber
        });
    };

    const handleConfirmDelete = async (reservationId) => {
        try {
            // Close modal first
            setDeleteModal({ isOpen: false, reservationId: null, reservationNumber: null });

            // Your delete logic here
            const { error } = await supabase
                .from('reservations')
                .delete()
                .eq('id', reservationId);

            if (error) throw error;

            // Update UI
            setReservations(prev => prev.filter(r => r.id !== reservationId));

            // Optional: Show success toast instead of alert
            console.log('Reservation deleted successfully!');

        } catch (error) {
            console.error('Error deleting reservation:', error);
            alert('Failed to delete reservation. Please try again.');
        }
    };

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
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
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
                <SummaryCard
                    icon="lucide:calendar"
                    label="Total Reservations"
                    value={summary.total}
                    color="bg-emerald-100 text-emerald-700"
                />
                <SummaryCard
                    icon="lucide:badge-check"
                    label="Confirmed"
                    value={summary.confirmed}
                    color="bg-green-100 text-green-700"
                />
                <SummaryCard
                    icon="lucide:badge-check"
                    label="Checked In"
                    value={summary.chekedIn}
                    color="bg-blue-100 text-blue-700"
                />

                <SummaryCard
                    icon="lucide:wallet"
                    label="Revenue"
                    value={formatLKR(summary.revenue)}
                    color="bg-pink-100 text-pink-700"
                />
            </div>

            {/* Table */}
            <div className="bg-white/70 rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div>
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">RES-ID</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Guest(s)</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Check-In</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Check-Out</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                                        No reservations found
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {r.reservation_number
                                                ? `RES-${r.reservation_number.toString().padStart(4, '0')}`
                                                : 'RES-0000'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {r.reservation_guests?.map((g) => g.guest?.name).join(', ') || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-800">
                                            {dayjs(r.check_in_date).format('DD/MM/YY')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-800">
                                            {dayjs(r.check_out_date).format('DD/MM/YY')}
                                        </td>


                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium
    ${String(r.status).toLowerCase() === 'confirmed'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : String(r.status).toLowerCase() === 'pending'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : String(r.status).toLowerCase() === 'checked_in'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-red-100 text-red-700'}`}
                                            >
                                                {r.status}
                                            </span>

                                        </td>
                                        <td className="px-6 py-4 text-slate-800">
                                            {String(r.status).toLowerCase() === 'cancelled'
                                                ? 'N/A'
                                                : formatLKR(r.estimated_total || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-800">
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1">
                                                {/* Room Details Tooltip Button */}
                                                <div className="group relative">
                                                    <button
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                        title="View room details"
                                                    >
                                                        <Icon icon="lucide:info" className="w-4 h-4" />
                                                    </button>

                                                    {/* Tooltip - Portal positioned to avoid clipping */}
                                                    {r.reservation_rooms?.length > 0 && (
                                                        <div className="invisible group-hover:visible absolute top-full right-0 mt-2 z-50">
                                                            <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700 min-w-max">
                                                                <div className="space-y-1">
                                                                    {r.reservation_rooms.slice(0, 3).map((rr, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                                                                            <span className="font-medium">{rr.room?.number}</span>
                                                                            <span className="text-slate-300">({rr.room?.type})</span>
                                                                        </div>
                                                                    ))}
                                                                    {r.reservation_rooms.length > 3 && (
                                                                        <div className="text-slate-300 text-center pt-1 border-t border-slate-600 whitespace-nowrap">
                                                                            +{r.reservation_rooms.length - 3} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Tooltip Arrow */}
                                                                <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteClick(r.id, r.reservation_number)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                                    title="Delete reservation"
                                                >
                                                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                                </button>
                                                {/* Open Reservation Button */}
                                                <button
                                                    onClick={() => navigate(`/dashboard/reservations/${r.id}`)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                    title="Open reservation"
                                                >
                                                    <Icon icon="fluent:open-24-regular" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing {(currentPage - 1) * itemsPerPage + (paginated.length ? 1 : 0)} to{' '}
                            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Icon icon="lucide:chevron-left" width="16" height="16" />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === i + 1
                                        ? 'bg-slate-900 text-white'
                                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Icon icon="lucide:chevron-right" width="16" height="16" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-red-100 text-red-600">
                                <Icon icon="lucide:alert-triangle" className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Delete Reservation</h3>
                        </div>

                        <p className="text-slate-600 mb-6">
                            Are you sure you want to delete reservation{' '}
                            <span className="font-semibold">RES-{deleteModal.reservationNumber?.toString().padStart(6, '0')}</span>?
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, reservationId: null, reservationNumber: null })}
                                className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirmDelete(deleteModal.reservationId)}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete Reservation
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
