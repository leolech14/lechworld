import { z } from 'zod';
import { apiClient } from '@/lib/api-client';

// Validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const setPasswordSchema = z.object({
  userId: z.number(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

// API functions
export async function login(data: LoginInput) {
  const response = await apiClient.post('/api/auth/login', data);

  if (!response.ok) {
    let errorMessage = 'Failed to login';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If JSON parsing fails, use default error message
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  
  // Store the JWT token if present
  if (result.token) {
    apiClient.setToken(result.token);
  }
  
  // Check if password creation is required
  if (result.requiresPasswordCreation) {
    return {
      ...result,
      requiresPasswordCreation: true,
    };
  }
  
  return result;
}

export async function setPassword(data: SetPasswordInput) {
  const { confirmPassword, ...passwordData } = data;
  
  const response = await fetch('/api/auth/set-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(passwordData),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to set password';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  const result = await response.json();

  return result;
}

export async function register(data: RegisterInput) {
  const { confirmPassword, ...registerData } = data;
  
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(registerData),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to register';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  const result = await response.json();

  return result;
}

export async function logout() {
  const response = await apiClient.post('/api/auth/logout');

  if (!response.ok) {
    throw new Error('Failed to logout');
  }

  // Clear the token
  apiClient.setToken(null);

  return response.json();
}

export async function getCurrentUser() {
  const response = await apiClient.get('/api/auth/me');

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error('Failed to get current user');
  }

  return response.json();
}