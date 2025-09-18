
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import { useReservation } from '../context/reservationContext';

export default function ReservationHeaderSummary() {
    const {
        reservation, handlePrint, nights,
        roomCharges, otherCharges, total, paid, balance, currencyLKR, handleCancel, canceling
    } = useReservation();


    const isCancelled = reservation?.status === 'cancelled';


    return (
        <>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 text-white">
                        <Icon icon="lucide:receipt" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Reservation</div>
                        <div className="text-xl font-semibold text-slate-800">
                            {reservation?.code || 'RES-XXXXXX'}
                        </div>
                    </div>
                </div>
                <div className='flex flex-row gap-5'>

                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
                    >
                        <Icon icon="lucide:printer" className="w-4 h-4" />
                        Print Bill (PDF)
                    </button>
                    {isCancelled ? (
                        <span className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                            Cancelled
                        </span>
                    ) : (
                        <button
                            onClick={handleCancel}
                            disabled={canceling}
                            className={`px-4 py-2 rounded-lg text-white shadow-sm ${canceling ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {canceling ? 'Cancelling…' : 'Cancel Reservation'}
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                <div className="grid sm:grid-cols-3 gap-4">
                    {/* Guest */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Guest</div>
                        <div className="font-semibold text-slate-800">
                            {reservation?.guest?.name || '-'}
                        </div>
                        <div className="text-sm text-slate-600">
                            {reservation?.guest?.nicNumber || '-'} · {reservation?.guest?.phone || '-'}
                        </div>
                        {reservation?.guest?.email && (
                            <div className="text-sm text-slate-600">{reservation.guest.email}</div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Dates</div>
                        <div className="font-semibold text-slate-800">
                            {reservation?.checkInDate
                                ? dayjs(reservation.checkInDate).format('MMM D, YYYY')
                                : '-'}{' '}
                            →{' '}
                            {reservation?.checkOutDate
                                ? dayjs(reservation.checkOutDate).format('MMM D, YYYY')
                                : '-'}
                        </div>
                        <div className="text-sm text-slate-600">{nights} night(s)</div>
                    </div>

                    {/* Rooms */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Rooms</div>
                        <div className="font-semibold text-slate-800">
                            {(reservation?.rooms || []).map((r) => r.roomNumber).join(', ') || '-'}
                        </div>
                        <div className="text-sm text-slate-600">
                            {reservation?.rooms?.length || 0} room(s)
                        </div>
                    </div>
                </div>

                {/* Room Charges */}
                <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Room Charges</div>
                        <div className="text-lg font-semibold text-slate-800">
                            {currencyLKR(roomCharges)}
                        </div>
                    </div>
                </div>

                {/* Other Charges, Total, Paid */}
                <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Other Charges</div>
                        <div className="text-lg font-semibold text-slate-800">
                            {currencyLKR(otherCharges)}
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Total</div>
                        <div className="text-lg font-semibold text-slate-800">
                            {currencyLKR(total)}
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Paid</div>
                        <div className="text-lg font-semibold text-slate-800">
                            {currencyLKR(paid)}
                        </div>
                    </div>
                </div>

                {/* Balance & Notes */}
                <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs text-slate-500">Balance</div>
                        <div
                            className={`text-lg font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                                }`}
                        >
                            {currencyLKR(balance)}
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-white/70 sm:col-span-2">
                        <div className="text-xs text-slate-500">Notes</div>
                        <div className="text-sm text-slate-700 line-clamp-2">
                            {reservation?.notes || '—'}
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
