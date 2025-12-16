import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface SignupPayload {
    email: string;
    password: string;
    role: 'buyer' | 'seller';
}

export const signup = async (data: SignupPayload) => {
    const res = await axios.post(`${API_URL}/auth/signup`, data);
    return res.data;
};

export const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data.token as string;
}