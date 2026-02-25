import { Link } from 'react-router-dom'
import { ArrowLeft, Home, RefreshCw } from 'lucide-react'
import logo from '../assets/logo.png'

interface ErrorPageProps {
  title?: string
  message?: string
  code?: string
}

export default function ErrorPage({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred. Please try again.',
  code 
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link to="/" className="inline-block mb-8">
          <img src={logo} alt="HostHaven" className="h-10 w-auto mx-auto" />
        </Link>

        {/* Error Code */}
        {code && (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-6">
            <span className="text-2xl font-bold text-neutral-400">{code}</span>
          </div>
        )}

        {/* Content */}
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h1>
        <p className="text-neutral-500 mb-8">{message}</p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98] transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
