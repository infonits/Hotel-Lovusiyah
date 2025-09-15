// Rooms component matching design system with status and bedType removed + placeholders added

import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const roomsData = [
    {
        id: 'RM001',
        number: '101',
        type: 'Deluxe',
        capacity: 2,
        price: 12000,
        facilities: ['Wi-Fi', 'TV', 'AC'],
        description: 'Sea-facing room with modern amenities.',
        createdAt: '2025-09-10',
    },
    {
        id: 'RM002',
        number: '102',
        type: 'Standard',
        capacity: 2,
        price: 9000,
        facilities: ['Wi-Fi', 'TV'],
        description: 'Budget-friendly room with essential facilities.',
        createdAt: '2025-09-11',
    },
];

export default function Rooms() {
    const [rooms, setRooms] = useState(roomsData);
    const [showNewRoom, setShowNewRoom] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;

    const filteredRooms = rooms.filter((room) => {
        const term = searchTerm.toLowerCase();
        return (
            room.number.toLowerCase().includes(term) ||
            room.type.toLowerCase().includes(term) ||
            room.description.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

    const [form, setForm] = useState({
        number: '',
        type: '',
        capacity: '',
        price: '',
        facilities: '',
        description: '',
    });

    const handleCreateRoom = () => {
        if (!form.number.trim() || !form.type.trim()) return;
        const id = 'RM' + Math.floor(Math.random() * 900 + 100).toString().padStart(3, '0');
        const newRoom = {
            id,
            number: form.number.trim(),
            type: form.type.trim(),
            capacity: parseInt(form.capacity),
            price: parseFloat(form.price),
            facilities: form.facilities.split(',').map((f) => f.trim()).filter(Boolean),
            description: form.description.trim(),
            createdAt: new Date().toISOString().slice(0, 10),
        };
        setRooms([newRoom, ...rooms]);
        setShowNewRoom(false);
        setForm({ number: '', type: '', capacity: '', price: '', facilities: '', description: '' });
        setCurrentPage(1);
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Icon icon="lucide:search" width="20" height="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
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
                            onClick={() => setShowNewRoom(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                        >
                            <Icon icon="lucide:plus" width="18" height="18" />
                            New Room
                        </button>
                        <div className="text-sm text-slate-600">
                            <span>Showing {paginatedData.length} of {filteredRooms.length} rooms</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Room ID</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Number</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Capacity</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Facilities</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((room) => (
                                <tr key={room.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{room.id}</td>
                                    <td className="px-6 py-4 text-slate-700">{room.number}</td>
                                    <td className="px-6 py-4 text-slate-700">{room.type}</td>
                                    <td className="px-6 py-4 text-slate-700">{room.capacity}</td>
                                    <td className="px-6 py-4 text-slate-700">LKR {room.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {room.facilities.map((f, idx) => (
                                            <span key={idx} className="inline-block text-xs px-2 py-1 mr-1 mb-1 bg-slate-100 rounded">{f}</span>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{room.createdAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNewRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNewRoom(false)} />
                    <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl border border-white/20 shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">Add New Room</h3>
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
                                    onClick={handleCreateRoom}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                >
                                    <Icon icon="lucide:plus" width="16" height="16" />
                                    Create Room
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}