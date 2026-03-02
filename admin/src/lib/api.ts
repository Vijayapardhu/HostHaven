import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<string> | null = null

const getAccessToken = () => localStorage.getItem('access_token') || localStorage.getItem('admin_token')

const clearAuthStorage = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('admin_data')
}

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/auth/refresh`, {
        refreshToken,
      })

      const payload = response.data?.data ?? response.data
      const nextAccessToken = payload?.accessToken || payload?.tokens?.accessToken
      const nextRefreshToken = payload?.refreshToken || payload?.tokens?.refreshToken

      if (!nextAccessToken) {
        throw new Error('Invalid refresh response')
      }

      localStorage.setItem('access_token', nextAccessToken)
      localStorage.setItem('admin_token', nextAccessToken)
      if (nextRefreshToken) {
        localStorage.setItem('refresh_token', nextRefreshToken)
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
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const nextToken = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextToken}`
        return api(originalRequest)
      } catch {
        clearAuthStorage()
      }
    }

    return Promise.reject(error)
  }
)

export default api
