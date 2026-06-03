import api from './api'

export interface AuthLoginRequest {
  email: string
  password: string
}

export interface AuthLoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN'
    isVerified: boolean
  }
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

const TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'
const USER_KEY = 'admin_user'

export const authService = {
  login: async (data: AuthLoginRequest) => {
    const response = await api.post('/v1/auth/login', data)
    const payload = response.data?.data

    const accessToken = payload?.tokens?.accessToken
    const refreshToken = payload?.tokens?.refreshToken

    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken)
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
    if (payload?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    }

    return {
      accessToken,
      user: payload?.user,
    } as AuthLoginResponse
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await api.post('/v1/auth/forgot-password', data)
    return response.data?.data ?? response.data
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post('/v1/auth/reset-password', data)
    return response.data?.data ?? response.data
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
