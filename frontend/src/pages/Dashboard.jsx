"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../utils/api"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, paymentsRes] = await Promise.all([api.get("/dashboard/stats"), api.get("/payments")])
      setStats(statsRes.data)
      setRecentPayments(paymentsRes.data.slice(0, 5))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md">
        <p>Error loading dashboard: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="text-sm text-gray-400">{new Date().toLocaleDateString("en-US", { dateStyle: "full" })}</div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-secondary p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Tenants</p>
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <span className="text-accent text-xl">👥</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeTenants}</p>
          <p className="text-xs text-gray-400 mt-1">Active residents</p>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Occupancy Rate</p>
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
              <span className="text-success text-xl">📊</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-success">{stats.occupancyRate}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.occupiedBeds} of {stats.totalBeds} beds
          </p>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Monthly Revenue</p>
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
              <span className="text-success text-xl">💰</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-success">₹{stats.monthlyRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Current month</p>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Pending Dues</p>
            <div className="w-10 h-10 bg-danger/20 rounded-lg flex items-center justify-center">
              <span className="text-danger text-xl">⚠️</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-danger">₹{stats.pendingDues.toLocaleString()}</p>
          <Link to="/payments/unpaid" className="text-xs text-accent hover:underline mt-1 inline-block">
            View unpaid →
          </Link>
        </div>
      </div>

      {/* Infrastructure Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-secondary p-6 rounded-lg border border-border">
          <h3 className="text-lg font-bold text-white mb-4">Infrastructure</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <span className="text-accent text-xl">🏢</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Floors</p>
                  <p className="text-xl font-bold text-white">{stats.totalFloors}</p>
                </div>
              </div>
              <Link to="/floors" className="text-accent text-sm hover:underline">
                Manage →
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <span className="text-accent text-xl">🚪</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Rooms</p>
                  <p className="text-xl font-bold text-white">{stats.totalRooms}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <span className="text-accent text-xl">🛏️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Beds</p>
                  <p className="text-xl font-bold text-white">{stats.totalBeds}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-border">
          <h3 className="text-lg font-bold text-white mb-4">Bed Availability</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Occupied</span>
                <span className="text-white font-medium">{stats.occupiedBeds} beds</span>
              </div>
              <div className="w-full bg-primary h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger transition-all"
                  style={{ width: `${(stats.occupiedBeds / stats.totalBeds) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Available</span>
                <span className="text-white font-medium">{stats.availableBeds} beds</span>
              </div>
              <div className="w-full bg-primary h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${(stats.availableBeds / stats.totalBeds) * 100}%` }}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <Link
                to="/floors"
                className="block w-full py-2 text-center bg-accent text-white rounded-md hover:bg-blue-600 text-sm"
              >
                View Floor Plan
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-border">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Overview</h3>
          <div className="space-y-4">
            <div className="bg-primary p-4 rounded-md">
              <p className="text-xs text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-success">₹{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-primary p-4 rounded-md">
              <p className="text-xs text-gray-400">Total Collected</p>
              <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-danger/10 p-4 rounded-md border border-danger">
              <p className="text-xs text-danger">Pending Dues</p>
              <p className="text-2xl font-bold text-danger">₹{stats.pendingDues.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-secondary rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Recent Payments</h3>
          <Link to="/payments/paid" className="text-accent text-sm hover:underline">
            View all →
          </Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No recent payments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Payment For</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-primary/50">
                    <td className="px-4 py-3 text-white">{payment.tenant?.name}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{payment.paymentFor}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-success">₹{payment.amount}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "PAID"
                            ? "bg-success/20 text-success"
                            : payment.status === "OVERDUE"
                              ? "bg-danger/20 text-danger"
                              : "bg-warning/20 text-warning"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/tenants"
          className="bg-secondary p-6 rounded-lg border border-border hover:border-accent transition text-center group"
        >
          <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/30 transition">
            <span className="text-accent text-3xl">👤</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Manage Tenants</h3>
          <p className="text-sm text-gray-400">Add, view, and manage tenant information</p>
        </Link>
        <Link
          to="/floors"
          className="bg-secondary p-6 rounded-lg border border-border hover:border-accent transition text-center group"
        >
          <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/30 transition">
            <span className="text-accent text-3xl">🏢</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Floor Management</h3>
          <p className="text-sm text-gray-400">Manage floors, rooms, and bed assignments</p>
        </Link>
        <Link
          to="/payments/unpaid"
          className="bg-secondary p-6 rounded-lg border border-border hover:border-danger transition text-center group"
        >
          <div className="w-16 h-16 bg-danger/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-danger/30 transition">
            <span className="text-danger text-3xl">💳</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Pending Payments</h3>
          <p className="text-sm text-gray-400">Track and collect outstanding dues</p>
        </Link>
      </div>
    </div>
  )
}
