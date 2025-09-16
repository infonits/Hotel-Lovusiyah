import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabse';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [booted, setBooted] = useState(false);

    // Boot: restore Supabase session and sync to localStorage (to keep your app’s expectation)
    useEffect(() => {
        let mounted = true;

        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;

            const sUser = session?.user ?? null;
            setUser(sUser);
            if (sUser) {
                localStorage.setItem('user', JSON.stringify({ email: sUser.email, id: sUser.id }));
            } else {
                localStorage.removeItem('user');
            }
            setBooted(true);
        })();

        // Listen to auth changes
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            const sUser = session?.user ?? null;
            setUser(sUser);
            if (sUser) {
                localStorage.setItem('user', JSON.stringify({ email: sUser.email, id: sUser.id }));
            } else {
                localStorage.removeItem('user');
            }
        });

        return () => {
            mounted = false;
            sub.subscription?.unsubscribe?.();
        };
    }, []);

    // Email/password login via Supabase
    const login = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const sUser = data.user ?? null;
        setUser(sUser);
        if (sUser) {
            localStorage.setItem('user', JSON.stringify({ email: sUser.email, id: sUser.id }));
        }
        return sUser;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, booted }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
