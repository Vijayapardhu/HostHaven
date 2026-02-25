import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

interface LoadingPageProps {
  message?: string
}

export default function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="inline-block mb-6">
          <img src={logo} alt="HostHaven" className="h-12 w-auto mx-auto" />
        </Link>
        <div className="w-8 h-8 border-3 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-500">{message}</p>
      </div>
    </div>
  )
}
