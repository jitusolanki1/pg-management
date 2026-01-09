import React, { useState } from "react"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"

export default function FloorForm({ initialData = null, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(initialData || {
        floorNumber: "",
        name: ""
    })
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(formData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-4 animate-in slide-in-from-top-2 border-primary/20 bg-primary/5">
            <h3 className="font-semibold text-sm mb-3 text-primary">{isEdit ? "Edit Floor" : "Add New Floor"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-text-muted mb-1 block">
                        Floor Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        placeholder="e.g. 1"
                        className="w-full p-2 border border-gray-200 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={formData.floorNumber}
                        onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-text-muted mb-1 block">
                        Floor Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Ground Floor"
                        className="w-full p-2 border border-gray-200 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        type="submit"
                        size="sm"
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : (isEdit ? "Update Floor" : "Save Floor")}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    )
}
