import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Home, Calendar, CreditCard, Users } from 'lucide-react'
import logo from '../assets/logo.png'

interface SuccessPageProps {
  title: string
  message: string
  icon?: 'booking' | 'payment' | 'user' | 'property' | 'general'
  actions?: Array<{
    label: string
    href: string
  }>
}

const iconMap = {
  booking: Calendar,
  payment: CreditCard,
  user: Users,
  property: Home,
  general: CheckCircle2,
}

export default function SuccessPage({ title, message, icon = 'general', actions }: SuccessPageProps) {
  const Icon = iconMap[icon]

  const defaultActions = [
    { label: 'Go to Dashboard', href: '/' },
    { label: 'View Bookings', href: '/bookings' },
  ]

  const finalActions = actions || defaultActions

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link to="/" className="inline-block mb-8">
          <img src={logo} alt="HostHaven" className="h-10 w-auto mx-auto" />
        </Link>

        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Content */}
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h1>
        <p className="text-neutral-500 mb-8">{message}</p>

        {/* Actions */}
        <div className="space-y-3">
          {finalActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                index === 0
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]'
                  : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
