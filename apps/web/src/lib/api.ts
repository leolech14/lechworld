// API configuration for different environments
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://lechworld-api-production.up.railway.app';

export const apiUrl = (path: string) => {
  // In production, API routes are handled by Vercel functions
  // In development, they're proxied to the local server
  return `${API_BASE_URL}/api${path}`;
};