"use client"

import { useState, useEffect } from "react"
import api from "../utils/api"

export default function PaymentsPaid() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await api.get("/payments/paid")
      setPayments(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) =>
    payment.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Paid Payments</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by tenant name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-secondary border border-border rounded-md text-white w-64"
          />
          <div className="text-sm text-gray-400">Total: {filteredPayments.length} payments</div>
        </div>
      </div>

      {error && (
        <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md">
          <p>{error}</p>
          <button onClick={() => setError("")} className="text-sm underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {filteredPayments.length === 0 ? (
        <div className="bg-secondary p-12 rounded-lg border border-border text-center text-gray-400">
          {searchTerm ? "No payments found matching your search." : "No paid payments yet."}
        </div>
      ) : (
        <div className="bg-secondary rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Tenant</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Payment For</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Payment Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-primary/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{payment.tenant?.name}</p>
                        <p className="text-sm text-gray-400">{payment.tenant?.bed?.bedNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{payment.paymentFor}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.paymentType === "FULL" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                        }`}
                      >
                        {payment.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-success">₹{payment.amount}</p>
                      {payment.paymentType === "PARTIAL" && payment.remainingDue > 0 && (
                        <p className="text-xs text-warning">Due: ₹{payment.remainingDue}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">{payment.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-secondary p-6 rounded-lg border border-border">
        <h3 className="text-lg font-bold text-white mb-4">Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary p-4 rounded-md">
            <p className="text-sm text-gray-400">Total Paid</p>
            <p className="text-2xl font-bold text-success">₹{filteredPayments.reduce((sum, p) => sum + p.amount, 0)}</p>
          </div>
          <div className="bg-primary p-4 rounded-md">
            <p className="text-sm text-gray-400">Full Payments</p>
            <p className="text-2xl font-bold text-white">
              {filteredPayments.filter((p) => p.paymentType === "FULL").length}
            </p>
          </div>
          <div className="bg-primary p-4 rounded-md">
            <p className="text-sm text-gray-400">Partial Payments</p>
            <p className="text-2xl font-bold text-warning">
              {filteredPayments.filter((p) => p.paymentType === "PARTIAL").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
