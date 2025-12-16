import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/authApi';

export default function Signup() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate password match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await signup({ email, password, role });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Signup failed. Please try again.';
            setError(errorMessage);
            console.error('Signup failed:', err);
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
                    <h1 className="text-5xl font text-white mb-2" style={{ fontFamily: 'Anton, sans-serif' }}>Create Account</h1>
                    <p className="text-gray-50">Join us and start shopping today</p>
                </div>

                {/* Signup Form */}
                <div className="bg-gray-100 rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600 text-center">
                                Account created successfully! Redirecting to login...
                            </p>
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
                                disabled={isLoading || success}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                className="w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="At least 6 characters"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                disabled={isLoading || success}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                className="w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Re-enter your password"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading || success}
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                I want to
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('buyer')}
                                    disabled={isLoading || success}
                                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                                        role === 'buyer'
                                            ? 'border-[#003b72] bg-[#003b72] text-white'
                                            : 'border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
                                    }`}
                                >
                                    Buy Products
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('seller')}
                                    disabled={isLoading || success}
                                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                                        role === 'seller'
                                            ? 'border-[#003b72] bg-[#003b72] text-white'
                                            : 'border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
                                    }`}
                                >
                                    Sell Products
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="w-full bg-linear-to-r from-[#003b72] to-[#012b55] text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : success ? (
                                '✓ Account Created!'
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 mb-6 flex items-center">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-sm text-gray-500">or</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link 
                                to="/login" 
                                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
