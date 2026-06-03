import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { vendorsService, type Vendor } from '../lib/vendors'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Eye, FileText, Building2, User, Phone, Mail, CreditCard, Shield, CheckCircle, XCircle, Clock, MapPin, Globe } from 'lucide-react'

export default function VendorApproval() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    vendorId: string
    action: 'approve' | 'reject'
  } | null>(null)

  const fetchPendingVendors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await vendorsService.getPendingVendors({ page, limit: pageSize })
      setVendors(data.data)
      setTotal(data.pagination.total)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load pending vendors.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingVendors()
  }, [page, pageSize])

  const filteredVendors = useMemo(() => {
    const query = searchTerm.toLowerCase()
    if (!query) return vendors
    return vendors.filter((vendor) =>
      [vendor.email, vendor.phone, vendor.businessName].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    )
  }, [searchTerm, vendors])

  const handleApproval = (vendorId: string, action: 'approve' | 'reject') => {
    setConfirmAction({ vendorId, action })
  }

  const confirmApproval = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.action === 'approve') {
        await vendorsService.approveVendor(confirmAction.vendorId)
        toast.success('Vendor approved successfully.')
      } else {
        if (!rejectReason || rejectReason.trim().length < 10) {
          toast.error('Please provide a detailed reason for rejection (minimum 10 characters)')
          return
        }
        await vendorsService.rejectVendor(confirmAction.vendorId, rejectReason)
        toast.success('Vendor rejected successfully.')
      }
      setVendors((prev) => prev.filter((vendor) => vendor.id !== confirmAction.vendorId))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update vendor approval.')
    } finally {
      setConfirmAction(null)
      setRejectReason('')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Approval"
        description="Review pending vendor registrations and approve or reject them."
      />

      <FiltersBar>
        <SearchInput
          placeholder="Search pending vendors"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={5} />
      ) : error ? (
        <EmptyState
          title="Unable to load approvals"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchPendingVendors}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="You are all caught up with vendor applications."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Business Details</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.name || vendor.email}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {vendor.email}
                    </p>
                    {vendor.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {vendor.phone}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.businessName}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {vendor.businessType || 'N/A'}
                    </p>
                    {vendor.businessAddress && (
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{vendor.businessAddress}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.gstNumber && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        <FileText className="w-3 h-3" /> GST
                      </span>
                    )}
                    {vendor.panNumber && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                        <CreditCard className="w-3 h-3" /> PAN
                      </span>
                    )}
                    {vendor.aadhaarNumber && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                        <Shield className="w-3 h-3" /> AADHAR
                      </span>
                    )}
                    {vendor.bankAccount && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        <CreditCard className="w-3 h-3" /> Bank
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.applicationStatus === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  ) : vendor.applicationStatus === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Eye className="w-3 h-3 inline" /> Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedVendor(vendor)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Quick View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval(vendor.id, 'reject')}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval(vendor.id, 'approve')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && filteredVendors.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
            setRejectReason('')
          }
        }}
        title={confirmAction?.action === 'approve' ? 'Approve this vendor?' : 'Reject this vendor?'}
        description={
          confirmAction?.action === 'approve'
            ? 'The vendor will go live once approved.'
            : 'The vendor application will be rejected. Please provide a detailed reason.'
        }
        confirmText={confirmAction?.action === 'approve' ? 'Approve vendor' : 'Reject vendor'}
        variant={confirmAction?.action === 'approve' ? 'default' : 'danger'}
        onConfirm={confirmApproval}
      >
        {confirmAction?.action === 'reject' && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejection (minimum 10 characters)..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-rose-500 focus:outline-none"
              rows={4}
            />
          </div>
        )}
      </ConfirmDialog>

      {/* Vendor Details Dialog */}
      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Application Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-sm font-medium">{selectedVendor.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium">{selectedVendor.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium">{selectedVendor.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Business Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Business Name</p>
                    <p className="text-sm font-medium">{selectedVendor.businessName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Business Type</p>
                    <p className="text-sm font-medium">{selectedVendor.businessType || 'N/A'}</p>
                  </div>
                  {selectedVendor.businessAddress && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-sm font-medium flex items-start gap-1">
                        <MapPin className="w-4 h-4 mt-0.5" /> {selectedVendor.businessAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documents
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">GST Number</p>
                    <p className="text-sm font-medium">{selectedVendor.gstNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">PAN Number</p>
                    <p className="text-sm font-medium">{selectedVendor.panNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Aadhaar Number</p>
                    <p className="text-sm font-medium">{selectedVendor.aadhaarNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {selectedVendor.bankAccount && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Bank Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-500">Bank Name</p>
                      <p className="text-sm font-medium">{selectedVendor.bankAccount.bankName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Account Number</p>
                      <p className="text-sm font-medium">••••{selectedVendor.bankAccount.accountNumber.slice(-4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IFSC Code</p>
                      <p className="text-sm font-medium">{selectedVendor.bankAccount.ifscCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Account Holder</p>
                      <p className="text-sm font-medium">{selectedVendor.bankAccount.accountHolderName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedVendor(null)
                    handleApproval(selectedVendor.id, 'reject')
                  }}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedVendor(null)
                    handleApproval(selectedVendor.id, 'approve')
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Approve Vendor
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
