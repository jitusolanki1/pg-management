"use client"

import { useState } from "react"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"

export default function TenantForm({ plans, beds, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    profilePhoto: "",
    aadhaarFront: "",
    aadhaarBack: "",
    plan: "",
    bed: "",
    clothWashing: false,
    depositMonths: 1,
  })
  const [loading, setLoading] = useState(false)
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
    setLoading(true)

    try {
      if (!formData.profilePhoto || !formData.aadhaarFront || !formData.aadhaarBack) {
        throw new Error("Please upload all required images")
      }

      await onSubmit(formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = plans.find((p) => p._id === formData.plan)
  const monthlyRent = selectedPlan ? selectedPlan.price + (formData.clothWashing ? 500 : 0) : 0
  const depositAmount = selectedPlan ? selectedPlan.price * formData.depositMonths : 0

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-text-main">Add New Tenant</h2>
        <Button variant="ghost" onClick={onCancel} size="sm">Cancel</Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Personal Info</h3>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Age *</label>
                <input
                  type="number"
                  min="18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="10-digit number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Stay Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Stay Config</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Select Plan *</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                >
                  <option value="">Select a Plan</option>
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} (₹{plan.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Select Bed *</label>
                <select
                  value={formData.bed}
                  onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                >
                  <option value="">Select a Bed</option>
                  {beds.map((bed) => (
                    <option key={bed._id} value={bed._id}>
                      Room {bed.room?.roomNumber || "?"} - Bed {bed.bedNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="washing"
                checked={formData.clothWashing}
                onChange={(e) => setFormData({ ...formData, clothWashing: e.target.checked })}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <label htmlFor="washing" className="text-sm font-medium text-text-main cursor-pointer">
                Include Cloth Washing (+₹500/mo)
              </label>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Documents & Photos</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { id: 'profilePhoto', label: 'Profile Photo' },
              { id: 'aadhaarFront', label: 'Aadhaar Front' },
              { id: 'aadhaarBack', label: 'Aadhaar Back' }
            ].map((field) => (
              <div key={field.id} className="relative group">
                <label className="block text-sm font-medium text-text-main mb-2 text-center">{field.label} *</label>
                <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex items-center justify-center bg-gray-50 overflow-hidden">
                  {formData[field.id] ? (
                    <img src={formData[field.id]} alt={field.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-gray-400 text-xs">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, field.id)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-lg mt-2">
          <div className="text-sm">
            <span className="text-text-muted">Total Monthly Rent:</span>
            <span className="ml-2 font-bold text-lg text-primary">₹{monthlyRent}</span>
            <span className="mx-3 text-gray-300">|</span>
            <span className="text-text-muted">Security Deposit:</span>
            <span className="ml-2 font-bold text-lg text-text-main">₹{depositAmount}</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Adding Tenant..." : "Add Tenant"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
