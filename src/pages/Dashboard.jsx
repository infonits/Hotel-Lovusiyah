import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// Page imports
import Home from './Home';
import Rooms from './Rooms';
import ReservationCalendarView from './ReservationCalendarView';
import Guests from './Guests';
import Services from './Services';
import Expenses from './Expenses';
import Reports from './Reports';
import CreateReservation from './CreateReservation';
import Menus from './Menus';
import ReservationView from './ReservationView';

const navItems = [
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
    const [time, setTime] = useState(new Date());
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { logout } = useAuth();
    const dropdownRef = useRef(null);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Greeting by time
    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        setDropdownOpen(false);
    };

    // Handle logout
    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen flex font-inter bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
            {/* Sidebar */}
            <aside className="w-65 h-screen sticky top-0 bg-gray-900 backdrop-blur-xl border-r border-slate-200/60 flex flex-col">
                <div className="p-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                            <Icon icon="lucide:building" className="text-black" width="20" height="20" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Hotel Lovusiyah</h1>
                            <p className="text-base text-gray-300">
                                {time.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 mt-3 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === item.href
                                ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-slate-900/25'
                                : ' text-white hover:bg-slate-100/70 hover:text-slate-800'
                                }`}
                        >
                            <Icon icon={item.icon} width="18" height="18" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className='flex-1 px-6 py-2 space-y-2'>
                    <hr className='border-gray-500' />

                    <span onClick={toggleFullscreen} className='cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-white hover:bg-slate-100/70 hover:text-slate-800'>
                        <Icon icon="mingcute:fullscreen-line" width="18" height="18" />

                        FullScreen</span>
                </div>
                {/* Dropdown Trigger */}
                <div className='px-6 my-2'>
                    <div
                        className="rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 flex items-center px-3 cursor-pointer"
                        onClick={() => logout()}
                    >

                        <Icon icon="material-symbols:logout-rounded" width="18" height="18" className='text-white' />

                        <p className="text-white text-left font-medium  text-sm py-3 px-3">Logout</p>
                    </div>

                </div>
                <div className="px-6 border-t border-slate-500/60 py-2">
                    <div className="bg-gradient-to-r from-blue-900 to-blue-950 rounded-xl p-3 text-white">
                        <p className="text-xs text-emerald-100">Dev by Infonits © 2025</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}


                {/* Inner Routes */}
                <div className="flex-1 overflow-y-auto  relative z-0">
                    <Routes>
                        <Route path="rooms" element={<Rooms />} />
                        <Route path="menus" element={<Menus />} />
                        <Route path="reservations" element={<ReservationCalendarView />} />
                        <Route path="guests" element={<Guests />} />
                        <Route path="housekeeping" element={<Services />} />
                        <Route path="analytics" element={<Reports />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="reservations/:id" element={<ReservationView />} />
                        <Route path="create-reservation" element={<CreateReservation />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
