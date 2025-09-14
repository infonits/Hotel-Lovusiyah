import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react'

export default function Home() {
    const quickStats = [
        {
            label: 'Occupancy Rate',
            value: '87%',
            change: '+12%',
            trend: 'up',
            icon: 'lucide:bed',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Total Revenue',
            value: '$28,450',
            change: '+8.2%',
            trend: 'up',
            icon: 'lucide:dollar-sign',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Available Rooms',
            value: '23',
            change: '-5',
            trend: 'down',
            icon: 'lucide:key',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50'
        },
        {
            label: 'Guest Satisfaction',
            value: '4.8/5',
            change: '+0.3',
            trend: 'up',
            icon: 'lucide:star',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
    ];

    const recentActivities = [
        { type: 'check-in', guest: 'Sarah Johnson', room: '205', time: '2 min ago' },
        { type: 'maintenance', room: '312', issue: 'AC repair completed', time: '15 min ago' },
        { type: 'check-out', guest: 'Michael Chen', room: '108', time: '1 hour ago' },
        { type: 'booking', guest: 'Emma Wilson', room: '404', time: '2 hours ago' },
    ];

    return (
        <>
            {/* Dashboard Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {quickStats.map((stat, index) => (
                        <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-lg transition-all duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon icon={stat.icon} width="20" height="20" className={stat.color} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                                    }`}>
                                    <Icon icon={stat.trend === 'up' ? 'lucide:trending-up' : 'lucide:trending-down'} width="12" height="12" />
                                    {stat.change}
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
                                <p className="text-sm text-slate-600">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                            <button className="text-sm text-slate-600 hover:text-slate-800 font-medium">View All</button>
                        </div>
                        <div className="space-y-4">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.type === 'check-in' ? 'bg-emerald-100 text-emerald-600' :
                                        activity.type === 'check-out' ? 'bg-blue-100 text-blue-600' :
                                            activity.type === 'maintenance' ? 'bg-amber-100 text-amber-600' :
                                                'bg-purple-100 text-purple-600'
                                        }`}>
                                        <Icon icon={
                                            activity.type === 'check-in' ? 'lucide:log-in' :
                                                activity.type === 'check-out' ? 'lucide:log-out' :
                                                    activity.type === 'maintenance' ? 'lucide:wrench' :
                                                        'lucide:calendar-plus'
                                        } width="16" height="16" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800">
                                            {activity.guest && `${activity.guest} - `}
                                            {activity.type === 'check-in' ? 'Checked in' :
                                                activity.type === 'check-out' ? 'Checked out' :
                                                    activity.type === 'maintenance' ? activity.issue :
                                                        'New booking'}
                                            {activity.room && ` • Room ${activity.room}`}
                                        </p>
                                        <p className="text-xs text-slate-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all">
                                    <Icon icon="lucide:plus" width="16" height="16" className="text-emerald-600" />
                                    <span className="text-sm font-medium text-slate-700">New Reservation</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all">
                                    <Icon icon="lucide:user-plus" width="16" height="16" className="text-blue-600" />
                                    <span className="text-sm font-medium text-slate-700">Add Guest</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50/50 hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all">
                                    <Icon icon="lucide:wrench" width="16" height="16" className="text-purple-600" />
                                    <span className="text-sm font-medium text-slate-700">Report Issue</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Icon icon="lucide:calendar" width="20" height="20" />
                                <span className="font-semibold">Today's Summary</span>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-300">Check-ins</span>
                                    <span className="font-medium">12</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-300">Check-outs</span>
                                    <span className="font-medium">8</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-300">Maintenance</span>
                                    <span className="font-medium">3</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
