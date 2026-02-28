import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home, Image as ImageIcon, Users, DollarSign,
    ScrollText, CalendarCheck, Rocket, ChevronLeft, ChevronRight,
    Check, MapPin, Video, Plus, Trash2, Clock, Percent
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { propertiesService } from '../lib/properties'

const STEPS = [
    { label: 'Basic Info', icon: Home },
    { label: 'Media', icon: ImageIcon },
    { label: 'Capacity', icon: Users },
    { label: 'Pricing', icon: DollarSign },
    { label: 'Rules', icon: ScrollText },
    { label: 'Availability', icon: CalendarCheck },
    { label: 'Review', icon: Rocket },
] as const

const CITY_OPTIONS = ['VIJAYAWADA', 'NANDIYALA', 'VETLAPALEM', 'TIRUPATI'] as const

const AMENITIES = [
    'WiFi', 'Kitchen', 'AC', 'Washing Machine', 'Refrigerator', 'Parking',
    'Swimming Pool', 'Balcony', 'Power Backup', 'Smart TV', 'Hot Water',
    'Iron', 'Hair Dryer', 'Microwave', 'Oven', 'Dishwasher',
    'Garden', 'BBQ Grill', 'Fire Pit', 'Gym', 'CCTV', 'First Aid Kit',
    'Pet Friendly', 'Wheelchair Access',
]

const HOUSE_TYPES = ['Villa', 'Apartment', 'Cottage', 'Bungalow', 'Farmhouse', 'Penthouse', 'Studio']
const VIEW_TYPES = ['Sea View', 'Hill View', 'City View', 'Lake View', 'River View', 'Garden View', 'No Specific View']
const LISTING_TYPES = ['Entire Home', 'Private Room', 'Shared Room']

const CANCELLATION_POLICIES = [
    { value: 'FREE_CANCELLATION', label: 'Free Cancellation (24h before check-in)' },
    { value: 'MODERATE', label: 'Moderate (48h before, 50% refund within 24h)' },
    { value: 'STRICT', label: 'Strict (72h before, no refund within 48h)' },
    { value: 'NON_REFUNDABLE', label: 'Non-refundable' },
]

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export default function AddHouse() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [direction, setDirection] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [basic, setBasic] = useState({
        title: '', slug: '', shortDescription: '', description: '',
        city: 'VIJAYAWADA' as string, address: '', landmark: '',
        latitude: '', longitude: '', pincode: '', state: 'Andhra Pradesh',
        houseType: 'Villa', listingType: 'Entire Home', viewType: 'No Specific View',
        floorNumber: '', liftAvailable: false, hostNotes: '',
    })

    const [images, setImages] = useState<string[]>(['', '', '', '', ''])
    const [videoUrl, setVideoUrl] = useState('')
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0)

    const [capacity, setCapacity] = useState({
        totalGuests: '4', bedrooms: '2', bathrooms: '1', beds: '2',
        propertySizeSqft: '',
    })
    const [amenities, setAmenities] = useState<string[]>([])

    const [pricing, setPricing] = useState({
        basePrice: '', weekendPrice: '', cleaningFee: '', securityDeposit: '',
        taxPercent: '18', minStayNights: '1', maxStayNights: '30',
    })

    const [rules, setRules] = useState({
        checkInTime: '14:00', checkOutTime: '11:00',
        noSmoking: true, petsAllowed: false, partiesAllowed: false,
        quietHours: '22:00 - 07:00', idProofRequired: true,
        damagePolicy: 'Guest is liable for any damages during the stay.',
        cancellationPolicy: 'FREE_CANCELLATION',
    })

    const [availability, setAvailability] = useState({
        totalUnits: '1', blockDates: '',
        nearbyAttractions: '', distanceStation: '',
    })

    // Helpers
    const setBasicField = (key: keyof typeof basic, v: string | boolean) => {
        setBasic(prev => ({ ...prev, [key]: v }))
        setErrors(prev => ({ ...prev, [key]: '' }))
    }

    const buildSlug = () => {
        const slug = basic.title.trim().toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
            .replace(/-+/g, '-').replace(/^-|-$/g, '')
        setBasicField('slug', slug)
    }

    const toggleAmenity = (a: string) => {
        setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
    }

    const addImageSlot = () => { if (images.length < 15) setImages([...images, '']) }
    const removeImageSlot = (idx: number) => {
        if (images.length <= 5) return
        const next = images.filter((_, i) => i !== idx)
        setImages(next)
        if (primaryImageIndex >= next.length || primaryImageIndex === idx) setPrimaryImageIndex(0)
        else if (primaryImageIndex > idx) setPrimaryImageIndex(primaryImageIndex - 1)
    }

    // Validation
    const validate = (): boolean => {
        const e: Record<string, string> = {}
        if (step === 0) {
            if (!basic.title.trim()) e.title = 'Title is required'
            if (!basic.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(basic.slug)) e.slug = 'Valid slug required'
            if (basic.shortDescription.trim().length < 10) e.shortDescription = 'At least 10 characters'
            if (basic.description.trim().length < 40) e.description = 'At least 40 characters'
            if (!basic.address.trim()) e.address = 'Address is required'
            if (!basic.pincode.trim() || !/^\d{6}$/.test(basic.pincode)) e.pincode = 'Valid 6-digit pincode'
            if (!basic.latitude.trim()) e.latitude = 'Required'
            if (!basic.longitude.trim()) e.longitude = 'Required'
        }
        if (step === 1) {
            if (images.filter(u => u.trim()).length < 5) e.images = 'Minimum 5 images required'
        }
        if (step === 2) {
            if (!capacity.totalGuests || Number(capacity.totalGuests) <= 0) e.totalGuests = 'Required'
            if (!capacity.bedrooms || Number(capacity.bedrooms) <= 0) e.bedrooms = 'Required'
            if (!capacity.bathrooms || Number(capacity.bathrooms) <= 0) e.bathrooms = 'Required'
            if (amenities.length === 0) e.amenities = 'Select at least 1'
        }
        if (step === 3) {
            if (!pricing.basePrice || Number(pricing.basePrice) <= 0) e.basePrice = 'Required'
        }
        if (step === 4) {
            if (!rules.checkInTime) e.checkInTime = 'Required'
            if (!rules.checkOutTime) e.checkOutTime = 'Required'
        }
        if (step === 5) {
            if (!availability.totalUnits || Number(availability.totalUnits) <= 0) e.totalUnits = 'Required'
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const goNext = () => { if (!validate()) { toast.error('Please fix errors.'); return } setDirection(1); setStep(s => Math.min(s + 1, STEPS.length - 1)) }
    const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)) }
    const jumpTo = (t: number) => { if (t < step) { setDirection(-1); setStep(t) } }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const imagePayload = images.filter(u => u.trim()).map((url, idx) => ({
            url, alt: `${basic.title} image ${idx + 1}`, isPrimary: idx === primaryImageIndex,
        }))
        const payload: any = {
            name: basic.title.trim(), type: 'HOME', city: basic.city,
            address: basic.address.trim(), state: basic.state, pincode: basic.pincode,
            description: basic.description.trim(), shortDesc: basic.shortDescription.trim(),
            slug: basic.slug.trim(), landmark: basic.landmark.trim() || undefined,
            latitude: Number(basic.latitude), longitude: Number(basic.longitude),
            images: imagePayload, videos: videoUrl.trim() ? [videoUrl.trim()] : [],
            amenities, highlights: [basic.viewType, basic.houseType].filter(v => v && v !== 'No Specific View'),
            basePrice: Number(pricing.basePrice), taxPercent: Number(pricing.taxPercent) || 18,
            cancellationPolicy: rules.cancellationPolicy,
            checkInTime: rules.checkInTime, checkOutTime: rules.checkOutTime,
            status: 'DRAFT',
            houseDetails: {
                houseType: basic.houseType, listingType: basic.listingType, viewType: basic.viewType,
                floorNumber: basic.floorNumber ? Number(basic.floorNumber) : undefined,
                liftAvailable: basic.liftAvailable, hostNotes: basic.hostNotes.trim() || undefined,
                totalGuests: Number(capacity.totalGuests), bedrooms: Number(capacity.bedrooms),
                bathrooms: Number(capacity.bathrooms), beds: Number(capacity.beds),
                propertySizeSqft: capacity.propertySizeSqft ? Number(capacity.propertySizeSqft) : undefined,
                weekendPrice: pricing.weekendPrice ? Number(pricing.weekendPrice) : undefined,
                cleaningFee: pricing.cleaningFee ? Number(pricing.cleaningFee) : undefined,
                securityDeposit: pricing.securityDeposit ? Number(pricing.securityDeposit) : undefined,
                minStayNights: Number(pricing.minStayNights) || 1,
                maxStayNights: Number(pricing.maxStayNights) || 30,
                noSmoking: rules.noSmoking, petsAllowed: rules.petsAllowed,
                partiesAllowed: rules.partiesAllowed, quietHours: rules.quietHours,
                idProofRequired: rules.idProofRequired, damagePolicy: rules.damagePolicy,
                totalUnits: Number(availability.totalUnits),
                blockDates: availability.blockDates.split(',').map(d => d.trim()).filter(Boolean),
                nearbyAttractions: availability.nearbyAttractions.trim() || undefined,
                distanceStation: availability.distanceStation.trim() || undefined,
            },
        }
        try {
            await propertiesService.createProperty(payload)
            toast.success('House created successfully!')
            navigate('/properties')
        } catch (err: any) {
            toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to create house.')
        } finally { setIsSubmitting(false) }
    }

    const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step])

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Add New House</h1>
                    <p className="mt-1 text-sm text-slate-500">Create an Airbnb-style home listing in 7 steps.</p>
                </div>
                <button type="button" onClick={() => navigate('/properties')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition">Cancel</button>
            </div>

            {/* Step Indicator */}
            <Card className="overflow-hidden border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
                <CardContent className="pt-5 pb-4 px-6">
                    <div className="mb-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STEPS.map(({ label, icon: Icon }, idx) => {
                            const done = idx < step; const active = idx === step
                            return (
                                <button key={label} type="button" onClick={() => jumpTo(idx)} disabled={idx > step}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${active ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-200/50' : done ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-pointer hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
                                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    <span className="hidden sm:inline">{label}</span>
                                    <span className="sm:hidden">{idx + 1}</span>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step Content */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }}>
                    {step === 0 && <Step1Basic basic={basic} setField={(k, v) => setBasicField(k as keyof typeof basic, v)} buildSlug={buildSlug} errors={errors} />}
                    {step === 1 && <Step2Media images={images} setImages={setImages} videoUrl={videoUrl} setVideoUrl={setVideoUrl} primaryImageIndex={primaryImageIndex} setPrimaryImageIndex={setPrimaryImageIndex} addImageSlot={addImageSlot} removeImageSlot={removeImageSlot} errors={errors} setErrors={setErrors} />}
                    {step === 2 && <Step3Capacity capacity={capacity} setCapacity={(k, v) => { setCapacity(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }} amenities={amenities} toggleAmenity={toggleAmenity} errors={errors} />}
                    {step === 3 && <Step4Pricing pricing={pricing} setField={(k, v) => { setPricing(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }} errors={errors} />}
                    {step === 4 && <Step5Rules rules={rules} setField={(k, v) => { setRules(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }} errors={errors} />}
                    {step === 5 && <Step6Availability availability={availability} setField={(k, v) => { setAvailability(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }} errors={errors} />}
                    {step === 6 && <Step7Review basic={basic} images={images} videoUrl={videoUrl} capacity={capacity} amenities={amenities} pricing={pricing} rules={rules} availability={availability} primaryImageIndex={primaryImageIndex} />}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button type="button" onClick={goBack} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {step < STEPS.length - 1 ? (
                    <button type="button" onClick={goNext} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-200/50 transition hover:shadow-lg">
                        Continue <ChevronRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Creating…' : '🏠 Publish House'}
                    </button>
                )}
            </div>
        </div>
    )
}

/* ─── STEP COMPONENTS ─── */

function Step1Basic({ basic, setField, buildSlug, errors }: { basic: Record<string, any>; setField: (k: string, v: string | boolean) => void; buildSlug: () => void; errors: Record<string, string> }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-teal-50/80 to-cyan-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><Home className="h-5 w-5 text-teal-500" /> Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2"><FormField label="House Title *" value={basic.title} onChange={v => setField('title', v)} error={errors.title} placeholder="e.g., Cozy Sea View Villa" /></div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Slug *</label>
                        <div className="flex gap-2">
                            <input value={basic.slug} onChange={e => setField('slug', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition" placeholder="cozy-sea-view-villa" />
                            <button type="button" onClick={buildSlug} className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Auto</button>
                        </div>
                        {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">City *</label>
                        <select value={basic.city} onChange={e => setField('city', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition">
                            {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <FormField label="Short Description *" value={basic.shortDescription} onChange={v => setField('shortDescription', v)} error={errors.shortDescription} placeholder="Brief tagline for card previews" />
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">Full Description *</label>
                    <textarea value={basic.description} onChange={e => setField('description', e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition" placeholder="Describe the home in detail…" />
                    {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2"><FormField label="Full Address *" value={basic.address} onChange={v => setField('address', v)} error={errors.address} placeholder="Street, area" /></div>
                    <FormField label="Landmark" value={basic.landmark} onChange={v => setField('landmark', v)} placeholder="Near…" />
                    <FormField label="Pincode *" value={basic.pincode} onChange={v => setField('pincode', v)} error={errors.pincode} placeholder="520001" />
                    <FormField label="State" value={basic.state} onChange={v => setField('state', v)} />
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700"><MapPin className="h-4 w-4" /> GPS Coordinates</div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Latitude *" value={basic.latitude} onChange={v => setField('latitude', v)} error={errors.latitude} placeholder="16.5062" />
                        <FormField label="Longitude *" value={basic.longitude} onChange={v => setField('longitude', v)} error={errors.longitude} placeholder="80.6480" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">House Type</label>
                        <select value={basic.houseType} onChange={e => setField('houseType', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition">
                            {HOUSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Listing Type</label>
                        <select value={basic.listingType} onChange={e => setField('listingType', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition">
                            {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">View Type</label>
                        <select value={basic.viewType} onChange={e => setField('viewType', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition">
                            {VIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField label="Floor Number" value={basic.floorNumber} onChange={v => setField('floorNumber', v)} placeholder="e.g. 3" />
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 w-full cursor-pointer hover:bg-slate-50 transition">
                            <input type="checkbox" checked={basic.liftAvailable} onChange={e => setField('liftAvailable', e.target.checked)} className="h-4 w-4 accent-teal-600" /> Lift Available
                        </label>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">Host Notes (optional)</label>
                    <textarea value={basic.hostNotes} onChange={e => setField('hostNotes', e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition" placeholder="Personal touch message for guests…" />
                </div>
            </CardContent>
        </Card>
    )
}

function Step2Media({ images, setImages, videoUrl, setVideoUrl, primaryImageIndex, setPrimaryImageIndex, addImageSlot, removeImageSlot, errors, setErrors }: any) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-pink-50/80 to-orange-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><ImageIcon className="h-5 w-5 text-pink-500" /> Media <span className="ml-auto rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-bold text-pink-700">Min 5 images</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <p className="text-sm text-slate-500">Paste image URLs. Click <strong>★</strong> to set the listing thumbnail.</p>
                <div className="space-y-3">
                    {images.map((url: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                                    <input value={url} onChange={(e: any) => { const next = [...images]; next[idx] = e.target.value; setImages(next); setErrors({ ...errors, images: '' }) }} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition" placeholder={`Image URL ${idx + 1}`} />
                                </div>
                                {url.trim() && <div className="ml-8 mt-1.5"><img src={url} alt="" className="h-16 w-24 rounded-lg border object-cover" onError={(e: any) => (e.currentTarget.style.display = 'none')} /></div>}
                            </div>
                            <button type="button" onClick={() => setPrimaryImageIndex(idx)} className={`mt-1 shrink-0 rounded-lg px-2.5 py-2 text-xs font-bold transition ${primaryImageIndex === idx ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>★</button>
                            {images.length > 5 && <button type="button" onClick={() => removeImageSlot(idx)} className="mt-1 shrink-0 rounded-lg bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                    ))}
                </div>
                {errors.images && <p className="text-xs font-medium text-rose-600">{errors.images}</p>}
                <button type="button" onClick={addImageSlot} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-slate-400 transition"><Plus className="h-3.5 w-3.5" /> Add Image</button>
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700"><Video className="h-4 w-4" /> Video URL (Recommended)</div>
                    <input value={videoUrl} onChange={(e: any) => setVideoUrl(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition" placeholder="YouTube or direct video URL" />
                </div>
            </CardContent>
        </Card>
    )
}

function Step3Capacity({ capacity, setCapacity, amenities, toggleAmenity, errors }: { capacity: Record<string, string>; setCapacity: (k: string, v: string) => void; amenities: string[]; toggleAmenity: (a: string) => void; errors: Record<string, string> }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-blue-500" /> Capacity & Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <FormField label="Total Guests *" value={capacity.totalGuests} onChange={v => setCapacity('totalGuests', v)} error={errors.totalGuests} placeholder="4" />
                    <FormField label="Bedrooms *" value={capacity.bedrooms} onChange={v => setCapacity('bedrooms', v)} error={errors.bedrooms} placeholder="2" />
                    <FormField label="Bathrooms *" value={capacity.bathrooms} onChange={v => setCapacity('bathrooms', v)} error={errors.bathrooms} placeholder="1" />
                    <FormField label="Beds" value={capacity.beds} onChange={v => setCapacity('beds', v)} placeholder="2" />
                    <FormField label="Size (sqft)" value={capacity.propertySizeSqft} onChange={v => setCapacity('propertySizeSqft', v)} placeholder="1200" />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">Amenities * <span className="ml-1 text-xs font-normal text-slate-400">({amenities.length} selected)</span></label>
                    <div className="flex flex-wrap gap-2">
                        {AMENITIES.map(a => (
                            <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${amenities.includes(a) ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {amenities.includes(a) ? '✓ ' : ''}{a}
                            </button>
                        ))}
                    </div>
                    {errors.amenities && <p className="mt-2 text-xs font-medium text-rose-600">{errors.amenities}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

function Step4Pricing({ pricing, setField, errors }: { pricing: Record<string, string>; setField: (k: string, v: string) => void; errors: Record<string, string> }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-green-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><DollarSign className="h-5 w-5 text-emerald-500" /> Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div><label className="mb-1 block text-sm font-semibold text-slate-600">Base Price / Night (₹) *</label><div className="relative"><span className="absolute left-3 top-2.5 text-sm text-slate-400">₹</span><input value={pricing.basePrice} onChange={e => setField('basePrice', e.target.value)} className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition" placeholder="2000" /></div>{errors.basePrice && <p className="mt-1 text-xs text-rose-600">{errors.basePrice}</p>}</div>
                    <div><label className="mb-1 block text-sm font-semibold text-slate-600">Weekend Price (₹)</label><div className="relative"><span className="absolute left-3 top-2.5 text-sm text-slate-400">₹</span><input value={pricing.weekendPrice} onChange={e => setField('weekendPrice', e.target.value)} className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition" placeholder="Optional" /></div></div>
                    <FormField label="Cleaning Fee (₹)" value={pricing.cleaningFee} onChange={v => setField('cleaningFee', v)} placeholder="Optional" />
                    <FormField label="Security Deposit (₹)" value={pricing.securityDeposit} onChange={v => setField('securityDeposit', v)} placeholder="Optional" />
                    <div><label className="mb-1 block text-sm font-semibold text-slate-600">Tax %</label><div className="relative"><input value={pricing.taxPercent} onChange={e => setField('taxPercent', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition" placeholder="18" /><Percent className="absolute right-3 top-3 h-4 w-4 text-slate-400" /></div></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Min Stay (nights)" value={pricing.minStayNights} onChange={v => setField('minStayNights', v)} placeholder="1" />
                    <FormField label="Max Stay (nights)" value={pricing.maxStayNights} onChange={v => setField('maxStayNights', v)} placeholder="30" />
                </div>
            </CardContent>
        </Card>
    )
}

function Step5Rules({ rules, setField, errors }: { rules: Record<string, any>; setField: (k: string, v: any) => void; errors: Record<string, string> }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50/80 to-yellow-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><ScrollText className="h-5 w-5 text-amber-500" /> House Rules & Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div><label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> Check-in *</label><input type="time" value={rules.checkInTime} onChange={e => setField('checkInTime', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition" />{errors.checkInTime && <p className="mt-1 text-xs text-rose-600">{errors.checkInTime}</p>}</div>
                    <div><label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> Check-out *</label><input type="time" value={rules.checkOutTime} onChange={e => setField('checkOutTime', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition" />{errors.checkOutTime && <p className="mt-1 text-xs text-rose-600">{errors.checkOutTime}</p>}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {[['No Smoking', 'noSmoking', rules.noSmoking], ['Pets Allowed', 'petsAllowed', rules.petsAllowed], ['Parties Allowed', 'partiesAllowed', rules.partiesAllowed], ['ID Proof Required', 'idProofRequired', rules.idProofRequired]].map(([label, key, checked]) => (
                        <label key={key as string} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm font-medium transition ${checked ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input type="checkbox" checked={checked as boolean} onChange={e => setField(key as string, e.target.checked)} className="h-4 w-4 accent-amber-600" />
                            {label as string}
                        </label>
                    ))}
                </div>
                <FormField label="Quiet Hours" value={rules.quietHours} onChange={v => setField('quietHours', v)} placeholder="22:00 - 07:00" />
                <div><label className="mb-1 block text-sm font-semibold text-slate-600">Damage Policy</label><textarea value={rules.damagePolicy} onChange={e => setField('damagePolicy', e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition" /></div>
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">Cancellation Policy *</label>
                    <div className="space-y-2">
                        {CANCELLATION_POLICIES.map(p => (
                            <label key={p.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${rules.cancellationPolicy === p.value ? 'border-amber-300 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <input type="radio" name="cancellation" value={p.value} checked={rules.cancellationPolicy === p.value} onChange={e => setField('cancellationPolicy', e.target.value)} className="h-4 w-4 accent-amber-600" />
                                <span className="text-sm font-medium text-slate-700">{p.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function Step6Availability({ availability, setField, errors }: { availability: Record<string, string>; setField: (k: string, v: string) => void; errors: Record<string, string> }) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-purple-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><CalendarCheck className="h-5 w-5 text-violet-500" /> Availability & Nearby</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                    <p className="mb-3 text-sm text-violet-700 font-medium">For homes, total units is usually <strong>1</strong> to prevent double bookings.</p>
                    <FormField label="Total Units *" value={availability.totalUnits} onChange={v => setField('totalUnits', v)} error={errors.totalUnits} placeholder="1" />
                </div>
                <FormField label="Block Dates (comma-separated YYYY-MM-DD)" value={availability.blockDates} onChange={v => setField('blockDates', v)} placeholder="2026-03-15, 2026-03-16" />
                <FormField label="Nearby Attractions" value={availability.nearbyAttractions} onChange={v => setField('nearbyAttractions', v)} placeholder="Beach 500m, Temple 1km" />
                <FormField label="Distance from Railway Station" value={availability.distanceStation} onChange={v => setField('distanceStation', v)} placeholder="2 km" />
            </CardContent>
        </Card>
    )
}

function Step7Review({ basic, images, videoUrl, capacity, amenities, pricing, rules, availability, primaryImageIndex }: any) {
    const filled = images.filter((u: string) => u.trim())
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/80">
                <CardTitle className="flex items-center gap-2 text-lg"><Rocket className="h-5 w-5 text-emerald-500" /> Review & Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
                <RS title="Basic Info" items={[['Title', basic.title], ['Slug', basic.slug], ['City', basic.city], ['Type', `${basic.houseType} · ${basic.listingType}`], ['Address', basic.address], ['View', basic.viewType], ['Coordinates', `${basic.latitude}, ${basic.longitude}`]]} />
                <div><h4 className="mb-2 text-sm font-bold text-slate-900">Media</h4><div className="flex flex-wrap gap-2">{filled.map((url: string, i: number) => (<div key={i} className={`relative h-16 w-24 rounded-lg border-2 overflow-hidden ${i === primaryImageIndex ? 'border-amber-400' : 'border-slate-200'}`}><img src={url} alt="" className="h-full w-full object-cover" onError={(e: any) => e.currentTarget.src = ''} />{i === primaryImageIndex && <span className="absolute top-0.5 right-0.5 rounded bg-amber-400 px-1 text-[9px] font-bold text-white">★</span>}</div>))}</div><p className="mt-1 text-xs text-slate-500">{filled.length} images · {videoUrl ? '1 video' : 'No video'}</p></div>
                <RS title="Capacity" items={[['Guests', capacity.totalGuests], ['Bedrooms', capacity.bedrooms], ['Bathrooms', capacity.bathrooms], ['Beds', capacity.beds], ['Size', capacity.propertySizeSqft ? `${capacity.propertySizeSqft} sqft` : '—']]} />
                <div><h4 className="mb-2 text-sm font-bold text-slate-900">Amenities ({amenities.length})</h4><div className="flex flex-wrap gap-1.5">{amenities.map((a: string) => <span key={a} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">{a}</span>)}</div></div>
                <RS title="Pricing" items={[['Base', `₹${pricing.basePrice}`], ['Weekend', pricing.weekendPrice ? `₹${pricing.weekendPrice}` : '—'], ['Cleaning', pricing.cleaningFee ? `₹${pricing.cleaningFee}` : '—'], ['Deposit', pricing.securityDeposit ? `₹${pricing.securityDeposit}` : '—'], ['Tax', `${pricing.taxPercent}%`], ['Stay', `${pricing.minStayNights}–${pricing.maxStayNights} nights`]]} />
                <RS title="Rules" items={[['Check-in', rules.checkInTime], ['Check-out', rules.checkOutTime], ['No Smoking', rules.noSmoking ? 'Yes' : 'No'], ['Pets', rules.petsAllowed ? 'Allowed' : 'Not allowed'], ['Parties', rules.partiesAllowed ? 'Allowed' : 'Not allowed'], ['Quiet Hours', rules.quietHours], ['Cancellation', CANCELLATION_POLICIES.find((p: any) => p.value === rules.cancellationPolicy)?.label || rules.cancellationPolicy]]} />
                <RS title="Availability" items={[['Units', availability.totalUnits], ['Block Dates', availability.blockDates || 'None']]} />
            </CardContent>
        </Card>
    )
}

/* ─── SHARED ─── */
function FormField({ label, value, onChange, error, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string }) {
    const id = useId()
    return (<div><label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-600">{label}</label><input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition" placeholder={placeholder} />{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div>)
}

function RS({ title, items }: { title: string; items: [string, string][] }) {
    return (<div><h4 className="mb-2 text-sm font-bold text-slate-900">{title}</h4><div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"><dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">{items.map(([k, v]) => (<div key={k}><dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{k}</dt><dd className="text-sm text-slate-900 break-words">{v || '—'}</dd></div>))}</dl></div></div>)
}
