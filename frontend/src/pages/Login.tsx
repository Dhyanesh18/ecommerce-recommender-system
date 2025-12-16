import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/authApi';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const token = await loginApi(email, password);
            login(token);

            // role-aware redirect
            const decodedRole = JSON.parse(atob(token.split('.')[1])).role;

            if (decodedRole === 'seller') {
                navigate('/seller/dashboard');
            } else {
                navigate('/products');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Invalid email or password. Please try again.';
            setError(errorMessage);
            console.error('Login failed:', err);
            console.error('Error details:', err.response?.data);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#00182f] via-[#014284] to-[#00182f] px-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold pb-3 text-[#C5A358] mt-5" style={{ fontFamily: 'Anton, sans-serif' }}>Aureila</h1>
                    <h1 className="text-5xl font text-white mb-2" style={{ fontFamily: 'Anton, sans-serif' }}>Welcome Back</h1>
                    <p className="text-gray-50">Sign in to continue shopping</p>
                </div>

                {/* Login Form */}
                <div className="bg-gray-100 rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                className="w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="you@example.com"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                className="w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Enter your password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-linear-to-r from-[#003b72] to-[#012b55] text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 mb-6 flex items-center">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-sm text-gray-500">or</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link 
                                to="/signup" 
                                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
