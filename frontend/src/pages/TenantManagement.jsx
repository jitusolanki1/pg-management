"use client"

import { useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTenants, useDeleteTenant, useInitializePlans, usePlans } from "../hooks"
import { exportToCSV } from "../utils/export"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Pagination } from "../components/ui/Pagination"
import { DeleteDialog } from "../components/ui/DeleteDialog"
import { SkeletonTenantRow } from "../components/ui/Skeleton"

export default function TenantManagement() {
  const navigate = useNavigate()

  // UI state
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tenant: null })

  // Data Layer - React Query hooks
  const { data: tenants = [], isLoading: tenantsLoading, refetch } = useTenants()
  const { data: plans = [], isLoading: plansLoading } = usePlans()
  const deleteTenant = useDeleteTenant()
  const initializePlans = useInitializePlans()

  // Initialize plans if empty
  useMemo(() => {
    if (plans.length === 0 && !plansLoading) {
      initializePlans.mutate()
    }
  }, [plans.length, plansLoading])

  // Filter tenants
  const filteredTenants = useMemo(() =>
    tenants.filter(tenant =>
      tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone?.includes(searchTerm) ||
      tenant.bed?.room?.roomNumber?.toString().includes(searchTerm)
    ), [tenants, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage)
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTenants.slice(start, start + itemsPerPage)
  }, [filteredTenants, currentPage, itemsPerPage])

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Handlers
  const handleDelete = async () => {
    if (!deleteDialog.tenant) return
    try {
      await deleteTenant.mutateAsync(deleteDialog.tenant._id)
      setDeleteDialog({ open: false, tenant: null })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleExport = () => {
    const dataToExport = tenants.map(t => ({
      Name: t.name,
      Phone: t.phone,
      Email: t.email || 'N/A',
      Status: t.status,
      Room: t.bed?.room?.roomNumber || 'N/A',
      Bed: t.bed?.bedNumber || 'N/A',
      Plan: t.plan?.name || 'N/A',
      Rent: t.monthlyRent,
      JoinDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
    }))
    exportToCSV(dataToExport, `Tenants_List_${new Date().toISOString().split('T')[0]}`)
  }

  // Skeleton for tenant table
  const TenantTableSkeleton = () => (
    <tbody className="divide-y divide-gray-100">
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <SkeletonTenantRow key={i} />
      ))}
    </tbody>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Tenant Management</h1>
          <p className="text-text-muted mt-1">Manage tenants, registrations, and room assignments</p>
        </div>
        <Button onClick={() => navigate("/admin/tenants/add")}>
          + Add Tenant
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
            placeholder="Search by name, phone, or room..."
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

      {/* Tenants Table */}
      <Card noPadding>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-text-main">All Tenants</h2>
            <Badge variant="secondary">{tenantsLoading ? "..." : filteredTenants.length}</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-text-muted">Tenant</th>
                <th className="px-6 py-4 font-medium text-text-muted">Room / Bed</th>
                <th className="px-6 py-4 font-medium text-text-muted">Plan</th>
                <th className="px-6 py-4 font-medium text-text-muted">Status</th>
                <th className="px-6 py-4 font-medium text-text-muted text-right">Rent</th>
                <th className="px-6 py-4 font-medium text-text-muted text-center">Actions</th>
              </tr>
            </thead>
            {tenantsLoading ? (
              <TenantTableSkeleton />
            ) : (
              <tbody className="divide-y divide-gray-100">
                {paginatedTenants.length > 0 ? (
                  paginatedTenants.map((tenant) => (
                    <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tenant.profilePhoto || "/placeholder.svg"}
                            alt={tenant.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <Link
                              to={`/admin/tenants/${tenant._id}`}
                              className="font-medium text-text-main hover:text-primary transition-colors block"
                            >
                              {tenant.name}
                            </Link>
                            <span className="text-xs text-text-muted">{tenant.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-main">
                          Room {tenant.bed?.room?.roomNumber || '-'}
                        </div>
                        <div className="text-xs text-text-muted">
                          Bed {tenant.bed?.bedNumber || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {tenant.plan?.name?.replace("_", " ") || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={tenant.status === "ACTIVE" ? "success" : "neutral"}>
                          {tenant.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-text-main">
                        ₹{tenant.monthlyRent}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/tenants/${tenant._id}`}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => setDeleteDialog({ open: true, tenant })}
                            className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Delete Tenant"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-text-muted">
                      {searchTerm ? "No tenants match your search" : "No tenants found. Add your first tenant!"}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {filteredTenants.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTenants.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val)
              setCurrentPage(1)
            }}
          />
        )}
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, tenant: null })}
        onConfirm={handleDelete}
        title="Delete Tenant"
        description="Are you sure you want to delete this tenant? This will remove all their records including payment history."
        itemName={deleteDialog.tenant?.name}
        isLoading={deleteTenant.isPending}
      />
    </div>
  )
}
