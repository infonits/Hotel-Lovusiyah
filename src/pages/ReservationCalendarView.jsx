import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabse';

/* ---------------------- helpers ---------------------- */

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ymd = (d) => dayjs(d).format('YYYY-MM-DD');

const generateCalendarDays = (year, month) => {
    const first = dayjs().year(year).month(month).date(1);
    const last = first.endOf('month');
    const startPad = first.day(); // 0..6 (Sun..Sat)
    const days = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.date(); d++) days.push(d);
    return days;
};

// Build a range of date strings [start, end) (end exclusive)
const eachDay = (start, end) => {
    const out = [];
    let cur = dayjs(start);
    const endD = dayjs(end);
    while (cur.isBefore(endD, 'day')) {
        out.push(cur.format('YYYY-MM-DD'));
        cur = cur.add(1, 'day');
    }
    return out;
};

/* ----------------- main component ----------------- */

export default function ReservationCalendarView() {
    const navigate = useNavigate();

    // Default to today’s month & preselect today
    const today = dayjs();
    const [currentDate, setCurrentDate] = useState(today.toDate());
    const [selectedDate, setSelectedDate] = useState(today.date());
    const [viewMode, setViewMode] = useState('availability'); // 'availability' | 'occupancy'

    // Data
    const [rooms, setRooms] = useState([]);
    const [resvCore, setResvCore] = useState([]); // reservations (id, check_in_date, check_out_date)
    const [resvRooms, setResvRooms] = useState([]); // reservation_rooms (reservation_id, room_id, rooms(number,type))
    const [resvGuests, setResvGuests] = useState([]); // reservation_guests (reservation_id, guests(name,email,phone))
    const [loading, setLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const calendarDays = generateCalendarDays(year, month);

    /* ----------------- fetch month data from Supabase ----------------- */

    const fetchMonth = async (year, month) => {
        // Compute [start, end) window for the displayed month
        const start = dayjs().year(year).month(month).date(1);
        const end = start.add(1, 'month');

        setLoading(true);
        try {
            // 1) rooms (for totals, types, numbers)
            const { data: roomData, error: roomErr } = await supabase
                .from('rooms')
                .select('id, number, type, capacity, price')
                .order('number', { ascending: true });
            if (roomErr) throw roomErr;

            // 2) reservations that overlap the month
            // overlap condition: check_in < end AND start < check_out
            const { data: resvData, error: resvErr } = await supabase
                .from('reservations')
                .select('id, check_in_date, check_out_date')
                .lt('check_in_date', end.format('YYYY-MM-DD'))
                .gt('check_out_date', start.format('YYYY-MM-DD'));
            if (resvErr) throw resvErr;

            const resvIds = (resvData || []).map(r => r.id);

            // If no reservations, clear linked arrays and finish
            if (resvIds.length === 0) {
                setRooms(roomData || []);
                setResvCore([]);
                setResvRooms([]);
                setResvGuests([]);
                setLoading(false);
                return;
            }

            // 3) reservation_rooms → include rooms(number, type) via FK
            const { data: rrData, error: rrErr } = await supabase
                .from('reservation_rooms')
                .select('reservation_id, room_id, rooms(id, number, type)');
            if (rrErr) throw rrErr;
            const rrFiltered = rrData.filter(r => resvIds.includes(r.reservation_id));

            // 4) reservation_guests → include guests(name,email,phone)
            const { data: rgData, error: rgErr } = await supabase
                .from('reservation_guests')
                .select('reservation_id, guest_id, guests(id, name, email, phone)');
            if (rgErr) throw rgErr;
            const rgFiltered = rgData.filter(r => resvIds.includes(r.reservation_id));

            setRooms(roomData || []);
            setResvCore(resvData || []);
            setResvRooms(rrFiltered || []);
            setResvGuests(rgFiltered || []);
        } catch (e) {
            console.error(e);
            // Fall back to empty state
            setRooms([]);
            setResvCore([]);
            setResvRooms([]);
            setResvGuests([]);
        } finally {
            setLoading(false);
        }
    };

    // Load on mount + when month changes
    useEffect(() => {
        fetchMonth(year, month);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month]);

    // When clicking "Today", jump to today's month and select today
    const goToday = () => {
        const t = dayjs();
        setCurrentDate(t.toDate());
        setSelectedDate(t.date());
    };

    // Month navigate
    const navigateMonth = (dir) => {
        setCurrentDate(new Date(year, month + dir, 1));
        setSelectedDate(null);
    };

    const openReservation = (resv) => {
        console.log(resv);

        navigate(`/dashboard/reservations/${resv.id}`, { state: { reservation: resv } });
    };

    const handleNavigate = () => {
        navigate('/dashboard/create-reservation');
    };

    /* ----------------- build daily map for the month ----------------- */

    // Map: dateStr -> { reservedRooms:Set<room_id>, items:[{roomNumber, guest, email, status, checkIn, checkOut}] }
    const monthMap = useMemo(() => {
        const map = new Map(); // dateStr -> { reservedRooms:Set, items:[] }
        if (!rooms.length) return map;

        const start = dayjs().year(year).month(month).date(1);
        const end = start.add(1, 'month');
        const dateKeys = eachDay(start, end);

        dateKeys.forEach(d => map.set(d, { reservedRooms: new Set(), items: [] }));

        // Build helpers
        const rrByResv = resvRooms.reduce((acc, row) => {
            (acc[row.reservation_id] ||= []).push(row);
            return acc;
        }, {});

        const rgByResv = resvGuests.reduce((acc, row) => {
            (acc[row.reservation_id] ||= []).push(row);
            return acc;
        }, {});

        for (const r of resvCore) {
            const rStart = dayjs(r.check_in_date);
            const rEnd = dayjs(r.check_out_date); // exclusive
            const overlapStart = rStart.isAfter(start) ? rStart : start;
            const overlapEnd = rEnd.isBefore(end) ? rEnd : end;
            if (!overlapStart.isBefore(overlapEnd)) continue;

            // one primary guest for list
            const gList = rgByResv[r.id] || [];
            const primaryGuest = gList[0]?.guests || null;
            const guestName = primaryGuest?.name || 'Guest';
            const guestEmail = primaryGuest?.email || '';

            // each room in reservation for each day in overlap
            const roomLinks = rrByResv[r.id] || [];
            const dayKeys = eachDay(overlapStart, overlapEnd);

            for (const d of dayKeys) {
                const bucket = map.get(d);
                if (!bucket) continue;
                for (const rl of roomLinks) {
                    const roomNum = rl.rooms?.number ?? null;
                    const roomId = rl.room_id;
                    bucket.reservedRooms.add(roomId);
                    bucket.items.push({
                        id: r.id,
                        room: roomNum || '—',
                        guest: guestName,
                        email: guestEmail,
                        checkIn: ymd(r.check_in_date),
                        checkOut: ymd(r.check_out_date),
                        status: 'confirmed', // default (schema in last answer didn’t include status)
                    });
                }
            }
        }

        return map;
    }, [rooms, resvCore, resvRooms, resvGuests, year, month]);

    const totalRooms = rooms.length || 0;

    const getDateReservations = (day) => {
        if (!day) return [];
        const key = dayjs().year(year).month(month).date(day).format('YYYY-MM-DD');
        const bucket = monthMap.get(key);
        if (!bucket) return [];
        // Sort by room number ascending
        return bucket.items.sort((a, b) => String(a.room).localeCompare(String(b.room)));
    };

    const getRoomAvailability = (day) => {
        if (!day || totalRooms === 0) return { available: 0, reserved: 0, rate: 0 };
        const key = dayjs().year(year).month(month).date(day).format('YYYY-MM-DD');
        const bucket = monthMap.get(key);
        const reserved = bucket ? bucket.reservedRooms.size : 0;
        const available = Math.max(0, totalRooms - reserved);
        const rate = totalRooms > 0 ? (reserved / totalRooms) * 100 : 0;
        return { available, reserved, rate };
    };

    // Month quick stats
    const monthStats = useMemo(() => {
        const start = dayjs().year(year).month(month).date(1);
        const end = start.endOf('month').date();
        if (totalRooms === 0) return { avgOcc: 0, peakDay: null, lowDay: null };

        let sumPct = 0;
        let peak = { day: null, rate: -1 };
        let low = { day: null, rate: 101 };

        for (let d = 1; d <= end; d++) {
            const { rate } = getRoomAvailability(d);
            sumPct += rate;
            if (rate > peak.rate) peak = { day: d, rate };
            if (rate < low.rate) low = { day: d, rate };
        }

        const avgOcc = end > 0 ? Math.round((sumPct / end)) : 0;
        const peakDay = peak.day ? `${monthNames[month].slice(0, 3)} ${peak.day}` : '—';
        const lowDay = low.day ? `${monthNames[month].slice(0, 3)} ${low.day}` : '—';

        return { avgOcc, peakDay, lowDay };
    }, [monthMap, totalRooms, year, month]);

    /* ----------------- UI ----------------- */

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
            {/* Header */}
            <header className="bg-yellow-50 backdrop-blur-xl border-b border-slate-200/60 px-8 py-6">
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
                                    ? 'bg-gray-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                Availability
                            </button>
                            <button
                                onClick={() => setViewMode('occupancy')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'occupancy'
                                    ? 'bg-gray-500 text-white shadow-sm'
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
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
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
                                        disabled={loading}
                                    >
                                        <Icon icon="lucide:chevron-left" width="20" height="20" className="text-slate-600" />
                                    </button>
                                    <button
                                        onClick={goToday}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                        disabled={loading}
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => navigateMonth(1)}
                                        className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/70 transition-colors"
                                        disabled={loading}
                                    >
                                        <Icon icon="lucide:chevron-right" width="20" height="20" className="text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Subtle month loading */}
                            {loading && (
                                <div className="mb-3 text-sm text-slate-500 flex items-center gap-2">
                                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                    Loading month…
                                </div>
                            )}

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
                                        return <div key={`pad-${index}`} className="aspect-square" />;
                                    }

                                    const availability = getRoomAvailability(day);
                                    const isSelected = selectedDate === day;
                                    const isToday =
                                        day === today.date() &&
                                        month === today.month() &&
                                        year === today.year();

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => !loading && setSelectedDate(day)}
                                            className={`aspect-square p-2 rounded-lg cursor-pointer transition-all duration-200 border-2
                        ${isSelected
                                                    ? 'border-slate-900 bg-slate-800 text-white'
                                                    : isToday
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-100 hover:bg-slate-50'}
                        ${loading ? 'opacity-60 pointer-events-none' : ''}`}
                                        >
                                            <div className="h-full flex flex-col justify-between">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                    {day}
                                                </span>

                                                {viewMode === 'availability' ? (
                                                    <div className="text-xs">
                                                        {/* skeleton shimmer for counts while loading */}
                                                        {loading ? (
                                                            <div className="animate-pulse space-y-1">
                                                                <div className="h-3 bg-slate-200 rounded" />
                                                                <div className="h-3 bg-slate-200 rounded w-3/4" />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className={`${isSelected ? 'text-emerald-200' : 'text-emerald-600'} font-medium`}>
                                                                    {availability.available} free
                                                                </div>
                                                                <div className={`${isSelected ? 'text-red-200' : 'text-red-600'}`}>
                                                                    {availability.reserved} booked
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-end justify-center">
                                                        <div
                                                            className={`w-full rounded-sm ${availability.rate >= 80 ? 'bg-red-400' :
                                                                availability.rate >= 60 ? 'bg-amber-400' :
                                                                    availability.rate >= 40 ? 'bg-blue-400' :
                                                                        'bg-emerald-400'
                                                                } ${loading ? 'animate-pulse' : ''}`}
                                                            style={{
                                                                height: `${Math.max(availability.rate * 0.6, 8)}px`,
                                                                opacity: isSelected ? 0.7 : 1
                                                            }}
                                                        />
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
                                            <div className="w-4 h-4 bg-emerald-400 rounded" />
                                            <span className="text-slate-600">Low (0-40%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-blue-400 rounded" />
                                            <span className="text-slate-600">Medium (40-60%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-amber-400 rounded" />
                                            <span className="text-slate-600">High (60-80%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-400 rounded" />
                                            <span className="text-white/40">Full (80%+)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Day Details */}
                    <div className="space-y-6 xl:col-span-2">
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
                                    <div className="text-center p-3 bg-emerald-50 rounded-lg border border-slate-200">
                                        <div className="text-2xl font-bold text-emerald-700">
                                            {getRoomAvailability(selectedDate).available}
                                        </div>
                                        <div className="text-sm text-emerald-600">Available</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="text-2xl font-bold text-slate-700">
                                            {getRoomAvailability(selectedDate).reserved}
                                        </div>
                                        <div className="text-sm text-slate-600">Reserved</div>
                                    </div>
                                </div>

                                {/* Reservations List */}
                                <div>
                                    <h5 className="font-medium text-slate-800 mb-3">
                                        Reservations ({getRoomAvailability(selectedDate).reserved})
                                    </h5>
                                    <div className={`space-y-2 max-h-64 overflow-y-auto ${loading ? 'animate-pulse' : ''}`}>
                                        {loading ? (
                                            // Sidebar skeleton (smoother loading)
                                            Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="w-full p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                {getDateReservations(selectedDate).map((reservation, idx) => (
                                                    <button
                                                        key={`${reservation.room}-${idx}`}
                                                        onClick={() =>
                                                            openReservation({
                                                                ...reservation,
                                                                date: dayjs().year(year).month(month).date(selectedDate).format('YYYY-MM-DD')
                                                            })
                                                        }
                                                        className="w-full text-left border border-slate-300 p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                                    >
                                                        <div className="flex items-start justify-between mb-1">
                                                            <span className="font-medium text-slate-800">Room {reservation.room}</span>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${reservation.status === 'confirmed'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : reservation.status === 'checked-in'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {reservation.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            <div>{reservation.guest}</div>
                                                            {reservation.email && <div className="text-xs mt-1">{reservation.email}</div>}
                                                        </div>
                                                    </button>
                                                ))}
                                                {getRoomAvailability(selectedDate).reserved === 0 && (
                                                    <p className="text-sm text-slate-500 text-center py-4">No reservations for this day</p>
                                                )}
                                            </>
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
                        <div className="bg-slate-900  backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                            <h4 className="text-lg font-semibold text-yellow-500 mb-4">Month Overview</h4>
                            <div className={`space-y-4 ${loading ? 'animate-pulse' : ''}`}>
                                <div className="flex justify-between">
                                    <span className="text-sm text-white">Average Occupancy</span>
                                    <span className="font-medium text-white">
                                        {loading ? '—' : `${monthStats.avgOcc}%`}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-white">Total Rooms</span>
                                    <span className="font-medium text-white">{loading ? '—' : totalRooms}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-white">Peak Day</span>
                                    <span className="font-medium text-white">{loading ? '—' : monthStats.peakDay}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-white">Lowest Day</span>
                                    <span className="font-medium text-white">{loading ? '—' : monthStats.lowDay}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
