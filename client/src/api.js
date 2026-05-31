const TOKEN_KEY = 'scholarx-token';

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function getToken() {
  return getStoredToken();
}

export function setToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

export function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function me() {
  return request('/api/auth/me');
}

export function fetchTasks(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);

  const query = params.toString();
  return request(`/api/tasks${query ? `?${query}` : ''}`);
}

export function createTask(payload) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTask(taskId, payload) {
  return request(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function deleteTask(taskId) {
  return request(`/api/tasks/${taskId}`, {
    method: 'DELETE'
  });
}
