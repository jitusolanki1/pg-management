"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useFloors, useCreateFloor, useCreateRoom } from "../hooks"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

export default function AddFloorRoom() {
    const navigate = useNavigate()

    // Data Layer
    const { data: floors = [], isLoading: floorsLoading } = useFloors()
    const createFloor = useCreateFloor()
    const createRoom = useCreateRoom()

    const [mode, setMode] = useState("floor") // 'floor' or 'room'

    // Floor form
    const [floorData, setFloorData] = useState({
        floorNumber: "",
        name: "",
    })

    // Room form
    const [roomData, setRoomData] = useState({
        floor: "",
        roomNumber: "",
        type: "SINGLE",
        numberOfBeds: 1,
    })

    const [error, setError] = useState("")

    const handleCreateFloor = async (e) => {
        e.preventDefault()
        setError("")

        try {
            await createFloor.mutateAsync({
                floorNumber: Number(floorData.floorNumber),
                name: floorData.name || `Floor ${floorData.floorNumber}`
            })
            navigate("/admin/floors")
        } catch (err) {
            setError(err.message)
        }
    }

    const handleCreateRoom = async (e) => {
        e.preventDefault()
        setError("")

        try {
            await createRoom.mutateAsync({
                floor: roomData.floor,
                roomNumber: Number(roomData.roomNumber),
                type: roomData.type,
                numberOfBeds: Number(roomData.numberOfBeds)
            })
            navigate("/admin/floors")
        } catch (err) {
            setError(err.message)
        }
    }

    // Auto-suggest next floor number
    const suggestFloorNumber = () => {
        if (floors.length === 0) return 1
        const maxFloor = Math.max(...floors.map(f => f.floorNumber))
        return maxFloor + 1
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/admin/floors")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Add Floor / Room</h1>
                    <p className="text-text-muted text-sm">Create a new floor or add rooms to existing floors</p>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setMode("floor")}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${mode === "floor"
                        ? "bg-white text-primary shadow-sm"
                        : "text-text-muted hover:text-text-main"
                        }`}
                >
                    🏢 Add Floor
                </button>
                <button
                    onClick={() => setMode("room")}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${mode === "room"
                        ? "bg-white text-primary shadow-sm"
                        : "text-text-muted hover:text-text-main"
                        }`}
                >
                    🚪 Add Room
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Floor Form */}
            {mode === "floor" && (
                <Card>
                    <form onSubmit={handleCreateFloor} className="space-y-4">
                        <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                            Create New Floor
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1.5">Floor Number *</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={floorData.floorNumber}
                                    onChange={(e) => setFloorData({ ...floorData, floorNumber: e.target.value })}
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="e.g., 1, 2, 3..."
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setFloorData({ ...floorData, floorNumber: suggestFloorNumber().toString() })}
                                >
                                    Suggest
                                </Button>
                            </div>
                            <p className="text-xs text-text-muted mt-1">Use 0 for ground floor</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1.5">Floor Name (Optional)</label>
                            <input
                                type="text"
                                value={floorData.name}
                                onChange={(e) => setFloorData({ ...floorData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="e.g., Ground Floor, First Floor..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate("/admin/floors")}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createFloor.isPending}
                                className="flex-1"
                            >
                                {createFloor.isPending ? "Creating..." : "Create Floor"}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Room Form */}
            {mode === "room" && (
                <Card>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                        <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-gray-100">
                            Add Room to Floor
                        </h3>

                        {floors.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <p className="text-text-muted mb-4">No floors exist yet. Create a floor first.</p>
                                <Button onClick={() => setMode("floor")}>
                                    Create Floor First
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Select Floor *</label>
                                    <select
                                        value={roomData.floor}
                                        onChange={(e) => setRoomData({ ...roomData, floor: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required
                                        disabled={floorsLoading}
                                    >
                                        <option value="">Select a floor</option>
                                        {floors.map((f) => (
                                            <option key={f._id} value={f._id}>
                                                {f.name || `Floor ${f.floorNumber}`} (Level {f.floorNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1.5">Room Number *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={roomData.roomNumber}
                                            onChange={(e) => setRoomData({ ...roomData, roomNumber: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            placeholder="e.g., 101"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1.5">Room Type *</label>
                                        <select
                                            value={roomData.type}
                                            onChange={(e) => {
                                                const type = e.target.value
                                                let beds = 1
                                                if (type === "DOUBLE") beds = 2
                                                if (type === "TRIPLE") beds = 3
                                                if (type === "DORMITORY") beds = 6
                                                setRoomData({ ...roomData, type, numberOfBeds: beds })
                                            }}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="SINGLE">Single (1 bed)</option>
                                            <option value="DOUBLE">Double (2 beds)</option>
                                            <option value="TRIPLE">Triple (3 beds)</option>
                                            <option value="DORMITORY">Dormitory (6+ beds)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1.5">Number of Beds *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={roomData.numberOfBeds}
                                        onChange={(e) => setRoomData({ ...roomData, numberOfBeds: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                    <p className="text-xs text-text-muted mt-1">Beds will be auto-created for this room</p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => navigate("/admin/floors")}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createRoom.isPending}
                                        className="flex-1"
                                    >
                                        {createRoom.isPending ? "Creating..." : "Create Room"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>
                </Card>
            )}
        </div>
    )
}
