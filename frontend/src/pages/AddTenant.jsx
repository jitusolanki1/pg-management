"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePlans, useAvailableBeds, useCreateTenant } from "../hooks"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

export default function AddTenant() {
    const navigate = useNavigate()

    // Data Layer
    const { data: plans = [], isLoading: plansLoading } = usePlans()
    const { data: beds = [], isLoading: bedsLoading } = useAvailableBeds()
    const createTenant = useCreateTenant()

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        phone: "",
        address: "",
        profilePhoto: "",
        aadhaarFront: "",
        aadhaarBack: "",
        plan: "",
        bed: "",
        clothWashing: false,
        depositMonths: 1,
        joinDate: new Date().toISOString().split('T')[0],
    })
    const [error, setError] = useState("")

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setFormData({ ...formData, [field]: reader.result })
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error("Please enter tenant name")
            }
            if (!formData.phone.trim()) {
                throw new Error("Please enter phone number")
            }
            if (!formData.plan) {
                throw new Error("Please select a plan")
            }
            if (!formData.bed) {
                throw new Error("Please select a bed")
            }
            if (!formData.profilePhoto || !formData.aadhaarFront || !formData.aadhaarBack) {
                throw new Error("Please upload all required images")
            }

            await createTenant.mutateAsync(formData)
            navigate("/admin/tenants")
        } catch (err) {
            setError(err.message)
        }
    }

    const selectedPlan = plans.find((p) => p._id === formData.plan)
    const monthlyRent = selectedPlan ? selectedPlan.price + (formData.clothWashing ? 500 : 0) : 0
    const depositAmount = selectedPlan ? selectedPlan.price * formData.depositMonths : 0

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/admin/tenants")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Add New Tenant</h1>
                        <p className="text-text-muted text-sm">Fill in the details to register a new tenant</p>
                    </div>
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

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Personal Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Age *</label>
                                    <input
                                        type="number"
                                        min="18"
                                        max="100"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Age"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="10-digit number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Join Date *</label>
                                    <input
                                        type="date"
                                        value={formData.joinDate}
                                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                        placeholder="Full address"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Documents */}
                        <Card>
                            <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                                Documents & Photos
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: 'profilePhoto', label: 'Profile Photo', icon: '👤' },
                                    { id: 'aadhaarFront', label: 'Aadhaar Front', icon: '🪪' },
                                    { id: 'aadhaarBack', label: 'Aadhaar Back', icon: '🪪' }
                                ].map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium text-text-main mb-2">{field.label} *</label>
                                        <div className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex items-center justify-center bg-gray-50 overflow-hidden group">
                                            {formData[field.id] ? (
                                                <>
                                                    <img src={formData[field.id]} alt={field.label} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-sm">Click to change</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <span className="text-3xl mb-2 block">{field.icon}</span>
                                                    <span className="text-gray-400 text-xs">Click or drag to upload</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) => handleImageUpload(e, field.id)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Stay Config & Summary */}
                    <div className="space-y-6">
                        <Card>
                            <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                                Stay Configuration
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Select Plan *</label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required
                                        disabled={plansLoading}
                                    >
                                        <option value="">Select a Plan</option>
                                        {plans.map((plan) => (
                                            <option key={plan._id} value={plan._id}>
                                                {plan.name} (₹{plan.price}/mo)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Select Bed *</label>
                                    <select
                                        value={formData.bed}
                                        onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required
                                        disabled={bedsLoading}
                                    >
                                        <option value="">Select a Bed</option>
                                        {beds.map((bed) => (
                                            <option key={bed._id} value={bed._id}>
                                                Floor {bed.room?.floor?.floorNumber || "?"} • Room {bed.room?.roomNumber || "?"} • Bed {bed.bedNumber}
                                            </option>
                                        ))}
                                    </select>
                                    {beds.length === 0 && !bedsLoading && (
                                        <p className="text-xs text-text-muted mt-1">No beds available. Create rooms first.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Security Deposit</label>
                                    <select
                                        value={formData.depositMonths}
                                        onChange={(e) => setFormData({ ...formData, depositMonths: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        <option value={1}>1 Month</option>
                                        <option value={2}>2 Months</option>
                                        <option value={3}>3 Months</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="washing"
                                        checked={formData.clothWashing}
                                        onChange={(e) => setFormData({ ...formData, clothWashing: e.target.checked })}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <label htmlFor="washing" className="text-sm text-text-main cursor-pointer">
                                        Cloth Washing Service (+₹500/mo)
                                    </label>
                                </div>
                            </div>
                        </Card>

                        {/* Summary */}
                        <Card className="bg-primary/5 border-primary/20">
                            <h3 className="text-lg font-semibold text-text-main mb-4">Payment Summary</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Plan Price</span>
                                    <span className="font-medium">₹{selectedPlan?.price || 0}</span>
                                </div>
                                {formData.clothWashing && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Washing Service</span>
                                        <span className="font-medium">+₹500</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="font-medium text-text-main">Monthly Rent Total</span>
                                    <span className="font-bold text-primary">₹{monthlyRent}</span>
                                </div>

                                <div className="pt-3 border-t border-gray-200 space-y-2">
                                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Initial Payment</div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">Security Deposit ({formData.depositMonths} mo × ₹{selectedPlan?.price || 0})</span>
                                        <span className="font-medium">₹{depositAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">First Month Rent</span>
                                        <span className="font-medium">₹{monthlyRent}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-3 border-t-2 border-primary/30 bg-white -mx-4 px-4 py-3 rounded-lg">
                                    <span className="font-semibold text-text-main">Total Due at Joining</span>
                                    <span className="text-xl font-bold text-primary">₹{depositAmount + monthlyRent}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                disabled={createTenant.isPending}
                                className="w-full py-3"
                            >
                                {createTenant.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Adding Tenant...
                                    </span>
                                ) : (
                                    "Add Tenant"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate("/admin/tenants")}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
