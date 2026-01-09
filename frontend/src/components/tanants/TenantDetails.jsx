import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { Badge } from "../ui/Badge"

export default function TenantDetails({ tenant, onDelete }) {
  if (!tenant) return null;

  return (
    <Card className="h-fit sticky top-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-text-main">Tenant Details</h2>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(tenant._id)}
        >
          Delete
        </Button>
      </div>

      <div className="flex flex-col items-center mb-6">
        <img
          src={tenant.profilePhoto || "/placeholder.svg"}
          alt={tenant.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4"
        />
        <h3 className="text-xl font-bold text-text-main">{tenant.name}</h3>
        <div className="flex gap-2 mt-2">
          <Badge variant={tenant.status === "ACTIVE" ? "success" : "neutral"}>
            {tenant.status}
          </Badge>
          <Badge variant="secondary">
            Age: {tenant.age}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contact */}
        <div>
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Contact Info</h4>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 text-primary hover:underline font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {tenant.phone}
            </a>
          </div>
        </div>

        {/* Accommodation */}
        <div>
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Accommodation</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted block mb-1">Room</label>
              <p className="text-text-main font-semibold">{tenant.bed?.room?.roomNumber || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Bed No</label>
              <p className="text-text-main font-semibold">{tenant.bed?.bedNumber || "N/A"}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-200">
              <label className="text-xs text-text-muted block mb-1">Plan</label>
              <p className="text-text-main font-semibold">{tenant.plan?.name.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Payment Stats */}
        <div>
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Financials</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 text-success border border-success/10">
              <span className="text-sm font-medium">Monthly Rent</span>
              <span className="font-bold">₹{tenant.monthlyRent}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              <span className="text-sm font-medium">Last Payment</span>
              <span className="font-bold">{tenant.lastPaymentDate ? new Date(tenant.lastPaymentDate).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Documents Preview */}
        <div>
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Documents</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-video bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-text-muted cursor-pointer hover:bg-gray-200">
              Front
            </div>
            <div className="aspect-video bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-text-muted cursor-pointer hover:bg-gray-200">
              Back
            </div>
          </div>
        </div>

      </div>
    </Card>
  )
}
