import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const { itemCount } = useCartStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Sync search query with URL params
    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchQuery(query);
    }, [searchParams]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setShowUserMenu(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/products');
        }
    };

    const isSeller = user?.role === 'seller';

    return (
        <nav className="bg-gray-950 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-1">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/products" className="flex items-center space-x-2 group">
                        
                        <span className="text-3xl font-bold pl-5 bg-[#C5A358] bg-clip-text text-transparent" style={{ fontFamily: 'Anton, sans-serif' }}>
                            Aurelia
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link 
                            to="/products" 
                            className="text-[#C5A358] hover:text-white text-xl transition-colors"
                        >
                            Products
                        </Link>
                        
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative">
                            <input 
                                type="search" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="What are you looking for?"
                                className="bg-white rounded-lg py-1.5 pr-10 pl-4 w-64 focus:outline-none focus:ring-2 focus:ring-[#C5A358] text-gray-900"
                            />
                            <button 
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C5A358] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                        {user && !isSeller && (
                            <Link 
                                to="/cart" 
                                className="relative text-[#C5A358] hover:text-white text-xl transition-colors flex items-center"
                            >
                                <svg 
                                    className="w-6 h-6 mr-1" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                                    />
                                </svg>

                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isSeller && (
                            <Link 
                                to="/seller/dashboard" 
                                className="text-[#C5A358] hover:text-white text-xl font-medium transition-colors"
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>

                    {/* User Menu / Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 bg-gray-950 hover:bg-gray-900 rounded-lg px-4 py-2 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-[#C5A358] rounded-full flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">
                                            {user?.email?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    
                                    <svg 
                                        className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-3 w-56 bg-[#012446] rounded-lg shadow-xl py-2 border-2 border-[#C5A358]">
                                        <div className="px-4 py-2 border-b border-[#C5A358]">
                                            <p className="text-xs text-gray-300">Signed in as</p>
                                            <p className="text-sm font-medium text-white">{user?.email}</p>
                                            <p className="text-xs text-green-500 mt-1 capitalize">{user?.role || 'User'}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-md text-red-600 hover:text-red-300"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all font-medium"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-gray-700 hover:text-blue-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="px-4">
                            <div className="relative">
                                <input 
                                    type="search" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full bg-gray-100 rounded-lg py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                        
                        <Link 
                            to="/products" 
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Products
                        </Link>
                        
                        {user && !isSeller && (
                            <Link 
                                to="/cart" 
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors relative"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Cart {itemCount > 0 && `(${itemCount})`}
                            </Link>
                        )}

                        {isSeller && (
                            <Link 
                                to="/seller/dashboard" 
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                        )}

                        <div className="border-t border-gray-200 pt-3 mt-3">
                            {user ? (
                                <>
                                    <div className="px-4 py-2">
                                        <p className="text-sm font-medium text-gray-900">User #{user?.id}</p>
                                        <p className="text-xs text-blue-600 capitalize">{user?.role || 'User'}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2 px-4">
                                    <Link
                                        to="/login"
                                        className="block text-center py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block text-center py-2 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
