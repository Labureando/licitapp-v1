import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: JWT token ──
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle 401 globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      // TODO: Redirect to /login once auth module is implemented
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)