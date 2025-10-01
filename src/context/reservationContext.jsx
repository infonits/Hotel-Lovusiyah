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
    const [discounts, setDiscounts] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [discountsLoading, setDiscountsLoading] = useState(true)
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
    // discount modal 
    const [discountModalOpen, setDiscountModalOpen] = useState(false);
    const [discountEditing, setDiscountEditing] = useState(null);
    const [discountForm, setDiscountForm] = useState({ name: '', amount: 0 });

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
                setServiceCatalog((svc || []).map(s => ({ id: s.id, title: s.name, rate: Number(s.price || 0) })));
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

    const reloadDiscounts = useCallback(async () => {
        if (!initialReservation?.id) { setDiscounts([]); setDiscountsLoading(false); return; }
        setDiscountsLoading(true);
        try {
            const { data, error } = await supabase
                .from('discounts')
                .select('id, name, amount, created_at')
                .eq('reservation_id', initialReservation.id)
                .order('created_at', { ascending: false });
            if (error) throw error;

            setDiscounts((data || []).map(d => ({
                id: d.id,
                name: d.name,
                date: d.created_at,
                amount: Number(d.amount || 0),
            })));
        } catch (e) {
            console.error('Discounts load failed:', e);
            setDiscounts([]);
        } finally {
            setDiscountsLoading(false);
        }
    }, [initialReservation?.id]);

    useEffect(() => { reloadPayments(); }, [reloadPayments]);
    useEffect(() => { reloadDiscounts(); }, [reloadDiscounts]);

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
                    type: paymentEditing.type === 'advance' ? 'Advance' : paymentEditing.type,
                    method: paymentEditing.method === 'cash' ? 'Cash' : paymentEditing.method,
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

    useEffect(() => {
        if (!discountModalOpen) return;
        if (discountEditing) {
            setDiscountForm({
                id: discountEditing.id,
                name: discountEditing.name || '',
                amount: Number(discountEditing.amount || 0),
            });
        } else {
            setDiscountForm({ name: '', amount: 0 });
        }
    }, [discountModalOpen, discountEditing]);


    /* ---------- Totals ---------- */
    const effectiveRes = reservation || initialReservation || {};

    const nights = useMemo(
        () => dayjs(effectiveRes.checkOutDate).diff(dayjs(effectiveRes.checkInDate), 'day'),
        [effectiveRes.checkInDate, effectiveRes.checkOutDate]
    );

    const roomCharges = useMemo(
        () => (effectiveRes.rooms || []).reduce((sum, r) => {
            const rate = Number(r.nightlyRate || r.price || 0);
            return sum + (rate * nights);
        }, 0),
        [effectiveRes.rooms, nights]
    );




    const otherCharges = useMemo(
        () => [...services, ...foods].reduce((sum, x) => sum + Number(x.amount || 0), 0),
        [services, foods]

    );

    const discountTotal = useMemo(
        () => discounts.reduce((sum, d) => sum + Number(d.amount || 0), 0),
        [discounts]
    );

    const total = useMemo(
        () => Math.max(0, roomCharges + otherCharges - discountTotal),
        [roomCharges, otherCharges, discountTotal]
    );

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
                _id: discountForm?._id || `disc-${(crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 9))}`,
                name: form.name,
                amount: Number(form.amount || 0),
                date: new Date().toISOString(),
            };
            if (discountEditing?._id) {
                setDiscounts(prev => prev.map(d => (d._id === local._id ? local : d)));
            } else {
                setDiscounts(prev => [local, ...prev]);
            }
            setDiscountModalOpen(false);
            setDiscountEditing(null);
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

    const openAddDiscount = () => {
        setDiscountEditing(null);
        setDiscountModalOpen(true);
    };

    const openEditDiscount = (d) => {
        setDiscountEditing(d);
        setDiscountModalOpen(true);
    };

    const savePayment = async (form) => {
        const rec = {
            type: form.type,
            method: form.method,
            date: form.date,
            amount: Number(form.amount || 0),
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
    const saveDiscount = async (form) => {
        const rec = {
            name: form.name,
            amount: Number(form.amount || 0),
        };

        if (!initialReservation?.id) {


            if (discountEditing?.id) {
                setDiscounts(prev => prev.map(d => (d._id === local._id ? local : d)));
            } else {
                setDiscounts(prev => [local, ...prev]);
            }

            setDiscountModalOpen(false);
            setDiscountEditing(null);
            return;
        }

        setDiscountsLoading(true);
        try {
            if (discountEditing?._id) {
                const { error } = await supabase
                    .from('discounts')
                    .update(rec)
                    .eq('id', discountEditing._id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('discounts')
                    .insert({ reservation_id: initialReservation.id, ...rec });
                if (error) throw error;
            }
            await reloadDiscounts();
        } catch (e) {
            console.error('Save discount failed:', e);
        } finally {
            setDiscountsLoading(false);
            setDiscountModalOpen(false);
            setDiscountEditing(null);
        }
    };

    // inside ReservationProvider

    const checkoutReservation = async () => {
        if (!reservation?.id) return;
        try {
            const { error } = await supabase
                .from("reservations")
                .update({ status: "checked_out" })
                .eq("id", reservation.id);

            if (error) throw error;

            setReservation(prev => prev ? { ...prev, status: "checked_out" } : prev);
        } catch (e) {
            console.error("Checkout failed:", e);
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

    const deleteDiscount = async (id) => {
        if (!initialReservation?.id) {
            setDiscounts(prev => prev.filter(x => x._id !== id));
            return;
        }
        setDiscountsLoading(true);
        try {
            const { error } = await supabase
                .from('discounts')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setDiscounts(prev => prev.filter(x => x._id !== id));
        } catch (e) {
            console.error('Delete discount failed:', e);
        } finally {
            setDiscountsLoading(false);
        }
    };

    /* ---------- Print (unchanged UI) ---------- */
    const handlePrint = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        const res = initialReservation || {};
        const n = nights;
        const img = new Image();
        img.src = "/logo.png"; // public/logo.png
        img.onload = () => {
            // Logo + Hotel title
            doc.addImage(img, "PNG", 14, 10, 20, 20);

            // Hotel Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("Hotel Lovusiyah", 34, 18);

            // Address & Phone (smaller, below name)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("Power House Rd, Jaffna", 34, 24);
            doc.text("Phone: 0212 221 326", 34, 29);

            // Date (right side, aligned with header block)
            doc.setFontSize(10);
            doc.text(`Date: ${dayjs().format('YY/MM/DD HH:mm')}`, 200 - 14, 18, { align: 'right' });
            let currentY = 35;

            const pageWidth = doc.internal.pageSize.getWidth();
            doc.setDrawColor(150);   // grey color (0=black, 255=white)
            doc.setLineWidth(0.3);   // thin line
            doc.line(14, currentY, pageWidth - 14, currentY); // x1, y1, x2, y2
            // Section spacing
            currentY += 10; // add space below line

            // Guest & Stay
            doc.setFont("helvetica", "bold");

            doc.setFontSize(12);
            doc.text('Guest & Stay', 14, currentY);
            doc.setFont("helvetica", "normal");

            doc.setFontSize(10);

            [
                `Guest: ${res.guest?.name || 'N/A'} (${res.guest?.nicNumber || 'N/A'})`,
                `Phone: ${res.guest?.phone || 'N/A'} | Email: ${res.guest?.email || 'N/A'}`,
                `Arrival: ${dayjs(res.checkInDate).format('YY/MM/DD')}   `,
                `Depature: ${dayjs(res.checkOutDate).format('YY/MM/DD')}`,
                `Rooms: ${(res.rooms || []).map(r => (r.roomNumber || r.number || '—')).join(', ') || '-'}`,
                `Nights: ${n}`,
            ].forEach((l, i) => doc.text(l, 14, currentY + 6 + i * 6));

            currentY += 42;

            // Rooms
            autoTable(doc, {
                startY: currentY,
                head: [['Room', 'Type', 'Rate (LKR)', 'Nights', 'Amount (LKR)']],
                body: (res.rooms || []).map((r) => {
                    const rate = Number(r.nightlyRate || r.price || 0);
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
                        s.title, s.qty, Number(s.rate || 0).toFixed(2), Number(s.amount || 0).toFixed(2)
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
                        f.title, f.qty, Number(f.rate || 0).toFixed(2), Number(f.amount || 0).toFixed(2)
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
                        p.type, p.method, dayjs(p.date).format('YYYY-MM-DD'), Number(p.amount || 0).toFixed(2)
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [15, 23, 42] },
                });

                y = (doc.lastAutoTable?.finalY ?? y) + 10;
            }

            // Discounts
            if (discounts.length) {
                doc.text('Discounts', 14, y);
                autoTable(doc, {
                    startY: y + 4,
                    head: [['Name', 'Amount (LKR)']],
                    body: discounts.map(d => [
                        d.name || '—',
                        Number(d.amount || 0).toFixed(2),
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [15, 23, 42] },
                });

                y = (doc.lastAutoTable?.finalY ?? y) + 10;
            }
            const subtotal = roomCharges + otherCharges;

            const totalsBody = [
                ['Room Charges', formatLKR(roomCharges)],
                ['Other Charges', formatLKR(otherCharges)],
                ['Discounts', `- ${formatLKR(discountTotal)}`],
                [
                    { content: 'Total After Discount', styles: { fontStyle: 'bold', halign: 'left' } },
                    { content: formatLKR(total), styles: { fontStyle: 'bold', halign: 'right' } }
                ],
                ['Paid', formatLKR(paid)],
            ];

            if (balance && balance > 0) {
                totalsBody.push(['Balance', formatLKR(balance)]);
            }

            autoTable(doc, {
                startY: y,
                head: [[
                    { content: 'Description', styles: { halign: 'left' } },
                    { content: 'Amount (LKR)', styles: { halign: 'right' } }
                ]],
                body: totalsBody,
                theme: 'plain',
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'right' }
                },
            });

            y = (doc.lastAutoTable?.finalY ?? y) + 8;

            // Footer (Signatures + Notes)
            const pageHeight = doc.internal.pageSize.height;

            // --- Signatures ---
            const marginX = 14;
            const centerY = pageHeight - 40; // position above footer

            // Manager (left side)
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text("....................", marginX, centerY);
            doc.text("Receptionist ", marginX, centerY + 6);

            // User/Guest (right side)
            doc.text("....................", pageWidth - marginX - 30, centerY);
            doc.text("Guest", pageWidth - marginX - 25, centerY + 6);

            // --- Bank Details ---
            y += 10; // spacing after totals
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Bank Details", 14, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            [
                `Bank: Commercial Bank`,
                `Account Name: HOTEL LOVUSIYAH PVT LTD`,
                `Account No: 1000585733`,
                `Branch: Jaffna`
            ].forEach((line, i) => doc.text(line, 14, y + 6 + i * 6));

            y += 36; // leave space after bank details



            // --- Footer (centered below) ---
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Digital invoice from Hotel Lovusiyah", pageWidth / 2, pageHeight - 20, { align: 'center' });
            doc.text("Smart hotel management solution by Infonits.", pageWidth / 2, pageHeight - 14, { align: 'center' });

            // Print preview
            const blobUrl = doc.output('bloburl');
            const win = window.open(blobUrl);
            win.onload = () => win.print();
        };

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
        discounts, discountsLoading,
        tab, setTab,
        itemModalOpen, setItemModalOpen,
        itemMode, setItemMode,
        itemEditing, setItemEditing,
        itemForm, setItemForm,
        paymentModalOpen, setPaymentModalOpen,
        paymentEditing, setPaymentEditing,
        paymentForm, setPaymentForm,
        discountModalOpen, setDiscountModalOpen,
        discountEditing, setDiscountEditing,
        openEditDiscount, openAddDiscount,
        discountForm, setDiscountForm,


        // totals
        nights, roomCharges, otherCharges, total, paid, balance,
        checkoutReservation,
        // handlers
        openAddService, openAddFood, openEditService, openEditFood, saveItem, deleteService, deleteFood,
        openAddPayment, openEditPayment, savePayment, deletePayment, deleteDiscount,
        handlePrint, saveDiscount
    };


    return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}
