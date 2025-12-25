"use client"

export default function TenantList({ tenants, onSelect, selectedId }) {
  if (tenants.length === 0) {
    return (
      <div className="bg-secondary p-6 rounded-lg border border-border text-center text-gray-400">
        No tenants found. Add your first tenant to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tenants.map((tenant) => (
        <div
          key={tenant._id}
          onClick={() => onSelect(tenant)}
          className={`bg-secondary p-4 rounded-lg border-2 cursor-pointer transition ${
            selectedId === tenant._id ? "border-accent" : "border-border hover:border-accent/50"
          }`}
        >
          <div className="flex items-start gap-4">
            <img
              src={tenant.profilePhoto || "/placeholder.svg"}
              alt={tenant.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{tenant.name}</h3>
                  <p className="text-sm text-gray-400">Age: {tenant.age}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tenant.status === "ACTIVE" ? "bg-success/20 text-success" : "bg-muted/20 text-muted"
                  }`}
                >
                  {tenant.status}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Bed:</span>
                  <span className="text-white ml-2">{tenant.bed?.bedNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400">Room:</span>
                  <span className="text-white ml-2">{tenant.bed?.room?.roomNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400">Plan:</span>
                  <span className="text-white ml-2">{tenant.plan?.name.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-gray-400">Rent:</span>
                  <span className="text-success ml-2">₹{tenant.monthlyRent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
