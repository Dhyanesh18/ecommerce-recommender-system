import api from './api';

export interface Product {
    id: number;
    name: string;
    description?: string;
    category: string;
    price: number;
    stock: number;
    images: string[];
    seller_id: number;
    created_at: string;
}

export interface ProductsResponse {
    page: number;
    results: Product[];
}

export interface CreateProductData {
    name: string;
    description?: string;
    category: string;
    price: number;
    stock: number;
    images: string[];
}

export const getProducts = async (page = 1, limit = 20, category?: string): Promise<ProductsResponse> => {
    let url = `/products?page=${page}&limit=${limit}`;
    if (category && category !== 'all') {
        url += `&category=${encodeURIComponent(category)}`;
    }
    const response = await api.get(url);
    return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (data: CreateProductData): Promise<{ productId: number }> => {
    const response = await api.post('/products', data);
    return response.data;
};

export const updateProduct = async (id: number, data: Partial<CreateProductData>): Promise<void> => {
    await api.put(`/products/${id}`, data);
};

export const deleteProduct = async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
};

export const getSellerProducts = async (): Promise<Product[]> => {
    const response = await api.get('/products/seller/my-products');
    return response.data.products;
};

export const getCategories = async (): Promise<string[]> => {
    const response = await api.get('/products/categories');
    return response.data.categories;
};
