"use client"

import { useState, useMemo } from "react"
import { usePlans, useInitializePlans, useUpdatePlan } from "../hooks"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { SkeletonCard } from "../components/ui/Skeleton"

export default function PlansManagement() {
    // UI state only
    const [editingId, setEditingId] = useState(null)
    const [editFormData, setEditFormData] = useState({
        price: "",
        description: ""
    })

    // Data Layer - React Query hooks
    const { data: plans = [], isLoading: loading, error: plansError } = usePlans()

    // Mutations
    const initializePlans = useInitializePlans()
    const updatePlan = useUpdatePlan()

    // Initialize plans if empty
    useMemo(() => {
        if (plans.length === 0 && !loading) {
            initializePlans.mutate()
        }
    }, [plans.length, loading])

    const error = plansError?.message || ""

    // Handlers
    const handleEditClick = (plan) => {
        setEditingId(plan._id)
        setEditFormData({
            price: plan.price,
            description: plan.description
        })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditFormData({ price: "", description: "" })
    }

    const handleSave = async (id) => {
        await updatePlan.mutateAsync({ id, data: editFormData })
        setEditingId(null)
    }

    // Skeleton for plan cards
    const PlanCardSkeleton = () => (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="border-t border-gray-100 my-4"></div>
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="pt-4 space-y-2">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main tracking-tight">Plans & Pricing</h1>
                    <p className="text-text-muted mt-1">Manage subscription plans and meal pricing</p>
                </div>
            </div>

            {error && (
                <Card className="border-danger/20 bg-red-50 text-danger">
                    <div className="p-4 flex items-center justify-between">
                        <p>{error}</p>
                        <button onClick={() => setError("")} className="text-sm font-medium hover:underline">
                            Dismiss
                        </button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    // Skeleton cards while loading
                    <>
                        <PlanCardSkeleton />
                        <PlanCardSkeleton />
                        <PlanCardSkeleton />
                    </>
                ) : (
                    plans.map((plan) => (
                        <Card key={plan._id} className={`transition-all ${editingId === plan._id ? 'ring-2 ring-primary border-transparent' : 'hover:shadow-md'}`}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-main">
                                            {plan.name === 'FULLY_PLAN' ? 'Full Meal Plan' : plan.name === 'HALF_PLAN' ? 'Half Meal Plan' : plan.name.replace(/_/g, ' ')}
                                        </h3>
                                        <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {plan.name}
                                        </span>
                                    </div>
                                    {editingId !== plan._id && (
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(plan)}>
                                            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </Button>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {editingId === plan._id ? (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        <div>
                                            <label className="block text-sm font-medium text-text-main mb-1.5">Price (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                value={editFormData.price}
                                                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-main mb-1.5">Description</label>
                                            <textarea
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                rows="3"
                                                value={editFormData.description}
                                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button className="w-full" onClick={() => handleSave(plan._id)}>Save</Button>
                                            <Button variant="secondary" className="w-full" onClick={handleCancelEdit}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-primary">₹{plan.price}</span>
                                            <span className="text-text-muted">/month</span>
                                        </div>
                                        <p className="text-text-secondary text-sm leading-relaxed">
                                            {plan.description || "No description provided."}
                                        </p>

                                        <div className="pt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Includes Food & Stay</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Maintenance Included</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
