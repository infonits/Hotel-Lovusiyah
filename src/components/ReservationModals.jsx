'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useReservation } from '../context/reservationContext';
import { formatLKR } from '../utils/currency';
import dayjs from 'dayjs';

const icons = {
    Cash: "lucide:banknote",
    Card: "lucide:credit-card",
    "Bank Transfer": "lucide:send-horizontal",
    Advance: "lucide:arrow-down-circle",
    Settlement: "lucide:check-circle",
};


export default function ReservationModals() {
    const {
        cancelModalOpen, setCancelModalOpen, confirmCancel, canceling,

        serviceCatalog, foodCatalog, catalogLoading,

        itemModalOpen, setItemModalOpen, itemEditing, setItemEditing,
        itemMode, itemForm, setItemForm, saveItem,

        // 👇 Add setPaymentModalOpen here
        paymentEditing, setPaymentEditing, paymentModalOpen, setPaymentModalOpen,
        savePayment,
        balance
    } = useReservation();


    const [localPaymentForm, setLocalPaymentForm] = useState({
        type: 'Advance',
        method: 'Cash',
        date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
    });

    useEffect(() => {
        if (!paymentModalOpen) return; // only run when modal just opened

        if (paymentEditing) {
            setLocalPaymentForm({
                type: paymentEditing.type,
                method: paymentEditing.method,
                date: paymentEditing.date,
                amount: Number(paymentEditing.amount || 0),
            });
        } else {
            setLocalPaymentForm({
                type: "Advance",
                method: "Cash",
                date: dayjs().format("YYYY-MM-DD"),
                amount: 0,
            });
        }
    }, [paymentModalOpen]); // 👈 only depend on modal open/close




    const CardToggle = ({ options, value, onChange }) => (
        <div className="flex gap-2">
            {options.map((opt) => {
                const active = value?.toLowerCase() === opt.toLowerCase();
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2
            ${active
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                        {/* <Icon icon={icons[opt]} className="w-4 h-4" /> */}
                        <span>{opt}</span>

                    </button>
                );
            })}
        </div>
    );


    // Group foods by category for a nicer dropdown
    const foodGroups = useMemo(() => {
        const groups = {};
        (foodCatalog || []).forEach((f) => {
            const key = f.category || 'Other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(f);
        });
        // sort group labels & items
        const sorted = Object.keys(groups).sort().map((k) => ({
            category: k,
            items: groups[k].sort((a, b) => a.title.localeCompare(b.title)),
        }));
        return sorted;
    }, [foodCatalog]);

    const handlePickCatalogItem = (idOrKey) => {
        if (!idOrKey) {
            // Reset title/rate if none selected
            setItemForm({ ...itemForm, title: '', rate: 0 });
            return;
        }

        if (itemMode === 'service') {
            const found = serviceCatalog.find((s) => s.id === idOrKey);
            if (found) {
                setItemForm({
                    ...itemForm,
                    title: found.title,
                    rate: Number(found.rate || 0),
                });
            }
        } else {
            const found = (foodCatalog || []).find((f) => f.id === idOrKey);
            if (found) {
                setItemForm({
                    ...itemForm,
                    title: found.title,
                    rate: Number(found.rate || 0),
                });
            }
        }
    };

    useEffect(() => {
        if (paymentModalOpen || itemModalOpen || cancelModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [paymentModalOpen, itemModalOpen, cancelModalOpen]);


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
                            {/* Title → Dropdown fed by Supabase catalogs */}
                            <div>
                                <label className="text-sm text-slate-600">
                                    {itemMode === 'service' ? 'Service' : 'Food'}
                                </label>
                                <div className="relative">
                                    <select
                                        disabled={catalogLoading}
                                        value={(itemMode === 'service'
                                            ? (serviceCatalog.find(s => s.title === itemForm.title)?.id || '')
                                            : ((foodCatalog || []).find(f => f.title === itemForm.title)?.id || '')
                                        )}
                                        onChange={(e) => handlePickCatalogItem(e.target.value)}
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50"
                                    >
                                        <option value="">
                                            {catalogLoading ? 'Loading…' : `Select ${itemMode === 'service' ? 'a service' : 'a food item'}`}
                                        </option>

                                        {itemMode === 'service' ? (
                                            // Simple flat list for services
                                            (serviceCatalog || []).map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.title} — {formatLKR(s.rate)}
                                                </option>
                                            ))
                                        ) : (
                                            // Foods grouped by category
                                            foodGroups.map((g) => (
                                                <optgroup key={g.category} label={g.category}>
                                                    {g.items.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.title} — {formatLKR(f.rate)}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))
                                        )}
                                    </select>

                                    {/* tiny inline loader to keep things smooth */}
                                    {catalogLoading && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 animate-pulse text-xs">
                                            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                        </div>
                                    )}
                                </div>
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
                                    value={formatLKR(itemForm.amount)}
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
                                disabled={!itemForm.title || itemForm.amount <= 0 || catalogLoading}
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
                                    value={localPaymentForm.type}
                                    onChange={(v) => {
                                        if (v === 'Settlement') {
                                            setLocalPaymentForm(f => ({ ...f, type: v, amount: balance }));
                                        } else {
                                            setLocalPaymentForm(f => ({ ...f, type: v, amount: 0 }));
                                        }
                                    }}
                                />

                            </div>

                            {/* Method: Cash / Card / Bank Transfer */}
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Method</label>
                                <CardToggle
                                    options={['Cash', 'Card', 'Bank Transfer']}
                                    value={localPaymentForm.method}
                                    onChange={(v) => setLocalPaymentForm(f => ({ ...f, method: v }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-600">Date</label>
                                <input
                                    type="date"
                                    value={localPaymentForm.date}
                                    onChange={(e) =>
                                        setLocalPaymentForm(f => ({ ...f, date: e.target.value }))
                                    }
                                    className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/50
               text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 
               focus:border-emerald-500"
                                />
                            </div>

                            {/* Show only for Advance */}
                            {localPaymentForm.type === 'Advance' && (
                                <div>
                                    <label className="text-sm text-slate-600">Amount</label>
                                    <input
                                        type="number"
                                        value={localPaymentForm.amount || ''}

                                        placeholder='Enter the Amount'
                                        onChange={(e) =>
                                            setLocalPaymentForm(f => ({ ...f, amount: Number(e.target.value) }))
                                        }
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 
                 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 
                 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            )}

                            {/* Show only for Settlement + Cash */}
                            {(localPaymentForm.type === 'Settlement' && localPaymentForm.method === 'Cash') && (
                                <div className="space-y-3">
                                    {/* Balance Due */}
                                    <div>
                                        <label className="text-sm text-slate-600">Balance Due</label>
                                        <input
                                            type="number"
                                            value={balance}
                                            disabled
                                            className="mt-1 w-full px-4 py-2 rounded-lg border bg-slate-100 
               text-slate-700 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Cash Received */}
                                    <div>
                                        <label className="text-sm text-slate-600">Cash Received</label>
                                        <input
                                            type="number"
                                            value={localPaymentForm.cashReceived || ""}
                                            onChange={(e) => {
                                                let entered = Number(e.target.value) || 0;
                                                setLocalPaymentForm(f => ({ ...f, cashReceived: entered }));
                                            }}
                                            placeholder="Enter cash received"
                                            className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 
               bg-white/50 text-slate-700 focus:outline-none focus:ring-2 
               focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* Change to Return */}
                                    {localPaymentForm.cashReceived > 0 && (
                                        <p className="text-sm font-medium text-emerald-600">
                                            Change to return: {localPaymentForm.cashReceived - balance}
                                        </p>
                                    )}


                                </div>
                            )}


                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => { setPaymentModalOpen(false); setPaymentEditing(null); }}
                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => savePayment(localPaymentForm)}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={localPaymentForm.amount <= 0}
                            >
                                Save
                            </button>

                        </div>
                    </div>

                </div>
            )}
            {cancelModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm animate-fadeIn">
                        <h3 className="text-lg font-semibold mb-2">Cancel Reservation?</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setCancelModalOpen(false)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            >
                                No
                            </button>
                            <button
                                onClick={confirmCancel}
                                disabled={canceling}
                                className={`px-3 py-1.5 rounded-lg text-white shadow-sm ${canceling ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {canceling ? 'Cancelling…' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
