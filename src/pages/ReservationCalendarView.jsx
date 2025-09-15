import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

// Generate sample data for 50 rooms
const generateRoomData = () => {
    const rooms = [];
    const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium', 'Executive'];

    for (let i = 1; i <= 50; i++) {
        rooms.push({
            number: i.toString().padStart(3, '0'),
            type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
            floor: Math.ceil(i / 10)
        });
    }
    return rooms;
};

// Generate sample reservations
const generateReservations = () => {
    const reservations = {};
    const guests = ['Sarah Johnson', 'Michael Chen', 'Emma Wilson', 'James Rodriguez', 'Lisa Anderson', 'David Park', 'Sophie Martin', 'Robert Taylor'];
    const currentDate = new Date(2025, 8, 15); // September 2025

    for (let day = 1; day <= 30; day++) {
        const dateKey = `2025-09-${day.toString().padStart(2, '0')}`;
        reservations[dateKey] = {};

        // Randomly assign reservations (40-70% occupancy)
        const occupancyRate = 0.4 + Math.random() * 0.3;
        const reservedRooms = Math.floor(50 * occupancyRate);

        const shuffledRooms = [...Array(50)].map((_, i) => (i + 1).toString().padStart(3, '0')).sort(() => Math.random() - 0.5);

        for (let j = 0; j < reservedRooms; j++) {
            const roomNumber = shuffledRooms[j];
            reservations[dateKey][roomNumber] = {
                guest: guests[Math.floor(Math.random() * guests.length)],
                email: `guest${j + 1}@email.com`,
                phone: `+1 234-567-89${day.toString().padStart(2, '0')}`,
                checkIn: dateKey,
                checkOut: `2025-09-${Math.min(day + Math.floor(Math.random() * 3) + 1, 30).toString().padStart(2, '0')}`,
                status: ['confirmed', 'checked-in', 'pending'][Math.floor(Math.random() * 3)],
                amount: `$${200 + Math.floor(Math.random() * 400)}`
            };
        }
    }
    return reservations;
};

const rooms = generateRoomData();
const reservations = generateReservations();

// Generate calendar days
const generateCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    return days;
};

export default function ReservationCalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 8)); // September 2025
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
    const [viewMode, setViewMode] = useState('availability'); // 'availability' or 'occupancy'
    const navigate = useNavigate()
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calendarDays = generateCalendarDays(year, month);

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(year, month + direction));
        setSelectedDate(null);
    };
    const handleNavigate = () => {
        navigate('/dashboard/create-reservation')
    }
    const getDateReservations = (day) => {
        if (!day) return {};
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return reservations[dateKey] || {};
    };

    const getRoomAvailability = (day) => {
        if (!day) return { available: 0, reserved: 0, rate: 0 };
        const dayReservations = getDateReservations(day);
        const reserved = Object.keys(dayReservations).length;
        const available = 50 - reserved;
        const rate = (reserved / 50) * 100;
        return { available, reserved, rate };
    };

    const getSelectedDateReservations = () => {
        if (!selectedDate) return [];
        const dayReservations = getDateReservations(selectedDate);
        return Object.entries(dayReservations).map(([room, details]) => ({
            room,
            ...details
        }));
    };

    const filteredRooms = selectedRoomFilter === 'all'
        ? rooms
        : rooms.filter(room => room.type === selectedRoomFilter);

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
            {/* Header */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Reservation Calendar</h2>
                        <p className="text-slate-600 mt-1">View room availability and manage reservations</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white/50 rounded-xl p-1 border border-slate-200">
                            <button
                                onClick={() => setViewMode('availability')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'availability'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                Availability
                            </button>
                            <button
                                onClick={() => setViewMode('occupancy')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'occupancy'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                Occupancy
                            </button>
                        </div>
                        <button onClick={handleNavigate} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                            <Icon icon="lucide:plus" width="16" height="16" />
                            <span className="text-sm font-medium">New Reservation</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Calendar */}
                    <div className="xl:col-span-3">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-slate-800">
                                    {monthNames[month]} {year}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigateMonth(-1)}
                                        className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/70 transition-colors"
                                    >
                                        <Icon icon="lucide:chevron-left" width="20" height="20" className="text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => navigateMonth(1)}
                                        className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/70 transition-colors"
                                    >
                                        <Icon icon="lucide:chevron-right" width="20" height="20" className="text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {dayNames.map(day => (
                                    <div key={day} className="p-3 text-center text-sm font-medium text-slate-600">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) => {
                                    if (!day) {
                                        return <div key={index} className="aspect-square"></div>;
                                    }

                                    const availability = getRoomAvailability(day);
                                    const isSelected = selectedDate === day;
                                    const isToday = day === new Date().getDate() &&
                                        month === new Date().getMonth() &&
                                        year === new Date().getFullYear();

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => setSelectedDate(day)}
                                            className={`aspect-square p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${isSelected
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : isToday
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-transparent hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="h-full flex flex-col justify-between">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-800'
                                                    }`}>
                                                    {day}
                                                </span>

                                                {viewMode === 'availability' ? (
                                                    <div className="text-xs">
                                                        <div className={`${isSelected ? 'text-emerald-200' : 'text-emerald-600'} font-medium`}>
                                                            {availability.available} free
                                                        </div>
                                                        <div className={`${isSelected ? 'text-red-200' : 'text-red-600'}`}>
                                                            {availability.reserved} booked
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-end justify-center">
                                                        <div
                                                            className={`w-full rounded-sm ${availability.rate >= 80 ? 'bg-red-400' :
                                                                availability.rate >= 60 ? 'bg-amber-400' :
                                                                    availability.rate >= 40 ? 'bg-blue-400' :
                                                                        'bg-emerald-400'
                                                                }`}
                                                            style={{
                                                                height: `${Math.max(availability.rate * 0.6, 8)}px`,
                                                                opacity: isSelected ? 0.7 : 1
                                                            }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 pt-6 border-t border-slate-200/60">
                                {viewMode === 'occupancy' && (
                                    <div className="flex items-center gap-6 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-emerald-400 rounded"></div>
                                            <span className="text-slate-600">Low (0-40%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-blue-400 rounded"></div>
                                            <span className="text-slate-600">Medium (40-60%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-amber-400 rounded"></div>
                                            <span className="text-slate-600">High (60-80%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-400 rounded"></div>
                                            <span className="text-slate-600">Full (80%+)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Day Details */}
                    <div className="space-y-6">
                        {/* Selected Day Info */}
                        {selectedDate ? (
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-slate-800">
                                        {monthNames[month]} {selectedDate}, {year}
                                    </h4>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                        {getRoomAvailability(selectedDate).available} available
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                        <div className="text-2xl font-bold text-emerald-700">
                                            {getRoomAvailability(selectedDate).available}
                                        </div>
                                        <div className="text-sm text-emerald-600">Available</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-700">
                                            {getRoomAvailability(selectedDate).reserved}
                                        </div>
                                        <div className="text-sm text-slate-600">Reserved</div>
                                    </div>
                                </div>

                                {/* Reservations List */}
                                <div>
                                    <h5 className="font-medium text-slate-800 mb-3">Reservations ({getRoomAvailability(selectedDate).reserved})</h5>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {getSelectedDateReservations().map(reservation => (
                                            <div key={reservation.room} className="p-3 bg-slate-50/50 rounded-lg">
                                                <div className="flex items-start justify-between mb-1">
                                                    <span className="font-medium text-slate-800">Room {reservation.room}</span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${reservation.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                        reservation.status === 'checked-in' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {reservation.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    <div>{reservation.guest}</div>
                                                    <div className="text-xs mt-1">{reservation.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {getRoomAvailability(selectedDate).reserved === 0 && (
                                            <p className="text-sm text-slate-500 text-center py-4">No reservations for this day</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                                <div className="text-center">
                                    <Icon icon="lucide:calendar" width="48" height="48" className="text-slate-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-slate-800 mb-2">Select a Date</h4>
                                    <p className="text-sm text-slate-600">Click on any date to view reservations and availability details</p>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4">Month Overview</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Average Occupancy</span>
                                    <span className="font-medium text-slate-800">68%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Total Rooms</span>
                                    <span className="font-medium text-slate-800">50</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Peak Day</span>
                                    <span className="font-medium text-slate-800">Sep 22</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Lowest Day</span>
                                    <span className="font-medium text-slate-800">Sep 3</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}