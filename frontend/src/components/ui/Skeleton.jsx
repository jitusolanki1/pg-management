/**
 * Skeleton Loading Components
 * Pure Tailwind CSS - Premium, Clean Design
 * No layout shift during loading
 */

// Base skeleton pulse animation
const pulseClass = "animate-pulse bg-gray-100 rounded"

/**
 * Text skeleton - for single line text
 */
export function SkeletonText({ className = "", width = "w-24" }) {
    return (
        <div className={`h-4 ${pulseClass} ${width} ${className}`} />
    )
}

/**
 * Title skeleton - for headings
 */
export function SkeletonTitle({ className = "", width = "w-48" }) {
    return (
        <div className={`h-6 ${pulseClass} ${width} ${className}`} />
    )
}

/**
 * Avatar skeleton - for profile images
 */
export function SkeletonAvatar({ size = "md", className = "" }) {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    }
    return (
        <div className={`${pulseClass} rounded-full ${sizes[size]} ${className}`} />
    )
}

/**
 * Button skeleton
 */
export function SkeletonButton({ className = "", width = "w-24" }) {
    return (
        <div className={`h-10 ${pulseClass} ${width} ${className}`} />
    )
}

/**
 * Card skeleton - for stat cards
 */
export function SkeletonCard({ className = "" }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                    <div className={`h-4 ${pulseClass} w-20`} />
                    <div className={`h-8 ${pulseClass} w-16`} />
                </div>
                <div className={`w-10 h-10 ${pulseClass}`} />
            </div>
            <div className={`h-3 ${pulseClass} w-32`} />
        </div>
    )
}

/**
 * Stat card skeleton - matches StatCard component
 */
export function SkeletonStatCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                    <div className={`h-4 ${pulseClass} w-24`} />
                    <div className={`h-7 ${pulseClass} w-16 mt-1`} />
                </div>
                <div className={`w-10 h-10 ${pulseClass} rounded-lg`} />
            </div>
            <div className="flex items-center justify-between">
                <div className={`h-3 ${pulseClass} w-28`} />
                <div className={`h-3 ${pulseClass} w-20`} />
            </div>
        </div>
    )
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({ columns = 5, className = "" }) {
    return (
        <tr className={`border-b border-gray-100 ${className}`}>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className={`h-4 ${pulseClass} ${i === 0 ? 'w-32' : 'w-20'}`} />
                </td>
            ))}
        </tr>
    )
}

/**
 * Table skeleton - full table with header and rows
 */
export function SkeletonTable({ rows = 5, columns = 5, headers = [] }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        {headers.length > 0
                            ? headers.map((header, i) => (
                                <th key={i} className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                                    {header}
                                </th>
                            ))
                            : Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="px-6 py-4">
                                    <div className={`h-3 ${pulseClass} w-16`} />
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/**
 * Tenant row skeleton - specific for tenant list
 */
export function SkeletonTenantRow() {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50/50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <SkeletonAvatar size="md" />
                    <div className="space-y-1.5">
                        <div className={`h-4 ${pulseClass} w-28`} />
                        <div className={`h-3 ${pulseClass} w-20`} />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className={`h-4 ${pulseClass} w-24`} />
            </td>
            <td className="px-6 py-4">
                <div className={`h-4 ${pulseClass} w-16`} />
            </td>
            <td className="px-6 py-4">
                <div className={`h-6 ${pulseClass} w-16 rounded-full`} />
            </td>
            <td className="px-6 py-4">
                <div className={`h-4 ${pulseClass} w-20`} />
            </td>
            <td className="px-6 py-4 text-right">
                <div className={`h-8 ${pulseClass} w-20 ml-auto`} />
            </td>
        </tr>
    )
}

/**
 * Payment row skeleton
 */
export function SkeletonPaymentRow() {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50/50">
            <td className="px-6 py-4">
                <div className="space-y-1.5">
                    <div className={`h-4 ${pulseClass} w-28`} />
                    <div className={`h-3 ${pulseClass} w-16`} />
                </div>
            </td>
            <td className="px-6 py-4">
                <div className={`h-4 ${pulseClass} w-16`} />
            </td>
            <td className="px-6 py-4">
                <div className={`h-4 ${pulseClass} w-20`} />
            </td>
            <td className="px-6 py-4">
                <div className={`h-4 ${pulseClass} w-24`} />
            </td>
            <td className="px-6 py-4">
                <div className={`h-6 ${pulseClass} w-14 rounded-full`} />
            </td>
        </tr>
    )
}

/**
 * Form field skeleton
 */
export function SkeletonFormField({ className = "" }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <div className={`h-4 ${pulseClass} w-20`} />
            <div className={`h-10 ${pulseClass} w-full`} />
        </div>
    )
}

/**
 * Form skeleton - full form with multiple fields
 */
export function SkeletonForm({ fields = 4, columns = 2 }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className={`h-6 ${pulseClass} w-40 mb-6`} />
            <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
                {Array.from({ length: fields }).map((_, i) => (
                    <SkeletonFormField key={i} />
                ))}
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                <SkeletonButton width="w-32" />
                <SkeletonButton width="w-24" />
            </div>
        </div>
    )
}

/**
 * Image upload skeleton
 */
export function SkeletonImageUpload({ className = "" }) {
    return (
        <div className={`aspect-video ${pulseClass} border-2 border-dashed border-gray-200 flex items-center justify-center ${className}`}>
            <div className="text-center space-y-2">
                <div className={`w-8 h-8 ${pulseClass} mx-auto rounded-full`} />
                <div className={`h-3 ${pulseClass} w-20 mx-auto`} />
            </div>
        </div>
    )
}

/**
 * Floor card skeleton - for floor management
 */
export function SkeletonFloorCard({ className = "" }) {
    return (
        <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
            <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                    <div className={`h-3 ${pulseClass} w-16`} />
                    <div className={`h-5 ${pulseClass} w-24`} />
                </div>
                <div className={`w-8 h-8 ${pulseClass} rounded-full`} />
            </div>
        </div>
    )
}

/**
 * Room card skeleton
 */
export function SkeletonRoomCard({ className = "" }) {
    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`h-5 ${pulseClass} w-20`} />
                <div className={`h-5 ${pulseClass} w-12 rounded-full`} />
            </div>
            <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-8 h-8 ${pulseClass} rounded`} />
                ))}
            </div>
        </div>
    )
}

/**
 * Dashboard skeleton - complete dashboard loading state
 */
export function SkeletonDashboard() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className={`h-7 ${pulseClass} w-48 mb-2`} />
                <div className={`h-4 ${pulseClass} w-72`} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <SkeletonTable rows={5} columns={4} headers={["Tenant", "Amount", "Status", "Date"]} />
                </div>
                <div className="space-y-6">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        </div>
    )
}

/**
 * Generic content skeleton wrapper
 * Shows skeleton while loading, actual content when ready
 */
export function SkeletonWrapper({ isLoading, skeleton, children }) {
    if (isLoading) {
        return skeleton
    }
    return children
}

export default {
    Text: SkeletonText,
    Title: SkeletonTitle,
    Avatar: SkeletonAvatar,
    Button: SkeletonButton,
    Card: SkeletonCard,
    StatCard: SkeletonStatCard,
    Table: SkeletonTable,
    TableRow: SkeletonTableRow,
    TenantRow: SkeletonTenantRow,
    PaymentRow: SkeletonPaymentRow,
    FormField: SkeletonFormField,
    Form: SkeletonForm,
    ImageUpload: SkeletonImageUpload,
    FloorCard: SkeletonFloorCard,
    RoomCard: SkeletonRoomCard,
    Dashboard: SkeletonDashboard,
    Wrapper: SkeletonWrapper
}
