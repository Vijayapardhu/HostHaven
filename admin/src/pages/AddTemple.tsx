import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Upload, MapPin, Clock, DollarSign, Image, Trash2, Plus, X } from 'lucide-react'

interface TempleFormData {
  name: string
  description: string
  shortDesc: string
  address: string
  city: string
  state: string
  pincode: string
  latitude: string
  longitude: string
  deity: string
  templeType: string
  builtYear: string
  architecture: string
  dressCode: string
  bestTimeToVisit: string
  entryFee: string
  photography: boolean
  specialInstructions: string
  darshanTimings: { day: string; openTime: string; closeTime: string }[]
  aartiTimings: { name: string; time: string }[]
  images: { url: string; alt: string }[]
}

export default function AddTemple() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState<TempleFormData>({
    name: '',
    description: '',
    shortDesc: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    deity: '',
    templeType: '',
    builtYear: '',
    architecture: '',
    dressCode: '',
    bestTimeToVisit: '',
    entryFee: '',
    photography: true,
    specialInstructions: '',
    darshanTimings: [
      { day: 'Monday', openTime: '06:00', closeTime: '12:00' },
      { day: 'Monday', openTime: '15:00', closeTime: '21:00' },
    ],
    aartiTimings: [
      { name: 'Morning Aarti', time: '06:30' },
      { name: 'Evening Aarti', time: '19:00' },
    ],
    images: [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const token = localStorage.getItem('admin_token')
      const url = id 
        ? `${import.meta.env.VITE_API_URL}/admin/temples/${id}`
        : `${import.meta.env.VITE_API_URL}/admin/temples`
      
      const method = id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        navigate('/temples')
      }
    } catch (error) {
      console.error('Failed to save temple')
    } finally {
      setIsSaving(false)
    }
  }

  const addTiming = (type: 'darshan' | 'aarti') => {
    if (type === 'darshan') {
      setFormData({
        ...formData,
        darshanTimings: [...formData.darshanTimings, { day: 'Monday', openTime: '06:00', closeTime: '12:00' }]
      })
    } else {
      setFormData({
        ...formData,
        aartiTimings: [...formData.aartiTimings, { name: 'New Aarti', time: '18:00' }]
      })
    }
  }

  const removeTiming = (type: 'darshan' | 'aarti', index: number) => {
    if (type === 'darshan') {
      setFormData({
        ...formData,
        darshanTimings: formData.darshanTimings.filter((_, i) => i !== index)
      })
    } else {
      setFormData({
        ...formData,
        aartiTimings: formData.aartiTimings.filter((_, i) => i !== index)
      })
    }
  }

  const updateTiming = (type: 'darshan' | 'aarti', index: number, field: string, value: string) => {
    if (type === 'darshan') {
      const newTimings = [...formData.darshanTimings]
      newTimings[index] = { ...newTimings[index], [field]: value }
      setFormData({ ...formData, darshanTimings: newTimings })
    } else {
      const newTimings = [...formData.aartiTimings]
      newTimings[index] = { ...newTimings[index], [field]: value }
      setFormData({ ...formData, aartiTimings: newTimings })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/temples')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{id ? 'Edit Temple' : 'Add New Temple'}</h1>
          <p className="text-gray-600">Temple information is content-only (no bookings)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temple Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={formData.shortDesc}
                    onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Brief tagline for listings"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deity *</label>
                    <input
                      type="text"
                      value={formData.deity}
                      onChange={(e) => setFormData({ ...formData, deity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temple Type</label>
                    <select
                      value={formData.templeType}
                      onChange={(e) => setFormData({ ...formData, templeType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="vaishnavite">Vaishnavite</option>
                      <option value="shaivite">Shaivite</option>
                      <option value="shakti">Shakti</option>
                      <option value="ganesh">Ganesh</option>
                      <option value="hanuman">Hanuman</option>
                      <option value="surya">Surya</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Built Year</label>
                    <input
                      type="text"
                      value={formData.builtYear}
                      onChange={(e) => setFormData({ ...formData, builtYear: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 8th Century"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Architecture</label>
                    <input
                      type="text"
                      value={formData.architecture}
                      onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Dravidian"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Location</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 13.6288"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 79.4192"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Darshan Timings</h2>
              <div className="space-y-3">
                {formData.darshanTimings.map((timing, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <select
                      value={timing.day}
                      onChange={(e) => updateTiming('darshan', index, 'day', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={timing.openTime}
                      onChange={(e) => updateTiming('darshan', index, 'openTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={timing.closeTime}
                      onChange={(e) => updateTiming('darshan', index, 'closeTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeTiming('darshan', index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTiming('darshan')}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Timing
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Aarti Timings</h2>
              <div className="space-y-3">
                {formData.aartiTimings.map((timing, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={timing.name}
                      onChange={(e) => updateTiming('aarti', index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Aarti Name"
                    />
                    <input
                      type="time"
                      value={timing.time}
                      onChange={(e) => updateTiming('aarti', index, 'time', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeTiming('aarti', index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTiming('aarti')}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Aarti
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee</label>
                  <input
                    type="text"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Free or ₹50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Code</label>
                  <input
                    type="text"
                    value={formData.dressCode}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Traditional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Best Time to Visit</label>
                  <input
                    type="text"
                    value={formData.bestTimeToVisit}
                    onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Oct-Mar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Any special instructions for visitors"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.photography}
                    onChange={(e) => setFormData({ ...formData, photography: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm text-gray-700">Photography Allowed</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Images</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Drag and drop images here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <input type="file" multiple accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/temples')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {id ? 'Update Temple' : 'Create Temple'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
