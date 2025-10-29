const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', headers = {}, body } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token && !headers.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    // Ensure proper URL construction
    const url = endpoint.startsWith('/') 
      ? `${API_BASE_URL}${endpoint}` 
      : `${API_BASE_URL}/${endpoint}`;
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth endpoints
  auth: {
    register: (fullName: string, email: string, password: string, role: string) =>
      apiCall('/auth/register', {
        method: 'POST',
        body: { fullName, email, password, role },
      }),
    login: (email: string, password: string) =>
      apiCall('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    getMe: () => apiCall('/auth/me'),
  },

  // User endpoints
  users: {
    getAll: () => apiCall('/users'),
    getById: (id: string) => apiCall(`/users/${id}`),
    update: (id: string, data: any) =>
      apiCall(`/users/${id}`, {
        method: 'PUT',
        body: data,
      }),
    delete: (id: string) =>
      apiCall(`/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // Product endpoints
  products: {
    getAll: (params?: { category?: string; status?: string; search?: string }) => {
      const queryString = params
        ? '?' + new URLSearchParams(params as any).toString()
        : '';
      return apiCall(`/products${queryString}`);
    },
    getById: (id: string) => apiCall(`/products/${id}`),
    create: (data: any) =>
      apiCall('/products', {
        method: 'POST',
        body: data,
      }),
    update: (id: string, data: any) =>
      apiCall(`/products/${id}`, {
        method: 'PUT',
        body: data,
      }),
    delete: (id: string) =>
      apiCall(`/products/${id}`, {
        method: 'DELETE',
      }),
    getLowStock: () => apiCall('/products/low-stock'),
  },

  // Admin endpoints
  admin: {
    getDashboardStats: () => apiCall('/admin/dashboard'),
    updateUserRole: (userId: string, role: string) =>
      apiCall(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: { role },
      }),
  },

  // Manager endpoints
  manager: {
    stockIn: (productId: string, quantity: number, reference?: string) =>
      apiCall('/manager/stockIn', {
        method: 'POST',
        body: { productId, quantity, reference },
      }),
    stockOut: (productId: string, quantity: number, reference?: string) =>
      apiCall('/manager/stockOut', {
        method: 'POST',
        body: { productId, quantity, reference },
      }),
    validateStock: () => apiCall('/manager/validateStock'),
    generateReport: (type: string) => apiCall(`/manager/generateReport?type=${type}`),
    getTransactions: (params?: { limit?: number; page?: number; type?: string; productId?: string }) => {
      const queryString = params
        ? '?' + new URLSearchParams(params as any).toString()
        : '';
      return apiCall(`/manager/transactions${queryString}`);
    },
  },

  // Clerk endpoints
  clerk: {
    getDashboardStats: () => apiCall('/clerk/stats'),
    getLowStockProducts: () => apiCall('/clerk/lowStock'),
    getPendingOrders: (status?: string) =>
      apiCall(status ? `/clerk/orders?status=${status}` : '/clerk/orders'),
    updateOrderStatus: (orderId: string, status: string) =>
      apiCall(`/clerk/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      }),
    requestReorder: (productId: string) =>
      apiCall('/clerk/reorder', {
        method: 'POST',
        body: { productId },
      }),
  },

  // Auditor endpoints
  auditor: {
    getDashboardStats: () => apiCall('/auditor/stats'),
    createNewAudit: () => apiCall('/auditor/auditInventory', {
      method: 'POST',
    }),
    scheduleAudit: (title: string, date: string) =>
      apiCall('/auditor/scheduleAudit', {
        method: 'POST',
        body: { title, date },
      }),
    getAuditReports: () => apiCall('/auditor/reports'),
    getAuditById: (id: string) => apiCall(`/auditor/audits/${id}`),
    completeAudit: (id: string) =>
      apiCall(`/auditor/audits/${id}/complete`, {
        method: 'PUT',
      }),
    exportReport: (format?: string) =>
      apiCall(format ? `/auditor/exportReport?format=${format}` : '/auditor/exportReport'),
  },

  // Notification endpoints
  notifications: {
    send: (recipientId: string, message: string, type?: string, productId?: string, metadata?: any) =>
      apiCall('/notifications/send', {
        method: 'POST',
        body: { recipientId, message, type, productId, metadata },
      }),
    getAll: (isRead?: boolean, type?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (isRead !== undefined) params.append('isRead', String(isRead));
      if (type) params.append('type', type);
      if (limit) params.append('limit', String(limit));
      return apiCall(`/notifications?${params.toString()}`);
    },
    getUnreadCount: () => apiCall('/notifications/unread-count'),
    markAsRead: (id: string) =>
      apiCall(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllAsRead: () =>
      apiCall('/notifications/read-all', {
        method: 'PUT',
      }),
  },
};
