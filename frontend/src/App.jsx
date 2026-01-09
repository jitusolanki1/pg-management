/**
 * PG Management App
 * Bank-Grade Security with Lazy Loading + TanStack Query
 * Dual Architecture: Public Website + Hidden Admin CRM
 */

import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { QueryProvider } from "./providers/QueryProvider"

// Public Pages (no auth required)
import LandingPage from "./pages/public/LandingPage"
import TenantRegister from "./pages/public/TenantRegister"

// Admin Auth Pages
import AdminLogin from "./pages/AdminLogin"

// Admin Dashboard Layout
import Layout from "./components/Layout"

// Eager load critical admin components
import Dashboard from "./pages/Dashboard"
import FloorManagement from "./pages/FloorManagement"
import TenantManagement from "./pages/TenantManagement"
import PlansManagement from "./pages/PlansManagement"
import PaymentsPaid from "./pages/PaymentsPaid"
import PaymentsUnpaid from "./pages/PaymentsUnpaid"
import AddTenant from "./pages/AddTenant"
import AddPayment from "./pages/AddPayment"
import AddFloorRoom from "./pages/AddFloorRoom"

// Lazy load less frequently used admin pages
const TenantDetailsPage = lazy(() => import("./pages/TenantDetailsPage"))
const LeadsManagement = lazy(() => import("./pages/admin/LeadsManagement"))

/**
 * Minimal Loading Fallback (only for lazy components)
 */
function MinimalLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

/**
 * Initial App Loading (only shows once on app start)
 */
function AppLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Protected Route Component
 * Only renders children if user is authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading while checking auth (only on initial load)
  if (isLoading) {
    return <AppLoadingSpinner />
  }

  // Redirect to home if not authenticated (not to login - login is hidden)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // No Suspense wrapper here - children render immediately
  return children
}

/**
 * Public Route Component
 * Redirects to dashboard if already authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AppLoadingSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

/**
 * Session Timer Component
 * Shows remaining session time
 */
function SessionTimer() {
  const { isAuthenticated, getSessionTimeRemaining, logout } = useAuth()

  if (!isAuthenticated) return null

  const remaining = getSessionTimeRemaining()
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  // Show warning when less than 5 minutes
  const isWarning = remaining < 300

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-mono transition-colors ${isWarning
      ? "bg-yellow-500/90 text-yellow-900"
      : "bg-gray-800/90 text-gray-200"
      }`}>
      <div className="flex items-center gap-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Session: {minutes}:{seconds.toString().padStart(2, "0")}</span>
        {isWarning && (
          <button
            onClick={logout}
            className="ml-2 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
          >
            Extend
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Main App Router
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============ PUBLIC ROUTES (No Auth Required) ============ */}

        {/* Landing Page - Main public website */}
        <Route path="/" element={<LandingPage />} />

        {/* Tenant Self-Registration */}
        <Route path="/register" element={<TenantRegister />} />

        {/* ============ ADMIN AUTH ROUTES ============ */}

        {/* Admin Login - Only accessible via hidden entry (handled in component) */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ============ PROTECTED ADMIN ROUTES ============ */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="floors" element={<FloorManagement />} />
          <Route path="floors/add" element={<AddFloorRoom />} />
          <Route path="tenants" element={<TenantManagement />} />
          <Route path="tenants/add" element={<AddTenant />} />
          <Route path="tenants/:id" element={<Suspense fallback={<MinimalLoader />}><TenantDetailsPage /></Suspense>} />
          <Route path="plans" element={<PlansManagement />} />
          <Route path="payments/paid" element={<PaymentsPaid />} />
          <Route path="payments/unpaid" element={<PaymentsUnpaid />} />
          <Route path="payments/add" element={<AddPayment />} />
          <Route path="leads" element={<Suspense fallback={<MinimalLoader />}><LeadsManagement /></Suspense>} />
        </Route>

        {/* Catch all - redirect to public home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Session Timer (commented out - enable for visible timer) */}
      {/* <SessionTimer /> */}
    </BrowserRouter>
  )
}

/**
 * App Entry Point
 */
function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
