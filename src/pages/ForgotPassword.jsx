'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export default function ForgotPassword() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 font-inter px-4">
            <div className="max-w-md w-full p-8 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-slate-800 to-slate-600 rounded-xl flex items-center justify-center">
                        <Icon icon="lucide:lock-reset" className="text-white" width="20" height="20" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800">Forgot Password</h1>
                        <p className="text-xs text-slate-500">Reset access to your account</p>
                    </div>
                </div>

                <form className="space-y-5">
                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Email</label>
                        <div className="flex items-center px-3 py-2.5 border border-slate-300 rounded-xl bg-white">
                            <Icon icon="lucide:mail" width="18" className="text-slate-500 mr-2" />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                        <Icon icon="lucide:arrow-right-circle" width="18" />
                        Send Reset Link
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/login" className="text-sm text-slate-700 hover:underline inline-flex items-center gap-1">
                        <Icon icon="lucide:arrow-left" width="16" />
                        Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
