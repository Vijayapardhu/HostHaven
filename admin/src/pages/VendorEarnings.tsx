import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/Table'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/PageLoader'
import { paymentsService } from '../lib/payments'
import { toast } from 'sonner'
import { IndianRupee, History, ArrowRight } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Link } from 'react-router-dom'
import { SearchInput } from '../components/ui/SearchInput'

interface VendorEarning {
    id: string
    businessName: string
    commissionRate: number
    grossAmount: number
    totalCommission: number
    unpaidEarnings: number
    pendingEntriesCount: number
}

const VendorEarnings = () => {
    const [earnings, setEarnings] = useState<VendorEarning[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [confirmPayout, setConfirmPayout] = useState<VendorEarning | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isBulkProcessing, setIsBulkProcessing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchEarnings = async () => {
        try {
            setIsLoading(true)
            const data = await paymentsService.getVendorEarnings({ search: searchTerm || undefined })
            setEarnings(data)
        } catch (err) {
            toast.error('Failed to load vendor earnings')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEarnings()
    }, [searchTerm])

    const handleGenerateAllPayouts = async () => {
        const payableVendors = earnings.filter((earning) => earning.unpaidEarnings > 0)
        if (payableVendors.length === 0) {
            toast.info('No pending earnings available for payout generation')
            return
        }

        try {
            setIsBulkProcessing(true)
            const results = await Promise.allSettled(
                payableVendors.map((earning) => paymentsService.createPayout(earning.id))
            )
            const successCount = results.filter((result) => result.status === 'fulfilled').length
            const failureCount = results.length - successCount

            if (failureCount === 0) {
                toast.success(`Created payout records for ${successCount} vendors`)
            } else {
                toast.warning(`Created ${successCount} payouts, ${failureCount} failed`)
            }
            fetchEarnings()
        } finally {
            setIsBulkProcessing(false)
        }
    }

    const handleCreatePayout = async () => {
        if (!confirmPayout) return

        try {
            setIsProcessing(true)
            await paymentsService.createPayout(confirmPayout.id)
            toast.success(`Payout record created for ${confirmPayout.businessName}`)
            setConfirmPayout(null)
            fetchEarnings()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create payout')
        } finally {
            setIsProcessing(false)
        }
    }

    if (isLoading) return <PageLoader />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Vendor Payout Management"
                description="Net payable earnings are auto-calculated after booking confirmation using each vendor's commission rate."
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleGenerateAllPayouts}
                            disabled={isBulkProcessing}
                            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                            <IndianRupee className="h-4 w-4" />
                            {isBulkProcessing ? 'Generating...' : 'Generate All Payouts'}
                        </button>
                        <Link
                            to="/payments?tab=payouts"
                            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                        >
                            <History className="h-4 w-4" /> View Payout History
                        </Link>
                    </div>
                }
            />

            <SearchInput
                placeholder="Search vendors"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
            />

            {earnings.length === 0 ? (
                <EmptyState
                    title="No pending earnings"
                    description="All vendor commissions have been processed or no bookings have been completed yet."
                />
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Gross Amount</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Net Payable</TableHead>
                                <TableHead>Pending Bookings</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {earnings.map((earning) => (
                                <TableRow key={earning.id}>
                                    <TableCell>
                                        <span className="font-semibold text-slate-900">{earning.businessName}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <span className="text-lg font-bold text-slate-900">
                                                ₹{earning.grossAmount.toLocaleString()}
                                            </span>
                                            <p className="text-xs text-slate-500">
                                                Rate: {earning.commissionRate}%
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-semibold text-rose-600">
                                            -₹{earning.totalCommission.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-lg font-bold text-emerald-600">
                                            ₹{earning.unpaidEarnings.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                            {earning.pendingEntriesCount} bookings
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button
                                            onClick={() => setConfirmPayout(earning)}
                                            disabled={earning.unpaidEarnings <= 0}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            <IndianRupee className="h-4 w-4" />
                                            Generate Payout
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ConfirmDialog
                open={Boolean(confirmPayout)}
                onOpenChange={(open: boolean) => !open && setConfirmPayout(null)}
                title="Generate Payout?"
                description={`This will create a pending payout record of ₹${confirmPayout?.unpaidEarnings.toLocaleString()} for ${confirmPayout?.businessName}. This action will group ${confirmPayout?.pendingEntriesCount} pending booking commissions.`}
                confirmText={isProcessing ? 'Processing...' : 'Create Payout'}
                onConfirm={handleCreatePayout}
            />
        </div>
    )
}

export default VendorEarnings
