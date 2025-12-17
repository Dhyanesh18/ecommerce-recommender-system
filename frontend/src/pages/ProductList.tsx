import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Product } from '../services/productApi';
import { getProducts, getCategories } from '../services/productApi';
import { trackEvent } from '../utils/eventTracker';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('default');
    const [addedToCart, setAddedToCart] = useState<number | null>(null);
    const [viewedProducts, setViewedProducts] = useState<Set<number>>(new Set());
    const [categories, setCategories] = useState<string[]>(['all']);
    const observerRef = useRef<IntersectionObserver | null>(null);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuthStore();
    const { addItem } = useCartStore();

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducts(page, 20, selectedCategory);
            setProducts(data.results);
            setFilteredProducts(data.results);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    }, [page, selectedCategory]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await getCategories();
                setCategories(['all', ...cats]);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    // Sync search query with URL params
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch !== null) {
            setSearchQuery(urlSearch);
        }
    }, [searchParams]);

    // Setup Intersection Observer for view tracking
    useEffect(() => {
        if (!user) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const productId = parseInt(entry.target.getAttribute('data-product-id') || '0');
                        if (productId && !viewedProducts.has(productId)) {
                            // Track view event when product appears in viewport
                            trackEvent({ userId: user.id, productId, eventType: 'view' });
                            setViewedProducts(prev => new Set([...prev, productId]));
                        }
                    }
                });
            },
            {
                threshold: 0.5, // Product must be 50% visible
                rootMargin: '0px'
            }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [user]);

    // Observe filtered products
    useEffect(() => {
        if (!observerRef.current) return;

        // Observe all product cards
        const productCards = document.querySelectorAll('[data-product-id]');
        productCards.forEach(card => {
            observerRef.current?.observe(card);
        });

        return () => {
            if (observerRef.current) {
                productCards.forEach(card => {
                    observerRef.current?.unobserve(card);
                });
            }
        };
    }, [filteredProducts]);

    // Reset to page 1 when category changes
    useEffect(() => {
        setPage(1);
    }, [selectedCategory]);

    // Filter and sort products
    useEffect(() => {
        let result = [...products];

        // Apply search filter
        if (searchQuery) {
            result = result.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter is now handled by backend, so no need to filter here

        // Apply sorting
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        setFilteredProducts(result);
    }, [products, searchQuery, selectedCategory, sortBy]);

    const handleProductClick = (product: Product) => {
        if (user) {
            // Track click event when user clicks to view details
            trackEvent({ userId: user.id, productId: product.id, eventType: 'click' });
        }
        navigate(`/products/${product.id}`);
    };

    const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        try {
            await addItem(product.id);
            if (user) {
                trackEvent({ userId: user.id, productId: product.id, eventType: 'add_to_cart' });
            }
            setAddedToCart(product.id);
            setTimeout(() => setAddedToCart(null), 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F6F9]">
            {/* Hero Section */}
            <div className="bg-linear-to-r from-[#001222] via-[#012b55] to-[#001222] text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-2 text-[#C5A358]" style={{ fontFamily: 'Anton, sans-serif' }}>Discover Amazing Products</h1>
                    <p className="text-[#C5A358]">Find exactly what you're looking for</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <svg
                                className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="default">Sort by: Default</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name: A to Z</option>
                        </select>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-gray-600">
                        Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <svg
                            className="w-24 h-24 mx-auto text-gray-300 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-xl text-gray-600 mb-2">No products found</p>
                        <p className="text-gray-500">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                data-product-id={product.id}
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group"
                            >
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {product.stock < 10 && product.stock > 0 && (
                                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                            Only {product.stock} left!
                                        </div>
                                    )}
                                    {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">Out of Stock</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="mb-2">
                                        <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded">
                                            {product.category}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-2xl font-bold text-gray-900">
                                            ₹{Number(product.price).toFixed(2)}
                                        </span>
                                        {user && product.stock > 0 && (
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                    addedToCart === product.id
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-[#002647] text-white hover:bg-[#001222]'
                                                }`}
                                            >
                                                {addedToCart === product.id ? '✓ Added' : 'Add to Cart'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-12">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Previous
                    </button>
                    <span className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
                        Page {page}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}
