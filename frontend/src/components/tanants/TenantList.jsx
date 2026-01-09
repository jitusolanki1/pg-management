"use client"

import { Link } from "react-router-dom"
import { Card } from "../ui/Card"
import { Badge } from "../ui/Badge"

export default function TenantList({ tenants }) {
  if (tenants.length === 0) {
    return (
      <Card noPadding>
        <div className="p-8 text-center text-text-muted">
          No tenants found. Add your first tenant to get started.
        </div>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-medium text-text-muted">Tenant Name</th>
            <th className="px-6 py-4 font-medium text-text-muted">Room / Bed</th>
            <th className="px-6 py-4 font-medium text-text-muted">Plan</th>
            <th className="px-6 py-4 font-medium text-text-muted">Status</th>
            <th className="px-6 py-4 font-medium text-text-muted text-right">Rent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tenants.map((tenant) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
