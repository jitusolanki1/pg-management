import React, { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Center, Environment, Sky } from "@react-three/drei"
import Building3D from "./Building3D"

export default function FloorVisualizer({ floors, rooms, beds, selectedFloor }) {
    const [exploded, setExploded] = useState(0) // 0 to 1
    const [transparentWalls, setTransparentWalls] = useState(false)

    return (
        <div className="w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden shadow-2xl border border-gray-300 relative">
            <div className="absolute top-4 left-4 z-10 bg-white/95 p-5 rounded-xl shadow-xl backdrop-blur text-sm max-w-sm border border-gray-100">
                <h3 className="font-bold text-xl mb-3 text-gray-800">PG Building Visualizer</h3>

                <div className="space-y-4">
                    {/* Slider Control */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Floor Separation
                            </label>
                            <span className="text-xs font-mono text-primary font-bold">{(exploded * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={exploded}
                            onChange={(e) => setExploded(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-[10px] text-gray-400 mt-1">
                            Slide to see inside lower floors
                        </div>
                    </div>

                    {/* Toggle Control */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">Transparent Walls</label>
                            <div className="text-[10px] text-gray-400">See through outer structure</div>
                        </div>
                        <button
                            onClick={() => setTransparentWalls(!transparentWalls)}
                            className={`w-12 h-6 rounded-full transition-colors relative duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${transparentWalls ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${transparentWalls ? "translate-x-7" : "translate-x-1"}`} />
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex gap-3 text-[11px] font-medium text-gray-600 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm shadow-sm"></div>Available</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm shadow-sm"></div>Occupied</div>
                </div>
            </div>

            <Canvas shadows camera={{ position: [25, 20, 25], fov: 45 }}>
                <Sky sunPosition={[10, 20, 10]} />
                <Environment preset="city" />
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.2}
                    castShadow
                    shadow-bias={-0.0001}
                    shadow-mapSize={[2048, 2048]}
                />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    maxPolarAngle={Math.PI / 2.1}
                />

                <Center top>
                    <Building3D
                        explodeFactor={exploded}
                        opacity={transparentWalls ? 0.2 : 1}
                    />
                </Center>

                {/* Ground Plane */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>

            </Canvas>
        </div>
    )
}
