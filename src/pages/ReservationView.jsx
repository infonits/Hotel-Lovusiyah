'use client';

import React from 'react';
import dayjs from 'dayjs';
import { ReservationProvider } from '../context/reservationContext';
import ReservationHeaderSummary from '../components/ReservationHeaderSummary';
import ReservationTabs from '../components/ReservationTabs';
import ReservationModals from '../components/ReservationModals';

const DEFAULT_RESERVATION = {
    code: 'RES-9X3KQ2',
    guest: { name: 'Kajan', nicNumber: '991234567V', phone: '0771234567', email: 'kajan@example.com' },
    rooms: [
        { _id: 'r101', roomNumber: '101', type: 'Standard', price: 60 },
        { _id: 'r201', roomNumber: '201', type: 'Deluxe', price: 90 },
    ],
    checkInDate: dayjs().format('YYYY-MM-DD'),
    checkOutDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    notes: 'Late check-in expected.',
};

export default function ReservationView({ initialReservation = DEFAULT_RESERVATION }) {
    return (
        <ReservationProvider initialReservation={initialReservation}>
            <div className="flex-1 p-8 overflow-y-auto">
                <ReservationHeaderSummary />
                <ReservationTabs />
                <ReservationModals />
            </div>
        </ReservationProvider>
    );
}
