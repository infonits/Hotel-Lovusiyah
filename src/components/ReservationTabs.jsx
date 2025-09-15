'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import { useReservation } from '../context/reservationContext';

export default function ReservationTabs() {
    const {
        tab, setTab,
        services, foods, payments,
        currencyLKR,
        openAddService, openAddFood, openEditService, openEditFood, deleteService, deleteFood,
        openAddPayment, openEditPayment, deletePayment,
        SERVICE_CATALOG, FOOD_CATALOG, addItemFromCatalog,
    } = useReservation();

    const QuickAdd = ({ mode }) => {
        const list = mode === 'service' ? SERVICE_CATALOG : FOOD_CATALOG;
        if (!list?.length) return null;
        return (
            <div className="mt-4 flex flex-wrap gap-2">
                {list.map((it, idx) => (
                    <button
                        key={`${mode}-${idx}`}
                        onClick={() => addItemFromCatalog(mode, it)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-50 flex items-center gap-2"
                        title={`Add ${it.title}`}
                    >
                        <Icon icon={mode === 'service' ? 'lucide:concierge-bell' : 'lucide:utensils'} className="w-4 h-4" />
                        <span>{it.title}</span>
                        <span className="text-slate-500">· {currencyLKR(it.rate)}</span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mt-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {['services', 'foods', 'payments'].map((id) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition
                ${tab === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                            {id === 'services' && <Icon icon="lucide:concierge-bell" className="w-4 h-4" />}
                            {id === 'foods' && <Icon icon="lucide:utensils" className="w-4 h-4" />}
                            {id === 'payments' && <Icon icon="lucide:wallet" className="w-4 h-4" />}
                            {id[0].toUpperCase() + id.slice(1)}
                        </button>
                    ))}
                </div>

                {tab !== 'payments' ? (
                    <button
                        onClick={() => (tab === 'services' ? openAddService() : openAddFood())}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-sm flex items-center gap-2"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" /> Add {tab === 'services' ? 'Service' : 'Food'}
                    </button>
                ) : (
                    <button
                        onClick={openAddPayment}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-sm flex items-center gap-2"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" /> Add Payment
                    </button>
                )}
            </div>

            {/* Quick add chips */}
            {tab === 'services' && <QuickAdd mode="service" />}
            {tab === 'foods' && <QuickAdd mode="food" />}

            {/* Tables */}
            {tab === 'services' && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-4 py-2 font-medium">Service</th>
                                <th className="px-4 py-2 font-medium">Qty</th>
                                <th className="px-4 py-2 font-medium">Rate</th>
                                <th className="px-4 py-2 font-medium">Amount</th>
                                <th className="px-4 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No services added.</td></tr>
                            ) : services.map((s) => (
                                <tr key={s._id} className="border-b last:border-0">
                                    <td className="px-4 py-3 text-slate-800">{s.title}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.qty}</td>
                                    <td className="px-4 py-3 text-slate-600">{currencyLKR(s.rate)}</td>
                                    <td className="px-4 py-3 text-slate-800 font-medium">{currencyLKR(s.amount)}</td>
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

            {tab === 'foods' && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-4 py-2 font-medium">Food</th>
                                <th className="px-4 py-2 font-medium">Qty</th>
                                <th className="px-4 py-2 font-medium">Rate</th>
                                <th className="px-4 py-2 font-medium">Amount</th>
                                <th className="px-4 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foods.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No foods added.</td></tr>
                            ) : foods.map((f) => (
                                <tr key={f._id} className="border-b last:border-0">
                                    <td className="px-4 py-3 text-slate-800">{f.title}</td>
                                    <td className="px-4 py-3 text-slate-600">{f.qty}</td>
                                    <td className="px-4 py-3 text-slate-600">{currencyLKR(f.rate)}</td>
                                    <td className="px-4 py-3 text-slate-800 font-medium">{currencyLKR(f.amount)}</td>
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
                            {payments.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-sm">No payments recorded.</td></tr>
                            ) : payments.map((p) => (
                                <tr key={p._id} className="border-b last:border-0">
                                    <td className="px-4 py-3 text-slate-800">{p.type}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.method}</td>
                                    <td className="px-4 py-3 text-slate-600">{dayjs(p.date).format('YYYY-MM-DD')}</td>
                                    <td className="px-4 py-3 text-slate-800 font-medium">{currencyLKR(p.amount)}</td>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
