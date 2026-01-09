import React, { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, useTexture } from "@react-three/drei"
import * as THREE from "three"

// --- Constants & Materials ---
const WALL_COLOR = "#e6e2d3"
const FLOOR_COLOR = "#f5f5f5"
const STAIR_COLOR = "#94a3b8"
const BED_FRAME_COLOR = "#475569"
const MATTRESS_AVAILABLE = "#10b981"
const MATTRESS_OCCUPIED = "#ef4444"
const DOOR_COLOR = "#8d6e63"

const FLOOR_HEIGHT = 3.2

// --- Helper Components ---

const Wall = ({ length, height, thickness = 0.2, position, rotation = [0, 0, 0], color = WALL_COLOR, opacity = 1, transparent = false }) => {
    return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color={color} transparent={true} opacity={opacity} />
        </mesh>
    )
}
// ...existing code...
const Bed = ({ position, rotation = [0, 0, 0], status = "AVAILABLE" }) => {
    const mattressColor = status === "OCCUPIED" ? MATTRESS_OCCUPIED : MATTRESS_AVAILABLE
    return (
        <group position={position} rotation={rotation}>
            {/* Frame */}
            <mesh position={[0, 0.2, 0]} castShadow>
                <boxGeometry args={[0.9, 0.4, 2]} />
                <meshStandardMaterial color={BED_FRAME_COLOR} />
            </mesh>
            {/* Mattress */}
            <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[0.85, 0.15, 1.9]} />
                <meshStandardMaterial color={mattressColor} />
            </mesh>
            {/* Pillow */}
            <mesh position={[0, 0.55, -0.75]}>
                <boxGeometry args={[0.5, 0.1, 0.3]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    )
}


const Staircase = ({ position, floors = 2 }) => {
    const steps = []
    const stepHeight = 0.2
    const stepDepth = 0.25
    const stepWidth = 1.2

    // Create a U-shaped or straight stair stack
    // Going UP
    for (let f = 0; f < floors; f++) {
        const floorY = f * FLOOR_HEIGHT
        for (let i = 0; i < 16; i++) {
            // Simple straight run for visualization
            steps.push(
                <mesh key={`stair-${f}-${i}`} position={[0, floorY + i * stepHeight, (i * stepDepth)]} rotation={[0, 0, 0]} castShadow>
                    <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
                    <meshStandardMaterial color={STAIR_COLOR} />
                </mesh>
            )
        }
        // Landing
        steps.push(
            <mesh key={`landing-${f}`} position={[0, floorY + 16 * stepHeight, 16 * stepDepth + 0.5]} rotation={[0, 0, 0]}>
                <boxGeometry args={[stepWidth, 0.2, 1.5]} />
                <meshStandardMaterial color={STAIR_COLOR} />
            </mesh>
        )
    }

    return (
        <group position={position}>
            {steps}
        </group>
    )
}

const Slab = ({ width, depth, position, color = FLOOR_COLOR }) => {
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
    )
}

const RoomText = ({ position, text }) => (
    <Text
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.4}
        color="#334155"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ffffff"
    >
        {text}
    </Text>
)

const FloorLabel = ({ position, text }) => (
    <group position={position}>
        <mesh position={[3, 0, 0]}>
            <boxGeometry args={[4, 0.8, 0.1]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        <Text
            position={[3, 0, 0.1]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
        >
            {text}
        </Text>
    </group>
)

// --- Floor Components ---

const GroundFloor = ({ y = 0, opacity = 1 }) => {
    // ...existing code...
    return (
        <group position={[0, y, 0]}>
            <FloorLabel position={[-12, 1, 0]} text="Ground Floor" />
            {/* Floor Slab */}
            <Slab width={12} depth={16} position={[0, 0.01, 0]} color="#f0fdf4" />

            {/* --- Walls --- */}
            {/* Outer Shell */}
            <Wall length={0.2} height={h} thickness={16} position={[-6, h / 2, 0]} opacity={opacity} /> {/* Left Wall */}
            <Wall length={0.2} height={h} thickness={16} position={[6, h / 2, 0]} opacity={opacity} /> {/* Right Wall */}
            <Wall length={12} height={h} thickness={0.2} position={[0, h / 2, -8]} opacity={1} /> {/* Back Wall */}

            {/* Front Wall with Entry Gap */}
            <Wall length={5} height={h} thickness={0.2} position={[-3.5, h / 2, 8]} opacity={opacity * 0.5} transparent />
            <Wall length={5} height={h} thickness={0.2} position={[3.5, h / 2, 8]} opacity={opacity * 0.5} transparent />
            {/* 3. Main Hall (Back Right) Z: -8 to 0 */}
            {/* 6 Beds in Hall */}
            <Bed position={[2.5, 0, -2]} status="OCCUPIED" />
            <Bed position={[4.5, 0, -2]} />
            <Bed position={[2.5, 0, -5]} status="OCCUPIED" />
            <Bed position={[4.5, 0, -5]} />
            <Bed position={[2.5, 0, -7]} />
            <Bed position={[4.5, 0, -7]} status="OCCUPIED" />
            <RoomText position={[3.5, 2, -4]} text="Main Hall (6)" />
            {/* 2. AC Room (Mid Left) Z: 0 to 4 */}
            <Wall length={5} height={h} thickness={0.2} position={[-3.5, h / 2, 4]} /> // Front of AC
            <Wall length={5} height={h} thickness={0.2} position={[-3.5, h / 2, 0]} /> // Back of AC
            {/* 3 Beds */}
            <Bed position={[-2.5, 0, 2]} rotation={[0, Math.PI / 2, 0]} />
            <Bed position={[-4.5, 0, 2]} rotation={[0, Math.PI / 2, 0]} status="OCCUPIED" />
            <Bed position={[-3.5, 0, 3.5]} rotation={[0, 0, 0]} />
            <RoomText position={[-3.5, 2, 2]} text="AC Room (3)" />

        </group>
    )
}

const h = 3
const FirstFloor = ({ y, opacity = 1 }) => {
    return (
        <group position={[0, y, 0]}>
            <FloorLabel position={[-12, 1, 0]} text="First Floor" />
            <Slab width={12} depth={16} position={[0, 0.01, 0]} color="#e0f2fe" />

            {/* Outline Walls */}
            <Wall length={0.2} height={h} thickness={16} position={[-6, h / 2, 0]} opacity={opacity} />
            <Wall length={0.2} height={h} thickness={16} position={[6, h / 2, 0]} opacity={opacity} />
            <Wall length={12} height={h} thickness={0.2} position={[0, h / 2, -8]} opacity={1} />
            <Wall length={12} height={h} thickness={0.2} position={[0, h / 2, 8]} opacity={opacity * 0.5} transparent />

            {/* Same Layout Logic */}

            <Wall length={5} height={h} thickness={0.2} position={[3.5, h / 2, 0]} />
            <RoomText position={[3.5, 2, 2]} text="Room" />
            <Bed position={[2.5, 0, 2]} status="OCCUPIED" />
            <Bed position={[4.5, 0, 2]} status="OCCUPIED" />

            {/* Back-Right: Central Hall (6 beds) */}
            <RoomText position={[3.5, 2, -4]} text="First Hall (6)" />
            <Bed position={[2.5, 0, -2]} />
            <Bed position={[4.5, 0, -2]} status="OCCUPIED" />
            <Bed position={[2.5, 0, -5]} />
            <Bed position={[4.5, 0, -5]} status="OCCUPIED" />
            <Bed position={[2.5, 0, -7]} />
            <Bed position={[4.5, 0, -7]} />

            {/* LEFT: Stairs (Front), AC (Mid), Non-AC (Back) */}

            <RoomText position={[-3.5, 2, 2]} text="AC Room" />
            <Bed position={[-2.5, 0, 2]} status="OCCUPIED" />
            <Bed position={[-4.5, 0, 2]} />

        </group>
    )
}

const TopFloor = ({ y, opacity = 1 }) => {
    const h = 3
    return (
        <group position={[0, y, 0]}>
            <FloorLabel position={[-12, 1, 0]} text="Second Floor" />
            <Slab width={12} depth={16} position={[0, 0.01, 0]} color="#fff7ed" />

            {/* Outline */}
            <Wall length={0.2} height={h} thickness={16} position={[-6, h / 2, 0]} opacity={opacity} />
            <Wall length={0.2} height={h} thickness={16} position={[6, h / 2, 0]} opacity={opacity} />
            <Wall length={12} height={h} thickness={0.2} position={[0, h / 2, -8]} opacity={1} />
            <Wall length={12} height={h} thickness={0.2} position={[0, h / 2, 8]} opacity={opacity * 0.5} transparent />

            {/* Front: AC Room (4 beds) */}
            <Wall length={12} height={h} thickness={0.2} position={[0, h / 2, 2]} /> {/* Divider Wall */}
            <RoomText position={[0, 2, 5]} text="Front AC (4)" />
            <Bed position={[-2, 0, 6]} status="OCCUPIED" /> <Bed position={[-4, 0, 6]} />
            <Bed position={[2, 0, 6]} /> <Bed position={[4, 0, 6]} status="OCCUPIED" />

            {/* Back Area split into Rooms? */}
// ...existing code...
            <RoomText position={[-3.5, 2, -3]} text="Px Non-AC (4)" />
            <Bed position={[-2, 0, -2]} /> <Bed position={[-5, 0, -2]} />
            <Bed position={[-2, 0, -5]} status="OCCUPIED" /> <Bed position={[-5, 0, -5]} />

            <RoomText position={[3.5, 2, -3]} text="Py Non-AC (4)" />
        </group>
    )
}

export default function Building3D({ explodeFactor = 0, opacity = 1 }) {
    // explodeFactor 0 to 1 -> 0 to 5 units gap
    const gap = explodeFactor * 8

    return (
        <group>
            <GroundFloor y={0} opacity={opacity} />
            <FirstFloor y={FLOOR_HEIGHT + gap} opacity={opacity} />
            <TopFloor y={(FLOOR_HEIGHT * 2) + (gap * 2)} opacity={opacity} />

            {/* Visual Staircase Tower on Left */}
            <Staircase position={[-4, 0, 4]} floors={2} />
        </group>
    )
}
