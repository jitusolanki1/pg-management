"use client"

import { useState } from "react"

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
    <form onSubmit={handleSubmit} className="bg-secondary p-6 rounded-lg border border-border space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Add New Tenant</h2>

      {error && <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Age *</label>
          <input
            type="number"
            min="18"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            placeholder="Enter 10-digit number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Plan *</label>
          <select
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          >
            <option value="">Choose a plan</option>
            {plans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name.replace("_", " ")} - ₹{plan.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Assign Bed *</label>
          <select
            value={formData.bed}
            onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          >
            <option value="">Choose a bed</option>
            {beds.map((bed) => (
              <option key={bed._id} value={bed._id}>
                {bed.bedNumber} - {bed.room?.roomNumber} ({bed.room?.roomType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Deposit Duration (Months) *</label>
          <input
            type="number"
            min="1"
            max="12"
            value={formData.depositMonths}
            onChange={(e) => setFormData({ ...formData, depositMonths: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="clothWashing"
          checked={formData.clothWashing}
          onChange={(e) => setFormData({ ...formData, clothWashing: e.target.checked })}
          className="w-4 h-4 rounded border-border"
        />
        <label htmlFor="clothWashing" className="text-sm text-gray-300">
          Add Cloth Washing Service (+₹500/month)
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Profile Photo *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "profilePhoto")}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white text-sm"
            required
          />
          {formData.profilePhoto && (
            <img
              src={formData.profilePhoto || "/placeholder.svg"}
              alt="Profile"
              className="mt-2 w-20 h-20 object-cover rounded-md"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Aadhaar Front *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "aadhaarFront")}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white text-sm"
            required
          />
          {formData.aadhaarFront && (
            <img
              src={formData.aadhaarFront || "/placeholder.svg"}
              alt="Aadhaar Front"
              className="mt-2 w-20 h-20 object-cover rounded-md"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Aadhaar Back *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "aadhaarBack")}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white text-sm"
            required
          />
          {formData.aadhaarBack && (
            <img
              src={formData.aadhaarBack || "/placeholder.svg"}
              alt="Aadhaar Back"
              className="mt-2 w-20 h-20 object-cover rounded-md"
            />
          )}
        </div>
      </div>

      {selectedPlan && (
        <div className="bg-primary p-4 rounded-md border border-border">
          <h3 className="font-medium text-white mb-2">Pricing Summary</h3>
          <div className="space-y-1 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Base Plan:</span>
              <span>₹{selectedPlan.price}</span>
            </div>
            {formData.clothWashing && (
              <div className="flex justify-between">
                <span>Cloth Washing:</span>
                <span>₹500</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white border-t border-border pt-1">
              <span>Monthly Rent:</span>
              <span>₹{monthlyRent}</span>
            </div>
            <div className="flex justify-between font-bold text-accent border-t border-border pt-1 mt-2">
              <span>Deposit ({formData.depositMonths} months):</span>
              <span>₹{depositAmount}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-success text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Tenant"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-muted text-white rounded-md hover:bg-gray-600">
          Cancel
        </button>
      </div>
    </form>
  )
}
