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

export const authService = {
  login: async (data: AuthLoginRequest) => {
    const response = await api.post('/v1/auth/login', data)
    const payload = response.data?.data
    return {
      accessToken: payload?.tokens?.accessToken,
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
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
  },
}
