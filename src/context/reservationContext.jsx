'use client';

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabse';
import { formatLKR } from '../utils/currency';

const ReservationContext = createContext(null);
export const useReservation = () => useContext(ReservationContext);


export function ReservationProvider({ initialReservation, children }) {
    // Catalogs (services + menus from Supabase)
    const [serviceCatalog, setServiceCatalog] = useState([]); // [{id,title,rate}]
    const [foodCatalog, setFoodCatalog] = useState([]);       // [{id,title,rate,category}]
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [reservation, setReservation] = useState(initialReservation);
    const [canceling, setCanceling] = useState(false);
    // Items persisted in Supabase (TWO TABLES)
    const [services, setServices] = useState([]); // [{_id,title,qty,rate,amount}]
    const [foods, setFoods] = useState([]);       // [{_id,title,qty,rate,amount}]
    const [itemsLoading, setItemsLoading] = useState(true);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);

    // Payments (persisted in Supabase)
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    // Tabs
    const [tab, setTab] = useState('services');

    // Item modal
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [itemMode, setItemMode] = useState('service'); // 'service' | 'food'
    const [itemEditing, setItemEditing] = useState(null);
    const [itemForm, setItemForm] = useState({ title: '', qty: 1, rate: 0, amount: 0 });

    // Payment modal
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentEditing, setPaymentEditing] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        type: 'Advance',
        method: 'Cash',
        date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
    });

    /* ---------- Catalogs ---------- */
    useEffect(() => {
        let alive = true;
        (async () => {
            setCatalogLoading(true);
            try {
                const [{ data: svc, error: svcErr }, { data: menus, error: menuErr }] = await Promise.all([
                    supabase.from('services')
                        .select('id, name, price, status,created_at')
                        .eq('status', 'active')
                        .order('name', { ascending: true }),
                    supabase.from('menus')
                        .select('id, name, price, category')
                        .order('name', { ascending: true })
                ]);
                if (svcErr) throw svcErr;
                if (menuErr) throw menuErr;

                if (!alive) return;
                setServiceCatalog((svc || []).map(s => ({ id: s.id, title: s.name, rate: formatLKR(s.price || 0) })));
                setFoodCatalog((menus || []).map(m => ({ id: m.id, title: m.name, rate: Number(m.price || 0), category: m.category })));
            } catch (e) {
                console.error('Catalog load failed:', e);
                if (!alive) return;
                setServiceCatalog([]);
                setFoodCatalog([]);
            } finally {
                if (alive) setCatalogLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    /* ---------- Items (two tables) ---------- */
    const mapRow = (r) => ({
        _id: r.id,
        title: r.title,
        qty: Number(r.qty || 0),
        rate: Number(r.rate || 0),
        amount: Number(r.amount || 0),
        created_at: r.created_at,
    });

    const reloadItems = useCallback(async () => {
        if (!initialReservation?.id) {
            setServices([]); setFoods([]); setItemsLoading(false);
            return;
        }
        setItemsLoading(true);
        try {
            const [svcRes, foodRes] = await Promise.all([
                supabase.from('reservation_services')
                    .select('id, title, qty, rate, amount, created_at')
                    .eq('reservation_id', initialReservation.id)
                    .order('created_at', { ascending: false }),
                supabase.from('reservation_foods')
                    .select('id, title, qty, rate, amount, created_at')
                    .eq('reservation_id', initialReservation.id)
                    .order('created_at', { ascending: false }),
            ]);
            if (svcRes.error) throw svcRes.error;
            if (foodRes.error) throw foodRes.error;

            setServices((svcRes.data || []).map(mapRow));
            setFoods((foodRes.data || []).map(mapRow));
        } catch (e) {
            console.error('Items load failed:', e);
            setServices([]); setFoods([]);
        } finally {
            setItemsLoading(false);
        }
    }, [initialReservation?.id]);

    useEffect(() => { reloadItems(); }, [reloadItems]);

    /* ---------- Payments ---------- */
    const reloadPayments = useCallback(async () => {
        if (!initialReservation?.id) { setPayments([]); setPaymentsLoading(false); return; }
        setPaymentsLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('id, type, method, date, amount')
                .eq('reservation_id', initialReservation.id)
                .order('date', { ascending: false });
            if (error) throw error;

            setPayments((data || []).map(p => ({
                _id: p.id,
                type: p.type,
                method: p.method,
                date: p.date,
                amount: Number(p.amount || 0),
            })));
        } catch (e) {
            console.error('Payments load failed:', e);
            setPayments([]);
        } finally {
            setPaymentsLoading(false);
        }
    }, [initialReservation?.id]);

    useEffect(() => { reloadPayments(); }, [reloadPayments]);

    /* ---------- Item form helpers ---------- */
    useEffect(() => {
        setItemForm(f => ({ ...f, amount: Number(f.qty || 0) * Number(f.rate || 0) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemForm.qty, itemForm.rate]);

    useEffect(() => {
        if (itemModalOpen) {
            if (itemEditing) {
                setItemForm({
                    _id: itemEditing._id,
                    title: itemEditing.title,
                    qty: Number(itemEditing.qty || 0),
                    rate: Number(itemEditing.rate || 0),
                    amount: Number(itemEditing.amount || 0),
                });
            } else {
                setItemForm({ title: '', qty: 1, rate: 0, amount: 0 });
            }
        }
    }, [itemModalOpen, itemEditing]);

    /* ---------- Payment form hydrate ---------- */
    useEffect(() => {
        if (paymentModalOpen) {
            if (paymentEditing) {
                setPaymentForm({
                    _id: paymentEditing._id,
                    type: paymentEditing.type,
                    method: paymentEditing.method,
                    date: paymentEditing.date,
                    amount: Number(paymentEditing.amount || 0),
                });
            } else {
                setPaymentForm({
                    type: 'Advance',
                    method: 'Cash',
                    date: dayjs().format('YYYY-MM-DD'),
                    amount: 0,
                });
            }
        }
    }, [paymentModalOpen, paymentEditing]);

    /* ---------- Totals ---------- */
    const nights = useMemo(
        () => dayjs(initialReservation.checkOutDate).diff(dayjs(initialReservation.checkInDate), 'day'),
        [initialReservation]
    );
    const roomCharges = useMemo(
        () => (initialReservation.rooms || []).reduce((sum, r) => sum + (Number(r.price || 0) * nights), 0),
        [initialReservation.rooms, nights]
    );
    const otherCharges = useMemo(
        () => [...services, ...foods].reduce((sum, x) => sum + Number(x.amount || 0), 0),
        [services, foods]
    );
    const total = useMemo(() => roomCharges + otherCharges, [roomCharges, otherCharges]);
    const paid = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments]);
    const balance = useMemo(() => Math.max(0, total - paid), [total, paid]);

    /* ---------- Item handlers (CRUD into TWO TABLES) ---------- */
    const openAddService = () => { setItemMode('service'); setItemEditing(null); setItemModalOpen(true); };
    const openAddFood = () => { setItemMode('food'); setItemEditing(null); setItemModalOpen(true); };
    const openEditService = (it) => { setItemMode('service'); setItemEditing(it); setItemModalOpen(true); };
    const openEditFood = (it) => { setItemMode('food'); setItemEditing(it); setItemModalOpen(true); };

    const saveItem = async () => {
        const rec = {
            title: itemForm.title,
            qty: Number(itemForm.qty || 0),
            rate: Number(itemForm.rate || 0),
            amount: Number(itemForm.amount || 0),
        };

        // Local fallback if no reservation id
        if (!initialReservation?.id) {
            const local = {
                _id: itemForm._id || `${itemMode}-${(crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 9))}`,
                ...rec,
            };
            if (itemMode === 'service') {
                if (itemEditing?._id) setServices(prev => prev.map(x => (x._id === local._id ? local : x)));
                else setServices(prev => [local, ...prev]);
            } else {
                if (itemEditing?._id) setFoods(prev => prev.map(x => (x._id === local._id ? local : x)));
                else setFoods(prev => [local, ...prev]);
            }
            setItemModalOpen(false); setItemEditing(null);
            return;
        }

        const table = itemMode === 'service' ? 'reservation_services' : 'reservation_foods';
        setItemsLoading(true);
        try {
            if (itemEditing?._id) {
                const { error } = await supabase.from(table).update(rec).eq('id', itemEditing._id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).insert({
                    reservation_id: initialReservation.id,
                    ...rec,
                });
                if (error) throw error;
            }
            await reloadItems();
        } catch (e) {
            console.error('Save item failed:', e);
        } finally {
            setItemsLoading(false);
            setItemModalOpen(false);
            setItemEditing(null);
        }
    };

    const deleteService = async (id) => {
        if (!initialReservation?.id) { setServices(prev => prev.filter(x => x._id !== id)); return; }
        setItemsLoading(true);
        try {
            const { error } = await supabase.from('reservation_services').delete().eq('id', id);
            if (error) throw error;
            setServices(prev => prev.filter(x => x._id !== id));
        } catch (e) {
            console.error('Delete service failed:', e);
        } finally {
            setItemsLoading(false);
        }
    };

    const deleteFood = async (id) => {
        if (!initialReservation?.id) { setFoods(prev => prev.filter(x => x._id !== id)); return; }
        setItemsLoading(true);
        try {
            const { error } = await supabase.from('reservation_foods').delete().eq('id', id);
            if (error) throw error;
            setFoods(prev => prev.filter(x => x._id !== id));
        } catch (e) {
            console.error('Delete food failed:', e);
        } finally {
            setItemsLoading(false);
        }
    };

    /* ---------- Payments (unchanged) ---------- */
    const openAddPayment = () => { setPaymentEditing(null); setPaymentModalOpen(true); };
    const openEditPayment = (p) => { setPaymentEditing(p); setPaymentModalOpen(true); };

    const savePayment = async () => {
        const rec = {
            type: paymentForm.type,
            method: paymentForm.method,
            date: paymentForm.date,
            amount: Number(paymentForm.amount || 0),
        };

        if (!initialReservation?.id) {
            const local = { _id: paymentForm._id || `pay-${(crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 9))}`, ...rec };
            if (paymentEditing?._id) setPayments(prev => prev.map(p => (p._id === local._id ? local : p)));
            else setPayments(prev => [local, ...prev]);
            setPaymentModalOpen(false); setPaymentEditing(null);
            return;
        }

        setPaymentsLoading(true);
        try {
            if (paymentEditing?._id) {
                const { error } = await supabase.from('payments').update(rec).eq('id', paymentEditing._id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('payments').insert({ reservation_id: initialReservation.id, ...rec });
                if (error) throw error;
            }
            await reloadPayments();
        } catch (e) {
            console.error('Save payment failed:', e);
        } finally {
            setPaymentsLoading(false);
            setPaymentModalOpen(false);
            setPaymentEditing(null);
        }
    };

    const deletePayment = async (id) => {
        if (!initialReservation?.id) { setPayments(prev => prev.filter(x => x._id !== id)); return; }
        setPaymentsLoading(true);
        try {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) throw error;
            setPayments(prev => prev.filter(x => x._id !== id));
        } catch (e) {
            console.error('Delete payment failed:', e);
        } finally {
            setPaymentsLoading(false);
        }
    };

    /* ---------- Print (unchanged UI) ---------- */
    const handlePrint = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        const res = initialReservation || {};
        const n = nights;

        doc.setFontSize(22);
        doc.text('Hotel Lovusiyah ', 14, 16);
        doc.setFontSize(10);
        doc.text(`Date: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 200 - 14, 22, { align: 'right' });

        doc.setFontSize(12);
        doc.text('Guest & Stay', 14, 32);
        doc.setFontSize(10);
        [
            `Guest: ${res.guest?.name || '-'} (${res.guest?.nicNumber || '-'})`,
            `Phone: ${res.guest?.phone || '-'}   Email: ${res.guest?.email || '-'}`,
            `Check-in: ${dayjs(res.checkInDate).format('YYYY-MM-DD')}   Check-out: ${dayjs(res.checkOutDate).format('YYYY-MM-DD')}`,
            `Rooms: ${(res.rooms || []).map(r => (r.roomNumber || r.number || '—')).join(', ') || '-'}`,
            `Nights: ${n}`,
        ].forEach((l, i) => doc.text(l, 14, 38 + i * 6));

        // Rooms
        autoTable(doc, {
            startY: 68,
            head: [['Room', 'Type', 'Rate (LKR)', 'Nights', 'Amount (LKR)']],
            body: (res.rooms || []).map((r) => {
                const rate = Number(r.price || 0);
                return [
                    (r.roomNumber || r.number || '—'),
                    (r.type || '—'),
                    formatLKR(rate),
                    n,
                    formatLKR(n * rate),
                ];
            }),
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
        });

        let y = (doc.lastAutoTable?.finalY ?? 68) + 8;

        // Services
        if (services.length) {
            doc.text('Services', 14, y);
            autoTable(doc, {
                startY: y + 4,
                head: [['Service', 'Qty', 'Rate (LKR)', 'Amount (LKR)']],
                body: (services.length ? services : [{ title: '—', qty: '—', rate: 0, amount: 0 }]).map((s) => [
                    s.title, s.qty, formatLKR(s.rate), formatLKR(s.amount)
                ]),
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [15, 23, 42] },
            });

            y = (doc.lastAutoTable?.finalY ?? y) + 8;
        }
        // Foods
        if (foods.length) {
            doc.text('Foods', 14, y);
            autoTable(doc, {
                startY: y + 4,
                head: [['Food', 'Qty', 'Rate (LKR)', 'Amount (LKR)']],
                body: (foods.length ? foods : [{ title: '—', qty: '—', rate: 0, amount: 0 }]).map((f) => [
                    f.title, f.qty, formatLKR(f.rate), formatLKR(f.amount)
                ]),
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [15, 23, 42] },
            });

            y = (doc.lastAutoTable?.finalY ?? y) + 8;
        }

        // Payments

        if (payments.length) {
            doc.text('Payments', 14, y);
            autoTable(doc, {
                startY: y + 4,
                head: [['Type', 'Method', 'Date', 'Amount (LKR)']],
                body: (payments.length ? payments : [{ type: '—', method: '—', date: dayjs().format('YYYY-MM-DD'), amount: 0 }]).map((p) => [
                    p.type, p.method, dayjs(p.date).format('YYYY-MM-DD'), formatLKR(p.amount)
                ]),
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [15, 23, 42] },
            });

            y = (doc.lastAutoTable?.finalY ?? y) + 10;
        }
        autoTable(doc, {
            startY: y + 6,
            head: [['Description', 'Amount (LKR)']],
            body: [
                ['Room Charges', formatLKR(roomCharges)],
                ['Other Charges', formatLKR(otherCharges)],
                ['Total', formatLKR(total)],
                ['Paid', formatLKR(paid)],
                ['Balance', formatLKR(balance)],
            ],
            theme: 'plain',
            styles: { fontSize: 10 },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' },
            },
        });

        // ⬇️ Instead of saving, open print preview
        const blobUrl = doc.output('bloburl');
        const win = window.open(blobUrl);
        win.onload = () => {
            win.print();
        };
    };

    const handleCancel = async () => {


        setCancelModalOpen(true);
    };


    const confirmCancel = async () => {

        if (!reservation?.id || reservation?.status === 'cancelled') return;
        setCanceling(true);
        try {
            const { data, error: upErr, } = await supabase
                .from('reservations')
                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                .eq('id', reservation.id);
            if (upErr) { throw upErr } else if (data) {
                console.log(data);

            }

            setReservation(prev => prev ? { ...prev, status: 'cancelled' } : prev);
        } catch (e) {
            console.error(e);
        } finally {
            setCanceling(false);
            setCancelModalOpen(false);
        }
    };

    const value = {

        reservation,
        canceling,

        // cancellation
        cancelModalOpen, setCancelModalOpen,
        handleCancel, confirmCancel,

        // catalogs + loaders
        serviceCatalog, foodCatalog, catalogLoading,

        // state
        services, foods, itemsLoading,
        payments, paymentsLoading,
        tab, setTab,
        itemModalOpen, setItemModalOpen,
        itemMode, setItemMode,
        itemEditing, setItemEditing,
        itemForm, setItemForm,
        paymentModalOpen, setPaymentModalOpen,
        paymentEditing, setPaymentEditing,
        paymentForm, setPaymentForm,

        // totals
        nights, roomCharges, otherCharges, total, paid, balance,

        // handlers
        openAddService, openAddFood, openEditService, openEditFood, saveItem, deleteService, deleteFood,
        openAddPayment, openEditPayment, savePayment, deletePayment,
        handlePrint,
    };


    return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}
