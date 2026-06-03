import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Image as ImageIcon, Wifi, Sparkles, Bed,
    ShieldCheck, ClipboardCheck, ChevronLeft, ChevronRight,
    Check, MapPin, Video, Plus, Trash2, Clock, Percent
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { ImageUpload } from '../components/ui/ImageUpload'
import { propertiesService } from '../lib/properties'
import { getFieldErrors } from '../lib/errorUtils'

const HOTEL_FORM_STORAGE_KEY = 'hotel_form_autosave'

const loadSavedHotelForm = () => {
    try {
        const saved = localStorage.getItem(HOTEL_FORM_STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed && parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
                return parsed.values
            }
        }
    } catch (e) {
        console.error('Failed to load saved hotel form:', e)
    }
    return null
}

const saveHotelFormToStorage = (values: any) => {
    try {
        localStorage.setItem(HOTEL_FORM_STORAGE_KEY, JSON.stringify({
            values,
            savedAt: Date.now()
        }))
    } catch (e) {
        console.error('Failed to save hotel form:', e)
    }
}

const clearSavedHotelForm = () => {
    try {
        localStorage.removeItem(HOTEL_FORM_STORAGE_KEY)
    } catch (e) {
        console.error('Failed to clear saved hotel form:', e)
    }
}

/* ─── constants ─── */
const STEPS = [
    { label: 'Basic Info', icon: Building2 },
    { label: 'Media', icon: ImageIcon },
    { label: 'Amenities', icon: Wifi },
    { label: 'Highlights', icon: Sparkles },
    { label: 'Rooms', icon: Bed },
    { label: 'Policies', icon: ShieldCheck },
    { label: 'Review', icon: ClipboardCheck },
] as const

const AMENITIES = [
    'Free WiFi', 'AC', 'Parking', 'Lift', 'Restaurant',
    'Room Service', 'TV', 'CCTV', '24/7 Reception', 'Laundry',
    'Gym', 'Spa', 'Pool', 'Bar', 'Business Center',
    'Conference Room', 'Garden', 'Rooftop', 'Kitchen', 'Hot Water',
    'Power Backup', 'EV Charging', 'Pet Friendly', 'Wheelchair Access',
]

const HIGHLIGHTS = [
    'Near Railway Station', 'Near Bus Stand', 'Near Airport',
    'Sea View', 'Hill View', 'Lake View', 'River View',
    'Family Friendly', 'Budget Friendly', 'Luxury Stay',
    'Heritage Property', 'Eco Friendly', 'Temple Nearby',
    'Beach Nearby', 'Shopping Area Nearby', 'Nightlife',
]

const ROOM_AMENITIES = [
    'AC', 'TV', 'WiFi', 'Mini Bar', 'Safe', 'Balcony',
    'Hot Water', 'Room Service', 'Wardrobe', 'Desk',
    'Iron', 'Hair Dryer', 'Coffee Maker', 'Bathtub',
]

const CANCELLATION_POLICIES = [
    { value: 'FREE_CANCELLATION', label: 'Free Cancellation (24h before check-in)' },
    { value: 'MODERATE', label: 'Moderate (48h before, 50% refund within 24h)' },
    { value: 'STRICT', label: 'Strict (72h before, no refund within 48h)' },
    { value: 'NON_REFUNDABLE', label: 'Non-refundable' },
]

/* ─── types ─── */
type RoomForm = {
    roomName: string
    description: string
    capacity: string
    extraBedCapacity: string
    pricePerNight: string
    weekendPrice: string
    totalRooms: string
    roomAmenities: string[]
    roomImages: string[]
    roomVideos: { url: string; alt: string }[]
}

const emptyRoom = (): RoomForm => ({
    roomName: '',
    description: '',
    capacity: '2',
    extraBedCapacity: '0',
    pricePerNight: '',
    weekendPrice: '',
    totalRooms: '1',
    roomAmenities: [],
    roomImages: [],
    roomVideos: [],
})

/* ─── animations ─── */
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

/* ═══════════════════════════════════════════════════════ */
export default function AddHotel() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [direction, setDirection] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    /* ── form state ── */
    const [basic, setBasic] = useState({
        hotelName: '', slug: '', shortDescription: '', description: '',
        city: 'VIJAYAWADA' as string, address: '', landmark: '',
        latitude: '', longitude: '', pincode: '', state: 'Andhra Pradesh',
    })

    const [images, setImages] = useState<string[]>(['', '', '', '', ''])
    const [videoUrl, setVideoUrl] = useState('')
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0)

    const [amenities, setAmenities] = useState<string[]>([])
    const [newAmenity, setNewAmenity] = useState('')
    const [highlights, setHighlights] = useState<string[]>([])

    const [rooms, setRooms] = useState<RoomForm[]>([emptyRoom()])

    const [policies, setPolicies] = useState({
        basePrice: '', taxPercent: '18',
        cancellationPolicy: 'FREE_CANCELLATION',
        checkInTime: '14:00', checkOutTime: '11:00',
    })
    const [cityOptions, setCityOptions] = useState<string[]>([])

    useEffect(() => {
        propertiesService.getCityNames().then(setCityOptions).catch(() => {})
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            saveHotelFormToStorage({ basic, images, videoUrl, amenities, highlights, rooms, policies })
        }, 1000)
        return () => clearTimeout(timer)
    }, [basic, images, videoUrl, amenities, highlights, rooms, policies])

    /* ── helpers ── */
    const setBasicField = (key: keyof typeof basic, v: string) => {
        setBasic(prev => ({ ...prev, [key]: v }))
        setErrors(prev => ({ ...prev, [key]: '' }))
    }

    const setPolicyField = (key: keyof typeof policies, v: string) => {
        setPolicies(prev => ({ ...prev, [key]: v }))
        setErrors(prev => ({ ...prev, [key]: '' }))
    }

    const buildSlug = () => {
        const slug = basic.hotelName.trim().toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
            .replace(/-+/g, '-').replace(/^-|-$/g, '')
        setBasicField('slug', slug)
    }

    const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
        setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
    }

    const addAmenity = () => {
        const trimmed = newAmenity.trim()
        if (!trimmed || amenities.includes(trimmed)) return
        setAmenities(prev => [...prev, trimmed])
        setNewAmenity('')
    }

    const setRoomField = (idx: number, key: keyof RoomForm, value: any) => {
        setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r))
        setErrors(prev => ({ ...prev, [`room-${idx}-${key}`]: '' }))
    }

    const addImageSlot = () => { setImages([...images, '']) }
    const removeImageSlot = (idx: number) => {
        if (images.length <= 5) return
        const next = images.filter((_, i) => i !== idx)
        setImages(next)
        if (primaryImageIndex >= next.length) setPrimaryImageIndex(0)
        else if (primaryImageIndex === idx) setPrimaryImageIndex(0)
        else if (primaryImageIndex > idx) setPrimaryImageIndex(primaryImageIndex - 1)
    }

    const addRoomImageSlot = (roomIdx: number) => {
        setRooms(prev => prev.map((r, i) =>
            i === roomIdx ? { ...r, roomImages: [...r.roomImages, ''] } : r
        ))
    }

    /* ── validation ── */
    const validate = (): boolean => {
        const e: Record<string, string> = {}

        if (step === 0) {
            if (!basic.hotelName.trim()) e.hotelName = 'Hotel name is required'
            if (!basic.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(basic.slug))
                e.slug = 'Valid slug is required (e.g. grand-hotel)'
            if (basic.shortDescription.trim().length < 10) e.shortDescription = 'At least 10 characters'
            if (basic.description.trim().length < 40) e.description = 'At least 40 characters'
            if (!basic.city) e.city = 'City is required'
            if (!basic.address.trim()) e.address = 'Address is required'
            if (!basic.pincode.trim() || !/^\d{6}$/.test(basic.pincode)) e.pincode = 'Valid 6-digit pincode'
            if (!basic.latitude.trim()) e.latitude = 'Latitude is required'
            if (!basic.longitude.trim()) e.longitude = 'Longitude is required'
        }

        if (step === 1) {
            const filled = images.filter(u => u.trim()).length
            if (filled < 5) e.images = `Minimum 5 images required (${filled}/5)`
            if (!videoUrl.trim()) e.videoUrl = 'At least 1 video URL is required'
        }

        if (step === 2) {
            if (amenities.length === 0) e.amenities = 'Select at least 1 amenity'
        }

        // Step 3 – highlights are optional, no validation needed

        if (step === 4) {
            rooms.forEach((room, idx) => {
                if (!room.roomName.trim()) e[`room-${idx}-roomName`] = 'Room name is required'
                if (!room.pricePerNight || Number(room.pricePerNight) <= 0)
                    e[`room-${idx}-pricePerNight`] = 'Valid price is required'
                if (!room.totalRooms || Number(room.totalRooms) <= 0)
                    e[`room-${idx}-totalRooms`] = 'At least 1 room'
                if (!room.capacity || Number(room.capacity) <= 0)
                    e[`room-${idx}-capacity`] = 'Valid capacity required'
                if (room.roomAmenities.length === 0)
                    e[`room-${idx}-roomAmenities`] = 'Select at least 1 amenity'
            })
        }

        if (step === 5) {
            if (!policies.basePrice || Number(policies.basePrice) <= 0) e.basePrice = 'Valid base price required'
            if (!policies.checkInTime) e.checkInTime = 'Check-in time required'
            if (!policies.checkOutTime) e.checkOutTime = 'Check-out time required'
        }

        setErrors(e)
        return Object.keys(e).length === 0
    }

    const goNext = () => {
        if (!validate()) { 
            const errorCount = Object.keys(errors).length
            if (errorCount === 1) {
                const field = Object.keys(errors)[0].replace(/-\d+/, '').replace(/([A-Z])/g, ' $1')
                toast.error(`Missing: ${field}`)
            } else {
                const fields = Object.keys(errors).slice(0, 3).map(f => f.replace(/-\d+/, '').replace(/([A-Z])/g, ' $1'))
                toast.error(`Missing ${errorCount} fields: ${fields.join(', ')}${errorCount > 3 ? '...' : ''}`)
            }
            return 
        }
        setDirection(1)
        setStep(s => Math.min(s + 1, STEPS.length - 1))
    }

    const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)) }

    const jumpTo = (target: number) => {
        if (target < step) { setDirection(-1); setStep(target) }
    }

    /* ── submit ── */
    const handleSubmit = async () => {
        setIsSubmitting(true)
        const imagePayload = images.filter(u => u.trim()).map((url, idx) => ({
            url, alt: `${basic.hotelName} image ${idx + 1}`, isPrimary: idx === primaryImageIndex,
        }))

        const payload: any = {
            name: basic.hotelName.trim(),
            type: 'HOTEL',
            city: basic.city,
            address: basic.address.trim(),
            state: basic.state.trim(),
            pincode: basic.pincode.trim(),
            description: basic.description.trim(),
            shortDesc: basic.shortDescription.trim(),
            slug: basic.slug.trim(),
            landmark: basic.landmark.trim() || undefined,
            latitude: Number(basic.latitude),
            longitude: Number(basic.longitude),
            images: imagePayload,
            videos: videoUrl.trim() ? [videoUrl.trim()] : [],
            amenities,
            highlights,
            basePrice: Number(policies.basePrice),
            taxPercent: Number(policies.taxPercent) || 18,
            cancellationPolicy: policies.cancellationPolicy,
            checkInTime: policies.checkInTime,
            checkOutTime: policies.checkOutTime,
            status: 'DRAFT',
            rooms: rooms.map(r => ({
                roomName: r.roomName.trim(),
                description: r.description.trim() || undefined,
                capacity: Number(r.capacity),
                extraBedCapacity: Number(r.extraBedCapacity || 0),
                pricePerNight: Number(r.pricePerNight),
                weekendPrice: r.weekendPrice ? Number(r.weekendPrice) : undefined,
                totalRooms: Number(r.totalRooms),
                roomAmenities: r.roomAmenities,
                roomImages: r.roomImages.filter(u => u.trim()),
                roomVideo: r.roomVideos?.[0]?.url || undefined,
            })),
        }

        try {
            await propertiesService.createProperty(payload)
            toast.success('Hotel created successfully!')
            clearSavedHotelForm()
            navigate('/properties')
        } catch (err: any) {
            toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to create hotel.')
        } finally {
            setIsSubmitting(false)
        }
    }

    /* ── progress ── */
    const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step])

    /* ═══════════════════ RENDER ═══════════════════ */
    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-24">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Add New Hotel
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Follow the steps below to create a hotel listing.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/properties')}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                    Cancel
                </button>
            </div>

            {/* ── Step Indicator ── */}
            <Card className="overflow-hidden border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
                <CardContent className="pt-5 pb-4 px-6">
                    {/* progress bar */}
                    <div className="mb-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                    {/* step pills */}
                    <div className="flex flex-wrap gap-2">
                        {STEPS.map(({ label, icon: Icon }, idx) => {
                            const done = idx < step
                            const active = idx === step
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => jumpTo(idx)}
                                    disabled={idx > step}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${active
                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50'
                                        : done
                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-pointer hover:bg-emerald-100'
                                            : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    <span className="hidden sm:inline">{label}</span>
                                    <span className="sm:hidden">{idx + 1}</span>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Step Content ── */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                    {step === 0 && <StepBasicInfo basic={basic} setField={(k, v) => setBasicField(k as keyof typeof basic, v)} buildSlug={buildSlug} errors={errors} cityOptions={cityOptions} />}
                    {step === 1 && <StepMedia images={images} setImages={setImages} videoUrl={videoUrl} setVideoUrl={setVideoUrl} primaryImageIndex={primaryImageIndex} setPrimaryImageIndex={setPrimaryImageIndex} addImageSlot={addImageSlot} removeImageSlot={removeImageSlot} errors={errors} setErrors={setErrors} />}
                    {step === 2 && <StepAmenities selected={amenities} toggle={(a) => toggleItem(amenities, a, setAmenities)} errors={errors} options={AMENITIES} newAmenity={newAmenity} setNewAmenity={setNewAmenity} addAmenity={addAmenity} />}
                    {step === 3 && <StepHighlights selected={highlights} toggle={(h) => toggleItem(highlights, h, setHighlights)} />}
                    {step === 4 && <StepRooms rooms={rooms} setRooms={setRooms} setRoomField={setRoomField} addRoomImageSlot={addRoomImageSlot} errors={errors} />}
                    {step === 5 && <StepPolicies policies={policies} setField={(k, v) => setPolicyField(k as keyof typeof policies, v)} errors={errors} />}
                    {step === 6 && <StepReview basic={basic} images={images} videoUrl={videoUrl} amenities={amenities} highlights={highlights} rooms={rooms} policies={policies} primaryImageIndex={primaryImageIndex} />}
                </motion.div>
            </AnimatePresence>

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </button>

                {step < STEPS.length - 1 ? (
                    <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:shadow-indigo-200/60"
                    >
                        Continue <ChevronRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating…' : '🚀 Publish Hotel'}
                    </button>
                )}
            </div>
        </div>
    )
}

/* ═════════════════════════════════════════════════════════ */
/*  STEP COMPONENTS                                        */
/* ═════════════════════════════════════════════════════════ */

/* ── Step 1: Basic Info ── */
function StepBasicInfo({ basic, setField, buildSlug, errors, cityOptions }: {
    basic: Record<string, string>; setField: (k: string, v: string) => void; buildSlug: () => void; errors: Record<string, string>; cityOptions: string[]
}) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-indigo-500" /> Basic Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <FormField label="Hotel Name *" value={basic.hotelName} onChange={v => setField('hotelName', v)} error={errors.hotelName} placeholder="e.g., Grand Vijayawada Inn" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Slug *</label>
                        <div className="flex gap-2">
                            <input value={basic.slug} onChange={e => setField('slug', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition" placeholder="grand-vijayawada-inn" />
                            <button type="button" onClick={buildSlug} className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Auto</button>
                        </div>
                        {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">City *</label>
                        <select value={basic.city} onChange={e => setField('city', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition">
                            <option value="">Select city</option>
                            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city}</p>}
                    </div>
                </div>

                <FormField label="Short Description *" value={basic.shortDescription} onChange={v => setField('shortDescription', v)} error={errors.shortDescription} placeholder="Brief tagline for listing previews" />

                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">Full Description *</label>
                    <textarea value={basic.description} onChange={e => setField('description', e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition" placeholder="Detailed hotel description for guests…" />
                    {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <FormField label="Full Address *" value={basic.address} onChange={v => setField('address', v)} error={errors.address} placeholder="Street address, area" />
                    </div>
                    <FormField label="Landmark (optional)" value={basic.landmark} onChange={v => setField('landmark', v)} placeholder="Near bus stand, temple, etc." />
                    <FormField label="Pincode *" value={basic.pincode} onChange={v => setField('pincode', v)} error={errors.pincode} placeholder="520001" />
                    <FormField label="State" value={basic.state} onChange={v => setField('state', v)} placeholder="Andhra Pradesh" />
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                        <MapPin className="h-4 w-4" /> GPS Coordinates
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Latitude *" value={basic.latitude} onChange={v => setField('latitude', v)} error={errors.latitude} placeholder="16.5062" />
                        <FormField label="Longitude *" value={basic.longitude} onChange={v => setField('longitude', v)} error={errors.longitude} placeholder="80.6480" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/* ── Step 2: Media ── */
function StepMedia({ images, setImages, videoUrl, setVideoUrl, primaryImageIndex, setPrimaryImageIndex, addImageSlot, removeImageSlot, errors, setErrors }: {
    images: string[]; setImages: (v: string[]) => void; videoUrl: string; setVideoUrl: (v: string) => void;
    primaryImageIndex: number; setPrimaryImageIndex: (v: number) => void;
    addImageSlot: () => void; removeImageSlot: (i: number) => void;
    errors: Record<string, string>; setErrors: (v: Record<string, string>) => void
}) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-pink-50/80 to-orange-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5 text-pink-500" /> Media
                    <span className="ml-auto rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-bold text-pink-700">Min 5 images + 1 video</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <p className="text-sm text-slate-500">Paste image URLs below. Click <strong>★ Primary</strong> to choose the listing thumbnail.</p>

                <div className="space-y-3">
                    {images.map((url, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                                    <input
                                        value={url}
                                        onChange={e => {
                                            const next = [...images]; next[idx] = e.target.value; setImages(next)
                                            setErrors({ ...errors, images: '' })
                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition"
                                        placeholder={`Image URL ${idx + 1}`}
                                    />
                                </div>
                                {url.trim() && (
                                    <div className="ml-8 mt-1.5">
                                        <img src={url} alt="" className="h-16 w-24 rounded-lg border object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPrimaryImageIndex(idx)}
                                className={`mt-1 shrink-0 rounded-lg px-2.5 py-2 text-xs font-bold transition ${primaryImageIndex === idx
                                    ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                ★
                            </button>
                            {images.length > 5 && (
                                <button type="button" onClick={() => removeImageSlot(idx)} className="mt-1 shrink-0 rounded-lg bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {errors.images && <p className="text-xs font-medium text-rose-600">{errors.images}</p>}

                <button type="button" onClick={addImageSlot} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700 transition">
                    <Plus className="h-3.5 w-3.5" /> Add Image Slot
                </button>

                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700">
                        <Video className="h-4 w-4" /> Video URL (Mandatory)
                    </div>
                    <input
                        value={videoUrl}
                        onChange={e => { setVideoUrl(e.target.value); setErrors({ ...errors, videoUrl: '' }) }}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
                        placeholder="YouTube or direct video URL"
                    />
                    {errors.videoUrl && <p className="mt-1 text-xs text-rose-600">{errors.videoUrl}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

/* ── Step 3: Amenities ── */
function StepAmenities({ selected, toggle, errors, options, newAmenity, setNewAmenity, addAmenity }: { selected: string[]; toggle: (a: string) => void; errors: Record<string, string>; options: string[]; newAmenity: string; setNewAmenity: (value: string) => void; addAmenity: () => void }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Wifi className="h-5 w-5 text-emerald-500" /> Amenities
                    <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">{selected.length} selected</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
                <p className="mb-4 text-sm text-slate-500">Select facilities available at your hotel. These appear on filters and the listing page.</p>
                <div className="mb-4">
                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Add New Amenity</label>
                    <div className="flex gap-2">
                        <input
                            value={newAmenity}
                            onChange={e => setNewAmenity(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                            placeholder="Add a new amenity"
                        />
                        <button type="button" onClick={addAmenity} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                            Add
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {options.map(a => (
                        <button
                            key={a} type="button" onClick={() => toggle(a)}
                            className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${selected.includes(a)
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {selected.includes(a) ? '✓ ' : ''}{a}
                        </button>
                    ))}
                </div>
                {errors.amenities && <p className="mt-3 text-xs font-medium text-rose-600">{errors.amenities}</p>}
            </CardContent>
        </Card>
    )
}

/* ── Step 4: Highlights ── */
function StepHighlights({ selected, toggle }: { selected: string[]; toggle: (h: string) => void }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50/80 to-yellow-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-amber-500" /> Highlights
                    <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Optional</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
                <p className="mb-4 text-sm text-slate-500">Choose marketing highlights that help guests discover your hotel.</p>
                <div className="flex flex-wrap gap-2">
                    {HIGHLIGHTS.map(h => (
                        <button
                            key={h} type="button" onClick={() => toggle(h)}
                            className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${selected.includes(h)
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {selected.includes(h) ? '✓ ' : ''}{h}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/* ── Step 5: Rooms ── */
function StepRooms({ rooms, setRooms, setRoomField, addRoomImageSlot, errors }: {
    rooms: RoomForm[]; setRooms: React.Dispatch<React.SetStateAction<RoomForm[]>>;
    setRoomField: (idx: number, key: keyof RoomForm, value: any) => void;
    addRoomImageSlot: (roomIdx: number) => void;
    errors: Record<string, string>
}) {
    return (
        <div className="space-y-4">
            {rooms.map((room, idx) => (
                <Card key={idx} className="border-slate-200/60 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-cyan-50/80">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Bed className="h-5 w-5 text-blue-500" /> Room {idx + 1}
                            </CardTitle>
                            {rooms.length > 1 && (
                                <button type="button" onClick={() => setRooms(prev => prev.filter((_, i) => i !== idx))} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition">
                                    Remove
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField label="Room Name *" value={room.roomName} onChange={v => setRoomField(idx, 'roomName', v)} error={errors[`room-${idx}-roomName`]} placeholder="e.g., Deluxe Double" />
                            <FormField label="Capacity *" value={room.capacity} onChange={v => setRoomField(idx, 'capacity', v)} error={errors[`room-${idx}-capacity`]} placeholder="2" />
                            <FormField label="Extra Bed Capacity" value={room.extraBedCapacity} onChange={v => setRoomField(idx, 'extraBedCapacity', v)} placeholder="0" />
                            <FormField label="Price Per Night (₹) *" value={room.pricePerNight} onChange={v => setRoomField(idx, 'pricePerNight', v)} error={errors[`room-${idx}-pricePerNight`]} placeholder="1500" />
                            <FormField label="Weekend Price (₹)" value={room.weekendPrice} onChange={v => setRoomField(idx, 'weekendPrice', v)} placeholder="Optional" />
                            <FormField label="Total Rooms *" value={room.totalRooms} onChange={v => setRoomField(idx, 'totalRooms', v)} error={errors[`room-${idx}-totalRooms`]} placeholder="10" />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-600">Description</label>
                            <textarea value={room.description} onChange={e => setRoomField(idx, 'description', e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition" placeholder="Room description…" />
                        </div>

                        {/* Room Amenities */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-600">Room Amenities *</label>
                            <div className="flex flex-wrap gap-2">
                                {ROOM_AMENITIES.map(a => (
                                    <button
                                        key={a} type="button"
                                        onClick={() => {
                                            const cur = room.roomAmenities
                                            setRoomField(idx, 'roomAmenities', cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a])
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${room.roomAmenities.includes(a)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {room.roomAmenities.includes(a) ? '✓ ' : ''}{a}
                                    </button>
                                ))}
                            </div>
                            {errors[`room-${idx}-roomAmenities`] && <p className="mt-1 text-xs text-rose-600">{errors[`room-${idx}-roomAmenities`]}</p>}
                        </div>

                        {/* Room Images */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-600">Room Images</label>
                            <div className="space-y-2">
                                {room.roomImages.map((url, imgIdx) => (
                                    <div key={imgIdx} className="flex items-center gap-2">
                                        <input
                                            value={url}
                                            onChange={e => {
                                                const next = [...room.roomImages]; next[imgIdx] = e.target.value
                                                setRoomField(idx, 'roomImages', next)
                                            }}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                                            placeholder={`Room image URL ${imgIdx + 1}`}
                                        />
                                        <button type="button" onClick={() => {
                                            setRoomField(idx, 'roomImages', room.roomImages.filter((_, i) => i !== imgIdx))
                                        }} className="rounded-lg bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => addRoomImageSlot(idx)} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-400 transition">
                                <Plus className="h-3 w-3" /> Add Image
                            </button>
                        </div>

                        {/* Room Video - Optional for Admin */}
                        <div className="mt-4">
                            <ImageUpload
                                images={room.roomVideos}
                                onChange={(videos) => setRoomField(idx, 'roomVideos', videos)}
                                maxImages={1}
                                folder={`hosthaven/rooms/${idx}`}
                                resourceType="video"
                                label="Room Video"
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            <button
                type="button"
                onClick={() => setRooms(prev => [...prev, emptyRoom()])}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition"
            >
                <Plus className="mr-2 inline h-4 w-4" /> Add Another Room Type
            </button>
        </div>
    )
}

/* ── Step 6: Policies ── */
function StepPolicies({ policies, setField, errors }: {
    policies: any; setField: (k: string, v: string) => void; errors: Record<string, string>
}) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-rose-50/80 to-pink-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-rose-500" /> Pricing & Policies
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Base Price (₹) *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm text-slate-400">₹</span>
                            <input value={policies.basePrice} onChange={e => setField('basePrice', e.target.value)} className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition" placeholder="1500" />
                        </div>
                        {errors.basePrice && <p className="mt-1 text-xs text-rose-600">{errors.basePrice}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Tax Percentage (%)</label>
                        <div className="relative">
                            <input value={policies.taxPercent} onChange={e => setField('taxPercent', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition" placeholder="18" />
                            <Percent className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">Cancellation Policy *</label>
                    <div className="space-y-2">
                        {CANCELLATION_POLICIES.map(p => (
                            <label key={p.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${policies.cancellationPolicy === p.value
                                ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-200'
                                : 'border-slate-200 hover:bg-slate-50'
                                }`}>
                                <input type="radio" name="cancellation" value={p.value} checked={policies.cancellationPolicy === p.value} onChange={e => setField('cancellationPolicy', e.target.value)} className="h-4 w-4 accent-rose-600" />
                                <span className="text-sm font-medium text-slate-700">{p.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                            <Clock className="h-3.5 w-3.5" /> Check-in Time *
                        </label>
                        <input type="time" value={policies.checkInTime} onChange={e => setField('checkInTime', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition" />
                        {errors.checkInTime && <p className="mt-1 text-xs text-rose-600">{errors.checkInTime}</p>}
                    </div>
                    <div>
                        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                            <Clock className="h-3.5 w-3.5" /> Check-out Time *
                        </label>
                        <input type="time" value={policies.checkOutTime} onChange={e => setField('checkOutTime', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition" />
                        {errors.checkOutTime && <p className="mt-1 text-xs text-rose-600">{errors.checkOutTime}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/* ── Step 7: Review ── */
function StepReview({ basic, images, videoUrl, amenities, highlights, rooms, policies, primaryImageIndex }: any) {
    const filledImages = images.filter((u: string) => u.trim())
    return (
        <div className="space-y-4">
            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-purple-50/80">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ClipboardCheck className="h-5 w-5 text-violet-500" /> Review & Publish
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                    {/* Basic Info Summary */}
                    <ReviewSection title="Basic Info" items={[
                        ['Hotel Name', basic.hotelName],
                        ['Slug', basic.slug],
                        ['City', basic.city],
                        ['Address', basic.address],
                        ['Landmark', basic.landmark || '—'],
                        ['Pincode', basic.pincode],
                        ['Coordinates', `${basic.latitude}, ${basic.longitude}`],
                    ]} />

                    <ReviewSection title="Descriptions" items={[
                        ['Short', basic.shortDescription],
                        ['Full', basic.description],
                    ]} />

                    {/* Media Summary */}
                    <div>
                        <h4 className="mb-2 text-sm font-bold text-slate-900">Media</h4>
                        <div className="flex flex-wrap gap-2">
                            {filledImages.map((url: string, idx: number) => (
                                <div key={idx} className={`relative h-16 w-24 rounded-lg border-2 overflow-hidden ${idx === primaryImageIndex ? 'border-amber-400' : 'border-slate-200'}`}>
                                    <img src={url} alt="" className="h-full w-full object-cover" onError={e => (e.currentTarget.src = '')} />
                                    {idx === primaryImageIndex && <span className="absolute top-0.5 right-0.5 rounded bg-amber-400 px-1 text-[9px] font-bold text-white">★</span>}
                                </div>
                            ))}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{filledImages.length} images · {videoUrl ? '1 video' : 'No video'}</p>
                    </div>

                    {/* Amenities & Highlights */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="mb-2 text-sm font-bold text-slate-900">Amenities ({amenities.length})</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {amenities.map((a: string) => <span key={a} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">{a}</span>)}
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-2 text-sm font-bold text-slate-900">Highlights ({highlights.length})</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {highlights.length ? highlights.map((h: string) => <span key={h} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">{h}</span>) : <span className="text-xs text-slate-400">None selected</span>}
                            </div>
                        </div>
                    </div>

                    {/* Rooms */}
                    <div>
                        <h4 className="mb-2 text-sm font-bold text-slate-900">Rooms ({rooms.length})</h4>
                        <div className="space-y-2">
                            {rooms.map((r: RoomForm, idx: number) => (
                                <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">{r.roomName || `Room ${idx + 1}`}</p>
                                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">₹{r.pricePerNight}/night</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{r.capacity} guests · {r.totalRooms} rooms · {r.roomAmenities.length} amenities</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Policies */}
                    <ReviewSection title="Pricing & Policies" items={[
                        ['Base Price', `₹${policies.basePrice}`],
                        ['Tax', `${policies.taxPercent}%`],
                        ['Cancellation', CANCELLATION_POLICIES.find((p: any) => p.value === policies.cancellationPolicy)?.label || policies.cancellationPolicy],
                        ['Check-in', policies.checkInTime],
                        ['Check-out', policies.checkOutTime],
                    ]} />
                </CardContent>
            </Card>
        </div>
    )
}

/* ═════════════════════════════════════════════════════════ */
/*  SHARED COMPONENTS                                       */
/* ═════════════════════════════════════════════════════════ */

function FormField({ label, value, onChange, error, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string
}) {
    const id = useId()
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-600">{label}</label>
            <input
                id={id} type={type} value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                placeholder={placeholder}
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    )
}

function ReviewSection({ title, items }: { title: string; items: [string, string][] }) {
    return (
        <div>
            <h4 className="mb-2 text-sm font-bold text-slate-900">{title}</h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {items.map(([k, v]) => (
                        <div key={k}>
                            <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{k}</dt>
                            <dd className="text-sm text-slate-900 break-words">{v || '—'}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    )
}
