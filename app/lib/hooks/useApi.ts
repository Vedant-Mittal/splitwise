import { useState } from 'react';

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return ''; // Server-side rendering
  
  if (process.env.NODE_ENV === 'production') {
    // Your actual Render.com deployment URL
    return 'https://splitwise-api-1xpz.onrender.com';
  }
  
  return ''; // In development, use relative URLs
};

// Generic API request function
async function apiRequest<T>(
  url: string, 
  method: string = 'GET', 
  data?: any
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${url}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  
  return response.json();
}

// Hook for API operations
export function useApi() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Generic request handler
  const request = async <T>(
    url: string,
    method: string = 'GET',
    data?: any
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest<T>(url, method, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // People API
  const people = {
    getAll: () => request<any[]>('/api/people'),
    getById: (id: string) => request<any>(`/api/people/${id}`),
    create: (name: string) => request<any>('/api/people', 'POST', { name }),
    update: (id: string, name: string) => 
      request<any>(`/api/people/${id}`, 'PUT', { name }),
    delete: (id: string) => request<any>(`/api/people/${id}`, 'DELETE'),
  };

  // Expenses API
  const expenses = {
    getAll: () => request<any[]>('/api/expenses'),
    getById: (id: string) => request<any>(`/api/expenses/${id}`),
    create: (expense: any) => request<any>('/api/expenses', 'POST', expense),
    update: (id: string, expense: any) => 
      request<any>(`/api/expenses/${id}`, 'PUT', expense),
    delete: (id: string) => request<any>(`/api/expenses/${id}`, 'DELETE'),
  };

  // Groups API
  const groups = {
    getAll: () => request<any[]>('/api/groups'),
    getById: (id: string) => request<any>(`/api/groups/${id}`),
    create: (group: any) => request<any>('/api/groups', 'POST', group),
    update: (id: string, group: any) => 
      request<any>(`/api/groups/${id}`, 'PUT', group),
    delete: (id: string) => request<any>(`/api/groups/${id}`, 'DELETE'),
  };

  // Settlements API
  const settlements = {
    getAll: () => request<any[]>('/api/settlements'),
    create: (settlement: any) => 
      request<any>('/api/settlements', 'POST', settlement),
    delete: (id: string) => request<any>(`/api/settlements/${id}`, 'DELETE'),
  };

  // Categories API
  const categories = {
    getAll: () => request<any[]>('/api/categories'),
    create: (name: string) => 
      request<any>('/api/categories', 'POST', { name, isCustom: true }),
    delete: (id: string) => request<any>(`/api/categories/${id}`, 'DELETE'),
  };

  // Currencies API
  const currencies = {
    getAll: () => request<any[]>('/api/currencies'),
  };

  return {
    loading,
    error,
    people,
    expenses,
    groups,
    settlements,
    categories,
    currencies,
  };
} 