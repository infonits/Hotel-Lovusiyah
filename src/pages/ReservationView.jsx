'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // ← from your router setup
import { ReservationProvider } from '../context/reservationContext';
import ReservationHeaderSummary from '../components/ReservationHeaderSummary';
import ReservationTabs from '../components/ReservationTabs';
import ReservationModals from '../components/ReservationModals';
import { supabase } from '../lib/supabse';

export default function ReservationView() {
    const { id } = useParams();               // ← reservation id from URL
    const [loading, setLoading] = useState(true);
    const [initialReservation, setInitialReservation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            if (!id) {
                setError('Missing reservation id');
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Only request columns that exist in your schema.
                // Here I assume guests has: id, name, email, phone, nic
                const { data, error } = await supabase
                    .from('reservations')
                    .select(`
           id,  notes, check_in_date, check_out_date, reservation_number, status, cancelled_at,
          reservation_rooms (
            rooms ( id, number, type, price )
          ),
          reservation_guests (
            guests ( id, name, email, phone, nic )
          )
        `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!alive) return;

                // Pick the first guest (or adjust per your logic)
                const primaryGuest = data?.reservation_guests?.[0]?.guests || null;

                // Gracefully fall back across possible field names you might have
                const nicValue =
                    (primaryGuest?.nic ??          // common in your earlier components
                        primaryGuest?.nic_number ??   // if you later add this column
                        primaryGuest?.national_id ??  // some schemas use this
                        '')                           // final fallback
                        .toString();

                const guest = primaryGuest
                    ? {
                        name: primaryGuest.name || '-',
                        nicNumber: nicValue,
                        phone: primaryGuest.phone || '',
                        email: primaryGuest.email || '',
                    }
                    : null;

                const rooms = (data?.reservation_rooms || []).map((rr) => {
                    const r = rr.rooms || {};
                    return {
                        _id: r.id,
                        roomNumber: r.number,
                        type: r.type,
                        price: Number(r.price || 0),
                    };
                });

                setInitialReservation({
                    id: data.id,
                    code: data.reservation_number
                        ? `RES-${data.reservation_number.toString().padStart(6, '0')}`
                        : 'RES-000000',
                    guest,
                    rooms,
                    checkInDate: data.check_in_date,
                    checkOutDate: data.check_out_date,
                    notes: data.notes || '',
                    status: data.status || 'confirmed',
                });
            } catch (e) {
                console.error(e);
                if (!alive) return;
                setError('Failed to load reservation.');
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [id]);



    if (loading) {
        // Smooth skeleton matching your design
        return (
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-200 animate-pulse w-9 h-9" />
                        <div>
                            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                    <div className="grid sm:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white/70">
                                <div className="h-3 w-20 bg-slate-200 rounded mb-2 animate-pulse" />
                                <div className="h-5 w-40 bg-slate-200 rounded mb-2 animate-pulse" />
                                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !initialReservation) {
        return (
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
                    {error || 'Reservation not found.'}
                </div>
            </div>
        );
    }
    return (
        <ReservationProvider initialReservation={initialReservation}>
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-4 flex justify-end">

                </div>
                <ReservationHeaderSummary />
                <ReservationTabs />
                <ReservationModals />
            </div>
        </ReservationProvider>
    );
}
