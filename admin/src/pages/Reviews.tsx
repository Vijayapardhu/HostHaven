import { useEffect, useState } from 'react'
import { Search, Star, User, Building2, Flag, Trash2, Eye } from 'lucide-react'

interface Review {
  id: string
  userName: string
  propertyName: string
  propertyType: string
  rating: number
  comment: string
  isFlagged: boolean
  createdAt: string
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setReviews(data.reviews || [])
        } else {
          setReviews([
            { id: '1', userName: 'Rahul Sharma', propertyName: 'Grand Palace Hotel', propertyType: 'Hotel', rating: 5, comment: 'Amazing experience! The staff was very polite and the rooms were spotless.', isFlagged: false, createdAt: '2024-03-15' },
            { id: '2', userName: 'Priya Patel', propertyName: 'Beach Resort', propertyType: 'Hotel', rating: 4, comment: 'Great location and beautiful views. Could improve breakfast options.', isFlagged: false, createdAt: '2024-03-14' },
            { id: '3', userName: 'Amit Kumar', propertyName: 'Mountain Homestay', propertyType: 'Home', rating: 2, comment: 'Not as described. Very disappointed with the cleanliness.', isFlagged: true, createdAt: '2024-03-13' },
            { id: '4', userName: 'Sneha Gupta', propertyName: 'Luxury Villa', propertyType: 'Villa', rating: 5, comment: 'Perfect for a family vacation. Will definitely come back!', isFlagged: false, createdAt: '2024-03-12' },
          ])
        }
      } catch (error) {
        setReviews([
          { id: '1', userName: 'Rahul Sharma', propertyName: 'Grand Palace Hotel', propertyType: 'Hotel', rating: 5, comment: 'Amazing experience! The staff was very polite and the rooms were spotless.', isFlagged: false, createdAt: '2024-03-15' },
          { id: '2', userName: 'Priya Patel', propertyName: 'Beach Resort', propertyType: 'Hotel', rating: 4, comment: 'Great location and beautiful views. Could improve breakfast options.', isFlagged: false, createdAt: '2024-03-14' },
          { id: '3', userName: 'Amit Kumar', propertyName: 'Mountain Homestay', propertyType: 'Home', rating: 2, comment: 'Not as described. Very disappointed with the cleanliness.', isFlagged: true, createdAt: '2024-03-13' },
          { id: '4', userName: 'Sneha Gupta', propertyName: 'Luxury Villa', propertyType: 'Villa', rating: 5, comment: 'Perfect for a family vacation. Will definitely come back!', isFlagged: false, createdAt: '2024-03-12' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFlag = !showFlaggedOnly || review.isFlagged
    return matchesSearch && matchesFlag
  })

  const handleDelete = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setReviews(reviews.filter(r => r.id !== reviewId))
    } catch (error) {
      console.error('Failed to delete review')
    }
  }

  const handleUnflag = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews/${reviewId}/unflag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, isFlagged: false } : r))
    } catch (error) {
      console.error('Failed to unflag review')
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
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600 mt-1">Moderate and manage reviews</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFlaggedOnly}
              onChange={(e) => setShowFlaggedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Show flagged only</span>
          </label>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredReviews.map((review) => (
            <div key={review.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                      {review.isFlagged && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                          <Flag className="w-3 h-3" />
                          Flagged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{review.propertyName}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">{review.propertyType}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-gray-700">{review.comment}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {review.isFlagged && (
                    <button
                      onClick={() => handleUnflag(review.id)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Unflag
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No reviews found
          </div>
        )}
      </div>
    </div>
  )
}
