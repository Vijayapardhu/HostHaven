import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/logo.png'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const savedEmail = localStorage.getItem('admin_email_saved')

  useEffect(() => {
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [savedEmail])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="HostHaven" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-neutral-900">HostHaven</h1>
          <p className="text-sm text-neutral-500 mt-1">Admin Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div>
            <input
              type="email"
              value={email || savedEmail || ''}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="Email"
              className={`w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200 outline-none ${
                focused === 'email'
                  ? 'border-neutral-900 ring-2 ring-neutral-900/10'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200 outline-none pr-12 ${
                focused === 'password'
                  ? 'border-neutral-900 ring-2 ring-neutral-900/10'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading
                ? 'bg-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-neutral-100 rounded-xl">
          <p className="text-xs text-neutral-600 font-medium mb-1">Demo access</p>
          <p className="text-xs text-neutral-500">admin@hosthaven.com / Admin@123</p>
        </div>

        {/* Back to site */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}
