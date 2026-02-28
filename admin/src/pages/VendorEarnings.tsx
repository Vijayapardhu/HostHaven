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

interface VendorEarning {
    id: string
    businessName: string
    unpaidEarnings: number
    pendingEntriesCount: number
}

const VendorEarnings = () => {
    const [earnings, setEarnings] = useState<VendorEarning[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [confirmPayout, setConfirmPayout] = useState<VendorEarning | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const fetchEarnings = async () => {
        try {
            setIsLoading(true)
            const data = await paymentsService.getVendorEarnings()
            setEarnings(data)
        } catch (err) {
            toast.error('Failed to load vendor earnings')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEarnings()
    }, [])

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
                description="Track accumulated earnings and generate payout records for vendors."
                actions={
                    <Link
                        to="/payments?tab=payouts"
                        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    >
                        <History className="h-4 w-4" /> View Payout History
                    </Link>
                }
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
                                <TableHead>Unpaid Commission</TableHead>
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
                                        <span className="text-lg font-bold text-slate-900">₹{earning.unpaidEarnings.toLocaleString()}</span>
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
