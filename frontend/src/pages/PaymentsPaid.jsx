"use client"

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { usePaidPayments } from "../hooks"
import { exportToCSV } from "../utils/export"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Pagination } from "../components/ui/Pagination"
import { SkeletonPaymentRow } from "../components/ui/Skeleton"

export default function PaymentsPaid() {
  const navigate = useNavigate()

  // UI state
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Data Layer - React Query hooks
  const { data: payments = [], isLoading: loading, refetch } = usePaidPayments()

  // Filtered data
  const filteredPayments = useMemo(() =>
    payments.filter((payment) =>
      payment.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [payments, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredPayments.slice(start, start + itemsPerPage)
  }, [filteredPayments, currentPage, itemsPerPage])

  // Reset page on search
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Handlers
  const handleExport = () => {
    const dataToExport = filteredPayments.map(p => ({
      Tenant: p.tenant?.name || 'Unknown',
      Room: p.tenant?.bed?.room?.roomNumber || 'N/A',
      Amount: p.amount,
      Month: p.month || p.paymentFor,
      Date: new Date(p.date || p.paymentDate).toLocaleDateString(),
      Status: 'Paid'
    }))
    exportToCSV(dataToExport, `Payments_Paid_${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Payment History</h1>
          <p className="text-text-muted mt-1">View all completed transactions</p>
        </div>
        <Button onClick={() => navigate("/admin/payments/add")}>
          + Record Payment
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative w-full md:w-96">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="secondary" onClick={() => refetch()} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-text-main">Paid Payments</h2>
            <Badge variant="success">{loading ? "..." : filteredPayments.length}</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-text-muted">Tenant</th>
                <th className="px-6 py-4 font-semibold text-text-muted">Amount</th>
                <th className="px-6 py-4 font-semibold text-text-muted">Month</th>
                <th className="px-6 py-4 font-semibold text-text-muted">Date Paid</th>
                <th className="px-6 py-4 font-semibold text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <SkeletonPaymentRow key={i} />
                ))
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-main">{payment.tenant?.name}</div>
                      <div className="text-xs text-text-muted">Room {payment.tenant?.bed?.room?.roomNumber || "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-success">₹{payment.amount}</td>
                    <td className="px-6 py-4 text-text-main">{payment.month || payment.paymentFor}</td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(payment.date || payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">Paid</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted">
                    {searchTerm ? "No payments match your search" : "No payment history found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPayments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val)
              setCurrentPage(1)
            }}
          />
        )}
      </Card>
    </div>
  )
}
