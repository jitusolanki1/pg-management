"use client"

import { useEffect, useRef, useState } from "react"

export default function FloorVisualizer({ floors, rooms, beds, selectedFloor, onBedClick }) {
  const canvasRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    if (!selectedFloor) {
      ctx.fillStyle = "#6b7280"
      ctx.font = "20px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Select a floor to view rooms and beds", dimensions.width / 2, dimensions.height / 2)
      return
    }

    // Filter rooms for selected floor
    const floorRooms = rooms.filter((room) => room.floor._id === selectedFloor || room.floor === selectedFloor)

    if (floorRooms.length === 0) {
      ctx.fillStyle = "#6b7280"
      ctx.font = "20px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("No rooms on this floor", dimensions.width / 2, dimensions.height / 2)
      return
    }

    // Draw rooms in a grid layout
    const cols = Math.ceil(Math.sqrt(floorRooms.length))
    const roomWidth = 180
    const roomHeight = 150
    const padding = 20
    const startX = 50
    const startY = 50

    floorRooms.forEach((room, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = startX + col * (roomWidth + padding)
      const y = startY + row * (roomHeight + padding)

      // Draw room box
      ctx.fillStyle = room.roomType === "AC" ? "#1e3a5f" : "#2a2a2a"
      ctx.fillRect(x, y, roomWidth, roomHeight)
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, roomWidth, roomHeight)

      // Room header
      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(x, y, roomWidth, 30)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(room.roomNumber, x + roomWidth / 2, y + 20)

      // Room type badge
      ctx.font = "10px sans-serif"
      ctx.fillStyle = room.roomType === "AC" ? "#10b981" : "#6b7280"
      ctx.fillText(room.roomType, x + roomWidth / 2, y + 45)

      // Get beds for this room
      const roomBeds = beds.filter((bed) => bed.room._id === room._id || bed.room === room._id)

      // Draw beds in a grid inside room
      const bedCols = Math.min(3, Math.ceil(Math.sqrt(roomBeds.length)))
      const bedSize = 40
      const bedPadding = 10
      const bedsStartX = x + 15
      const bedsStartY = y + 60

      roomBeds.forEach((bed, bedIndex) => {
        const bedCol = bedIndex % bedCols
        const bedRow = Math.floor(bedIndex / bedCols)
        const bedX = bedsStartX + bedCol * (bedSize + bedPadding)
        const bedY = bedsStartY + bedRow * (bedSize + bedPadding)

        // Store bed coordinates for click detection
        if (!bed.clickArea) {
          bed.clickArea = { x: bedX, y: bedY, width: bedSize, height: bedSize }
        } else {
          bed.clickArea = { x: bedX, y: bedY, width: bedSize, height: bedSize }
        }

        // Draw bed
        ctx.fillStyle = bed.status === "OCCUPIED" ? "#ef4444" : "#10b981"
        ctx.fillRect(bedX, bedY, bedSize, bedSize)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.strokeRect(bedX, bedY, bedSize, bedSize)

        // Bed icon
        ctx.fillStyle = "#ffffff"
        ctx.font = "20px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("🛏", bedX + bedSize / 2, bedY + bedSize / 2 + 7)

        // Bed number
        ctx.font = "9px sans-serif"
        ctx.fillText(bed.bedNumber.split("-")[1] || bedIndex + 1, bedX + bedSize / 2, bedY + bedSize - 5)
      })
    })
  }, [floors, rooms, beds, selectedFloor, dimensions])

  const handleCanvasClick = (e) => {
    if (!onBedClick) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is on any bed
    const floorRooms = rooms.filter((room) => room.floor._id === selectedFloor || room.floor === selectedFloor)
    const floorBeds = beds.filter((bed) =>
      floorRooms.some((room) => room._id === bed.room._id || room._id === bed.room),
    )

    for (const bed of floorBeds) {
      if (bed.clickArea) {
        const { x: bedX, y: bedY, width, height } = bed.clickArea
        if (x >= bedX && x <= bedX + width && y >= bedY && y <= bedY + height) {
          onBedClick(bed)
          break
        }
      }
    }
  }

  return (
    <div className="bg-secondary p-6 rounded-lg border border-border">
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-pointer mx-auto" />
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success rounded"></div>
          <span className="text-sm text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-danger rounded"></div>
          <span className="text-sm text-gray-300">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#1e3a5f] border border-accent rounded"></div>
          <span className="text-sm text-gray-300">AC Room</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#2a2a2a] border border-accent rounded"></div>
          <span className="text-sm text-gray-300">Non-AC Room</span>
        </div>
      </div>
    </div>
  )
}
