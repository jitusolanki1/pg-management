"use client"

import { useState, useEffect } from "react"
import api from "../utils/api"
import TenantForm from "../components/TenantForm"
import TenantList from "../components/TenantList"
import TenantDetails from "../components/TenantDetails"

export default function TenantManagement() {
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [beds, setBeds] = useState([])
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tenantsRes, plansRes, bedsRes] = await Promise.all([
        api.get("/tenants"),
        api.get("/plans"),
        api.get("/beds?status=AVAILABLE"),
      ])
      setTenants(tenantsRes.data)
      setPlans(plansRes.data)
      setBeds(bedsRes.data)

      // Initialize plans if empty
      if (plansRes.data.length === 0) {
        await api.post("/plans/init")
        const newPlans = await api.get("/plans")
        setPlans(newPlans.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (tenantData) => {
    try {
      await api.post("/tenants", tenantData)
      setShowForm(false)
      fetchData()
    } catch (err) {
      throw err
    }
  }

  const handleDeleteTenant = async (id) => {
    if (!confirm("Are you sure you want to delete this tenant?")) return
    try {
      await api.delete(`/tenants/${id}`)
      setSelectedTenant(null)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "Add Tenant"}
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

      {showForm && (
        <TenantForm plans={plans} beds={beds} onSubmit={handleCreateTenant} onCancel={() => setShowForm(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TenantList tenants={tenants} onSelect={setSelectedTenant} selectedId={selectedTenant?._id} />
        </div>
        <div>
          {selectedTenant ? (
            <TenantDetails tenant={selectedTenant} onDelete={handleDeleteTenant} />
          ) : (
            <div className="bg-secondary p-6 rounded-lg border border-border text-center text-gray-400">
              Select a tenant to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
