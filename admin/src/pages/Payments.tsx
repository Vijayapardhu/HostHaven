import { useEffect, useState } from 'react'
import { Search, DollarSign, CreditCard, RefreshCw, CheckCircle, Clock, Banknote, TrendingUp } from 'lucide-react'

interface Transaction {
  id: string
  type: 'booking_payment' | 'refund' | 'payout'
  bookingId?: string
  vendorName?: string
  userName?: string
  amount: number
  commission: number
  status: 'completed' | 'pending' | 'failed'
  paymentMethod: string
  createdAt: string
}

interface Payout {
  id: string
  vendorName: string
  amount: number
  status: 'pending' | 'processing' | 'paid'
  bankDetails: string
  createdAt: string
}

export default function Payments() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        
        const [transactionsRes, payoutsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/admin/payouts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data.transactions || [])
        } else {
          setTransactions([
            { id: 'TXN001', type: 'booking_payment', bookingId: 'BK001', userName: 'Rahul Sharma', amount: 25000, commission: 2500, status: 'completed', paymentMethod: 'Razorpay', createdAt: '2024-03-15' },
            { id: 'TXN002', type: 'booking_payment', bookingId: 'BK002', userName: 'Priya Patel', amount: 40000, commission: 4000, status: 'completed', paymentMethod: 'Razorpay', createdAt: '2024-03-16' },
            { id: 'TXN003', type: 'refund', bookingId: 'BK003', userName: 'Amit Kumar', amount: 7500, commission: 0, status: 'completed', paymentMethod: 'Razorpay', createdAt: '2024-03-17' },
            { id: 'TXN004', type: 'booking_payment', bookingId: 'BK004', userName: 'Sneha Gupta', amount: 15000, commission: 1500, status: 'pending', paymentMethod: 'Razorpay', createdAt: '2024-03-18' },
          ])
        }

        if (payoutsRes.ok) {
          const data = await payoutsRes.json()
          setPayouts(data.payouts || [])
        } else {
          setPayouts([
            { id: 'P001', vendorName: 'John Doe', amount: 50000, status: 'paid', bankDetails: 'HDFC Bank ****1234', createdAt: '2024-03-10' },
            { id: 'P002', vendorName: 'Sarah Smith', amount: 35000, status: 'pending', bankDetails: 'ICICI Bank ****5678', createdAt: '2024-03-15' },
            { id: 'P003', vendorName: 'Mike Johnson', amount: 20000, status: 'processing', bankDetails: 'SBI Bank ****9012', createdAt: '2024-03-18' },
          ])
        }
      } catch (error) {
        setTransactions([
          { id: 'TXN001', type: 'booking_payment', bookingId: 'BK001', userName: 'Rahul Sharma', amount: 25000, commission: 2500, status: 'completed', paymentMethod: 'Razorpay', createdAt: '2024-03-15' },
          { id: 'TXN002', type: 'booking_payment', bookingId: 'BK002', userName: 'Priya Patel', amount: 40000, commission: 4000, status: 'completed', paymentMethod: 'Razorpay', createdAt: '2024-03-16' },
          { id: 'TXN003', type: 'refund', bookingId: 'BK003', userName: 'Amit Kumar', amount: 7500, commission: 0, status: 'completed', paymentMethod: 'Razorpay', createdAt: '2024-03-17' },
          { id: 'TXN004', type: 'booking_payment', bookingId: 'BK004', userName: 'Sneha Gupta', amount: 15000, commission: 1500, status: 'pending', paymentMethod: 'Razorpay', createdAt: '2024-03-18' },
        ])
        setPayouts([
          { id: 'P001', vendorName: 'John Doe', amount: 50000, status: 'paid', bankDetails: 'HDFC Bank ****1234', createdAt: '2024-03-10' },
          { id: 'P002', vendorName: 'Sarah Smith', amount: 35000, status: 'pending', bankDetails: 'ICICI Bank ****5678', createdAt: '2024-03-15' },
          { id: 'P003', vendorName: 'Mike Johnson', amount: 20000, status: 'processing', bankDetails: 'SBI Bank ****9012', createdAt: '2024-03-18' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredTransactions = transactions.filter(txn =>
    txn.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPayouts = payouts.filter(payout =>
    payout.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMarkAsPaid = async (payoutId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/payouts/${payoutId}/mark-paid`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status: 'paid' } : p))
    } catch (error) {
      console.error('Failed to mark payout as paid')
    }
  }

  const totalRevenue = transactions.filter(t => t.type === 'booking_payment' && t.status === 'completed').reduce((sum, t) => sum + t.commission, 0)
  const totalRefunds = transactions.filter(t => t.type === 'refund' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)
  const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage transactions and payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRefunds.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900">₹{pendingPayouts.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex gap-4 p-4">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'payouts'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Payouts
            </button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User/Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900">#{txn.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.type === 'booking_payment' 
                          ? 'bg-green-100 text-green-700'
                          : txn.type === 'refund'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {txn.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {txn.userName || txn.vendorName || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{txn.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ₹{txn.commission.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : txn.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900">#{payout.id}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {payout.vendorName}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{payout.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {payout.bankDetails}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : payout.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(payout.id)}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
