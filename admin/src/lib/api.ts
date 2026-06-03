import axios from 'axios'

// Auto-detect API URL with intelligent fallback
const getApiBaseUrl = (): string => {
  // Use explicit env var first (strip trailing slash if present)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  
  // Auto-detect based on current domain
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // If we're on admin.hosthaven.in, API is at api.hosthaven.in
    if (hostname.startsWith("admin.")) {
      const apiHostname = hostname.replace("admin.", "api.");
      return `${protocol}//${apiHostname}`;
    }
    // If we're on localhost, API is also localhost with port 4000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }
  
  // Fallback for server-side or unknown domains
  return "https://api.hosthaven.in";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<string> | null = null

const TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'
const USER_KEY = 'admin_user'

const getAccessToken = () => localStorage.getItem(TOKEN_KEY)

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const dispatchLogout = () => {
  clearAuthStorage()
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post(`${getApiBaseUrl()}/v1/auth/refresh`, {
        refreshToken,
      })

      const payload = response.data?.data ?? response.data
      const nextAccessToken = payload?.accessToken || payload?.tokens?.accessToken
      const nextRefreshToken = payload?.refreshToken || payload?.tokens?.refreshToken

      if (!nextAccessToken) {
        throw new Error('Invalid refresh response')
      }

      localStorage.setItem(TOKEN_KEY, nextAccessToken)
      if (nextRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken)
      }

      return nextAccessToken as string
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }

  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const responseData = error.response?.data as any
    if (responseData?.error?.message && !responseData?.message) {
      responseData.message = responseData.error.message
    }

    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 429) {
      console.error('Rate limited (429). Too many requests sent.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
