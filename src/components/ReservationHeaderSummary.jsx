
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import { useReservation } from '../context/reservationContext';
import { formatLKR } from '../utils/currency';

export default function ReservationHeaderSummary() {
    const {
        reservation, handlePrint, nights,
        roomCharges, otherCharges, total, paid, balance, handleCancel, canceling, discountTotal,
        setDateModalOpen,

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
                <div className="space-y-4">
                    {/* Guest, Dates, Rooms */}
                    <div className="grid sm:grid-cols-3 gap-4">
                        {/* Guest */}
                        <div className="p-5 rounded-xl border border-slate-200 bg-white/70 hover:border-slate-300 transition-colors">
                            <div className="text-xs font-medium text-slate-500 mb-3">Guest Information</div>
                            <div className="space-y-2">
                                <div className="font-semibold text-lg text-slate-900">
                                    {reservation?.guest?.name || <span className="text-slate-400">No guest assigned</span>}
                                </div>
                                {reservation?.guest?.nicNumber && (
                                    <div className="text-sm text-slate-600">
                                        <span className="text-slate-400">NIC:</span> {reservation.guest.nicNumber}
                                    </div>
                                )}
                                {reservation?.guest?.phone && (
                                    <div className="text-sm text-slate-600">
                                        <span className="text-slate-400">Phone:</span> {reservation.guest.phone}
                                    </div>
                                )}
                                {reservation?.guest?.email && (
                                    <div className="text-sm text-slate-600 break-words">
                                        <span className="text-slate-400">Email:</span> {reservation.guest.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="p-5 rounded-xl border border-slate-200 bg-white/70 hover:border-slate-300 transition-colors">
                            <div className="text-xs font-medium text-slate-500 mb-3">Stay Duration</div>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Check-in</div>
                                    <div className="font-semibold text-slate-900">
                                        {reservation?.checkInDate
                                            ? dayjs(reservation.checkInDate).format('MMM D, YYYY')
                                            : '—'}
                                    </div>
                                </div>
                                <div className="border-t border-slate-100"></div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Check-out</div>
                                    <div className="font-semibold text-slate-900">
                                        {reservation?.checkOutDate
                                            ? dayjs(reservation.checkOutDate).format('MMM D, YYYY')
                                            : '—'}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                                        {nights} {nights === 1 ? 'night' : 'nights'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setDateModalOpen(true)}
                                    className="mt-2 text-xs text-emerald-600 hover:underline"
                                >
                                    Change Dates
                                </button>

                            </div>
                        </div>

                        {/* Rooms */}
                        <div className="p-5 rounded-xl border border-slate-200 bg-white/70 hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-xs font-medium text-slate-500">Rooms</div>
                                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
                                    {reservation?.rooms?.length || 0}
                                </span>
                            </div>

                            {reservation?.rooms?.length > 0 ? (
                                <div className="space-y-3">
                                    {reservation.rooms.map((r) => (
                                        <div key={r._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-slate-900">Room {r.roomNumber}</span>
                                                <span className="text-xs text-slate-500 px-2 py-0.5 bg-white rounded">{r.type}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Per night</span>
                                                <span className="font-semibold text-slate-900">
                                                    {r.nightlyRate && r.nightlyRate !== r.price ? (
                                                        <span className="space-x-1">
                                                            <span className="text-slate-400 line-through">{formatLKR(r.price)}</span>
                                                            <span>{formatLKR(r.nightlyRate)}</span>
                                                        </span>
                                                    ) : (
                                                        formatLKR(r.nightlyRate || r.price)
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-sm text-slate-400">No rooms assigned</div>
                            )}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                            <div className="text-xs text-slate-500 mb-1">Room Charges</div>
                            <div className="text-xl font-bold text-slate-900">{formatLKR(roomCharges)}</div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-white/70">
                            <div className="text-xs text-slate-500 mb-1">Other Charges</div>
                            <div className="text-xl font-bold text-slate-900">{formatLKR(otherCharges)}</div>
                        </div>

                        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                            <div className="text-xs text-rose-600 mb-1">Discounts</div>
                            <div className="text-xl font-bold text-rose-700">−{formatLKR(discountTotal)}</div>
                        </div>

                        <div className="p-4 rounded-xl border-2 border-slate-300 bg-slate-50 col-span-2 sm:col-span-1">
                            <div className="text-xs text-slate-500 mb-1">Total</div>
                            <div className="text-2xl font-bold text-slate-900">{formatLKR(total)}</div>
                        </div>

                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                            <div className="text-xs text-emerald-700 mb-1">Paid</div>
                            <div className="text-2xl font-bold text-emerald-700">{formatLKR(paid)}</div>
                        </div>

                        <div className={`p-4 rounded-xl border-2 ${balance > 0 ? 'border-amber-400 bg-amber-50' : 'border-emerald-400 bg-emerald-50'}`}>
                            <div className={`text-xs mb-1 ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {balance > 0 ? 'Balance Due' : 'Fully Paid'}
                            </div>
                            <div className={`text-2xl font-bold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {formatLKR(Math.abs(balance))}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="p-5 rounded-xl border border-slate-200 bg-white/70">
                        <div className="text-xs font-medium text-slate-500 mb-2">Notes</div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                            {reservation?.notes || <span className="text-slate-400 italic">No additional notes</span>}
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
