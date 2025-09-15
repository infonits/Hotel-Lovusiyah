'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';

// --- Mock data (replace with real APIs) ---
const ALL_ROOMS = [
    { _id: 'r101', roomNumber: '101', type: 'Standard', price: 60, capacity: 2 },
    { _id: 'r102', roomNumber: '102', type: 'Standard', price: 60, capacity: 2 },
    { _id: 'r201', roomNumber: '201', type: 'Deluxe', price: 90, capacity: 3 },
    { _id: 'r202', roomNumber: '202', type: 'Deluxe', price: 95, capacity: 3 },
    { _id: 'r301', roomNumber: '301', type: 'Suite', price: 150, capacity: 4 },
];

const MOCK_BLOCKS = [
    { roomId: 'r101', from: '2025-09-17', to: '2025-09-18' },
    { roomId: 'r201', from: '2025-09-19', to: '2025-09-20' },
];

// --- Utils ---
const overlap = (aStart, aEnd, bStart, bEnd) => {
    const aS = dayjs(aStart);
    const aE = dayjs(aEnd);
    const bS = dayjs(bStart);
    const bE = dayjs(bEnd);
    return aS.isBefore(bE) && bS.isBefore(aE); // [aS, aE) x [bS, bE)
};

const currencyLKR = (n) => `LKR ${Number(n || 0).toFixed(2)}`;
const nightsBetween = (from, to) =>
    from && to ? Math.max(0, dayjs(to).diff(dayjs(from), 'day')) : 0;

// --- API placeholders (swap with real endpoints) ---
async function apiCheckAvailability(_from, _to) {
    return ALL_ROOMS; // Return all rooms every time
}

const MOCK_GUESTS = {
    '991234567V': {
        _id: 'g01',
        name: 'Kajan',
        nicNumber: '991234567V',
        phone: '0771234567',
        email: 'kajan@example.com',
        address: 'Jaffna',
    },
};

async function apiFindGuestByNIC(nic) {
    await new Promise((res) => setTimeout(res, 200));
    return MOCK_GUESTS[nic] ?? null;
}

async function apiCreateOrGetReservation(payload) {
    console.log('Submitting reservation payload:', payload);
    await new Promise((res) => setTimeout(res, 300));
    return { ok: true, reservationId: 'RES-' + Math.random().toString(36).slice(2, 8).toUpperCase() };
}

const steps = [
    { key: 1, label: 'Dates & Rooms', icon: 'lucide:calendar-check' },
    { key: 2, label: 'Guest', icon: 'lucide:user' },
    { key: 3, label: 'Extras & Review', icon: 'lucide:sticky-note' },
];

/* ---------- Hoisted child components (stable identity) ---------- */

function Stepper({ step }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {steps.map((s, idx) => {
                const active = step === s.key;
                const completed = step > s.key;
                return (
                    <div
                        key={s.key}
                        className={`p-4 rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm flex items-center gap-3
              ${active ? 'border-slate-300' : 'border-white/20'} ${completed ? 'opacity-80' : ''}`}
                    >
                        <div className={`p-2 rounded-full ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            <Icon icon={s.icon} className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Step {idx + 1}</div>
                            <div className="font-semibold text-slate-800">{s.label}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DatesAndRooms({
    dates,
    setDates,
    totalNights,
    availableRooms,
    loadingRooms,
    selectedRoomIds,
    toggleRoom,
    canNextFromStep1,
    goNext,
}) {
    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-4">
                <div>
                    <label className="text-sm text-slate-600">Check-in</label>
                    <input
                        type="date"
                        value={dates.from}
                        onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-600">Check-out</label>
                    <input
                        type="date"
                        value={dates.to}
                        onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
                <div className="flex items-end">
                    <div className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="text-xs text-slate-500">Nights</div>
                        <div className="font-semibold text-slate-800">{totalNights}</div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-6">
                <h3 className="text-slate-800 font-semibold flex items-center gap-2">
                    <Icon icon="lucide:bed" className="w-5 h-5" /> Available Rooms
                </h3>
                {loadingRooms ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" /> Checking…
                    </div>
                ) : (
                    <div className="text-sm text-slate-600">Select multiple rooms if needed</div>
                )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {!loadingRooms && availableRooms.length === 0 && (
                    <div className="col-span-full text-slate-500 text-sm">No rooms available for the selected dates.</div>
                )}
                {availableRooms.map((r) => {
                    const active = selectedRoomIds.includes(r._id);
                    return (
                        <button
                            key={r._id}
                            type="button"
                            onClick={() => toggleRoom(r._id)}
                            className={`text-left p-4 rounded-xl border shadow-sm transition
                ${active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-slate-800">Room {r.roomNumber}</div>
                                <Icon icon={active ? 'lucide:check-circle-2' : 'lucide:circle'} className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                                {r.type} · {r.capacity} pax
                            </div>
                            <div className="mt-2 text-slate-800">{currencyLKR(r.price)} / night</div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                    Selected: <span className="font-semibold text-slate-800">{selectedRoomIds.length}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={!canNextFromStep1}
                        onClick={goNext}
                        className={`px-4 py-2 rounded-lg text-white shadow-sm flex items-center gap-2
              ${canNextFromStep1 ? 'bg-slate-900 hover:bg-black' : 'bg-slate-400 cursor-not-allowed'}`}
                    >
                        Next <Icon icon="lucide:arrow-right" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function GuestDetails({
    nic,
    setNic,
    guestLoading,
    guestFound,
    currentGuest,
    setCurrentGuest,
    guests,
    setGuests,
    handleFindGuest,
    canNextFromStep2,
    goBack,
    goNext,
}) {
    const handleAddGuest = () => {
        if (!currentGuest.name || !currentGuest.nicNumber) return;
        setGuests((prev) => [...prev, currentGuest]);
        setCurrentGuest({ name: '', nicNumber: '', phone: '', email: '', address: '' });
        setNic('');
    };

    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-600">NIC Number</label>
                    <div className="mt-1 flex gap-2">
                        <input
                            value={nic}
                            onChange={(e) => setNic(e.target.value)}
                            placeholder="Eg: 991234567V"
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                        />
                        <button
                            type="button"
                            onClick={handleFindGuest}
                            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white shadow-sm flex items-center gap-2"
                        >
                            <Icon icon="lucide:search" className="w-4 h-4" /> Find
                        </button>
                    </div>
                    {guestLoading && (
                        <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" /> Searching…
                        </div>
                    )}
                    {guestFound === true && <div className="text-sm text-emerald-700 mt-2">Existing guest loaded.</div>}
                    {guestFound === false && (
                        <div className="text-sm text-slate-500 mt-2">No existing guest. Please fill details below.</div>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={handleAddGuest}
                disabled={!currentGuest.name || !currentGuest.nicNumber}
                className="mt-6 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
                Add Guest to Reservation
            </button>

            {guests.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-slate-700 font-semibold mb-2">Added Guests:</h4>
                    <ul className="space-y-1">
                        {guests.map((g, idx) => (
                            <li key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                                <div>
                                    <div className="font-medium text-slate-800">
                                        {g.name} ({g.nicNumber})
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        {g.phone} · {g.email}
                                    </div>
                                </div>
                                <button onClick={() => setGuests((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 text-sm hover:underline">
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div>
                    <label className="text-sm text-slate-600">Full Name</label>
                    <input
                        value={currentGuest.name || ''}
                        onChange={(e) => setCurrentGuest((g) => ({ ...g, name: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-600">NIC</label>
                    <input
                        value={currentGuest.nicNumber}
                        onChange={(e) => setCurrentGuest((g) => ({ ...g, nicNumber: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-600">Phone</label>
                    <input
                        value={currentGuest.phone || ''}
                        onChange={(e) => setCurrentGuest((g) => ({ ...g, phone: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-600">Email</label>
                    <input
                        type="email"
                        value={currentGuest.email || ''}
                        onChange={(e) => setCurrentGuest((g) => ({ ...g, email: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-600">Address</label>
                    <input
                        value={currentGuest.address || ''}
                        onChange={(e) => setCurrentGuest((g) => ({ ...g, address: e.target.value }))}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                    />
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={goBack}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-sm flex items-center gap-2"
                >
                    <Icon icon="lucide:arrow-left" className="w-4 h-4" /> Back
                </button>
                <button
                    disabled={!canNextFromStep2}
                    onClick={goNext}
                    className={`px-4 py-2 rounded-lg text-white shadow-sm flex items-center gap-2
            ${canNextFromStep2 ? 'bg-slate-900 hover:bg-black' : 'bg-slate-400 cursor-not-allowed'}`}
                >
                    Next <Icon icon="lucide:arrow-right" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function ExtrasAndReview({
    dates,
    totalNights,
    selectedRooms,
    guests,
    specialRequests,
    setSpecialRequests,
    notes,
    setNotes,
    roomTotal,
    goBack,
    handleSubmit,
    submitting,
}) {
    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm text-slate-600">Special Requests</label>
                    <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={5}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                        placeholder="E.g., Late check-in, extra pillows, airport pickup…"
                    />
                    <label className="text-sm text-slate-600 mt-4 block">Notes (internal)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                        placeholder="Internal notes for staff"
                    />
                </div>

                <div>
                    <div className="p-4 rounded-xl border border-white/20 bg-white/70 shadow-sm">
                        <div className="text-slate-800 font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="lucide:clipboard-list" className="w-5 h-5" /> Review
                        </div>
                        <div className="text-sm text-slate-600">Dates</div>
                        <div className="font-medium text-slate-800">
                            {dayjs(dates.from).format('MMM D, YYYY')} → {dayjs(dates.to).format('MMM D, YYYY')} ({totalNights} nights)
                        </div>

                        <div className="mt-3 text-sm text-slate-600">Rooms</div>
                        {selectedRooms.length === 0 ? (
                            <div className="text-slate-500 text-sm">No rooms selected.</div>
                        ) : (
                            <ul className="mt-1 space-y-1">
                                {selectedRooms.map((r) => (
                                    <li key={r._id} className="flex items-center justify-between">
                                        <span className="text-slate-800">#{r.roomNumber} · {r.type}</span>
                                        <span className="text-slate-800">{currencyLKR(r.price)} × {totalNights}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-3 text-sm text-slate-600">Guests</div>
                        {guests.length === 0 ? (
                            <div className="text-slate-500">No guests added.</div>
                        ) : (
                            <ul className="text-slate-800 space-y-1 mt-1">
                                {guests.map((g, idx) => (
                                    <li key={idx}>
                                        {g.name} ({g.nicNumber}) {g.phone && ` · 📞 ${g.phone}`} {g.email && ` · ✉️ ${g.email}`}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between">
                            <div className="text-slate-600">Room Total</div>
                            <div className="font-semibold text-slate-800">{currencyLKR(roomTotal)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={goBack}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-sm flex items-center gap-2"
                >
                    <Icon icon="lucide:arrow-left" className="w-4 h-4" /> Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedRooms.length === 0 || totalNights === 0 || guests.length === 0}
                    className={`px-4 py-2 rounded-lg text-white shadow-sm flex items-center gap-2
            ${submitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    {submitting ? (
                        <>
                            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" /> Creating…
                        </>
                    ) : (
                        <>
                            <Icon icon="lucide:check" className="w-4 h-4" /> Create Reservation
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ----------------------- Parent component ----------------------- */

export default function CreateReservation() {
    const today = dayjs().format('YYYY-MM-DD');
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

    // Wizard state
    const [step, setStep] = useState(1);

    // Step 1
    const [dates, setDates] = useState({ from: today, to: tomorrow });
    const [availableRooms, setAvailableRooms] = useState(ALL_ROOMS);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [selectedRoomIds, setSelectedRoomIds] = useState([]);

    // Step 2
    const [nic, setNic] = useState('');
    const [guests, setGuests] = useState([]);
    const [currentGuest, setCurrentGuest] = useState({ name: '', nicNumber: '', phone: '', email: '', address: '' });
    const [guestLoading, setGuestLoading] = useState(false);
    const [guestFound, setGuestFound] = useState(null);

    // Step 3
    const [specialRequests, setSpecialRequests] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const totalNights = useMemo(() => nightsBetween(dates.from, dates.to), [dates]);
    const selectedRooms = useMemo(
        () => availableRooms.filter((r) => selectedRoomIds.includes(r._id)),
        [availableRooms, selectedRoomIds]
    );
    const roomTotal = useMemo(
        () => selectedRooms.reduce((sum, r) => sum + r.price * totalNights, 0),
        [selectedRooms, totalNights]
    );

    // Load availability when dates change
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!dates.from || !dates.to || dayjs(dates.to).isSameOrBefore(dayjs(dates.from))) {
                setAvailableRooms([]);
                setSelectedRoomIds([]);
                return;
            }
            setLoadingRooms(true);
            const res = await apiCheckAvailability(dates.from, dates.to);
            if (!alive) return;
            setAvailableRooms(res);
            setSelectedRoomIds((prev) => prev.filter((id) => res.some((r) => r._id === id)));
            setLoadingRooms(false);
        })();
        return () => {
            alive = false;
        };
    }, [dates]);

    const canNextFromStep1 = dates.from && dates.to && totalNights > 0 && selectedRoomIds.length > 0;
    const canNextFromStep2 = guests.length > 0;

    const goNext = () => setStep((s) => Math.min(3, s + 1));
    const goBack = () => setStep((s) => Math.max(1, s - 1));

    const toggleRoom = (id) => {
        setSelectedRoomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleFindGuest = async () => {
        if (!nic.trim()) return;
        setGuestLoading(true);
        const g = await apiFindGuestByNIC(nic.trim());
        setGuestLoading(false);
        if (g) {
            setCurrentGuest({
                name: g.name || '',
                nicNumber: g.nicNumber || '',
                phone: g.phone || '',
                email: g.email || '',
                address: g.address || '',
            });
            setGuestFound(true);
        } else {
            setCurrentGuest({
                name: '',
                nicNumber: nic.trim(),
                phone: '',
                email: '',
                address: '',
            });
            setGuestFound(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const payload = {
            checkInDate: dates.from,
            checkOutDate: dates.to,
            nights: totalNights,
            rooms: selectedRooms.map((r) => ({ roomId: r._id, price: r.price })),
            guests,
            specialRequests,
            notes,
            estimatedTotal: roomTotal,
        };
        const res = await apiCreateOrGetReservation(payload);
        setSubmitting(false);
        if (res.ok) {
            alert(`Reservation created: ${res.reservationId}`);
            setStep(1);
            setSelectedRoomIds([]);
            setSpecialRequests('');
            setNotes('');
            setGuests([]);
        } else {
            alert('Failed to create reservation');
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 text-white">
                        <Icon icon="lucide:calendar-plus" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Reservations</div>
                        <div className="text-xl font-semibold text-slate-800">New Reservation</div>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <Stepper step={step} />

            {/* Steps */}
            {step === 1 && (
                <DatesAndRooms
                    dates={dates}
                    setDates={setDates}
                    totalNights={totalNights}
                    availableRooms={availableRooms}
                    loadingRooms={loadingRooms}
                    selectedRoomIds={selectedRoomIds}
                    toggleRoom={toggleRoom}
                    canNextFromStep1={canNextFromStep1}
                    goNext={goNext}
                />
            )}
            {step === 2 && (
                <GuestDetails
                    nic={nic}
                    setNic={setNic}
                    guestLoading={guestLoading}
                    guestFound={guestFound}
                    currentGuest={currentGuest}
                    setCurrentGuest={setCurrentGuest}
                    guests={guests}
                    setGuests={setGuests}
                    handleFindGuest={handleFindGuest}
                    canNextFromStep2={canNextFromStep2}
                    goBack={goBack}
                    goNext={goNext}
                />
            )}
            {step === 3 && (
                <ExtrasAndReview
                    dates={dates}
                    totalNights={totalNights}
                    selectedRooms={selectedRooms}
                    guests={guests}
                    specialRequests={specialRequests}
                    setSpecialRequests={setSpecialRequests}
                    notes={notes}
                    setNotes={setNotes}
                    roomTotal={roomTotal}
                    goBack={goBack}
                    handleSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}
        </div>
    );
}
