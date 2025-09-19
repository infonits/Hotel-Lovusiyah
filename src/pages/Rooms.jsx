// Rooms component connected to Supabase with full CRUD
// - Keeps your styling and layout
// - Adds edit/delete actions
// - Uses the same "Add New Room" modal for editing too

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabse';

// Helper: to/from facilities text<->array
const toFacilitiesArray = (txt) =>
    (txt || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

const toFacilitiesText = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showNewRoom, setShowNewRoom] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState('');
    const itemsPerPage = 10;

    // Form state (used for both create & edit)
    const [form, setForm] = useState({
        id: null,              // if null => create, else edit
        number: '',
        type: '',
        capacity: '',
        price: '',
        facilities: '',
        description: '',
    });

    const isEditing = !!form.id;

    // Fetch all rooms on mount
    const fetchRooms = async () => {
        setLoading(true);
        setError('');
        try {
            // Select columns that match our UI; map created_at -> createdAt
            const { data, error: err } = await supabase
                .from('rooms')
                .select('id, number, type, capacity, price, facilities, description, created_at')
                .order('created_at', { ascending: false });

            if (err) throw err;

            const mapped = (data || []).map((r) => ({
                id: r.id,
                number: r.number || '',
                type: r.type || '',
                capacity: r.capacity ?? 0,
                price: r.price ?? 0,
                facilities: Array.isArray(r.facilities) ? r.facilities : [],
                description: r.description || '',
                createdAt: (r.created_at || '').slice(0, 10),
            }));

            setRooms(mapped);
        } catch (e) {
            setError(e.message || 'Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    // Search + pagination
    const filteredRooms = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return rooms.filter((room) => {
            const facilitiesTxt = toFacilitiesText(room.facilities).toLowerCase();
            return (
                room.number.toLowerCase().includes(term) ||
                room.type.toLowerCase().includes(term) ||
                room.description.toLowerCase().includes(term) ||
                facilitiesTxt.includes(term)
            );
        });
    }, [rooms, searchTerm]);

    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

    // Open modal for create
    const openCreate = () => {
        setForm({
            id: null,
            number: '',
            type: '',
            capacity: '',
            price: '',
            facilities: '',
            description: '',
        });
        setShowNewRoom(true);
    };

    // Open modal for edit
    const openEdit = (room) => {
        setForm({
            id: room.id,
            number: room.number,
            type: room.type,
            capacity: String(room.capacity ?? ''),
            price: String(room.price ?? ''),
            facilities: toFacilitiesText(room.facilities),
            description: room.description || '',
        });
        setShowNewRoom(true);
    };

    // Create or Update
    const handleSave = async () => {
        setError('');

        if (!form.number.trim() || !form.type.trim()) {
            setError('Room number and type are required.');
            return;
        }

        const payload = {
            number: form.number.trim(),
            type: form.type.trim(),
            capacity: form.capacity ? Number(form.capacity) : null,
            price: form.price ? Number(form.price) : null,
            facilities: toFacilitiesArray(form.facilities),
            description: form.description.trim() || null,
        };

        try {
            if (isEditing) {
                const { error: err } = await supabase
                    .from('rooms')
                    .update(payload)
                    .eq('id', form.id);

                if (err) throw err;
            } else {
                const { error: err } = await supabase.from('rooms').insert(payload);
                if (err) throw err;
            }

            setShowNewRoom(false);
            await fetchRooms();
            setCurrentPage(1);
        } catch (e) {
            setError(e.message || 'Save failed');
        }
    };

    // Delete
    const handleDelete = async (room) => {
        const ok = window.confirm(`Delete room ${room.number} (${room.id})?`);
        if (!ok) return;
        setError('');
        try {
            const { error: err } = await supabase.from('rooms').delete().eq('id', room.id);
            if (err) throw err;
            await fetchRooms();
            // Keep current page valid
            if (startIndex >= filteredRooms.length - 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (e) {
            setError(e.message || 'Delete failed');
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Top bar */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" width="20" height="20" />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                        >
                            <Icon icon="lucide:plus" width="18" height="18" />
                            New Room
                        </button>
                        <div className="text-sm text-slate-600">
                            <span>
                                {loading && 'Loading…'}
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {/* <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Room ID</th> */}
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Number</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Capacity</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Facilities</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Created</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((room) => (
                                <tr key={room.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                                    {/* <td className="px-6 py-4 font-medium text-slate-800">{room.id}</td> */}
                                    <td className="px-6 py-4 text-slate-700">{room.number}</td>
                                    <td className="px-6 py-4 text-slate-700">{room.type}</td>
                                    <td className="px-6 py-4 text-slate-700">{room.capacity}</td>
                                    <td className="px-6 py-4 text-slate-700">LKR {Number(room.price || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {room.facilities.map((f, idx) => (
                                            <span key={idx} className="inline-block text-xs px-2 py-1 mr-1 mb-1 bg-slate-100 rounded">{f}</span>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{room.createdAt}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(room)}
                                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                                                title="Edit"
                                            >
                                                <Icon icon="lucide:edit" width="18" height="18" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(room)}
                                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                                                title="Delete"
                                            >
                                                <Icon icon="lucide:trash-2" width="18" height="18" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!loading && paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        No rooms found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50">
                    <div className="text-sm text-slate-600">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showNewRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNewRoom(false)} />
                    <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl border border-white/20 shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {isEditing ? 'Edit Room' : 'Add New Room'}
                            </h3>
                            <button
                                onClick={() => setShowNewRoom(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            >
                                <Icon icon="lucide:x" width="18" height="18" />
                            </button>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Room Number</label>
                                <input
                                    placeholder="e.g., 101"
                                    value={form.number}
                                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Type</label>
                                <input
                                    placeholder="e.g., Deluxe"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Capacity</label>
                                <input
                                    placeholder="e.g., 2"
                                    type="number"
                                    value={form.capacity}
                                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Price</label>
                                <input
                                    placeholder="e.g., 12000"
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Facilities</label>
                                <input
                                    placeholder="e.g., Wi-Fi, TV, AC"
                                    value={form.facilities}
                                    onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    placeholder="Brief room description..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewRoom(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                >
                                    <Icon icon={isEditing ? 'lucide:check' : 'lucide:plus'} width="16" height="16" />
                                    {isEditing ? 'Save Changes' : 'Create Room'}
                                </button>
                            </div>

                            {error && (
                                <div className="md:col-span-2 -mt-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
