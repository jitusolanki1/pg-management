"use client"

import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"

export default function Layout() {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-primary">
      <nav className="bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-xl font-bold text-white">
                PG Management
              </Link>
            </div>

            <div className="hidden sm:flex sm:items-center sm:gap-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/floors"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/floors") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Floor Management
              </Link>
              <Link
                to="/tenants"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/tenants") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Tenants
              </Link>
              <Link
                to="/payments/paid"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/payments/paid") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Paid List
              </Link>
              <Link
                to="/payments/unpaid"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/payments/unpaid") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Unpaid List
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex sm:items-center sm:gap-4">
                <span className="text-sm text-gray-300">{admin?.name}</span>
                <button onClick={logout} className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-600">
                  Logout
                </button>
              </div>

              <button
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
                aria-expanded={mobileOpen}
                aria-label="Toggle navigation"
                onClick={() => setMobileOpen((s) => !s)}
              >
                <svg className={`h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden bg-secondary border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/floors"
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/floors") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Floor Management
              </Link>
              <Link
                to="/tenants"
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/tenants") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Tenants
              </Link>
              <Link
                to="/payments/paid"
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/payments/paid") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Paid List
              </Link>
              <Link
                to="/payments/unpaid"
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/payments/unpaid") ? "bg-accent text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Unpaid List
              </Link>
              <div className="border-t border-border mt-2 pt-2 px-3 flex items-center justify-between">
                <span className="text-sm text-gray-300">{admin?.name}</span>
                <button onClick={() => { setMobileOpen(false); logout(); }} className="px-3 py-2 bg-danger text-white rounded-md hover:bg-red-600">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
