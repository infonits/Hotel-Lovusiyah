
import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReservationContext = createContext(null);
export const useReservation = () => useContext(ReservationContext);

const currencyLKR = (n) => `LKR ${Number(n || 0).toFixed(2)}`;

const SERVICE_CATALOG = [
    { title: 'Laundry', rate: 500 },
    { title: 'Room Cleaning', rate: 300 },
    { title: 'Airport Pickup', rate: 4500 },
    { title: 'Extra Bed', rate: 1500 },
];

const FOOD_CATALOG = [
    { title: 'Fried Rice', rate: 1200 },
    { title: 'Koththu', rate: 1100 },
    { title: 'Chicken Curry', rate: 900 },
    { title: 'String Hoppers Set', rate: 800 },
];

export function ReservationProvider({ initialReservation, children }) {
    // Items
    const [services, setServices] = useState([]);
    const [foods, setFoods] = useState([]);
    const [payments, setPayments] = useState([]);

    // Tabs
    const [tab, setTab] = useState('services'); // 'services' | 'foods' | 'payments'

    // Item modal (Service/Food)
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

    // compute amount whenever qty/rate change
    useEffect(() => {
        setItemForm((f) => ({ ...f, amount: Number(f.qty || 0) * Number(f.rate || 0) }));
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

    // Totals
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

    // Item handlers
    const openAddService = () => {
        setItemMode('service');
        setItemEditing(null);
        setItemModalOpen(true);
    };
    const openAddFood = () => {
        setItemMode('food');
        setItemEditing(null);
        setItemModalOpen(true);
    };
    const openEditService = (it) => {
        setItemMode('service');
        setItemEditing(it);
        setItemModalOpen(true);
    };
    const openEditFood = (it) => {
        setItemMode('food');
        setItemEditing(it);
        setItemModalOpen(true);
    };
    const saveItem = () => {
        const item = {
            _id:
                itemForm._id ||
                `${itemMode}-${(crypto.randomUUID?.() || Math.random().toString(36).slice(2, 9))}`,
            title: itemForm.title,
            qty: Number(itemForm.qty || 0),
            rate: Number(itemForm.rate || 0),
            amount: Number(itemForm.amount || 0),
        };
        if (itemEditing?._id) {
            if (itemMode === 'service') setServices((prev) => prev.map((x) => (x._id === item._id ? item : x)));
            else setFoods((prev) => prev.map((x) => (x._id === item._id ? item : x)));
        } else {
            if (itemMode === 'service') setServices((prev) => [item, ...prev]);
            else setFoods((prev) => [item, ...prev]);
        }
        setItemModalOpen(false);
        setItemEditing(null);
    };
    const deleteService = (id) => setServices((prev) => prev.filter((x) => x._id !== id));
    const deleteFood = (id) => setFoods((prev) => prev.filter((x) => x._id !== id));

    // Payment handlers
    const openAddPayment = () => {
        setPaymentEditing(null);
        setPaymentModalOpen(true);
    };
    const openEditPayment = (p) => {
        setPaymentEditing(p);
        setPaymentModalOpen(true);
    };
    const savePayment = () => {
        const rec = {
            _id: paymentForm._id || `pay-${(crypto.randomUUID?.() || Math.random().toString(36).slice(2, 9))}`,
            type: paymentForm.type,
            method: paymentForm.method,
            date: paymentForm.date,
            amount: Number(paymentForm.amount || 0),
        };
        if (paymentEditing?._id) {
            setPayments((prev) => prev.map((p) => (p._id === rec._id ? rec : p)));
        } else {
            setPayments((prev) => [rec, ...prev]);
        }
        setPaymentModalOpen(false);
        setPaymentEditing(null);
    };
    const deletePayment = (id) => setPayments((prev) => prev.filter((x) => x._id !== id));

    // Print PDF (same as your page)
    const handlePrint = () => {
        const doc = new jsPDF();
        const res = initialReservation;

        // Header
        doc.setFontSize(16);
        doc.text('Hotel Bill / Invoice', 14, 16);
        doc.setFontSize(10);
        doc.text(`Reservation: ${res.code || '-'}`, 14, 22);
        doc.text(`Date: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 150, 22, { align: 'right' });

        // Guest & Stay
        doc.setFontSize(12);
        doc.text('Guest & Stay', 14, 32);
        doc.setFontSize(10);
        const lines = [
            `Guest: ${res.guest?.name || '-'} (${res.guest?.nicNumber || '-'})`,
            `Phone: ${res.guest?.phone || '-'}   Email: ${res.guest?.email || '-'}`,
            `Check-in: ${dayjs(res.checkInDate).format('YYYY-MM-DD')}   Check-out: ${dayjs(res.checkOutDate).format('YYYY-MM-DD')}`,
            `Rooms: ${(res.rooms || []).map((r) => r.roomNumber).join(', ') || '-'}`,
            `Nights: ${nights}`,
        ];
        lines.forEach((l, i) => doc.text(l, 14, 38 + i * 6));

        // Rooms
        doc.autoTable({
            startY: 68,
            head: [['Room', 'Type', 'Rate (LKR)', 'Nights', 'Amount (LKR)']],
            body: (res.rooms || []).map((r) => [
                r.roomNumber,
                r.type,
                (r.price || 0).toFixed(2),
                nights,
                (nights * (r.price || 0)).toFixed(2),
            ]),
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
        });

        let y = doc.lastAutoTable.finalY + 8;

        // Services
        doc.text('Services', 14, y);
        doc.autoTable({
            startY: y + 4,
            head: [['Service', 'Qty', 'Rate (LKR)', 'Amount (LKR)']],
            body: (services.length ? services : [['—', '—', '—', '0.00']]).map((s) =>
                Array.isArray(s) ? s : [s.title, s.qty, (s.rate || 0).toFixed(2), (s.amount || 0).toFixed(2)]
            ),
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
        });

        y = doc.lastAutoTable.finalY + 8;

        // Foods
        doc.text('Foods', 14, y);
        doc.autoTable({
            startY: y + 4,
            head: [['Food', 'Qty', 'Rate (LKR)', 'Amount (LKR)']],
            body: (foods.length ? foods : [['—', '—', '—', '0.00']]).map((f) =>
                Array.isArray(f) ? f : [f.title, f.qty, (f.rate || 0).toFixed(2), (f.amount || 0).toFixed(2)]
            ),
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
        });

        y = doc.lastAutoTable.finalY + 8;

        // Payments
        doc.text('Payments', 14, y);
        doc.autoTable({
            startY: y + 4,
            head: [['Type', 'Method', 'Date', 'Amount (LKR)']],
            body: (payments.length ? payments : [['—', '—', '—', '0.00']]).map((p) =>
                Array.isArray(p) ? p : [p.type, p.method, dayjs(p.date).format('YYYY-MM-DD'), (p.amount || 0).toFixed(2)]
            ),
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
        });

        y = doc.lastAutoTable.finalY + 10;

        // Totals
        doc.setFontSize(12);
        doc.text('Totals', 14, y);
        doc.setFontSize(10);
        const totalsTable = [
            ['Room Charges', (roomCharges || 0).toFixed(2)],
            ['Other Charges', (otherCharges || 0).toFixed(2)],
            ['Total', (total || 0).toFixed(2)],
            ['Paid', (paid || 0).toFixed(2)],
            ['Balance', (balance || 0).toFixed(2)],
        ];
        doc.autoTable({
            startY: y + 6,
            head: [['Label', 'Amount (LKR)']],
            body: totalsTable,
            theme: 'plain',
            styles: { fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } },
        });

        doc.save(`${initialReservation.code || 'reservation'}.pdf`);
    };

    const value = {
        currencyLKR,
        initialReservation,
        // state
        services, foods, payments,
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
