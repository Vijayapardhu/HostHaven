import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { vendorsService } from '../lib/vendors'

const STEPS = [
  'Account',
  'Business Info',
  'Bank Info',
  'Hotel Info',
  'Room Setup',
  'Submit',
] as const

const CITY_OPTIONS = ['VIJAYAWADA', 'NANDIYALA', 'VETLAPALEM', 'TIRUPATI'] as const
const APPROVAL_OPTIONS = ['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED'] as const

type RoomForm = {
  roomName: string
  capacity: string
  extraBedCapacity: string
  pricePerNight: string
  weekendPrice: string
  totalRooms: string
  roomAmenities: string
  roomImages: string
}

const emptyRoom = (): RoomForm => ({
  roomName: '',
  capacity: '2',
  extraBedCapacity: '0',
  pricePerNight: '',
  weekendPrice: '',
  totalRooms: '1',
  roomAmenities: '',
  roomImages: '',
})

export default function AddVendorOnboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    businessName: '',

    businessAddress: '',
    city: 'VIJAYAWADA',
    state: 'Andhra Pradesh',
    pincode: '',
    gstNumber: '',
    panNumber: '',

    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',

    hotelName: '',
    slug: '',
    description: '',
    shortDescription: '',
    fullAddress: '',
    latitude: '',
    longitude: '',
    amenities: '',
    highlights: '',
    image1: '',
    image2: '',
    image3: '',
    image4: '',
    image5: '',
    video1: '',
    basePrice: '',

    totalRoomsAvailable: '',
    blockDates: '',

    acceptTerms: false,
    acceptCommission: false,
    acceptRefundPolicy: false,

    commissionRate: '10',
    approvalStatus: 'PENDING',
    suspensionStatus: false,
    vendorApproved: false,
  })

  const [rooms, setRooms] = useState<RoomForm[]>([emptyRoom()])

  const progressClass = useMemo(
    () => ['w-[16%]', 'w-[33%]', 'w-1/2', 'w-[66%]', 'w-[83%]', 'w-full'][currentStep] || 'w-0',
    [currentStep],
  )

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const setRoomField = (index: number, key: keyof RoomForm, value: string) => {
    setRooms((prev) => prev.map((room, i) => (i === index ? { ...room, [key]: value } : room)))
    setErrors((prev) => ({ ...prev, [`room-${index}-${key}`]: '' }))
  }

  const buildSlug = () => {
    const generated = form.hotelName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setField('slug', generated)
  }

  const splitByComma = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const validateStep = () => {
    const nextErrors: Record<string, string> = {}

    if (currentStep === 0) {
      if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Valid email is required'
      if ((form.password || '').length < 8) nextErrors.password = 'Password must be at least 8 characters'
      if (!/^[6-9]\d{9}$/.test(form.phoneNumber)) nextErrors.phoneNumber = 'Enter valid 10-digit phone'
      if (!form.businessName.trim()) nextErrors.businessName = 'Business name is required'
    }

    if (currentStep === 1) {
      if (!form.businessAddress.trim()) nextErrors.businessAddress = 'Business address is required'
      if (!form.state.trim()) nextErrors.state = 'State is required'
      if (!/^\d{6}$/.test(form.pincode)) nextErrors.pincode = 'Valid 6-digit pincode is required'
      if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber)) {
        nextErrors.gstNumber = 'Invalid GST number format'
      }
      if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) {
        nextErrors.panNumber = 'Invalid PAN format'
      }
    }

    if (currentStep === 2) {
      if (!form.bankName.trim()) nextErrors.bankName = 'Bank name is required'
      if (!form.accountHolderName.trim()) nextErrors.accountHolderName = 'Account holder name is required'
      if (!form.accountNumber.trim()) nextErrors.accountNumber = 'Account number is required'
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode)) nextErrors.ifscCode = 'Invalid IFSC code'
    }

    if (currentStep === 3) {
      if (!form.hotelName.trim()) nextErrors.hotelName = 'Hotel name is required'
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) nextErrors.slug = 'Slug must be lowercase and hyphenated'
      if (form.description.trim().length < 40) nextErrors.description = 'Description must be at least 40 characters'
      if (form.shortDescription.trim().length < 10) nextErrors.shortDescription = 'Short description is required'
      if (!form.fullAddress.trim()) nextErrors.fullAddress = 'Full address is required'
      if (!form.latitude.trim()) nextErrors.latitude = 'Latitude is required'
      if (!form.longitude.trim()) nextErrors.longitude = 'Longitude is required'
      if (splitByComma(form.amenities).length === 0) nextErrors.amenities = 'At least one amenity is required'

      const imageUrls = [form.image1, form.image2, form.image3, form.image4, form.image5]
        .map((item) => item.trim())
        .filter(Boolean)
      if (imageUrls.length < 5) nextErrors.images = 'Minimum 5 image URLs are required'
      if (!form.video1.trim()) nextErrors.video1 = 'At least 1 video URL is required'
      if (!form.basePrice || Number(form.basePrice) <= 0) nextErrors.basePrice = 'Base price must be greater than 0'
    }

    if (currentStep === 4) {
      if (!form.totalRoomsAvailable || Number(form.totalRoomsAvailable) <= 0) {
        nextErrors.totalRoomsAvailable = 'Total rooms available is required'
      }

      rooms.forEach((room, index) => {
        if (!room.roomName.trim()) nextErrors[`room-${index}-roomName`] = 'Room name is required'
        if (!room.capacity || Number(room.capacity) <= 0) nextErrors[`room-${index}-capacity`] = 'Valid capacity is required'
        if (!room.pricePerNight || Number(room.pricePerNight) <= 0) {
          nextErrors[`room-${index}-pricePerNight`] = 'Price per night is required'
        }
        if (!room.totalRooms || Number(room.totalRooms) <= 0) nextErrors[`room-${index}-totalRooms`] = 'Total rooms is required'
        if (splitByComma(room.roomAmenities).length === 0) {
          nextErrors[`room-${index}-roomAmenities`] = 'At least one room amenity is required'
        }
        if (splitByComma(room.roomImages).length === 0) {
          nextErrors[`room-${index}-roomImages`] = 'At least one room image URL is required'
        }
      })
    }

    if (currentStep === 5) {
      if (!form.acceptTerms) nextErrors.acceptTerms = 'You must accept terms'
      if (!form.acceptCommission) nextErrors.acceptCommission = 'You must accept commission'
      if (!form.acceptRefundPolicy) nextErrors.acceptRefundPolicy = 'You must accept refund policy'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const nextStep = () => {
    if (!validateStep()) return
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const submitForm = async () => {
    if (!validateStep()) return
    setIsSubmitting(true)

    const imageUrls = [form.image1, form.image2, form.image3, form.image4, form.image5]
      .map((url) => url.trim())
      .filter(Boolean)

    const roomsPayload = rooms.map((room) => ({
      roomName: room.roomName.trim(),
      capacity: Number(room.capacity),
      extraBedCapacity: Number(room.extraBedCapacity || 0),
      pricePerNight: Number(room.pricePerNight),
      weekendPrice: room.weekendPrice ? Number(room.weekendPrice) : undefined,
      totalRooms: Number(room.totalRooms),
      roomAmenities: splitByComma(room.roomAmenities),
      roomImages: splitByComma(room.roomImages),
    }))

    const payload = {
      account: {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        businessName: form.businessName.trim(),
      },
      businessInfo: {
        businessAddress: form.businessAddress.trim(),
        city: form.city as (typeof CITY_OPTIONS)[number],
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        gstNumber: form.gstNumber.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
      },
      payout: {
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        upiId: form.upiId.trim() || undefined,
      },
      hotel: {
        hotelName: form.hotelName.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        fullAddress: form.fullAddress.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        amenities: splitByComma(form.amenities),
        highlights: splitByComma(form.highlights),
        images: imageUrls.map((url, index) => ({
          url,
          alt: `${form.hotelName || 'Hotel'} image ${index + 1}`,
          isPrimary: index === 0,
        })),
        videos: [form.video1.trim()],
        basePrice: Number(form.basePrice),
      },
      rooms: roomsPayload,
      inventory: {
        totalRoomsAvailable: Number(form.totalRoomsAvailable),
        blockDates: splitByComma(form.blockDates).map((date) => ({ date })),
      },
      legal: {
        acceptTerms: true as const,
        acceptCommission: true as const,
        acceptRefundPolicy: true as const,
      },
      adminControls: {
        commissionRate: Number(form.commissionRate || 10),
        approvalStatus: form.approvalStatus as (typeof APPROVAL_OPTIONS)[number],
        suspensionStatus: form.suspensionStatus,
        vendorApproved: form.vendorApproved,
      },
    }

    try {
      await vendorsService.createOnboardingVendor(payload)
      toast.success('Vendor onboarding created successfully.')
      navigate('/vendors')
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Unable to create vendor onboarding'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manual Vendor Onboarding" description="Create vendor, hotel, room and inventory in one admin flow." />

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  index === currentStep
                    ? 'bg-slate-900 text-white'
                    : index < currentStep
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className={`h-2 rounded-full bg-slate-900 ${progressClass}`} />
          </div>
        </CardContent>
      </Card>

      {currentStep === 0 ? (
        <Card>
          <CardHeader><CardTitle>1) Account Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full Name" value={form.fullName} onChange={(v) => setField('fullName', v)} error={errors.fullName} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setField('email', v)} error={errors.email} />
            <Field label="Password" type="password" value={form.password} onChange={(v) => setField('password', v)} error={errors.password} />
            <Field label="Phone Number" value={form.phoneNumber} onChange={(v) => setField('phoneNumber', v)} error={errors.phoneNumber} />
            <div className="md:col-span-2">
              <Field label="Business Name" value={form.businessName} onChange={(v) => setField('businessName', v)} error={errors.businessName} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 1 ? (
        <Card>
          <CardHeader><CardTitle>2) Business Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Business Address" value={form.businessAddress} onChange={(v) => setField('businessAddress', v)} error={errors.businessAddress} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">City</label>
              <select
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                title="City"
                aria-label="City"
              >
                {CITY_OPTIONS.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <Field label="State" value={form.state} onChange={(v) => setField('state', v)} error={errors.state} />
            <Field label="Pincode" value={form.pincode} onChange={(v) => setField('pincode', v)} error={errors.pincode} />
            <Field label="GST Number (Optional)" value={form.gstNumber} onChange={(v) => setField('gstNumber', v.toUpperCase())} error={errors.gstNumber} />
            <Field label="PAN Number (Optional)" value={form.panNumber} onChange={(v) => setField('panNumber', v.toUpperCase())} error={errors.panNumber} />
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card>
          <CardHeader><CardTitle>3) Payout / Bank Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Bank Name" value={form.bankName} onChange={(v) => setField('bankName', v)} error={errors.bankName} />
            <Field label="Account Holder Name" value={form.accountHolderName} onChange={(v) => setField('accountHolderName', v)} error={errors.accountHolderName} />
            <Field label="Account Number" value={form.accountNumber} onChange={(v) => setField('accountNumber', v)} error={errors.accountNumber} />
            <Field label="IFSC Code" value={form.ifscCode} onChange={(v) => setField('ifscCode', v.toUpperCase())} error={errors.ifscCode} />
            <div className="md:col-span-2">
              <Field label="UPI ID (Optional)" value={form.upiId} onChange={(v) => setField('upiId', v)} error={errors.upiId} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 3 ? (
        <Card>
          <CardHeader><CardTitle>4) Hotel Basic Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Hotel Name" value={form.hotelName} onChange={(v) => setField('hotelName', v)} error={errors.hotelName} />
              <div>
                <label className="text-sm font-semibold text-slate-600">Slug</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(e) => setField('slug', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    title="Hotel slug"
                    aria-label="Hotel slug"
                    placeholder="hotel-slug"
                  />
                  <button type="button" onClick={buildSlug} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Auto</button>
                </div>
                {errors.slug ? <p className="mt-1 text-xs text-rose-600">{errors.slug}</p> : null}
              </div>
            </div>

            <TextAreaField label="Description" value={form.description} onChange={(v) => setField('description', v)} error={errors.description} rows={5} />
            <TextAreaField label="Short Description" value={form.shortDescription} onChange={(v) => setField('shortDescription', v)} error={errors.shortDescription} rows={2} />
            <Field label="Full Address" value={form.fullAddress} onChange={(v) => setField('fullAddress', v)} error={errors.fullAddress} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Latitude" value={form.latitude} onChange={(v) => setField('latitude', v)} error={errors.latitude} />
              <Field label="Longitude" value={form.longitude} onChange={(v) => setField('longitude', v)} error={errors.longitude} />
              <Field label="Base Price" value={form.basePrice} onChange={(v) => setField('basePrice', v)} error={errors.basePrice} />
            </div>

            <TextAreaField
              label="Amenities (comma separated)"
              value={form.amenities}
              onChange={(v) => setField('amenities', v)}
              error={errors.amenities}
              rows={2}
            />
            <TextAreaField
              label="Highlights (comma separated)"
              value={form.highlights}
              onChange={(v) => setField('highlights', v)}
              rows={2}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Image URL 1" value={form.image1} onChange={(v) => setField('image1', v)} />
              <Field label="Image URL 2" value={form.image2} onChange={(v) => setField('image2', v)} />
              <Field label="Image URL 3" value={form.image3} onChange={(v) => setField('image3', v)} />
              <Field label="Image URL 4" value={form.image4} onChange={(v) => setField('image4', v)} />
              <Field label="Image URL 5" value={form.image5} onChange={(v) => setField('image5', v)} />
              <Field label="Video URL (mandatory)" value={form.video1} onChange={(v) => setField('video1', v)} error={errors.video1} />
            </div>
            {errors.images ? <p className="text-xs text-rose-600">{errors.images}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 4 ? (
        <Card>
          <CardHeader><CardTitle>5) Room Details + Inventory Setup</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Total Rooms Available (all rooms)"
                value={form.totalRoomsAvailable}
                onChange={(v) => setField('totalRoomsAvailable', v)}
                error={errors.totalRoomsAvailable}
              />
              <Field
                label="Block Dates (comma separated YYYY-MM-DD)"
                value={form.blockDates}
                onChange={(v) => setField('blockDates', v)}
              />
            </div>

            {rooms.map((room, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Room {index + 1}</h4>
                  {rooms.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600"
                      onClick={() => setRooms((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Room Name" value={room.roomName} onChange={(v) => setRoomField(index, 'roomName', v)} error={errors[`room-${index}-roomName`]} />
                  <Field label="Capacity" value={room.capacity} onChange={(v) => setRoomField(index, 'capacity', v)} error={errors[`room-${index}-capacity`]} />
                  <Field label="Extra Bed Capacity" value={room.extraBedCapacity} onChange={(v) => setRoomField(index, 'extraBedCapacity', v)} />
                  <Field label="Price Per Night" value={room.pricePerNight} onChange={(v) => setRoomField(index, 'pricePerNight', v)} error={errors[`room-${index}-pricePerNight`]} />
                  <Field label="Weekend Price (Optional)" value={room.weekendPrice} onChange={(v) => setRoomField(index, 'weekendPrice', v)} />
                  <Field label="Total Rooms" value={room.totalRooms} onChange={(v) => setRoomField(index, 'totalRooms', v)} error={errors[`room-${index}-totalRooms`]} />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Room Amenities (comma separated)"
                      value={room.roomAmenities}
                      onChange={(v) => setRoomField(index, 'roomAmenities', v)}
                      error={errors[`room-${index}-roomAmenities`]}
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Room Image URLs (comma separated)"
                      value={room.roomImages}
                      onChange={(v) => setRoomField(index, 'roomImages', v)}
                      error={errors[`room-${index}-roomImages`]}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setRooms((prev) => [...prev, emptyRoom()])}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Add Another Room
            </button>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 5 ? (
        <Card>
          <CardHeader><CardTitle>6) Legal & Admin Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <CheckField
              label="Accept Terms"
              checked={form.acceptTerms}
              onChange={(checked) => setField('acceptTerms', checked)}
              error={errors.acceptTerms}
            />
            <CheckField
              label="Accept Commission"
              checked={form.acceptCommission}
              onChange={(checked) => setField('acceptCommission', checked)}
              error={errors.acceptCommission}
            />
            <CheckField
              label="Accept Refund Policy"
              checked={form.acceptRefundPolicy}
              onChange={(checked) => setField('acceptRefundPolicy', checked)}
              error={errors.acceptRefundPolicy}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Commission Rate (%)"
                value={form.commissionRate}
                onChange={(v) => setField('commissionRate', v)}
              />
              <div>
                <label className="text-sm font-semibold text-slate-600">Approval Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.approvalStatus}
                  onChange={(e) => setField('approvalStatus', e.target.value)}
                  title="Approval status"
                  aria-label="Approval status"
                >
                  {APPROVAL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CheckField label="Vendor Approved" checked={form.vendorApproved} onChange={(checked) => setField('vendorApproved', checked)} />
              <CheckField label="Suspended" checked={form.suspensionStatus} onChange={(checked) => setField('suspensionStatus', checked)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Back
            </button>
          ) : null}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
}) {
  const inputId = useId()
  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold text-slate-600">{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        title={label}
        placeholder={label}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  rows?: number
}) {
  const textAreaId = useId()
  return (
    <div>
      <label htmlFor={textAreaId} className="text-sm font-semibold text-slate-600">{label}</label>
      <textarea
        id={textAreaId}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        title={label}
        placeholder={label}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}

function CheckField({
  label,
  checked,
  onChange,
  error,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  error?: string
}) {
  const checkId = useId()
  return (
    <label htmlFor={checkId} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
      <input
        id={checkId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
        title={label}
      />
      <span>
        <span className="font-medium">{label}</span>
        {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
      </span>
    </label>
  )
}
