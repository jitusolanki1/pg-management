"use client"

import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTenants, useCreatePayment } from "../hooks"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

export default function AddPayment() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const preselectedTenantId = searchParams.get("tenant")

    // Data Layer
    const { data: tenants = [], isLoading: tenantsLoading } = useTenants()
    const createPayment = useCreatePayment()

    const [selectedTenant, setSelectedTenant] = useState(preselectedTenantId || "")
    const [formData, setFormData] = useState({
        amount: "",
        paymentFor: "",
        paymentType: "CASH",
        notes: "",
        paymentDate: new Date().toISOString().split('T')[0],
    })
    const [error, setError] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    const filteredTenants = tenants.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phone?.includes(searchTerm)
    )

    const tenant = tenants.find(t => t._id === selectedTenant)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        try {
            if (!selectedTenant) {
                throw new Error("Please select a tenant")
            }
            if (!formData.amount || Number(formData.amount) <= 0) {
                throw new Error("Please enter a valid amount")
            }
            if (!formData.paymentFor) {
                throw new Error("Please select payment month")
            }

            await createPayment.mutateAsync({
                tenant: selectedTenant,
                ...formData,
                amount: Number(formData.amount)
            })
            navigate("/admin/payments/paid")
        } catch (err) {
            setError(err.message)
        }
    }

    // Generate month options
    const getMonthOptions = () => {
        const months = []
        const now = new Date()
        for (let i = -2; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
            months.push({
                value: date.toISOString().slice(0, 7),
                label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            })
        }
        return months
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Record Payment</h1>
                    <p className="text-text-muted text-sm">Record a new payment from a tenant</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tenant Selection */}
                <Card>
                    <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                        Select Tenant
                    </h3>

                    {!selectedTenant ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search tenant by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                                {tenantsLoading ? (
                                    <div className="col-span-2 py-8 text-center text-text-muted">Loading tenants...</div>
                                ) : filteredTenants.length > 0 ? (
                                    filteredTenants.map((t) => (
                                        <button
                                            key={t._id}
                                            type="button"
                                            onClick={() => setSelectedTenant(t._id)}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 text-left transition-all"
                                        >
                                            <img
                                                src={t.profilePhoto || "/placeholder.svg"}
                                                alt={t.name}
                                                className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-text-main text-sm truncate">{t.name}</div>
                                                <div className="text-xs text-text-muted">
                                                    Room {t.bed?.room?.roomNumber || "?"} • ₹{t.monthlyRent}/mo
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-8 text-center text-text-muted">No tenants found</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <img
                                    src={tenant?.profilePhoto || "/placeholder.svg"}
                                    alt={tenant?.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                                />
                                <div>
                                    <div className="font-semibold text-text-main">{tenant?.name}</div>
                                    <div className="text-sm text-text-muted">
                                        Room {tenant?.bed?.room?.roomNumber || "?"} • Monthly: ₹{tenant?.monthlyRent}
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTenant("")}
                            >
                                Change
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Payment Details */}
                <Card>
                    <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                        Payment Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1.5">Amount (₹) *</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Enter amount"
                                required
                            />
                            {tenant && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, amount: tenant.monthlyRent?.toString() || "" })}
                                    className="text-xs text-primary hover:underline mt-1"
                                >
                                    Use monthly rent (₹{tenant.monthlyRent})
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1.5">Payment For *</label>
                            <select
                                value={formData.paymentFor}
                                onChange={(e) => setFormData({ ...formData, paymentFor: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                required
                            >
                                <option value="">Select month</option>
                                {getMonthOptions().map((m) => (
                                    <option key={m.value} value={m.label}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1.5">Payment Method</label>
                            <select
                                value={formData.paymentType}
                                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1.5">Payment Date</label>
                            <input
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-main mb-1.5">Notes (Optional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={createPayment.isPending || !selectedTenant}
                        className="flex-1"
                    >
                        {createPayment.isPending ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Recording...
                            </span>
                        ) : (
                            "Record Payment"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
