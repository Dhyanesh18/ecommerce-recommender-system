import { signupService, loginService } from '../services/authService.js';

export const signup = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await signupService({ email, password, role });
        res.status(201).json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res)=> {
    try {
        const { email, password } = req.body;
        const token = await loginService({ email, password });
        res.json({ token });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
}