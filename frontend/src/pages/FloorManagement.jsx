"use client"

import { useState, useEffect } from "react"
import api from "../utils/api"
import FloorVisualizer from "../components/FloorVisualizer"

export default function FloorManagement() {
  const [floors, setFloors] = useState([])
  const [rooms, setRooms] = useState([])
  const [beds, setBeds] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [showFloorForm, setShowFloorForm] = useState(false)
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [floorData, setFloorData] = useState({ floorNumber: "", name: "" })
  const [roomData, setRoomData] = useState({ roomNumber: "", roomType: "NON_AC", totalBeds: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [floorsRes, roomsRes, bedsRes] = await Promise.all([
        api.get("/floors"),
        api.get("/rooms"),
        api.get("/beds"),
      ])
      setFloors(floorsRes.data)
      setRooms(roomsRes.data)
      setBeds(bedsRes.data)
      if (floorsRes.data.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsRes.data[0]._id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFloor = async (e) => {
    e.preventDefault()
    try {
      await api.post("/floors", floorData)
      setFloorData({ floorNumber: "", name: "" })
      setShowFloorForm(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!selectedFloor) {
      setError("Please select a floor first")
      return
    }
    try {
      await api.post("/rooms", { ...roomData, floor: selectedFloor })
      setRoomData({ roomNumber: "", roomType: "NON_AC", totalBeds: 1 })
      setShowRoomForm(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteFloor = async (id) => {
    if (!confirm("Are you sure you want to delete this floor?")) return
    try {
      await api.delete(`/floors/${id}`)
      fetchData()
      if (selectedFloor === id) setSelectedFloor(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Floor Management</h1>
        <button
          onClick={() => setShowFloorForm(!showFloorForm)}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600"
        >
          {showFloorForm ? "Cancel" : "Add Floor"}
        </button>
      </div>

      {error && (
        <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md">
          <p>{error}</p>
          <button onClick={() => setError("")} className="text-sm underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {showFloorForm && (
        <form onSubmit={handleCreateFloor} className="bg-secondary p-6 rounded-lg border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Floor Number</label>
            <input
              type="number"
              value={floorData.floorNumber}
              onChange={(e) => setFloorData({ ...floorData, floorNumber: e.target.value })}
              className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Floor Name</label>
            <input
              type="text"
              value={floorData.name}
              onChange={(e) => setFloorData({ ...floorData, name: e.target.value })}
              className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
              placeholder="e.g., Ground Floor, First Floor"
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-600">
            Create Floor
          </button>
        </form>
      )}

      <div className="grid grid-cols-4 gap-4">
        {floors.map((floor) => (
          <button
            key={floor._id}
            onClick={() => setSelectedFloor(floor._id)}
            className={`p-4 rounded-lg border-2 transition ${
              selectedFloor === floor._id
                ? "bg-accent border-accent text-white"
                : "bg-secondary border-border text-gray-300 hover:border-accent"
            }`}
          >
            <div className="text-lg font-bold">{floor.name}</div>
            <div className="text-sm opacity-80">Floor {floor.floorNumber}</div>
            <div className="text-xs mt-2">{floor.totalRooms} rooms</div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFloor(floor._id)
              }}
              className="mt-2 text-xs text-danger hover:underline"
            >
              Delete
            </button>
          </button>
        ))}
      </div>

      {selectedFloor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {floors.find((f) => f._id === selectedFloor)?.name} - Visual Layout
            </h2>
            <button
              onClick={() => setShowRoomForm(!showRoomForm)}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600"
            >
              {showRoomForm ? "Cancel" : "Add Room"}
            </button>
          </div>

          {showRoomForm && (
            <form onSubmit={handleCreateRoom} className="bg-secondary p-6 rounded-lg border border-border space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Number</label>
                <input
                  type="text"
                  value={roomData.roomNumber}
                  onChange={(e) => setRoomData({ ...roomData, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
                  placeholder="e.g., 101, 102"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Type</label>
                <select
                  value={roomData.roomType}
                  onChange={(e) => setRoomData({ ...roomData, roomType: e.target.value })}
                  className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
                >
                  <option value="AC">AC</option>
                  <option value="NON_AC">Non-AC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Number of Beds</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={roomData.totalBeds}
                  onChange={(e) => setRoomData({ ...roomData, totalBeds: e.target.value })}
                  className="w-full px-3 py-2 bg-primary border border-border rounded-md text-white"
                  required
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-600">
                Create Room
              </button>
            </form>
          )}

          <FloorVisualizer floors={floors} rooms={rooms} beds={beds} selectedFloor={selectedFloor} />
        </div>
      )}
    </div>
  )
}
