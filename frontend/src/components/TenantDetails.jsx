"use client"

export default function TenantDetails({ tenant, onDelete }) {
  return (
    <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Tenant Details</h2>
        <button
          onClick={() => onDelete(tenant._id)}
          className="px-3 py-1 bg-danger text-white text-sm rounded-md hover:bg-red-600"
        >
          Delete
        </button>
      </div>

      <div className="flex justify-center">
        <img
          src={tenant.profilePhoto || "/placeholder.svg"}
          alt={tenant.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-border"
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 uppercase">Full Name</label>
          <p className="text-white font-medium">{tenant.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 uppercase">Age</label>
            <p className="text-white font-medium">{tenant.age} years</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase">Status</label>
            <p className="text-white font-medium">{tenant.status}</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase">Phone</label>
          <a href={`tel:${tenant.phone}`} className="text-accent hover:underline font-medium block">
            {tenant.phone}
          </a>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase">Plan</label>
          <p className="text-white font-medium">{tenant.plan?.name.replace("_", " ")}</p>
          <p className="text-sm text-gray-400">{tenant.plan?.description}</p>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase">Bed Assignment</label>
          <p className="text-white font-medium">
            {tenant.bed?.bedNumber} - Room {tenant.bed?.room?.roomNumber}
          </p>
          <p className="text-sm text-gray-400">Floor: {tenant.bed?.floor?.name}</p>
        </div>

        <div className="bg-primary p-3 rounded-md">
          <label className="text-xs text-gray-400 uppercase">Monthly Rent</label>
          <p className="text-2xl font-bold text-success">₹{tenant.monthlyRent}</p>
          {tenant.clothWashing && <p className="text-xs text-gray-400 mt-1">Includes cloth washing service</p>}
        </div>

        <div className="bg-primary p-3 rounded-md">
          <label className="text-xs text-gray-400 uppercase">Deposit Information</label>
          <div className="space-y-1 text-sm mt-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-accent font-bold">₹{tenant.deposit?.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{tenant.deposit?.months} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Paid On:</span>
              <span className="text-white">{new Date(tenant.deposit?.paidDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase mb-2 block">Aadhaar Documents</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">Front</p>
              <img
                src={tenant.aadhaarFront || "/placeholder.svg"}
                alt="Aadhaar Front"
                className="w-full h-24 object-cover rounded-md border border-border"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Back</p>
              <img
                src={tenant.aadhaarBack || "/placeholder.svg"}
                alt="Aadhaar Back"
                className="w-full h-24 object-cover rounded-md border border-border"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase">Join Date</label>
          <p className="text-white font-medium">{new Date(tenant.joinDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
