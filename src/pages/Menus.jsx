// Hotel Menus Page Component — simplified (no spicy, status, veg options)
// Supabase CRUD wired with same UI

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabse';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages', 'Snacks', 'Desserts'];

export default function MenusPage() {
    const [menus, setMenus] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Breakfast',
        price: '',
        description: '',
    });

    const [editingId, setEditingId] = useState(null); // null = creating, string = editing
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ---- Load from Supabase ----
    const fetchMenus = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error: err } = await supabase
                .from('menus')
                .select('id, name, category, price, description, created_at')
                .order('created_at', { ascending: false });

            if (err) throw err;
            setMenus(data || []);
        } catch (e) {
            setError(e.message || 'Failed to load menu items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    // ---- Helpers ----
    const nextId = () => {
        const maxNum = menus.reduce((acc, m) => {
            const n = Number(String(m.id || '').replace('MNU', '')) || 0;
            return Math.max(acc, n);
        }, 0);
        return `MNU${String(maxNum + 1).padStart(3, '0')}`;
    };

    const filtered = useMemo(() => {
        return menus.filter(m => {
            const matchesSearch =
                !search ||
                m.name?.toLowerCase().includes(search.toLowerCase()) ||
                m.description?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [menus, search, categoryFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ---- Create / Update (reuses same modal) ----
    const handleSave = async () => {
        const priceNum = parseFloat(String(newItem.price));
        if (!newItem.name.trim() || isNaN(priceNum) || priceNum < 0) return;

        setError('');
        try {
            if (editingId) {
                // UPDATE
                const { error: err } = await supabase
                    .from('menus')
                    .update({
                        name: newItem.name.trim(),
                        category: newItem.category,
                        price: priceNum,
                        description: newItem.description?.trim() || '',
                    })
                    .eq('id', editingId);
                if (err) throw err;
            } else {
                // INSERT
                const itemId = nextId();
                const { error: err } = await supabase.from('menus').insert({
                    id: itemId,
                    name: newItem.name.trim(),
                    category: newItem.category,
                    price: priceNum,
                    description: newItem.description?.trim() || '',
                });
                if (err) throw err;
            }

            await fetchMenus();
            setShowAddForm(false);
            setNewItem({ name: '', category: 'Breakfast', price: '', description: '' });
            setEditingId(null);
            setCurrentPage(1);
        } catch (e) {
            setError(e.message || 'Save failed');
        }
    };

    // ---- Edit open ----
    const openEdit = (item) => {
        setEditingId(item.id);
        setNewItem({
            name: item.name || '',
            category: item.category || 'Breakfast',
            price: String(item.price ?? ''),
            description: item.description || '',
        });
        setShowAddForm(true);
    };

    // ---- Delete ----
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        setError('');
        try {
            const { error: err } = await supabase.from('menus').delete().eq('id', id);
            if (err) throw err;
            await fetchMenus();
            if ((currentPage - 1) * itemsPerPage >= filtered.length - 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (e) {
            setError(e.message || 'Delete failed');
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Filters & Add (kept same) */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-col xl:flex-row gap-4 w-full">
                        {/* Search */}
                        <div className="relative flex-1 max-w-xl">
                            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" width="20" height="20" />
                            <input
                                type="text"
                                placeholder="Search menu by name or description..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm"
                            />
                        </div>

                        {/* Category */}
                        <select
                            value={categoryFilter}
                            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm"
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setShowAddForm(true);
                            setEditingId(null);
                            setNewItem({ name: '', category: 'Breakfast', price: '', description: '' });
                        }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 whitespace-nowrap"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" /> Add Menu Item
                    </button>

                </div>

                {loading && <div className="mt-3 text-sm text-slate-600">Loading…</div>}
                {error && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
            </div>

            {/* Table (kept same) */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Item</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Category</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price (LKR)</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id} className="border-t border-slate-200/50 hover:bg-slate-50/30">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800">{item.name}</span>
                                            {item.description ? (
                                                <span className="text-xs text-slate-500 mt-0.5">{item.description}</span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{item.category}</td>
                                    <td className="px-6 py-4 text-slate-700">{Number(item.price || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(item)}
                                                className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Icon icon="lucide:edit" width="16" height="16" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <Icon icon="lucide:trash-2" width="16" height="16" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500" colSpan={5}>
                                        No items found. Try adjusting filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (kept same) */}
                <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing {(currentPage - 1) * itemsPerPage + (filtered.length ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Icon icon="lucide:chevron-right" width="16" height="16" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal (kept same UI; button text changes) */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
                            </h2>
                            <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="text-slate-500 hover:text-slate-700">
                                <Icon icon="lucide:x" width="20" height="20" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm text-slate-600 mb-1">Item name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Chicken Biryani"
                                    value={newItem.name}
                                    onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm text-slate-600 mb-1">Category</label>
                                <select
                                    value={newItem.category}
                                    onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm text-slate-600 mb-1">Price (LKR)</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 950"
                                    value={newItem.price}
                                    onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-600 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Short description (optional)"
                                    value={newItem.description}
                                    onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                                {editingId ? 'Save' : 'Add Item'}
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
