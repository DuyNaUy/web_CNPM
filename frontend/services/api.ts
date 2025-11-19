// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to get auth token
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

// Helper function to set auth tokens
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
};

// Helper function to remove auth tokens
export const removeAuthTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
};

// Helper function to get stored user
export const getStoredUser = () => {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    return null;
};

// Helper function to set stored user
export const setStoredUser = (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
};

// API Request wrapper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>)
    };

    // Only set Content-Type if not already set and body is not FormData
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers
    };

    try {
        console.log(`API Request: ${config.method || 'GET'} ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Try to parse JSON response
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
        }

        console.log(`API Response (${response.status}):`, data);

        // If response is not OK, but we have data structure from backend
        if (!response.ok) {
            // Return the full response structure from backend (with success: false)
            if (data && typeof data === 'object') {
                console.error('API Error Response:', data);
                return data;
            }
            throw new Error(data?.message || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error: any) {
        console.error('API Request Error:', error);

        // If it's a network error or fetch error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra xem server đã chạy chưa!');
        }

        throw error;
    }
};

// Auth API
export const authAPI = {
    register: async (userData: { username: string; email: string; full_name: string; phone: string; password: string; confirm_password: string; role?: string }) => {
        // Don't send token for registration - use fetch directly
        const response = await fetch(`${API_BASE_URL}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            return data;
        }

        if (data.success && data.data) {
            // Store tokens and user data
            setAuthTokens(data.data.tokens.access, data.data.tokens.refresh);
            setStoredUser(data.data.user);
        }

        return data;
    },

    login: async (credentials: { email: string; password: string }) => {
        // Don't send token for login - use fetch directly
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (!response.ok) {
            return data;
        }

        if (data.success && data.data) {
            // Store tokens and user data
            setAuthTokens(data.data.tokens.access, data.data.tokens.refresh);
            setStoredUser(data.data.user);
        }

        return data;
    },

    logout: async () => {
        const refreshToken = localStorage.getItem('refresh_token');

        try {
            await apiRequest('/auth/logout/', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refreshToken })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always remove tokens
            removeAuthTokens();
        }
    },

    getProfile: async () => {
        return await apiRequest('/auth/profile/', {
            method: 'GET'
        });
    },

    updateProfile: async (userData: any) => {
        return await apiRequest('/auth/profile/', {
            method: 'PATCH',
            body: JSON.stringify(userData)
        });
    }
};

// User Management API (Admin only)
export const userManagementAPI = {
    getAll: async (params?: { role?: string; search?: string; page?: number; page_size?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.role) queryParams.append('role', params.role);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        const queryString = queryParams.toString();
        return await apiRequest(`/auth/users/${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id: number) => {
        return await apiRequest(`/auth/users/${id}/`);
    },

    create: async (userData: any) => {
        return await apiRequest('/auth/users/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    update: async (id: number, userData: any) => {
        return await apiRequest(`/auth/users/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(userData)
        });
    },

    delete: async (id: number) => {
        return await apiRequest(`/auth/users/${id}/`, {
            method: 'DELETE'
        });
    },

    toggleStatus: async (id: number) => {
        return await apiRequest(`/auth/users/${id}/toggle_status/`, {
            method: 'POST'
        });
    }
};

// Category Management API
export const categoryAPI = {
    getAll: async (params?: { search?: string; status?: string; page?: number; page_size?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        const queryString = queryParams.toString();
        return await apiRequest(`/categories/${queryString ? '?' + queryString : ''}`);
    },

    getActive: async () => {
        return await apiRequest('/categories/active/');
    },

    getById: async (id: number) => {
        return await apiRequest(`/categories/${id}/`);
    },

    create: async (categoryData: { name: string; description?: string; status?: string }) => {
        return await apiRequest('/categories/', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    },

    update: async (id: number, categoryData: { name?: string; description?: string; status?: string }) => {
        return await apiRequest(`/categories/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(categoryData)
        });
    },

    delete: async (id: number) => {
        return await apiRequest(`/categories/${id}/`, {
            method: 'DELETE'
        });
    },

    deleteCategory: async (id: number) => {
        return await apiRequest(`/categories/${id}/delete_category/`, {
            method: 'POST'
        });
    },

    toggleStatus: async (id: number) => {
        return await apiRequest(`/categories/${id}/toggle_status/`, {
            method: 'POST'
        });
    }
};

// Product Management API
export const productAPI = {
    getAll: async (params?: { search?: string; category?: number; status?: string; min_price?: number; max_price?: number; min_rating?: number; low_stock?: boolean; is_featured?: boolean; page?: number; page_size?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.min_price) queryParams.append('min_price', params.min_price.toString());
        if (params?.max_price) queryParams.append('max_price', params.max_price.toString());
        if (params?.min_rating) queryParams.append('min_rating', params.min_rating.toString());
        if (params?.low_stock) queryParams.append('low_stock', 'true');
        if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        const queryString = queryParams.toString();
        return await apiRequest(`/products/${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id: number) => {
        return await apiRequest(`/products/${id}/`);
    },

    getBySlug: async (slug: string) => {
        return await apiRequest(`/products/${slug}/`);
    },

    getByIdOrSlug: async (idOrSlug: string | number) => {
        return await apiRequest(`/products/${idOrSlug}/`);
    },

    getFeatured: async () => {
        return await apiRequest('/products/featured/');
    },

    getByCategory: async (categoryId: number, params?: { page?: number; page_size?: number }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('category_id', categoryId.toString());
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        return await apiRequest(`/products/by_category/?${queryParams.toString()}`);
    },

    getLowStock: async () => {
        return await apiRequest('/products/low_stock/');
    },

    getOutOfStock: async () => {
        return await apiRequest('/products/out_of_stock/');
    },

    create: async (productData: FormData | any) => {
        const isFormData = productData instanceof FormData;

        return await apiRequest('/products/', {
            method: 'POST',
            headers: isFormData ? {} : { 'Content-Type': 'application/json' },
            body: isFormData ? productData : JSON.stringify(productData)
        });
    },

    update: async (id: number, productData: FormData | any) => {
        const isFormData = productData instanceof FormData;

        return await apiRequest(`/products/${id}/`, {
            method: 'PATCH',
            headers: isFormData ? {} : { 'Content-Type': 'application/json' },
            body: isFormData ? productData : JSON.stringify(productData)
        });
    },

    delete: async (id: number) => {
        return await apiRequest(`/products/${id}/`, {
            method: 'DELETE'
        });
    },

    uploadImage: async (id: number, imageFile: File) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        return await apiRequest(`/products/${id}/upload_image/`, {
            method: 'POST',
            body: formData
        });
    },

    addImages: async (id: number, imageFiles: File[]) => {
        const formData = new FormData();
        imageFiles.forEach((file) => {
            formData.append('images', file);
        });

        return await apiRequest(`/products/${id}/add_images/`, {
            method: 'POST',
            body: formData
        });
    },

    deleteImage: async (id: number, imageId: number) => {
        return await apiRequest(`/products/${id}/delete_image/${imageId}/`, {
            method: 'DELETE'
        });
    },

    toggleFeatured: async (id: number) => {
        return await apiRequest(`/products/${id}/toggle_featured/`, {
            method: 'POST'
        });
    },

    toggleStatus: async (id: number) => {
        return await apiRequest(`/products/${id}/toggle_status/`, {
            method: 'POST'
        });
    },

    saveVariants: async (id: number, variants: Array<{ size: string; price: number; stock: number }>) => {
        return await apiRequest(`/products/${id}/save_variants/`, {
            method: 'POST',
            body: JSON.stringify({ variants })
        });
    }
};

// Order API
export const orderAPI = {
    createOrder: async (orderData: {
        full_name: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        district: string;
        note?: string;
        payment_method: string;
        items: Array<{
            id: number;
            name?: string;
            price: number;
            quantity: number;
            unit: string;
            image?: string;
        }>;
    }) => {
        // Transform items to match backend format - include price!
        const items = orderData.items.map(item => ({
            id: item.id.toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            price: item.price.toString()  // Include price from checkout
        }));

        return await apiRequest('/orders/create_order/', {
            method: 'POST',
            body: JSON.stringify({
                full_name: orderData.full_name,
                phone: orderData.phone,
                email: orderData.email,
                address: orderData.address,
                city: orderData.city,
                district: orderData.district,
                note: orderData.note || '',
                payment_method: orderData.payment_method,
                items
            })
        });
    },

    getMyOrders: async () => {
        return await apiRequest('/orders/my_orders/');
    },

    getAllOrders: async () => {
        return await apiRequest('/orders/all_orders/');
    },

    updateOrderStatus: async (order_id: number, status: string) => {
        return await apiRequest('/orders/update_order_status/', {
            method: 'POST',
            body: JSON.stringify({ order_id, status })
        });
    },

    getStats: async () => {
        return await apiRequest('/orders/stats/');
    },

    exportExcel: async (reportType?: string, startDate?: string, endDate?: string) => {
        const token = getAuthToken();
        const params = new URLSearchParams();
        if (reportType) params.append('report_type', reportType);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const url = `${API_BASE_URL}/orders/export_excel/${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Không thể xuất Excel');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `bao_cao_${reportType || 'orders'}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    },

    exportPDF: async (reportType?: string, startDate?: string, endDate?: string) => {
        const token = getAuthToken();
        const params = new URLSearchParams();
        if (reportType) params.append('report_type', reportType);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const url = `${API_BASE_URL}/orders/export_pdf/${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Không thể xuất PDF');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `bao_cao_${reportType || 'orders'}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    }
};

// Cart API
export const cartAPI = {
    getCart: async () => {
        return await apiRequest('/orders/cart/my_cart/');
    },

    addItem: async (product_id: number, quantity: number, unit: string) => {
        return await apiRequest('/orders/cart/add_item/', {
            method: 'POST',
            body: JSON.stringify({
                product_id,
                quantity,
                unit
            })
        });
    },

    updateItem: async (item_id: number, quantity: number) => {
        return await apiRequest('/orders/cart/update_item/', {
            method: 'POST',
            body: JSON.stringify({
                item_id,
                quantity
            })
        });
    },

    removeItem: async (item_id: number) => {
        return await apiRequest('/orders/cart/remove_item/', {
            method: 'POST',
            body: JSON.stringify({
                item_id
            })
        });
    },

    clearCart: async () => {
        return await apiRequest('/orders/cart/clear_cart/', {
            method: 'POST'
        });
    }
};

export default apiRequest;
