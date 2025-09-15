import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const navItems = [
    { label: 'Overview', icon: 'lucide:layout-dashboard', href: '#' },
    { label: 'Reservations', icon: 'lucide:calendar-check', href: '#', active: true },
    { label: 'Guests', icon: 'lucide:users', href: '#' },
    { label: 'Rooms', icon: 'lucide:bed', href: '#' },
    { label: 'Housekeeping', icon: 'lucide:sparkles', href: '#' },
    { label: 'Analytics', icon: 'lucide:trending-up', href: '#' },
    { label: 'Settings', icon: 'lucide:settings', href: '#' },
];

const reservationsData = [
    {
        id: 'RES001',
        guest: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        room: '205',
        roomType: 'Deluxe Suite',
        checkIn: '2025-09-15',
        checkOut: '2025-09-18',
        status: 'confirmed',
        amount: '$450',
        phone: '+1 234-567-8901'
    },
    {
        id: 'RES002',
        guest: 'Michael Chen',
        email: 'michael.chen@email.com',
        room: '108',
        roomType: 'Standard Room',
        checkIn: '2025-09-16',
        checkOut: '2025-09-19',
        status: 'pending',
        amount: '$280',
        phone: '+1 234-567-8902'
    },
    {
        id: 'RES003',
        guest: 'Emma Wilson',
        email: 'emma.wilson@email.com',
        room: '312',
        roomType: 'Premium Suite',
        checkIn: '2025-09-17',
        checkOut: '2025-09-20',
        status: 'checked-in',
        amount: '$650',
        phone: '+1 234-567-8903'
    },
    {
        id: 'RES004',
        guest: 'James Rodriguez',
        email: 'james.rodriguez@email.com',
        room: '156',
        roomType: 'Family Room',
        checkIn: '2025-09-18',
        checkOut: '2025-09-22',
        status: 'confirmed',
        amount: '$520',
        phone: '+1 234-567-8904'
    },
    {
        id: 'RES005',
        guest: 'Lisa Anderson',
        email: 'lisa.anderson@email.com',
        room: '423',
        roomType: 'Executive Suite',
        checkIn: '2025-09-19',
        checkOut: '2025-09-21',
        status: 'cancelled',
        amount: '$750',
        phone: '+1 234-567-8905'
    },
    {
        id: 'RES006',
        guest: 'David Park',
        email: 'david.park@email.com',
        room: '289',
        roomType: 'Standard Room',
        checkIn: '2025-09-20',
        checkOut: '2025-09-23',
        status: 'confirmed',
        amount: '$330',
        phone: '+1 234-567-8906'
    },
    {
        id: 'RES007',
        guest: 'Sophie Martin',
        email: 'sophie.martin@email.com',
        room: '367',
        roomType: 'Deluxe Suite',
        checkIn: '2025-09-21',
        checkOut: '2025-09-24',
        status: 'pending',
        amount: '$480',
        phone: '+1 234-567-8907'
    },
    {
        id: 'RES008',
        guest: 'Robert Taylor',
        email: 'robert.taylor@email.com',
        room: '145',
        roomType: 'Premium Suite',
        checkIn: '2025-09-22',
        checkOut: '2025-09-25',
        status: 'checked-out',
        amount: '$680',
        phone: '+1 234-567-8908'
    }
];

const statusColors = {
    'confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'checked-in': 'bg-blue-100 text-blue-700 border-blue-200',
    'checked-out': 'bg-slate-100 text-slate-700 border-slate-200',
    'cancelled': 'bg-red-100 text-red-700 border-red-200'
};

export default function Rooms() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roomTypeFilter, setRoomTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter data
    const filteredData = reservationsData.filter(reservation => {
        const matchesSearch = reservation.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
        const matchesRoomType = roomTypeFilter === 'all' || reservation.roomType === roomTypeFilter;

        return matchesSearch && matchesStatus && matchesRoomType;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const uniqueRoomTypes = [...new Set(reservationsData.map(r => r.roomType))];

    return (
        <>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Icon icon="lucide:search" width="20" height="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search reservations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="checked-in">Checked In</option>
                                <option value="checked-out">Checked Out</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                value={roomTypeFilter}
                                onChange={(e) => setRoomTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                            >
                                <option value="all">All Room Types</option>
                                {uniqueRoomTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>Showing {paginatedData.length} of {filteredData.length} reservations</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Reservation ID</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Guest</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Room</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Check In</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Check Out</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((reservation, index) => (
                                    <tr key={reservation.id} className="border-t border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">{reservation.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-800">{reservation.guest}</p>
                                                <p className="text-sm text-slate-600">{reservation.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-800">Room {reservation.room}</p>
                                                <p className="text-sm text-slate-600">{reservation.roomType}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{reservation.checkIn}</td>
                                        <td className="px-6 py-4 text-slate-700">{reservation.checkOut}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusColors[reservation.status]}`}>
                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1).replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-800">{reservation.amount}</td>
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
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
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
        </>
    );
}