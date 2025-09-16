import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const guestsData = [
    {
        id: 'GST001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+94 77 123 4567',
        nic: '199245601234',
        passport: '',
        address: '45 Palm Street',
        city: 'Colombo',
        country: 'Sri Lanka',
        nationality: 'Sri Lankan',
        dob: '1992-04-15',

        notes: 'Prefers high-floor rooms',
        createdAt: '2025-09-10',
    },
    {
        id: 'GST002',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+65 9876 5432',
        nic: '',
        passport: 'A1234567',
        address: '21 Riverside Ave',
        city: 'Singapore',
        country: 'Singapore',
        nationality: 'Singaporean',
        dob: '1988-12-02',
        notes: '',
        createdAt: '2025-09-11',
    },
    {
        id: 'GST003',
        name: 'Emma Wilson',
        email: 'emma.wilson@email.com',
        phone: '+44 7700 900123',
        nic: '',
        passport: 'B9876543',
        address: '12 King’s Road',
        city: 'London',
        country: 'United Kingdom',
        nationality: 'British',
        dob: '1995-06-30',
        notes: '',
        createdAt: '2025-09-12',
    },
    {
        id: 'GST004',
        name: 'James Rodriguez',
        email: 'james.rodriguez@email.com',
        phone: '+57 310 555 1122',
        nic: '',
        passport: 'X12398745',
        address: 'Calle 89 #12',
        city: 'Bogotá',
        country: 'Colombia',
        nationality: 'Colombian',
        dob: '',
        notes: '',
        createdAt: '2025-09-13',
    },
    {
        id: 'GST005',
        name: 'Lisa Anderson',
        email: 'lisa.anderson@email.com',
        phone: '+1 415 222 7890',
        nic: '',
        passport: 'C77889900',
        address: '900 Market St',
        city: 'San Francisco',
        country: 'USA',
        nationality: 'American',
        dob: '',
        notes: 'Chargeback history',
        createdAt: '2025-09-14',
    },
    {
        id: 'GST006',
        name: 'David Park',
        email: 'david.park@email.com',
        phone: '+82 10 9999 0000',
        nic: '',
        passport: 'K11223344',
        address: '88 Teheran-ro',
        city: 'Seoul',
        country: 'South Korea',
        nationality: 'Korean',
        dob: '',
        notes: '',
        createdAt: '2025-09-14',
    },
    {
        id: 'GST007',
        name: 'Sophie Martin',
        email: 'sophie.martin@email.com',
        phone: '+33 6 22 33 44 55',
        nic: '',
        passport: 'FR55667788',
        address: '3 Rue de Rivoli',
        city: 'Paris',
        country: 'France',
        nationality: 'French',
        dob: '',
        notes: '',
        createdAt: '2025-09-15',
    },
    {
        id: 'GST008',
        name: 'Robert Taylor',
        email: 'robert.taylor@email.com',
        phone: '+61 400 555 777',
        nic: '',
        passport: 'AU33445566',
        address: '200 George St',
        city: 'Sydney',
        country: 'Australia',
        nationality: 'Australian',
        dob: '',
        notes: '',
        createdAt: '2025-09-15',
    },
];

export default function Guests() {
    const [searchTerm, setSearchTerm] = useState('');
    const [countryFilter, setCountryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showNewGuest, setShowNewGuest] = useState(false);
    const [guests, setGuests] = useState(guestsData);

    const itemsPerPage = 5;

    const countries = ['all', ...Array.from(new Set(guests.map(g => g.country).filter(Boolean)))];

    // Filter
    const filteredData = guests.filter(g => {
        const t = searchTerm.toLowerCase();
        const matchesSearch =
            g.name.toLowerCase().includes(t) ||
            g.id.toLowerCase().includes(t) ||
            (g.nic || '').toLowerCase().includes(t) ||
            (g.passport || '').toLowerCase().includes(t) ||
            (g.email || '').toLowerCase().includes(t) ||
            (g.phone || '').toLowerCase().includes(t);
        const matchesCountry = countryFilter === 'all' || g.country === countryFilter;
        return matchesSearch && matchesCountry;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Create new guest
    const [form, setForm] = useState({
        name: '',
        nic: '',
        passport: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        country: 'Sri Lanka',
        nationality: '',
        dob: '',
        notes: '',
    });

    const handleCreateGuest = () => {
        if (!form.name.trim() || (!form.nic.trim() && !form.passport.trim()) || !form.address.trim()) return;
        const id = 'GST' + Math.floor(Math.random() * 900 + 100).toString().padStart(3, '0');
        const newGuest = {
            id,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            nic: form.nic.trim(),
            passport: form.passport.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            country: form.country.trim(),
            nationality: form.nationality.trim(),
            dob: form.dob,
            notes: form.notes.trim(),
            createdAt: new Date().toISOString().slice(0, 10),
        };
        setGuests([newGuest, ...guests]);
        setShowNewGuest(false);
        setForm({
            name: '',
            nic: '',
            passport: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            country: 'Sri Lanka',
            nationality: '',
            dob: '',
            notes: '',
        });
        setCurrentPage(1);
    };

    return (
        <>
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Icon icon="lucide:search" width="20" height="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search guests..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                            </div>



                            <select
                                value={countryFilter}
                                onChange={(e) => {
                                    setCountryFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                            >
                                {countries.map(c => (
                                    <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowNewGuest(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                            >
                                <Icon icon="lucide:user-plus" width="18" height="18" />
                                New Guest
                            </button>
                            <div className="text-sm text-slate-600">
                                <span>Showing {paginatedData.length} of {filteredData.length} guests</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Guest</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">NIC / Passport</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Contact</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((g) => (
                                    <tr key={g.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">

                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-800">{g.name}</p>
                                                {(g.email || g.nationality) && (
                                                    <p className="text-sm text-slate-600">
                                                        {g.email ? g.email : g.nationality}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {g.nic || g.passport || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700">
                                                {g.phone && <p className="font-medium">{g.phone}</p>}
                                                {g.email && <p className="text-sm text-slate-600">{g.email}</p>}
                                            </div>
                                        </td>


                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 transition-colors">
                                                    <Icon icon="lucide:eye" width="16" height="16" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors">
                                                    <Icon icon="lucide:edit" width="16" height="16" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors">
                                                    <Icon icon="lucide:trash-2" width="16" height="16" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                            No guests found. Try adjusting filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                Showing {filteredData.length ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Icon icon="lucide:chevron-left" width="16" height="16" />
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                            ? 'bg-slate-900 text-white'
                                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Icon icon="lucide:chevron-right" width="16" height="16" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Guest Modal */}
            {showNewGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNewGuest(false)} />
                    <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl border border-white/20 shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">Add New Guest</h3>
                            <button
                                onClick={() => setShowNewGuest(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            >
                                <Icon icon="lucide:x" width="18" height="18" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Full Name *</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., John Doe"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">NIC</label>
                                    <input
                                        value={form.nic}
                                        onChange={e => setForm({ ...form, nic: e.target.value })}
                                        placeholder="e.g., 200012345678"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Passport</label>
                                    <input
                                        value={form.passport}
                                        onChange={e => setForm({ ...form, passport: e.target.value })}
                                        placeholder="e.g., N1234567"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Phone</label>
                                    <input
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+94 7X XXX XXXX"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="guest@email.com"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={form.dob}
                                        onChange={e => setForm({ ...form, dob: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Address *</label>
                                    <input
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        placeholder="Street, number, etc."
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">City</label>
                                    <input
                                        value={form.city}
                                        onChange={e => setForm({ ...form, city: e.target.value })}
                                        placeholder="e.g., Jaffna"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Country</label>
                                    <input
                                        value={form.country}
                                        onChange={e => setForm({ ...form, country: e.target.value })}
                                        placeholder="e.g., Sri Lanka"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Nationality</label>
                                    <input
                                        value={form.nationality}
                                        onChange={e => setForm({ ...form, nationality: e.target.value })}
                                        placeholder="e.g., Sri Lankan"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Notes</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Allergies, preferences, special requests…"
                                        className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewGuest(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateGuest}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                >
                                    <Icon icon="lucide:plus" width="16" height="16" />
                                    Create Guest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
