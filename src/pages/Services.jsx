// Hotel Services Page Component — updated to include Add Service modal and remove Type
// Supabase CRUD wired without changing your design

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabse';

const statusColors = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-red-100 text-red-700 border-red-200'
};

export default function ServicesPage() {
    // ---- STATE (same visual behavior) ----
    const [services, setServices] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newService, setNewService] = useState({ name: '', price: '', status: 'active' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null); // null = creating, string = editing existing
    const itemsPerPage = 5;

    // ---- HELPERS ----
    const fetchServices = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error: err } = await supabase
                .from('services')
                .select('id, name, price, status, created_at')
                .order('created_at', { ascending: false });

            if (err) throw err;
            setServices(data || []);
        } catch (e) {
            setError(e.message || 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    // compute next id like SRV001, SRV002 …
    const makeNextId = () => {
        const nums = services
            .map((s) => Number((s.id || '').replace(/^SRV/, '')))
            .filter((n) => Number.isFinite(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return `SRV${String(max + 1).padStart(3, '0')}`;
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // ---- FILTERS, SEARCH, PAGINATION (unchanged visually) ----
    const filtered = useMemo(() => {
        return services.filter((s) => {
            const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [services, search, statusFilter]);

    const paginated = useMemo(() => {
        return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filtered, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    // ---- CREATE / UPDATE ----
    const handleAddService = async () => {
        const price = parseFloat(newService.price);
        if (!newService.name || isNaN(price)) return;

        setError('');
        try {
            if (editingId) {
                // UPDATE
                const { error: err } = await supabase
                    .from('services')
                    .update({ name: newService.name, price, status: newService.status })
                    .eq('id', editingId);
                if (err) throw err;
            } else {
                // INSERT
                const id = makeNextId();
                const { error: err } = await supabase
                    .from('services')
                    .insert({ id, name: newService.name, price, status: newService.status });
                if (err) throw err;
            }

            await fetchServices();
            setShowAddForm(false);
            setNewService({ name: '', price: '', status: 'active' });
            setEditingId(null);
            setCurrentPage(1);
        } catch (e) {
            setError(e.message || 'Save failed');
        }
    };

    // ---- EDIT OPEN ----
    const openEdit = (svc) => {
        setEditingId(svc.id);
        setNewService({ name: svc.name || '', price: String(svc.price ?? ''), status: svc.status || 'active' });
        setShowAddForm(true);
    };

    // ---- DELETE ----
    const handleDelete = async (svc) => {
        if (!window.confirm(`Delete service "${svc.name}" (${svc.id})?`)) return;
        setError('');
        try {
            const { error: err } = await supabase.from('services').delete().eq('id', svc.id);
            if (err) throw err;
            await fetchServices();
            if ((currentPage - 1) * itemsPerPage >= filtered.length - 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (e) {
            setError(e.message || 'Delete failed');
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Filters & Add New (unchanged visually) */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" />
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <button
                        onClick={() => { setEditingId(null); setNewService({ name: '', price: '', status: 'active' }); setShowAddForm(true); }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" /> Add New Service
                    </button>
                </div>

                {loading && (
                    <div className="mt-3 text-sm text-slate-600">Loading…</div>
                )}
                {error && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>
                )}
            </div>

            {/* Table (unchanged visually) */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Service</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price (LKR)</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(service => (
                                <tr key={service.id} className="border-t border-slate-200/50 hover:bg-slate-50/30">

                                    <td className="px-6 py-4 text-slate-700">{service.name}</td>
                                    <td className="px-6 py-4 text-slate-700">{Number(service.price || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusColors[service.status]}`}>
                                            {service.status?.charAt(0).toUpperCase() + service.status?.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(service)}
                                                className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600"
                                            >
                                                <Icon icon="lucide:edit" width="16" height="16" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service)}
                                                className="p-2 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600"
                                            >
                                                <Icon icon="lucide:trash-2" width="16" height="16" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!loading && paginated.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">No services found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (unchanged visually) */}
                <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing {(currentPage - 1) * itemsPerPage + (filtered.length ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Icon icon="lucide:chevron-left" width="16" height="16" />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === i + 1 ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Icon icon="lucide:chevron-right" width="16" height="16" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Service Modal (same design; just re-used for edit) */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">
                            {editingId ? 'Edit Service' : 'Add New Service'}
                        </h2>
                        <div className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Service name (e.g., Laundry)"
                                value={newService.name}
                                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                                className="border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                            />
                            <input
                                type="number"
                                placeholder="Price (LKR)"
                                value={newService.price}
                                onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                                className="border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                            />
                            <select
                                value={newService.status}
                                onChange={(e) => setNewService(prev => ({ ...prev, status: e.target.value }))}
                                className="border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => { setShowAddForm(false); setEditingId(null); }}
                                className="px-4 py-2 text-slate-600 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddService}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                            >
                                {editingId ? 'Save' : 'Add'}
                            </button>
                        </div>
                        {error && (
                            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
