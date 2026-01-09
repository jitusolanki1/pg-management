import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useFloors, useRooms, useBeds, useCreateFloor, useCreateRoom, useDeleteFloor, useDeleteRoom } from "../hooks"
import FloorVisualizer from "../components/3d/FloorVisualizer"
import FloorForm from "../components/rooms/FloorForm"
import RoomForm from "../components/rooms/RoomForm"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { DeleteDialog } from "../components/ui/DeleteDialog"
import { SkeletonFloorCard, SkeletonRoomCard } from "../components/ui/Skeleton"

export default function FloorManagement() {
  const navigate = useNavigate()

  // UI state only
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [showFloorForm, setShowFloorForm] = useState(false)
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, item: null })

  // Data Layer - React Query hooks
  const { data: floorsData = [], isLoading: floorsLoading } = useFloors()
  const { data: rooms = [], isLoading: roomsLoading } = useRooms()
  const { data: beds = [], isLoading: bedsLoading } = useBeds()

  // Mutations
  const createFloor = useCreateFloor()
  const createRoom = useCreateRoom()
  const deleteFloor = useDeleteFloor()
  const deleteRoom = useDeleteRoom()

  // Derived state
  const floors = useMemo(() =>
    [...floorsData].sort((a, b) => a.floorNumber - b.floorNumber),
    [floorsData]
  )

  // Auto-select first floor
  useMemo(() => {
    if (floors.length > 0 && !selectedFloor) {
      setSelectedFloor(floors[0]._id)
    }
  }, [floors, selectedFloor])

  const currentFloorData = floors.find(f => f._id === selectedFloor)
  const currentFloorRooms = rooms.filter(r => r.floor._id === selectedFloor || r.floor === selectedFloor)

  // Handlers
  const handleCreateFloor = async (floorData) => {
    try {
      await createFloor.mutateAsync(floorData)
      setShowFloorForm(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateRoom = async (roomData) => {
    if (!selectedFloor) return
    try {
      await createRoom.mutateAsync({ ...roomData, floor: selectedFloor })
      setShowRoomForm(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.item) return
    try {
      if (deleteDialog.type === 'floor') {
        await deleteFloor.mutateAsync(deleteDialog.item._id)
        // If deleted floor was selected, select the first one available or null
        if (selectedFloor === deleteDialog.item._id) {
          const remainingFloors = floors.filter(f => f._id !== deleteDialog.item._id)
          setSelectedFloor(remainingFloors.length > 0 ? remainingFloors[0]._id : null)
        }
      } else if (deleteDialog.type === 'room') {
        await deleteRoom.mutateAsync(deleteDialog.item._id)
      }
      setDeleteDialog({ open: false, type: null, item: null })
    } catch (err) {
      alert(err.message)
    }
  }

  const openDeleteDialog = (type, item, e) => {
    e?.stopPropagation()
    setDeleteDialog({ open: true, type, item })
  }

  // Skeleton for floor list
  const FloorListSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonFloorCard key={i} />
      ))}
    </div>
  )

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar: Floor List */}
      <div className="w-full md:w-72 flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Floors</h2>
          <Button size="sm" onClick={() => setShowFloorForm(true)} title="Add Floor" className="w-8 h-8 p-0 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>

        {showFloorForm && (
          <FloorForm onSubmit={handleCreateFloor} onCancel={() => setShowFloorForm(false)} />
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {floorsLoading ? (
            <FloorListSkeleton />
          ) : floors.length > 0 ? (
            floors.map(floor => (
              <div
                key={floor._id}
                onClick={() => setSelectedFloor(floor._id)}
                className={`
                        p-4 rounded-lg cursor-pointer transition-all border group relative text-sm
                        ${selectedFloor === floor._id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 translate-x-1'
                    : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900'
                  }
                    `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className={`text-xs uppercase tracking-wider font-semibold mb-0.5 ${selectedFloor === floor._id ? 'text-white/80' : 'text-gray-400'}`}>
                      Level {floor.floorNumber}
                    </div>
                    <div className="font-bold text-base">{floor.name || `Floor ${floor.floorNumber}`}</div>
                  </div>

                  {selectedFloor === floor._id && (
                    <button
                      onClick={(e) => handleDeleteFloor(floor._id, e)}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      title="Delete Floor"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : !showFloorForm && (
            <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              No floors added yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {selectedFloor ? (
          <>
            {/* Floor Header */}
            <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {currentFloorData?.name ? currentFloorData.name : `Floor ${currentFloorData?.floorNumber}`}
                  </h1>
                  <Badge variant="outline" className="px-2 py-0.5 text-xs bg-gray-100 border-gray-200 text-gray-600">
                    Level {currentFloorData?.floorNumber}
                  </Badge>
                </div>
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {currentFloorRooms.length} Rooms
                  <span className="text-gray-300"> | </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  {currentFloorRooms.reduce((acc, r) => acc + (beds.filter(b => b.room === r._id || b.room._id === r._id).length), 0)} Beds
                </p>
              </div>
              <Button onClick={() => setShowRoomForm(true)} className="px-5 shadow-lg shadow-primary/20">
                <span className="mr-2 text-lg">+</span> Add Room
              </Button>
            </div>

            {/* Add Room Modal */}
            {showRoomForm && (
              <RoomForm
                selectedFloor={selectedFloor}
                onSubmit={handleCreateRoom}
                onCancel={() => setShowRoomForm(false)}
              />
            )}

            <div className="flex-1 relative min-h-0">
              <FloorVisualizer
                floors={floors}
                rooms={rooms}
                beds={beds}
                selectedFloor={selectedFloor}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed m-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">Select a floor to manage</p>
            <p className="text-sm">Click on a floor from the sidebar to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
