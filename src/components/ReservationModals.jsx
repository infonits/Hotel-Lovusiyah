'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useReservation } from '../context/reservationContext';

export default function ReservationModals() {
    const currencyLKR = (n) => `LKR ${Number(n || 0).toFixed(2)}`;

    const {
        // item modal
        itemModalOpen, setItemModalOpen, itemEditing, setItemEditing,
        itemMode, itemForm, setItemForm, saveItem,
        // payment modal
        paymentModalOpen, setPaymentModalOpen, paymentEditing, setPaymentEditing,
        paymentForm, setPaymentForm, savePayment,
    } = useReservation();

    const CardToggle = ({ options, value, onChange }) => (
        <div className="flex gap-2">
            {options.map((opt) => {
                const active = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2
              ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                        {opt === 'Cash' && <Icon icon="lucide:banknote" className="w-4 h-4" />}
                        {opt === 'Card' && <Icon icon="lucide:credit-card" className="w-4 h-4" />}
                        {opt === 'Bank Transfer' && <Icon icon="lucide:send-horizontal" className="w-4 h-4" />}
                        {opt === 'Advance' && <Icon icon="lucide:arrow-down-circle" className="w-4 h-4" />}
                        {opt === 'Settlement' && <Icon icon="lucide:check-circle" className="w-4 h-4" />}
                        <span>{opt}</span>
                    </button>
                );
            })}
        </div>
    );

    return (
        <>
            {/* -------- Item Modal (Service/Food) -------- */}
            {itemModalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {itemEditing ? 'Edit' : 'Add'} {itemMode === 'service' ? 'Service' : 'Food'}
                            </h3>
                            <button
                                onClick={() => { setItemModalOpen(false); setItemEditing(null); }}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                            >
                                <Icon icon="lucide:x" className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-slate-600">Title</label>
                                <input
                                    value={itemForm.title}
                                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                                    className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-slate-600">Qty</label>
                                    <input
                                        type="number"
                                        value={itemForm.qty}
                                        onChange={(e) => setItemForm({ ...itemForm, qty: Number(e.target.value) })}
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">Rate</label>
                                    <input
                                        type="number"
                                        value={itemForm.rate}
                                        onChange={(e) => setItemForm({ ...itemForm, rate: Number(e.target.value) })}
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600">Amount</label>
                                <input
                                    disabled
                                    value={currencyLKR(itemForm.amount)}
                                    className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => { setItemModalOpen(false); setItemEditing(null); }}
                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveItem}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={!itemForm.title || itemForm.amount <= 0}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* -------- Payment Modal (card-style selectors) -------- */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {paymentEditing ? 'Edit' : 'Add'} Payment
                            </h3>
                            <button
                                onClick={() => { setPaymentModalOpen(false); setPaymentEditing(null); }}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                            >
                                <Icon icon="lucide:x" className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Type: Advance / Settlement */}
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Type</label>
                                <CardToggle
                                    options={['Advance', 'Settlement']}
                                    value={paymentForm.type}
                                    onChange={(v) => setPaymentForm({ ...paymentForm, type: v })}
                                />
                            </div>

                            {/* Method: Cash / Card / Bank Transfer */}
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Method</label>
                                <CardToggle
                                    options={['Cash', 'Card', 'Bank Transfer']}
                                    value={paymentForm.method}
                                    onChange={(v) => setPaymentForm({ ...paymentForm, method: v })}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-600">Date</label>
                                <input
                                    type="date"
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600">Amount</label>
                                <input
                                    type="number"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                                    className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => { setPaymentModalOpen(false); setPaymentEditing(null); }}
                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePayment}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={paymentForm.amount <= 0}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
