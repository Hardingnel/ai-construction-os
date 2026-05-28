const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('aicos-token');
  const tenantId = (() => { try { const t = localStorage.getItem('aicos-active-tenant'); return t ? JSON.parse(t).id : undefined; } catch { return undefined; } })();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  upload: <T>(endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('aicos-token');
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<T>;
    });
  },
};

export const pythonApi = {
  get: <T>(endpoint: string) =>
    fetch(`${PYTHON_API_BASE}${endpoint}`).then((r) => r.json() as Promise<T>),
  post: <T>(endpoint: string, data?: any) =>
    fetch(`${PYTHON_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<T>),
};
