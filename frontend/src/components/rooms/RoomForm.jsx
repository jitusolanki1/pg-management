import React, { useState } from "react"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"

export default function RoomForm({ initialData = null, selectedFloor, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(initialData || {
        roomNumber: "",
        roomType: "NON_AC", // 'AC' | 'NON_AC'
        totalBeds: 1
    })
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit({ ...formData, floor: selectedFloor })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 bg-white shadow-xl animate-in zoom-in-95 duration-200 border-t-4 border-primary">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-text-main">{isEdit ? "Edit Room" : "Add Room"}</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-text-muted mb-1 block">
                                Room Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="e.g. 101"
                                value={formData.roomNumber}
                                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1 block">
                                Room Type
                            </label>
                            <select
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                                value={formData.roomType}
                                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                            >
                                <option value="NON_AC">Non AC</option>
                                <option value="AC">AC</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1 block">
                                Total Beds
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                value={formData.totalBeds}
                                onChange={(e) => setFormData({ ...formData, totalBeds: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : (isEdit ? "Update Room" : "Create Room")}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
