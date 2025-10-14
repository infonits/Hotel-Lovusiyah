'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import { useReservation } from '../context/reservationContext';
import { formatLKR } from '../utils/currency';

export default function ReservationTabs() {
    const {
        // state
        tab, setTab,
        services, foods, payments, discounts, openAddDiscount,
        reservation,

        // item handlers (from provider)
        openAddService, openAddFood, openEditService, openEditFood, deleteService, deleteFood,

        // payment handlers (from provider)
        openAddPayment, openEditPayment, deletePayment, deleteDiscount,

        // catalogs (Supabase-backed) + loaders
        serviceCatalog, foodCatalog, catalogLoading,
        paymentsLoading, discountsLoading, openEditDiscount,

        // modal controls to support Quick Add prefill
        setItemMode, setItemForm, setItemModalOpen,
    } = useReservation();

    // Prefill the item modal with a catalog entry (no design change; user just hits "Save")
    const handleQuickAdd = (mode, entry) => {
        setItemMode(mode);
        setItemForm({
            title: entry.title,
            qty: 1,
            rate: Number(entry.rate || 0),
            amount: Number(entry.rate || 0),
        });
        setItemModalOpen(true);
    };



    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mt-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {['payments', 'services', 'foods', 'discounts'].map((id) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition
                ${tab === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                            {id === 'services' && <Icon icon="lucide:concierge-bell" className="w-4 h-4" />}
                            {id === 'foods' && <Icon icon="lucide:utensils" className="w-4 h-4" />}
                            {id === 'payments' && <Icon icon="lucide:wallet" className="w-4 h-4" />}
                            {id === 'discounts' && <Icon icon="iconamoon:discount-duotone" className="w-4 h-4" />}
                            {id[0].toUpperCase() + id.slice(1)}
                        </button>
                    ))}
                </div>
                {reservation?.status != 'checked_out' &&
                    <>
                        {tab === 'payments' ? (
                            <button
                                onClick={openAddPayment}
                                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-sm flex items-center gap-2"
                            >
                                <Icon icon="lucide:plus" className="w-4 h-4" /> Add Payment
                            </button>
                        ) : tab === 'discounts' ? (
                            <button
                                onClick={openAddDiscount}
                                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-sm flex items-center gap-2"
                            >
                                <Icon icon="lucide:plus" className="w-4 h-4" /> Add Discount
                            </button>
                        ) : (
                            <button
                                onClick={() => (tab === 'services' ? openAddService() : openAddFood())}
                                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-sm flex items-center gap-2"
                            >
                                <Icon icon="lucide:plus" className="w-4 h-4" /> Add {tab === 'services' ? 'Service' : 'Food'}
                            </button>
                        )}
                    </>}
            </div>



            {/* Services table */}
            {tab === 'services' && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-4 py-2 font-medium">Service</th>
                                <th className="px-4 py-2 font-medium">Qty</th>
                                <th className="px-4 py-2 font-medium">Date</th>
                                <th className="px-4 py-2 font-medium">Rate</th>
                                <th className="px-4 py-2 font-medium">Amount</th>
                                <th className="px-4 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No services added.</td>
                                </tr>
                            ) : services.map((s) => (
                                <tr key={s._id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-4 py-3 text-slate-800">{s.title}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.qty}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {s.created_at ? dayjs(s.created_at).format('MMM D, YYYY h:mm A') : '-'}

                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatLKR(s.rate)}</td>

                                    <td className="px-4 py-3 text-slate-800 font-medium">{formatLKR(s.amount)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditService(s)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200" title="Edit">
                                                <Icon icon="lucide:square-pen" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteService(s._id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete">
                                                <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Foods table */}
            {tab === 'foods' && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-4 py-2 font-medium">Food</th>
                                <th className="px-4 py-2 font-medium">Qty</th>
                                <th className="px-4 py-2 font-medium">Ordered</th>

                                <th className="px-4 py-2 font-medium">Rate</th>
                                <th className="px-4 py-2 font-medium">Amount</th>
                                <th className="px-4 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foods.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No foods added.</td>
                                </tr>
                            ) : foods.map((f) => (
                                <tr key={f._id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-4 py-3 text-slate-800">{f.title}</td>
                                    <td className="px-4 py-3 text-slate-600">{f.qty}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {f.created_at ? dayjs(f.created_at).format('MMM D, YYYY h:mm A') : '-'}

                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatLKR(f.rate)}</td>
                                    <td className="px-4 py-3 text-slate-800 font-medium">{formatLKR(f.amount)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditFood(f)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200" title="Edit">
                                                <Icon icon="lucide:square-pen" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteFood(f._id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete">
                                                <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payments table */}
            {tab === 'payments' && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-4 py-2 font-medium">Type</th>
                                <th className="px-4 py-2 font-medium">Method</th>
                                <th className="px-4 py-2 font-medium">Date</th>
                                <th className="px-4 py-2 font-medium">Amount</th>
                                <th className="px-4 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-slate-500 text-sm flex items-center gap-2">
                                        <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                        Loading payments…
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No payments recorded.</td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p._id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-4 py-3 text-slate-800">{p.type}</td>
                                        <td className="px-4 py-3 text-slate-600">{p.method}</td>
                                        <td className="px-4 py-3 text-slate-600">{dayjs(p.date).format('YYYY-MM-DD')}</td>
                                        <td className="px-4 py-3 text-slate-800 font-medium">{formatLKR(p.amount)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditPayment(p)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200" title="Edit">
                                                    <Icon icon="lucide:square-pen" className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deletePayment(p._id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete">
                                                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'discounts' && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">Date</th>
                                <th className="px-4 py-2 font-medium">Value</th>
                                <th className="px-4 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discountsLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-slate-500 text-sm flex items-center gap-2">
                                        <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                        Loading Discounts
                                    </td>
                                </tr>
                            ) : discounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No discounts recorded.</td>
                                </tr>
                            ) : (
                                discounts.map((d) => (
                                    <tr key={d._id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-4 py-3 text-slate-800">{d.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{dayjs(d.date).format('YYYY-MM-DD')}</td>
                                        <td className="px-4 py-3 text-slate-800 font-medium">{formatLKR(d.amount)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditDiscount(d)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200" title="Edit">
                                                    <Icon icon="lucide:square-pen" className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteDiscount(d.id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete">
                                                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
