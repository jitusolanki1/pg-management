"use client"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { useAuth } from "./context/AuthContext"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import FloorManagement from "./pages/FloorManagement"
import TenantManagement from "./pages/TenantManagement"
import PaymentsPaid from "./pages/PaymentsPaid"
import PaymentsUnpaid from "./pages/PaymentsUnpaid"
import Layout from "./components/Layout"

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="floors" element={<FloorManagement />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="payments/paid" element={<PaymentsPaid />} />
            <Route path="payments/unpaid" element={<PaymentsUnpaid />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
