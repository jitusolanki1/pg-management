"use client"

import { useState } from "react"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"

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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold text-text-muted text-xs uppercase tracking-wider mb-3">Tenant Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted mb-1">Name</p>
            <p className="text-text-main font-semibold">{tenant.name}</p>
          </div>
          <div>
            <p className="text-text-muted mb-1">Monthly Rent</p>
            <p className="text-primary font-bold">₹{tenant.monthlyRent}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">Payment Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handlePaymentTypeChange("FULL")}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${formData.paymentType === "FULL"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-text-main border-gray-200 hover:border-primary/50"
                }`}
            >
              Full Payment
            </button>
            <button
              type="button"
              onClick={() => handlePaymentTypeChange("PARTIAL")}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${formData.paymentType === "PARTIAL"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-text-main border-gray-200 hover:border-primary/50"
                }`}
            >
              Partial Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              readOnly={formData.paymentType === "FULL"}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${formData.paymentType === "FULL" ? "bg-gray-50 text-gray-500" : ""
                }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">Date</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main mb-1.5">Payment For</label>
          <input
            type="text"
            value={formData.paymentFor}
            onChange={(e) => setFormData({ ...formData, paymentFor: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {formData.paymentType === "PARTIAL" && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 border border-orange-100 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Remaining Due</label>
              <div className="text-danger font-bold">₹{formData.remainingDue}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Next Due Date *</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-main mb-1.5">Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            rows="2"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Processing..." : "Record Payment"}
        </Button>
      </form>
    </div>
  )
}
