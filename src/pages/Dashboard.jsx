import React from 'react';
import { Icon } from '@iconify/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Rooms from './Rooms';
import ReservationCalendarView from './ReservationCalendarView';
import Guests from './Guests';
import Services from './Services';
import Expenses from './Expenses';
import Reports from './Reports';
import CreateReservation from './CreateReservation';
import Menus from './Menus';

const navItems = [
    // { label: 'Overview', icon: 'lucide:layout-dashboard', href: '/dashboard/overview' },
    { label: 'Reservations', icon: 'lucide:calendar-check', href: '/dashboard/reservations' },
    { label: 'Guests', icon: 'lucide:users', href: '/dashboard/guests' },
    { label: 'Rooms', icon: 'lucide:bed', href: '/dashboard/rooms' },
    { label: 'Menus', icon: 'lucide:utensils', href: '/dashboard/menus' },
    { label: 'Services', icon: 'lucide:sparkles', href: '/dashboard/housekeeping' },
    { label: 'Expenses', icon: 'lucide:settings', href: '/dashboard/expenses' },
    { label: 'Reports', icon: 'lucide:trending-up', href: '/dashboard/analytics' },
];

export default function HotelDashboard() {
    const location = useLocation();

    return (
        <div className="min-h-screen flex font-inter bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
            {/* Sidebar */}
            <aside className="w-72 h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col">
                <div className="p-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-slate-800 to-slate-600 rounded-xl flex items-center justify-center">
                            <Icon icon="lucide:building" className="text-white" width="20" height="20" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-800">Hotel Lovusiyah</h1>
                            <p className="text-xs text-slate-500">Management Suite</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === item.href
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-800'
                                }`}
                        >
                            <Icon icon={item.icon} width="18" height="18" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-200/60">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                        <p className="text-xs text-emerald-100 mb-3">Infonits Product</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Good morning, Alex</h2>
                            <p className="text-slate-600 mt-1">Here's what's happening at your hotel today</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* <button className="relative p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 transition-colors">
                                <Icon icon="lucide:bell" width="20" height="20" className="text-slate-600" />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
                            </button> */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">AC</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Inner Routes */}
                <div className="flex-1 overflow-y-auto p-6">
                    <Routes>
                        {/* <Route path="overview" element={<Home />} /> */}
                        <Route path="rooms" element={<Rooms />} />
                        <Route path="menus" element={<Menus />} />
                        <Route path="reservations" element={<ReservationCalendarView />} />
                        <Route path="guests" element={<Guests />} />
                        <Route path="housekeeping" element={<Services />} />
                        <Route path="analytics" element={<Reports />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="create-reservation" element={<CreateReservation />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
