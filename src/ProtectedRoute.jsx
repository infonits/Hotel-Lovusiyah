// src/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authContext';

export default function ProtectedRoute({ children }) {
    const { user, booted } = useAuth();
    const location = useLocation();

    // 👇 Wait until we know whether a session exists
    if (!booted) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div className="text-slate-500 text-sm">Loading…</div>
            </div>
        );
    }

    // After boot: if no user, send to login and remember where we came from
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
