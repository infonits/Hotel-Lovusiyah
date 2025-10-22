import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabse';

/* ---------------------- helpers ---------------------- */

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ymd = (d) => dayjs(d).format('YYYY-MM-DD');

const generateCalendarDays = (year, month) => {
    const first = dayjs().year(year).month(month).date(1);
    const last = first.endOf('month');
    const startPad = first.day();
    const days = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.date(); d++) days.push(d);
    return days;
};

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
    const today = dayjs();

    const [currentDate, setCurrentDate] = useState(today.toDate());
    const [selectedDate, setSelectedDate] = useState(today.date());
    const [viewMode, setViewMode] = useState('availability');

    const [rooms, setRooms] = useState([]);
    const [resvCore, setResvCore] = useState([]);
    const [resvRooms, setResvRooms] = useState([]);
    const [resvGuests, setResvGuests] = useState([]);
    const [loading, setLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const calendarDays = useMemo(() => generateCalendarDays(year, month), [year, month]);

    /* ----------------- fetch month data ----------------- */
    const fetchMonth = async (year, month) => {
        const start = dayjs().year(year).month(month).date(1);
        const end = start.add(1, 'month');

        setLoading(true);
        try {
            const { data: roomData, error: roomErr } = await supabase
                .from('rooms')
                .select('id, number, type, capacity, price')
                .order('number', { ascending: true });
            if (roomErr) throw roomErr;

            const { data: resvData, error: resvErr } = await supabase
                .from('reservations')
                .select('id, check_in_date, check_out_date, status')
                .lt('check_in_date', end.format('YYYY-MM-DD'))
                .gt('check_out_date', start.format('YYYY-MM-DD'));
            if (resvErr) throw resvErr;

            const resvIds = (resvData || []).map(r => r.id);
            if (resvIds.length === 0) {
                setRooms(roomData || []);
                setResvCore([]);
                setResvRooms([]);
                setResvGuests([]);
                setLoading(false);
                return;
            }

            const { data: rrData, error: rrErr } = await supabase
                .from('reservation_rooms')
                .select('reservation_id, room_id, rooms(id, number, type)');
            if (rrErr) throw rrErr;
            const rrFiltered = rrData.filter(r => resvIds.includes(r.reservation_id));

            const { data: rgData, error: rgErr } = await supabase
                .from('reservation_guests')
                .select('reservation_id, guest_id, guests(id, name, email, phone)');
            if (rgErr) throw rgErr;
            const rgFiltered = rgData.filter(r => resvIds.includes(r.reservation_id));

            // only update if data actually changed (prevents re-render flicker)
            if (JSON.stringify(roomData) !== JSON.stringify(rooms)) setRooms(roomData || []);
            if (JSON.stringify(resvData) !== JSON.stringify(resvCore)) setResvCore(resvData || []);
            if (JSON.stringify(rrFiltered) !== JSON.stringify(resvRooms)) setResvRooms(rrFiltered || []);
            if (JSON.stringify(rgFiltered) !== JSON.stringify(resvGuests)) setResvGuests(rgFiltered || []);

        } catch (e) {
            console.error(e);
            setRooms([]);
            setResvCore([]);
            setResvRooms([]);
            setResvGuests([]);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchMonth(year, month).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => { mounted = false };
    }, [year, month]);


    const goToday = () => {
        const t = dayjs();
        setCurrentDate(t.toDate());
        setSelectedDate(t.date());
    };

    const navigateMonth = (dir) => {
        setCurrentDate(new Date(year, month + dir, 1));
        setSelectedDate(null);
    };

    const openReservation = (resv) => {
        navigate(`/dashboard/reservations/${resv.id}`, { state: { reservation: resv } });
    };

    const handleNavigate = () => {
        navigate('/dashboard/reservations/new');
    };

    /* ----------------- month map ----------------- */
    const monthMap = useMemo(() => {
        const map = new Map();
        if (!rooms.length) return map;

        const start = dayjs().year(year).month(month).date(1);
        const end = start.add(1, 'month');
        const dateKeys = eachDay(start, end);

        dateKeys.forEach(d => map.set(d, { reservedRooms: new Set(), items: [] }));

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
            const rEnd = dayjs(r.check_out_date);
            const overlapStart = rStart.isAfter(start) ? rStart : start;
            const overlapEnd = rEnd.isBefore(end) ? rEnd : end;
            if (!overlapStart.isBefore(overlapEnd)) continue;

            const gList = rgByResv[r.id] || [];
            const primaryGuest = gList[0]?.guests || null;
            const guestName = primaryGuest?.name || 'Guest';
            const guestEmail = primaryGuest?.email || '';

            const roomLinks = rrByResv[r.id] || [];
            const dayKeys = eachDay(overlapStart, overlapEnd);

            for (const d of dayKeys) {
                const bucket = map.get(d);
                if (!bucket) continue;
                for (const rl of roomLinks) {
                    bucket.reservedRooms.add(rl.room_id);
                    bucket.items.push({
                        id: r.id,
                        room: rl.rooms?.number ?? null,
                        guest: guestName,
                        email: guestEmail,
                        checkIn: ymd(r.check_in_date),
                        checkOut: ymd(r.check_out_date),
                        status: r.status || 'confirmed',
                    });
                }
            }
        }
        return map;
    }, [rooms, resvCore, resvRooms, resvGuests, year, month]);

    const totalRooms = rooms.length || 0;

    // Availability counts confirmed only
    const getRoomAvailability = (day) => {
        if (!day || totalRooms === 0) return { available: 0, reserved: 0, rate: 0 };
        const key = dayjs().year(year).month(month).date(day).format('YYYY-MM-DD');
        const bucket = monthMap.get(key);
        let reserved = 0;
        if (bucket) {
            reserved = new Set(bucket.items.filter(x => x.status === 'confirmed' || x.status === 'checked_in').map(x => x.room)).size;
        }
        const available = Math.max(0, totalRooms - reserved);
        const rate = totalRooms > 0 ? (reserved / totalRooms) * 100 : 0;
        return { available, reserved, rate };
    };

    // Group reservations by reservation_id for sidebar
    const getDateReservationsGrouped = (day) => {
        if (!day) return [];
        const key = dayjs().year(year).month(month).date(day).format('YYYY-MM-DD');
        const bucket = monthMap.get(key);
        if (!bucket) return [];

        const byResv = {};
        bucket.items.forEach(it => {
            (byResv[it.id] ||= []).push(it);
        });

        const reservations = Object.values(byResv).map(items => {
            const first = items[0];
            return {
                id: first.id,
                guest: first.guest,
                email: first.email,
                checkIn: first.checkIn,
                checkOut: first.checkOut,
                status: first.status,
                rooms: items.map(x => x.room).filter(Boolean).join(', '),
            };
        });

        return reservations.sort((a, b) => {
            if (a.status === b.status) return 0;
            return (a.status === 'confirmed' || a.status === 'checked_in') ? -1 : 1;
        });
    };

    const handleDateDoubleClick = (day) => {
        if (!day) return;
        const start = dayjs().year(year).month(month).date(day);
        const today = dayjs();

        if (start.isSame(today, 'day')) {
            navigate(`/dashboard/reservations/new`);

        } else {

            const end = start.add(1, 'day');
            navigate(`/dashboard/reservations/new?start=${start.format('YYYY-MM-DD')}&end=${end.format('YYYY-MM-DD')}`);
        }
    };

    /* ----------------- stats ----------------- */
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

        const avgOcc = end > 0 ? Math.round(sumPct / end) : 0;
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
                                    : 'text-slate-600 hover:text-slate-800'}`}
                            >
                                Availability
                            </button>
                            <button
                                onClick={() => setViewMode('occupancy')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'occupancy'
                                    ? 'bg-gray-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'}`}
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
                                            onDoubleClick={() => handleDateDoubleClick(day)}
                                            className={`aspect-square p-2 rounded-lg cursor-pointer transition-all duration-200 border-2
                        ${isSelected
                                                    ? 'border-slate-900 bg-slate-800 text-white'
                                                    : isToday
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-100 hover:bg-slate-50'}
                        ${loading ? 'opacity-60 pointer-events-none' : ''}`}
                                        >
                                            <div className="h-full flex flex-col justify-between">
                                                <span className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                    {day}
                                                </span>

                                                {viewMode === 'availability' ? (
                                                    <div className="text-xs">
                                                        {loading ? (
                                                            <div className="animate-pulse space-y-1">
                                                                <div className="h-3 bg-slate-200 rounded" />
                                                                <div className="h-3 bg-slate-200 rounded w-3/4" />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="relative group" title={`${availability.reserved} reserved of ${availability.available} available`} >
                                                                    <div className={`flex items-center gap-2 px-1 py-1 rounded-lg transition-colors cursor-pointer ${isSelected
                                                                        ? 'bg-emerald-500/20 text-emerald-100'
                                                                        : 'bg-emerald-50 text-emerald-700'
                                                                        }`}>
                                                                        <Icon icon="material-symbols:hotel-outline" className='h-6 w-6' />
                                                                        <span className="font-semibold text-xs">
                                                                            {availability.reserved}/{availability.available}
                                                                        </span>
                                                                    </div>


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
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 xl:col-span-2">
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

                                <h5 className="font-medium text-slate-800 mb-3">
                                    Reservations ({getDateReservationsGrouped(selectedDate).length})
                                </h5>
                                <div className={`space-y-2 md:h-80 h-96 overflow-y-auto ${loading ? 'animate-pulse' : ''}`}>
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-full p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                                                <div className="h-3 bg-slate-200 rounded w-1/2" />
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            {getDateReservationsGrouped(selectedDate).map(reservation => (
                                                <button
                                                    key={reservation.id}
                                                    onClick={() => openReservation(reservation)}
                                                    className="w-full text-left border border-slate-300 p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                                >

                                                    <div className="flex items-start justify-between mb-1">

                                                        <span className="font-medium text-slate-800">Rooms {reservation.rooms}</span>
                                                        <div className='flex'>

                                                            <span
                                                                className={`p-1 rounded text-xs font-medium
    ${reservation.status === 'confirmed'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : reservation.status === 'checked_in'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : reservation.status === 'checked_out'
                                                                                ? 'bg-red-100 text-red-700'
                                                                                : 'bg-amber-100 text-amber-700'
                                                                    }`}
                                                            >
                                                                {reservation.status}

                                                            </span>

                                                        </div>

                                                    </div>
                                                    <div className="flex items-start justify-between mt-3">

                                                        <div className="text-sm text-slate-600">
                                                            <div>{reservation.guest}</div>
                                                            {reservation.email && <div className="text-xs mt-1">{reservation.email}</div>}
                                                        </div>
                                                        <span
                                                            onClick={() => navigate(`/dashboard/reservations/${r.id}`)}
                                                            className="inline-flex items-center justify-center rounded-lg  text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                            title="Open reservation"
                                                        >
                                                            <Icon icon="fluent:open-24-regular" className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                            {getDateReservationsGrouped(selectedDate).length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-96 ">
                                                    <Icon icon="lucide:calendar" width="48" height="48" className="text-slate-400 mx-auto mb-4" />

                                                    <p className="text-sm text-slate-500">No reservations for this day</p>
                                                </div>
                                            )}
                                        </>
                                    )}
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

                        <div className="bg-slate-900 rounded-2xl p-6 border border-white/20 shadow-sm">
                            <div className='flex justify-between'>

                                <h4 className="text-lg font-semibold text-yellow-500 mb-4">Month Overview</h4>
                                <button
                                    onClick={() => navigate(`/dashboard/analytics`)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                    title="Open reservation"
                                >
                                    <Icon icon="fluent:open-24-regular" className="w-4 h-4" />
                                </button>
                            </div>
                            <div className={`space-y-4 ${loading ? 'animate-pulse' : ''}`}>
                                <div className="flex justify-between">
                                    <span className="text-sm text-white">Average Occupancy</span>
                                    <span className="font-medium text-white">{loading ? '—' : `${monthStats.avgOcc}%`}</span>
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
        </main >
    );
}
