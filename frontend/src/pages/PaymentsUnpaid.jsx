"use client"

import { useState, useEffect } from "react"
import api from "../utils/api"
import PaymentForm from "../components/PaymentForm"

export default function PaymentsUnpaid() {
  const [payments, setPayments] = useState([])
  const [tenants, setTenants] = useState([])
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, tenantsRes] = await Promise.all([api.get("/payments/unpaid"), api.get("/tenants")])
      setPayments(paymentsRes.data)
      setTenants(tenantsRes.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = async (paymentData) => {
    try {
      await api.post("/payments", paymentData)
      setShowPaymentForm(false)
      setSelectedTenant(null)
      fetchData()
    } catch (err) {
      throw err
    }
  }

  const handleUpdatePayment = async (id, updates) => {
    try {
      await api.put(`/payments/${id}`, updates)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Unpaid Payments</h1>
        <button
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600"
        >
          {showPaymentForm ? "Cancel" : "Add Payment"}
        </button>
      </div>

      {error && (
        <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md">
          <p>{error}</p>
          <button onClick={() => setError("")} className="text-sm underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {showPaymentForm && (
        <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
          <h2 className="text-xl font-bold text-white">Record New Payment</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Tenant</label>
            <select
              value={selectedTenant?._id || ""}
              onChange={(e) => setSelectedTenant(tenants.find((t) => t._id === e.target.value))}
              className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
            >
              <option value="">Choose a tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.name} - {tenant.bed?.bedNumber} (Rent: ₹{tenant.monthlyRent})
                </option>
              ))}
            </select>
          </div>
          {selectedTenant && <PaymentForm tenant={selectedTenant} onSubmit={handleCreatePayment} />}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-secondary p-12 rounded-lg border border-border text-center text-gray-400">
          No pending or overdue payments. All tenants are up to date!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className={`bg-secondary p-6 rounded-lg border-2 ${
                payment.status === "OVERDUE" ? "border-danger" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{payment.tenant?.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === "OVERDUE" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Bed</p>
                      <p className="text-white font-medium">{payment.tenant?.bed?.bedNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Payment For</p>
                      <p className="text-white font-medium">{payment.paymentFor}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Amount Paid</p>
                      <p className="text-success font-bold">₹{payment.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Remaining Due</p>
                      <p className="text-danger font-bold">₹{payment.remainingDue}</p>
                    </div>
                  </div>
                  {payment.nextDueDate && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-400">Next Due Date</p>
                      <p className={`font-medium ${isOverdue(payment.nextDueDate) ? "text-danger" : "text-white"}`}>
                        {new Date(payment.nextDueDate).toLocaleDateString()}
                        {isOverdue(payment.nextDueDate) && " (Overdue)"}
                      </p>
                    </div>
                  )}
                  {payment.notes && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-400">Notes</p>
                      <p className="text-white">{payment.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${payment.tenant?.phone}`}
                    className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600 text-center text-sm"
                  >
                    Call Tenant
                  </a>
                  <button
                    onClick={() =>
                      handleUpdatePayment(payment._id, {
                        status: "PAID",
                        remainingDue: 0,
                      })
                    }
                    className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-600 text-sm"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-secondary p-6 rounded-lg border border-border">
        <h3 className="text-lg font-bold text-white mb-4">Pending Dues Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary p-4 rounded-md">
            <p className="text-sm text-gray-400">Total Pending</p>
            <p className="text-2xl font-bold text-danger">₹{payments.reduce((sum, p) => sum + p.remainingDue, 0)}</p>
          </div>
          <div className="bg-primary p-4 rounded-md">
            <p className="text-sm text-gray-400">Overdue Payments</p>
            <p className="text-2xl font-bold text-danger">{payments.filter((p) => p.status === "OVERDUE").length}</p>
          </div>
          <div className="bg-primary p-4 rounded-md">
            <p className="text-sm text-gray-400">Pending Payments</p>
            <p className="text-2xl font-bold text-warning">{payments.filter((p) => p.status === "PENDING").length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
