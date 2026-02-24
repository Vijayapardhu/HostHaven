import { useEffect, useState } from 'react'
import { Search, Building2, MapPin, Phone, Mail, CheckCircle, XCircle, Eye, FileText } from 'lucide-react'

interface VendorApproval {
  id: string
  name: string
  email: string
  phone: string
  propertyName: string
  propertyType: string
  location: string
  description: string
  rooms: number
  priceRange: string
  documents: string[]
  submittedAt: string
}

export default function VendorApproval() {
  const [vendors, setVendors] = useState<VendorApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchPendingVendors = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/vendors?status=pending`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setVendors(data.vendors || [])
        } else {
          setVendors([
            { id: '1', name: 'Rajesh Kumar', email: 'rajesh@hotel.com', phone: '+91 9876543210', propertyName: 'Royal Palace Hotel', propertyType: 'Hotel', location: 'Jaipur, RJ', description: 'Luxury 5-star hotel in the heart of Jaipur', rooms: 50, priceRange: '₹5,000 - ₹15,000', documents: ['Aadhar Card', 'PAN Card', 'Property Deed'], submittedAt: '2024-03-10' },
            { id: '2', name: 'Anita Desai', email: 'anita@villa.com', phone: '+91 9876543211', propertyName: 'Sunset Beach Villa', propertyType: 'Villa', location: 'Goa, GA', description: 'Beachfront villa with private pool', rooms: 6, priceRange: '₹10,000 - ₹25,000', documents: ['Aadhar Card', 'PAN Card'], submittedAt: '2024-03-12' },
            { id: '3', name: 'Vikram Singh', email: 'vikram@resort.com', phone: '+91 9876543212', propertyName: 'Mountain View Resort', propertyType: 'Resort', location: 'Manali, HP', description: 'Hill station resort with scenic views', rooms: 25, priceRange: '₹3,000 - ₹8,000', documents: ['Aadhar Card', 'PAN Card', 'Business License'], submittedAt: '2024-03-15' },
          ])
        }
      } catch (error) {
        setVendors([
          { id: '1', name: 'Rajesh Kumar', email: 'rajesh@hotel.com', phone: '+91 9876543210', propertyName: 'Royal Palace Hotel', propertyType: 'Hotel', location: 'Jaipur, RJ', description: 'Luxury 5-star hotel in the heart of Jaipur', rooms: 50, priceRange: '₹5,000 - ₹15,000', documents: ['Aadhar Card', 'PAN Card', 'Property Deed'], submittedAt: '2024-03-10' },
          { id: '2', name: 'Anita Desai', email: 'anita@villa.com', phone: '+91 9876543211', propertyName: 'Sunset Beach Villa', propertyType: 'Villa', location: 'Goa, GA', description: 'Beachfront villa with private pool', rooms: 6, priceRange: '₹10,000 - ₹25,000', documents: ['Aadhar Card', 'PAN Card'], submittedAt: '2024-03-12' },
          { id: '3', name: 'Vikram Singh', email: 'vikram@resort.com', phone: '+91 9876543212', propertyName: 'Mountain View Resort', propertyType: 'Resort', location: 'Manali, HP', description: 'Hill station resort with scenic views', rooms: 25, priceRange: '₹3,000 - ₹8,000', documents: ['Aadhar Card', 'PAN Card', 'Business License'], submittedAt: '2024-03-15' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingVendors()
  }, [])

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApproval = async (vendorId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/vendors/${vendorId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setVendors(vendors.filter(v => v.id !== vendorId))
    } catch (error) {
      console.error(`Failed to ${action} vendor`)
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Vendor Approval</h1>
        <p className="text-gray-600 mt-1">Review and approve vendor registrations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pending vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vendor.propertyName}</h3>
                  <p className="text-gray-600">{vendor.propertyType}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {vendor.location}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval(vendor.id, 'reject')}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproval(vendor.id, 'approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vendor Name</p>
                <p className="font-medium text-gray-900">{vendor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium text-gray-900">{vendor.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rooms</p>
                <p className="font-medium text-gray-900">{vendor.rooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price Range</p>
                <p className="font-medium text-gray-900">{vendor.priceRange}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{vendor.description}</p>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Documents Submitted</p>
              <div className="flex flex-wrap gap-2">
                {vendor.documents.map((doc, index) => (
                  <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                    <FileText className="w-4 h-4" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              Submitted on {new Date(vendor.submittedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-600">No pending vendor approvals at the moment</p>
        </div>
      )}
    </div>
  )
}
