import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // ✅ from AuthContext

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (email && password) {
                await login({ email, password }); // Supabase email login
                navigate('/'); // go to Dashboard (protected)
            }
        } catch (err) {
            // Keep UI unchanged: use alert for error (no extra UI elements added)
            alert(err?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 font-inter px-4">
            <div className="max-w-md w-full p-8 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-slate-800 to-slate-600 rounded-xl flex items-center justify-center">
                        <Icon icon="lucide:building" className="text-white" width="20" height="20" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800">Hotel Lovusiyah</h1>
                        <p className="text-xs text-slate-500">Login to your dashboard</p>
                    </div>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Email</label>
                        <div className="flex items-center px-3 py-2.5 border border-slate-300 rounded-xl bg-white">
                            <Icon icon="lucide:mail" width="18" className="text-slate-500 mr-2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Password</label>
                        <div className="flex items-center px-3 py-2.5 border border-slate-300 rounded-xl bg-white">
                            <Icon icon="lucide:lock" width="18" className="text-slate-500 mr-2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="ml-2 text-slate-500 hover:text-slate-700"
                            >
                                <Icon icon={showPassword ? 'lucide:eye-off' : 'lucide:eye'} width="18" />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600">

                        <a href="/forgot-password" className="hover:underline">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                        <Icon icon="lucide:log-in" width="18" />
                        Login
                    </button>
                </form>


            </div>
        </div>
    );
}
