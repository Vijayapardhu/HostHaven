import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Calendar,
    Lock,
    Unlock,
    RefreshCcw
} from 'lucide-react'
import { inventoryService } from '../lib/inventory'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/Table'

export default function RoomInventoryControl() {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [inventory, setInventory] = useState<any>(null)

    // Date Range (default: next 30 days)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() + 30)
        return date.toISOString().split('T')[0]
    })

    const [overrideDate, setOverrideDate] = useState<any>(null)
    const [overrideValue, setOverrideValue] = useState<number>(0)
    const [confirmRelease, setConfirmRelease] = useState<string | null>(null)
    const [isCleaning, setIsCleaning] = useState(false)

    const fetchData = async () => {
        if (!roomId) return
        setIsLoading(true)
        try {
            const inventoryData = await inventoryService.getRoomInventory(roomId, startDate, endDate)
            setInventory(inventoryData)
        } catch (err) {
            toast.error('Failed to load inventory data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [roomId, startDate, endDate])

    const handleOverride = async () => {
        if (!roomId || !overrideDate) return
        try {
            await inventoryService.overrideInventory(roomId, overrideDate.date, overrideValue)
            toast.success('Inventory overridden successfully')
            setOverrideDate(null)
            fetchData()
        } catch (err) {
            toast.error('Failed to override inventory')
        }
    }

    const handleRelease = async () => {
        if (!roomId || !confirmRelease) return
        try {
            await inventoryService.releaseLocks(roomId, confirmRelease === 'all' ? undefined : confirmRelease)
            toast.success('Locks released successfully')
            setConfirmRelease(null)
            fetchData()
        } catch (err) {
            toast.error('Failed to release locks')
        }
    }

    const handleCleanup = async () => {
        try {
            setIsCleaning(true)
            const result = await inventoryService.cleanupLocks()
            toast.success(`Cleaned up ${result.count} expired locks system-wide`)
            fetchData()
        } catch (err) {
            toast.error('Failed to cleanup locks')
        } finally {
            setIsCleaning(false)
        }
    }

    if (isLoading && !inventory) return <PageLoader />

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <PageHeader
                    title="Advanced Inventory Control"
                    description="Manage availability, locks, and manual overrides for this room type."
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-sm rounded-lg border-slate-200 p-2 focus:ring-primary"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-sm rounded-lg border-slate-200 p-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setConfirmRelease('all')}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <Unlock className="h-4 w-4" /> Release All Locks
                    </button>
                    <button
                        onClick={handleCleanup}
                        disabled={isCleaning}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isCleaning ? 'animate-spin' : ''}`} />
                        Cleanup Expired
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" /> Availability Grid
                    </h3>
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory?.days.map((day: any) => (
                                    <TableRow key={day.date}>
                                        <TableCell className="font-medium text-slate-700">
                                            {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </TableCell>
                                        <TableCell>{day.totalRooms}</TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${day.availableRooms <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {day.availableRooms}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                onClick={() => {
                                                    setOverrideDate(day)
                                                    setOverrideValue(day.availableRooms)
                                                }}
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                            >
                                                Override
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-rose-500" /> Active Locks & Blocks
                    </h3>
                    <div className="space-y-3">
                        {inventory?.locks.length === 0 ? (
                            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                                No active locks or blocks for this period
                            </div>
                        ) : (
                            inventory?.locks.map((lock: any) => (
                                <div
                                    key={lock.id}
                                    className={`p-4 rounded-xl border shadow-sm transition-all ${lock.lockUntil.startsWith('9999')
                                            ? 'border-rose-100 bg-rose-50'
                                            : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${lock.lockUntil.startsWith('9999') ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <Lock className="h-3 w-3" />
                                            </div>
                                            <span className="font-bold text-slate-900">{lock.quantity} {lock.quantity === 1 ? 'Room' : 'Rooms'}</span>
                                        </div>
                                        <button
                                            onClick={() => setConfirmRelease(lock.id)}
                                            className="p-1 hover:bg-white/50 rounded text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Unlock className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-600 flex justify-between">
                                            <span>Period:</span>
                                            <span className="font-medium text-slate-900 uppercase">
                                                {new Date(lock.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                {' → '}
                                                {new Date(lock.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-600 flex justify-between">
                                            <span>Expires:</span>
                                            <span className={`${lock.lockUntil.startsWith('9999') ? 'text-rose-600 font-bold' : 'text-slate-900 font-medium'}`}>
                                                {lock.lockUntil.startsWith('9999') ? 'Permanent Block' : new Date(lock.lockUntil).toLocaleTimeString()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(overrideDate)}
                onOpenChange={(open: boolean) => !open && setOverrideDate(null)}
                title="Direct Inventory Override"
                description={`Manually set available rooms for ${overrideDate ? new Date(overrideDate.date).toLocaleDateString() : ''}. Note: This bypasses lock checks and affects direct availability.`}
                confirmText="Apply Override"
                onConfirm={handleOverride}
            >
                <div className="mt-4">
                    <label className="text-sm font-medium text-slate-700 block mb-2">Available Rooms</label>
                    <input
                        type="number"
                        min="0"
                        max={inventory?.days[0]?.totalRooms || 100}
                        value={overrideValue}
                        onChange={(e) => setOverrideValue(parseInt(e.target.value))}
                        className="w-full rounded-lg border-slate-200 p-2 text-lg font-bold focus:ring-primary"
                    />
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={Boolean(confirmRelease)}
                onOpenChange={(open: boolean) => !open && setConfirmRelease(null)}
                title={confirmRelease === 'all' ? "Release All Locks?" : "Release Lock?"}
                description={confirmRelease === 'all'
                    ? "This will remove ALL current inventory locks and blocks for this room, making them immediately available for booking."
                    : "This specific lock will be removed. If this was an admin block, the rooms will become available to the public again."
                }
                confirmText="Release Now"
                variant="danger"
                onConfirm={handleRelease}
            />
        </div>
    )
}
