/**
 * Leads Management Page - Admin CRM
 * View, filter, and manage tenant applications
 */

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import apiClient from "../../api/apiClient"

// Status config
const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    contacted: { label: "Contacted", color: "bg-blue-100 text-blue-800", icon: "📞" },
    scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-800", icon: "📅" },
    accepted: { label: "Accepted", color: "bg-green-100 text-green-800", icon: "✅" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: "❌" }
}

// Room preference labels
const roomLabels = {
    single: "Single Sharing",
    double: "Double Sharing",
    triple: "Triple Sharing"
}

// Occupation labels
const occupationLabels = {
    student: "Student",
    working: "Working Professional"
}

export default function LeadsManagement() {
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState({
        status: "all",
        occupation: "all",
        roomPreference: "all",
        search: ""
    })
    const [page, setPage] = useState(1)
    const [selectedLead, setSelectedLead] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [noteText, setNoteText] = useState("")

    // Fetch leads
    const { data: leadsData, isLoading, error } = useQuery({
        queryKey: ["leads", filters, page],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters.status !== "all") params.append("status", filters.status)
            if (filters.occupation !== "all") params.append("occupation", filters.occupation)
            if (filters.roomPreference !== "all") params.append("roomPreference", filters.roomPreference)
            if (filters.search) params.append("search", filters.search)
            params.append("page", page)
            params.append("limit", "15")

            const response = await apiClient.get(`/leads?${params.toString()}`)
            return response.data
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2 // 2 minutes
    })

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ["lead-stats"],
        queryFn: async () => {
            const response = await apiClient.get("/leads/stats")
            return response.data.data
        },
        staleTime: 1000 * 60 * 5
    })

    // Update lead mutation
    const updateLeadMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await apiClient.put(`/leads/${id}`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["leads"])
            queryClient.invalidateQueries(["lead-stats"])
            setShowModal(false)
            setSelectedLead(null)
        }
    })

    // Delete lead mutation
    const deleteLeadMutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(`/leads/${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["leads"])
            queryClient.invalidateQueries(["lead-stats"])
        }
    })

    // Handle status change
    const handleStatusChange = async (lead, newStatus) => {
        updateLeadMutation.mutate({ id: lead._id, data: { status: newStatus } })
    }

    // Handle notes save
    const handleSaveNotes = async () => {
        if (!selectedLead) return
        updateLeadMutation.mutate({
            id: selectedLead._id,
            data: { adminNotes: noteText }
        })
    }

    // Open lead details
    const openLeadModal = (lead) => {
        setSelectedLead(lead)
        setNoteText(lead.adminNotes || "")
        setShowModal(true)
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
                <p className="text-gray-600 mt-1">Manage tenant applications from the website</p>
            </div>

            {/* Stats Cards */}
            {statsData && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-3xl font-bold text-gray-900">{statsData.total}</div>
                        <div className="text-sm text-gray-500">Total Leads</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                        <div className="text-3xl font-bold text-yellow-700">{statsData.pending}</div>
                        <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="text-3xl font-bold text-blue-700">{statsData.contacted}</div>
                        <div className="text-sm text-blue-600">Contacted</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="text-3xl font-bold text-purple-700">{statsData.scheduled}</div>
                        <div className="text-sm text-purple-600">Scheduled</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-3xl font-bold text-green-700">{statsData.accepted}</div>
                        <div className="text-sm text-green-600">Accepted</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <div className="text-3xl font-bold text-red-700">{statsData.rejected}</div>
                        <div className="text-sm text-red-600">Rejected</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* Occupation Filter */}
                    <select
                        value={filters.occupation}
                        onChange={(e) => setFilters(prev => ({ ...prev, occupation: e.target.value }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">All Occupation</option>
                        <option value="student">Student</option>
                        <option value="working">Working</option>
                    </select>

                    {/* Room Preference Filter */}
                    <select
                        value={filters.roomPreference}
                        onChange={(e) => setFilters(prev => ({ ...prev, roomPreference: e.target.value }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">All Rooms</option>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="triple">Triple</option>
                    </select>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading leads...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">Failed to load leads</div>
                ) : leadsData?.data?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No leads found</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preference</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Move-in</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leadsData?.data?.map((lead) => (
                                        <tr
                                            key={lead._id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => openLeadModal(lead)}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                                                        {lead.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{lead.fullName}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-900">{lead.formattedPhone || lead.phone}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[150px]">{lead.email}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-900">{roomLabels[lead.roomPreference]}</div>
                                                <div className="text-xs text-gray-500">{occupationLabels[lead.occupation]}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {format(new Date(lead.moveInDate), "dd MMM yyyy")}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => handleStatusChange(lead, e.target.value)}
                                                    className={`px-3 py-1 text-sm rounded-full border-0 cursor-pointer ${statusConfig[lead.status].color}`}
                                                >
                                                    {Object.entries(statusConfig).map(([key, { label, icon }]) => (
                                                        <option key={key} value={key}>{icon} {label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`tel:${lead.phone}`}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Call"
                                                    >
                                                        📞
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="WhatsApp"
                                                    >
                                                        💬
                                                    </a>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm("Are you sure you want to delete this lead?")) {
                                                                deleteLeadMutation.mutate(lead._id)
                                                            }
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {leadsData?.pagination && leadsData.pagination.pages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, leadsData.pagination.total)} of {leadsData.pagination.total}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(leadsData.pagination.pages, p + 1))}
                                        disabled={page === leadsData.pagination.pages}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lead Detail Modal */}
            {showModal && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Lead Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                    {selectedLead.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900">{selectedLead.fullName}</h3>
                                    <p className="text-gray-500">{selectedLead.email}</p>
                                    <div className="mt-2 flex items-center gap-4">
                                        <span className={`px-3 py-1 text-sm rounded-full ${statusConfig[selectedLead.status].color}`}>
                                            {statusConfig[selectedLead.status].icon} {statusConfig[selectedLead.status].label}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Applied {formatDistanceToNow(new Date(selectedLead.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Actions */}
                            <div className="flex gap-3">
                                <a
                                    href={`tel:${selectedLead.phone}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    📞 Call Now
                                </a>
                                <a
                                    href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                                >
                                    💬 WhatsApp
                                </a>
                                <a
                                    href={`mailto:${selectedLead.email}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    ✉️ Email
                                </a>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500">Phone</div>
                                    <div className="font-medium text-gray-900">{selectedLead.formattedPhone || selectedLead.phone}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500">Occupation</div>
                                    <div className="font-medium text-gray-900">{occupationLabels[selectedLead.occupation]}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500">Room Preference</div>
                                    <div className="font-medium text-gray-900">{roomLabels[selectedLead.roomPreference]}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500">Move-in Date</div>
                                    <div className="font-medium text-gray-900">
                                        {format(new Date(selectedLead.moveInDate), "dd MMM yyyy")}
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            {selectedLead.message && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Message</div>
                                    <div className="text-gray-900">{selectedLead.message}</div>
                                </div>
                            )}

                            {/* Status Update */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(statusConfig).map(([key, { label, icon, color }]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleStatusChange(selectedLead, key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedLead.status === key
                                                ? color + " ring-2 ring-offset-2 ring-gray-400"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            {icon} {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Add internal notes about this lead..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={updateLeadMutation.isLoading}
                                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {updateLeadMutation.isLoading ? "Saving..." : "Save Notes"}
                                </button>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Timeline</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-gray-500">Created:</span>
                                        <span className="text-gray-900">
                                            {format(new Date(selectedLead.createdAt), "dd MMM yyyy, hh:mm a")}
                                        </span>
                                    </div>
                                    {selectedLead.contactedAt && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <span className="text-gray-500">Contacted:</span>
                                            <span className="text-gray-900">
                                                {format(new Date(selectedLead.contactedAt), "dd MMM yyyy, hh:mm a")}
                                            </span>
                                        </div>
                                    )}
                                    {selectedLead.scheduledAt && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                            <span className="text-gray-500">Scheduled:</span>
                                            <span className="text-gray-900">
                                                {format(new Date(selectedLead.scheduledAt), "dd MMM yyyy, hh:mm a")}
                                            </span>
                                        </div>
                                    )}
                                    {selectedLead.processedAt && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className={`w-2 h-2 ${selectedLead.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'} rounded-full`} />
                                            <span className="text-gray-500">{selectedLead.status === 'accepted' ? 'Accepted' : 'Rejected'}:</span>
                                            <span className="text-gray-900">
                                                {format(new Date(selectedLead.processedAt), "dd MMM yyyy, hh:mm a")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
