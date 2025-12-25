"use client"

import { useState } from "react"

export default function PaymentForm({ tenant, onSubmit }) {
  const [formData, setFormData] = useState({
    paymentType: "FULL",
    amount: tenant.monthlyRent,
    paymentFor: `Monthly Rent - ${new Date().toLocaleString("default", { month: "long", year: "numeric" })}`,
    paymentDate: new Date().toISOString().split("T")[0],
    remainingDue: 0,
    nextDueDate: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePaymentTypeChange = (type) => {
    if (type === "FULL") {
      setFormData({
        ...formData,
        paymentType: type,
        amount: tenant.monthlyRent,
        remainingDue: 0,
        nextDueDate: "",
      })
    } else {
      setFormData({
        ...formData,
        paymentType: type,
        remainingDue: tenant.monthlyRent - (formData.amount || 0),
      })
    }
  }

  const handleAmountChange = (amount) => {
    const numAmount = Number.parseFloat(amount) || 0
    const remaining = tenant.monthlyRent - numAmount
    setFormData({
      ...formData,
      amount: numAmount,
      remainingDue: formData.paymentType === "PARTIAL" ? remaining : 0,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (formData.paymentType === "PARTIAL" && !formData.nextDueDate) {
        throw new Error("Next due date is required for partial payments")
      }

      if (formData.amount <= 0) {
        throw new Error("Payment amount must be greater than zero")
      }

      if (formData.paymentType === "PARTIAL" && formData.amount >= tenant.monthlyRent) {
        throw new Error("For partial payment, amount must be less than monthly rent")
      }

      await onSubmit({
        ...formData,
        tenant: tenant._id,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md">{error}</div>}

      <div className="bg-primary p-4 rounded-md">
        <h3 className="font-medium text-white mb-2">Tenant Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-400">Name:</p>
            <p className="text-white font-medium">{tenant.name}</p>
          </div>
          <div>
            <p className="text-gray-400">Monthly Rent:</p>
            <p className="text-success font-bold">₹{tenant.monthlyRent}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Payment Type *</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handlePaymentTypeChange("FULL")}
            className={`px-4 py-3 rounded-md border-2 transition ${
              formData.paymentType === "FULL"
                ? "border-success bg-success/20 text-success"
                : "border-border bg-primary text-gray-300 hover:border-success/50"
            }`}
          >
            <p className="font-bold">Full Payment</p>
            <p className="text-xs mt-1">Pay complete amount</p>
          </button>
          <button
            type="button"
            onClick={() => handlePaymentTypeChange("PARTIAL")}
            className={`px-4 py-3 rounded-md border-2 transition ${
              formData.paymentType === "PARTIAL"
                ? "border-warning bg-warning/20 text-warning"
                : "border-border bg-primary text-gray-300 hover:border-warning/50"
            }`}
          >
            <p className="font-bold">Partial Payment</p>
            <p className="text-xs mt-1">Pay part now, rest later</p>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Payment For *</label>
        <input
          type="text"
          value={formData.paymentFor}
          onChange={(e) => setFormData({ ...formData, paymentFor: e.target.value })}
          className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
          placeholder="e.g., Monthly Rent - January 2024"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Amount Paying *</label>
          <input
            type="number"
            min="1"
            max={tenant.monthlyRent}
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Payment Date *</label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            required
          />
        </div>
      </div>

      {formData.paymentType === "PARTIAL" && (
        <div className="bg-warning/10 p-4 rounded-md border border-warning space-y-3">
          <div>
            <label className="block text-sm font-medium text-warning mb-2">Remaining Due Amount</label>
            <p className="text-2xl font-bold text-warning">₹{formData.remainingDue.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-warning mb-2">Next Due Date *</label>
            <input
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 bg-primary border border-warning rounded-md text-white"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white h-24 resize-none"
          placeholder="Add any additional notes about this payment..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-success text-white rounded-md hover:bg-green-600 disabled:opacity-50 font-medium"
      >
        {loading ? "Recording Payment..." : "Record Payment"}
      </button>
    </form>
  )
}
