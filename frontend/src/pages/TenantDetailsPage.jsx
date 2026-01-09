"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useTenant, useDeleteTenant } from "../hooks"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"

export default function TenantDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    // Data Layer - React Query hooks
    const { data: tenant, isLoading: loading, error: fetchError } = useTenant(id)
    const deleteTenant = useDeleteTenant()

    const error = fetchError?.message || ""

    // Handlers
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return
        try {
            await deleteTenant.mutateAsync(id)
            navigate("/admin/tenants")
        } catch (err) {
            alert(err.message)
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    if (error || !tenant) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error || "Tenant not found"}</p>
                <Button onClick={() => navigate("/admin/tenants")}>Back to List</Button>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate("/admin/tenants")}>
                        &larr; Back
                    </Button>
                    <h1 className="text-2xl font-bold text-text-main">Tenant Profile</h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="danger" onClick={handleDelete}>
                        Delete Tenant
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="flex flex-col items-center p-6 text-center">
                        <div className="relative mb-4">
                            <img
                                src={tenant.profilePhoto || "/placeholder.svg"}
                                alt={tenant.name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${tenant.status === "ACTIVE" ? "bg-success" : "bg-gray-400"
                                }`}></span>
                        </div>

                        <h2 className="text-xl font-bold text-text-main mb-1">{tenant.name}</h2>
                        <p className="text-text-muted text-sm mb-4">ID: {tenant._id.slice(-6).toUpperCase()}</p>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <Badge variant={tenant.status === "ACTIVE" ? "success" : "neutral"}>
                                {tenant.status}
                            </Badge>
                            <Badge variant="secondary">Age: {tenant.age}</Badge>
                        </div>

                        <div className="w-full pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Phone</p>
                                <p className="text-sm font-medium text-text-main">{tenant.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Email</p>
                                <p className="text-sm font-medium text-text-main">{tenant.email || "N/A"}</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-text-main mb-4">Documents</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-text-muted mb-2">Aadhar Card (Front)</p>
                                <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
                                    {tenant.idProofFront ? (
                                        <img src={tenant.idProofFront} alt="ID Front" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <svg className="w-8 h-8 mx-auto text-gray-300 mb-2 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs text-text-muted group-hover:text-primary">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted mb-2">Aadhar Card (Back)</p>
                                <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
                                    {tenant.idProofBack ? (
                                        <img src={tenant.idProofBack} alt="ID Back" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <svg className="w-8 h-8 mx-auto text-gray-300 mb-2 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs text-text-muted group-hover:text-primary">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Other Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Accommodation Info */}
                    <Card>
                        <h3 className="font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">Accommodation Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-text-muted mb-1">Room Number</p>
                                <p className="text-lg font-bold text-text-main">{tenant.bed?.room?.roomNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-text-muted mb-1">Bed Number</p>
                                <p className="text-lg font-bold text-text-main">{tenant.bed?.bedNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-text-muted mb-1">Floor</p>
                                <p className="text-lg font-medium text-text-main">
                                    {tenant.bed?.room?.floor?.floorNumber ? `Floor ${tenant.bed.room.floor.floorNumber}` : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-text-muted mb-1">Room Type</p>
                                <Badge variant="secondary">{tenant.bed?.room?.roomType || "Standard"}</Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Plan & Financials */}
                    <Card>
                        <h3 className="font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">Plan & Subscription</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Current Plan</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-2xl font-bold text-indigo-900">{tenant.plan?.name?.replace("_", " ")}</p>
                                    <span className="text-indigo-600 font-medium mb-1">/ month</span>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Monthly Rent</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-2xl font-bold text-emerald-900">₹{tenant.monthlyRent}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-text-main mb-3">Address & Guardian Info</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-text-muted mb-1">Permanent Address</p>
                                    <p className="text-text-main">{tenant.address || "Not provided"}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-text-muted mb-1">Guardian Contact</p>
                                    <p className="text-text-main font-medium">{tenant.guardianName || "N/A"}</p>
                                    <p className="text-text-muted mt-1">{tenant.guardianPhone || "No Phone"}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Activity placeholder (Optional) */}
                    <Card>
                        <h3 className="font-semibold text-text-main mb-4">Recent Payments</h3>
                        <div className="text-center py-6 text-text-muted bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Transaction history will appear here
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    )
}
