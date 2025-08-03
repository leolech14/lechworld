// API client with JWT token handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Try to restore token from localStorage
    this.token = localStorage.getItem('auth-token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth-token', token);
    } else {
      localStorage.removeItem('auth-token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(url: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Prepend base URL if not already included
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Still include cookies for backward compatibility
    });

    // If unauthorized, clear token and redirect to login
    if (response.status === 401) {
      this.setToken(null);
      // Don't redirect on login endpoint
      if (!url.includes('/auth/login')) {
        window.location.href = '/login';
      }
    }

    return response;
  }

  async get(url: string) {
    return this.request(url, { method: 'GET' });
  }

  async post(url: string, data?: any) {
    return this.request(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: any) {
    return this.request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string) {
    return this.request(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();