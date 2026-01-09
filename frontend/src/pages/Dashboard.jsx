"use client"

import { Link } from "react-router-dom"
import { useDashboardStats, usePaidPayments } from "../hooks"
import { Card, CardHeader } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import {
  SkeletonStatCard,
  SkeletonTable,
  SkeletonCard,
  SkeletonPaymentRow
} from "../components/ui/Skeleton"

// Icons
const Icons = {
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Money: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
}

const StatCard = ({ title, value, icon: Icon, subtext, color = "primary", link }) => (
  <Card className="hover:shadow-md transition-shadow h-full">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <h3 className="text-2xl font-bold text-text-main mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg
        ${color === 'primary' ? 'bg-indigo-50 text-indigo-600' : ''}
        ${color === 'success' ? 'bg-emerald-50 text-emerald-600' : ''}
        ${color === 'danger' ? 'bg-red-50 text-red-600' : ''}
        ${color === 'warning' ? 'bg-amber-50 text-amber-600' : ''}
      `}>
        <Icon />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{subtext}</span>
      {link && (
        <Link to={link} className="text-xs font-medium text-primary hover:text-primary-hover flex items-center">
          View Details
          <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  </Card>
)

export default function Dashboard() {
  // Data Layer - Using React Query hooks
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useDashboardStats()

  const {
    data: paidPayments,
    isLoading: paymentsLoading
  } = usePaidPayments()

  // Derived data
  const recentPayments = Array.isArray(paidPayments) ? paidPayments.slice(0, 5) : []

  // Safe stats with defaults
  const safeStats = {
    activeTenants: stats?.activeTenants || 0,
    occupancyRate: stats?.occupancyRate || 0,
    occupiedBeds: stats?.occupiedBeds || 0,
    totalBeds: stats?.totalBeds || 0,
    monthlyRevenue: stats?.monthlyRevenue || 0,
    expectedMonthlyRevenue: stats?.expectedMonthlyRevenue || 0,
    pendingDues: stats?.pendingDues || 0,
    totalFloors: stats?.totalFloors || 0,
    totalRooms: stats?.totalRooms || 0,
    availableBeds: stats?.availableBeds || 0,
    totalRevenue: stats?.totalRevenue || 0
  }

  // Calculate collection percentage
  const collectionRate = safeStats.expectedMonthlyRevenue > 0
    ? ((safeStats.monthlyRevenue / safeStats.expectedMonthlyRevenue) * 100).toFixed(0)
    : 0

  // Error state - Only for critical errors
  if (statsError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Dashboard Overview</h1>
          <p className="text-text-muted mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="bg-red-50 border border-danger/20 text-danger px-4 py-3 rounded-lg">
          <p>{statsError.message || "Failed to load dashboard data. Please try again."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Dashboard Overview</h1>
        <p className="text-text-muted mt-1">Welcome back, here's what's happening today.</p>
      </div>

      {/* KPI Cards - Show skeletons while loading stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Tenants"
              value={safeStats.activeTenants}
              icon={Icons.Users}
              subtext="Active residents"
              color="primary"
              link="/tenants"
            />
            <StatCard
              title="Occupancy Rate"
              value={`${safeStats.occupancyRate}%`}
              icon={Icons.Chart}
              subtext={`${safeStats.occupiedBeds} occupied / ${safeStats.totalBeds} total`}
              color="success"
              link="/floors"
            />
            <StatCard
              title="Monthly Collection"
              value={`₹${safeStats.monthlyRevenue.toLocaleString()}`}
              icon={Icons.Money}
              subtext={`${collectionRate}% of ₹${safeStats.expectedMonthlyRevenue.toLocaleString()} expected`}
              color="success"
              link="/payments/paid"
            />
            <StatCard
              title="Pending Dues"
              value={`₹${safeStats.pendingDues.toLocaleString()}`}
              icon={Icons.Alert}
              subtext={safeStats.pendingDues > 0 ? "Outstanding this month" : "All dues cleared! 🎉"}
              color={safeStats.pendingDues > 0 ? "danger" : "success"}
              link="/payments/unpaid"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - 2 Cols */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Activity / Payments */}
          <Card noPadding className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-text-main">Recent Transactions</h3>
              <Link to="/payments/paid" className="text-xs font-medium text-primary hover:text-primary-hover">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium text-text-muted">Tenant</th>
                    <th className="px-6 py-3 font-medium text-text-muted">Amount</th>
                    <th className="px-6 py-3 font-medium text-text-muted">Status</th>
                    <th className="px-6 py-3 font-medium text-text-muted text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentsLoading ? (
                    // Show skeleton rows while loading
                    Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonPaymentRow key={i} />
                    ))
                  ) : recentPayments.length > 0 ? (
                    recentPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-medium text-text-main">{payment.tenant?.name || 'Unknown'}</div>
                          <div className="text-xs text-text-muted">{payment.month}</div>
                        </td>
                        <td className="px-6 py-3 font-medium text-text-main">₹{payment.amount}</td>
                        <td className="px-6 py-3">
                          <Badge variant="success">Paid</Badge>
                        </td>
                        <td className="px-6 py-3 text-right text-text-muted">
                          {new Date(payment.date || payment.paymentDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-text-muted">
                        No recent transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Area - 1 Col */}
        <div className="space-y-8">
          {/* Overall Status */}
          <Card>
            <CardHeader title="Property Status" />
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary font-medium">Occupancy</span>
                  <span className="text-text-main font-bold">{safeStats.occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${safeStats.occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-text-main">{safeStats.availableBeds}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-medium mt-1">Available Beds</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-text-main">{safeStats.totalRooms}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-medium mt-1">Total Rooms</p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/floors">
                  <button className="w-full py-2 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                    Manage Property Layout
                  </button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="space-y-3">
              <Link to="/tenants" className="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all group">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="text-lg">+</span>
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-main">Add New Tenant</span>
              </Link>
              <Link to="/payments/unpaid" className="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all group">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <span className="text-sm">₹</span>
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-main">Record Payment</span>
              </Link>
              <Link to="/floors" className="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all group">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mr-3 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-main">Manage Rooms</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
