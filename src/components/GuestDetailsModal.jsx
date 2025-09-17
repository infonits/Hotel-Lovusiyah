
import { Icon } from '@iconify/react';

// ===== Simple details modal (separate component) =====
export default function GuestDetailsModal({ guest, onClose }) {
    if (!guest) return null;

    // Dummy stats (NOT from DB for now, as requested)
    const dummy = {
        totalBookings: 4,
        lastBookingDate: '2025-08-20',
        totalNights: 12,
        lifetimeSpendLKR: 120000,
        cancellations: 1,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl border border-white/20 shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Guest Details</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                        <Icon icon="lucide:x" width="18" height="18" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Top: name + contact */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-slate-500">Full Name</p>
                            <p className="font-medium text-slate-800">{guest.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Nationality</p>
                            <p className="font-medium text-slate-800">{guest.nationality || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Email</p>
                            <p className="font-medium text-slate-800">{guest.email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Phone</p>
                            <p className="font-medium text-slate-800">{guest.phone || '-'}</p>
                        </div>
                    </div>

                    {/* IDs */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-slate-500">NIC</p>
                            <p className="font-medium text-slate-800">{guest.nic || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Passport</p>
                            <p className="font-medium text-slate-800">{guest.passport || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Date of Birth</p>
                            <p className="font-medium text-slate-800">{guest.dob || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Created</p>
                            <p className="font-medium text-slate-800">{guest.createdAt || '-'}</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-slate-500">Address</p>
                            <p className="font-medium text-slate-800">{guest.address || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">City</p>
                            <p className="font-medium text-slate-800">{guest.city || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Country</p>
                            <p className="font-medium text-slate-800">{guest.country || '-'}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <p className="text-sm text-slate-500">Notes</p>
                        <p className="font-medium text-slate-800">{guest.notes || '-'}</p>
                    </div>

                    {/* Dummy stats */}
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <p className="text-xs text-slate-500">Total Bookings</p>
                            <p className="text-xl font-semibold text-slate-800">{dummy.totalBookings}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <p className="text-xs text-slate-500">Last Booking</p>
                            <p className="text-sm font-medium text-slate-800">{dummy.lastBookingDate}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <p className="text-xs text-slate-500">Total Nights</p>
                            <p className="text-xl font-semibold text-slate-800">{dummy.totalNights}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <p className="text-xs text-slate-500">Lifetime Spend</p>
                            <p className="text-sm font-semibold text-slate-800">LKR {dummy.lifetimeSpendLKR.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}