import { create } from 'zustand';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
    id: number;
    email: string;
    role: UserRole;
}

interface AuthState {
    token: string | null;
    role: UserRole | null;
    userId: number | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
}

interface JwtPayload {
    id: number;
    email: string;
    role: UserRole;
    exp: number;
}

export const useAuthStore = create<AuthState>((set) => {
    const token = localStorage.getItem('token');
    let initialUser: User | null = null;
    let initialRole: UserRole | null = null;
    let initialUserId: number | null = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
            initialUser = { id: payload.id, email: payload.email, role: payload.role };
            initialRole = payload.role;
            initialUserId = payload.id;
        } catch (e) {
            localStorage.removeItem('token');
        }
    }

    return {
        token,
        role: initialRole,
        userId: initialUserId,
        user: initialUser,

        login: (token: string) => {
            localStorage.setItem('token', token);

            // decode JWT
            const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
            const user = { id: payload.id, email: payload.email, role: payload.role };

            set({
                token,
                role: payload.role,
                userId: payload.id,
                user,
            });
        },

        logout: () => {
            localStorage.removeItem('token');
            set({ token: null, role: null, userId: null, user: null });
        },
    };
});
