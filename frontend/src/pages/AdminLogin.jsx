/**
 * Admin Login Page - Secure Hidden Entry Only
 *
 * SECURITY: This page should ONLY be accessible via:
 * 1. 10-click hidden entry from landing page footer
 * 2. NOT directly via URL (in production)
 *
 * Development Mode: Email + Password (Dev Database)
 * Production Mode: Google Auth → QR Upload → Dashboard (Real Database)
 */

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { signInWithGoogle } from "../config/firebase"

// Build API base safely: prefer VITE_API_URL, fall back to VITE_BACKEND_URL, else use relative `/api`
const RAW_API = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || ""
const CLEAN_API = RAW_API.replace(/\/$/, "").replace(/\/api$/, "")
const API_URL = (CLEAN_API ? CLEAN_API : "") + "/api"
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE
const IS_DEV = import.meta.env.DEV

export default function AdminLogin() {
    const navigate = useNavigate()
    const location = useLocation()
    const { isAuthenticated, isLoading, setAuthDirect, loginWithPassword } = useAuth()

    // Security: Check if accessed via hidden entry
    const [isValidEntry, setIsValidEntry] = useState(false)

    // Mode: 'select' | 'dev' | 'prod-google' | 'prod-qr'
    const [mode, setMode] = useState("select")

    // Dev login state
    const [phoneNumber, setPhoneNumber] = useState(ADMIN_PHONE)
    const [password, setPassword] = useState("")

    // Production state
    const [googleUser, setGoogleUser] = useState(null)
    const [qrFile, setQrFile] = useState(null)
    const [qrPreview, setQrPreview] = useState(null)

    // UI state
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Security Check: Only allow access via hidden entry OR valid session
    useEffect(() => {
        // Check if came from landing page with hidden entry flag
        const fromHiddenEntry = location.state?.fromHiddenEntry === true
        const timestamp = location.state?.timestamp

        // Valid if: came from hidden entry AND within last 60 seconds
        if (fromHiddenEntry && timestamp) {
            const elapsed = Date.now() - timestamp
            if (elapsed < 60000) { // 60 seconds
                setIsValidEntry(true)
                // Store in sessionStorage for refresh persistence (valid for 10 minutes)
                sessionStorage.setItem("adminEntryValid", JSON.stringify({
                    valid: true,
                    timestamp: Date.now()
                }))
                return
            }
        }

        // Check sessionStorage for valid entry (survives refresh)
        const storedEntry = sessionStorage.getItem("adminEntryValid")
        if (storedEntry) {
            try {
                const { valid, timestamp: storedTimestamp } = JSON.parse(storedEntry)
                const elapsed = Date.now() - storedTimestamp
                // Valid for 10 minutes
                if (valid && elapsed < 600000) {
                    setIsValidEntry(true)
                    return
                } else {
                    // Expired - remove it
                    sessionStorage.removeItem("adminEntryValid")
                }
            } catch (e) {
                sessionStorage.removeItem("adminEntryValid")
            }
        }

        // In development, allow direct access for testing
        if (IS_DEV) {
            console.log("⚠️ DEV MODE: Direct access allowed for testing")
            setIsValidEntry(true)
            return
        }

        // Invalid entry in production - redirect to home
        console.log("🚫 Invalid entry attempt - redirecting to home")
        navigate("/", { replace: true })
    }, [location, navigate])

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate("/admin/dashboard", { replace: true })
        }
    }, [isAuthenticated, isLoading, navigate])

    // Handle QR file selection
    const handleQrFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("File too large. Max 5MB allowed.")
                return
            }
            setQrFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setQrPreview(reader.result)
            reader.readAsDataURL(file)
            setError("")
        }
    }

    /**
     * Development Login - Phone + Password (pg_dev database)
     */
    const handleDevLogin = async (e) => {
        e.preventDefault()
        setError("")

        if (!phoneNumber || !password) {
            setError("Phone number and password required")
            return
        }

        setLoading(true)

        try {
            // Use AuthContext helper which sets tokens, sessionToken and persists session
            const result = await loginWithPassword(phoneNumber, password)
            if (result && result.success) {
                navigate("/admin/dashboard", { replace: true })
                return
            }
            throw new Error("Login failed")
        } catch (err) {
            console.error("Dev login error:", err)
            setError(err.message || "Login failed. Check phone number and password.")
        } finally {
            setLoading(false)
        }
    }

    /**
     * Production Step 1: Google Sign-In
     */
    const handleGoogleSignIn = async () => {
        setError("")
        setLoading(true)

        try {
            const result = await signInWithGoogle()

            if (!result?.user) {
                throw new Error("Google sign-in failed")
            }

            const { user } = result

            // Verify email matches admin email
            if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                setError(`Unauthorized. Only ${ADMIN_EMAIL} can access.`)
                setLoading(false)
                return
            }

            // Store Google user and move to QR step
            setGoogleUser({
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photo: user.photoURL,
                token: await user.getIdToken()
            })

            setMode("prod-qr")
            setError("")

        } catch (err) {
            console.error("Google sign-in error:", err)
            if (err.code === "auth/popup-closed-by-user") {
                setError("Sign-in cancelled")
            } else {
                setError(err.message || "Google sign-in failed")
            }
        } finally {
            setLoading(false)
        }
    }

    /**
     * Production Step 2: QR Verification (Real Database)
     */
    const handleQrVerification = async () => {
        if (!qrFile || !googleUser) {
            setError("Please upload QR code")
            return
        }

        setError("")
        setLoading(true)

        try {
            // Create form data with QR image
            const formData = new FormData()
            formData.append("qrImage", qrFile)
            formData.append("googleToken", googleUser.token)
            formData.append("googleEmail", googleUser.email)
            formData.append("googleUid", googleUser.uid)

            console.log("📧 Sending QR verify with email:", googleUser.email)
            console.log("📧 Expected ADMIN_EMAIL:", ADMIN_EMAIL)

            const response = await fetch(`${API_URL}/auth/verify-admin-qr`, {
                method: "POST",
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || data.message || "QR verification failed")
            }

            // Success - set auth and navigate (ensure sessionToken passed)
            setAuthDirect(data.token, data.sessionToken, data.admin, data.expiresAt)
            navigate("/admin/dashboard", { replace: true })

        } catch (err) {
            console.error("QR verification error:", err)
            setError(err.message || "QR verification failed")
        } finally {
            setLoading(false)
        }
    }

    // Show loading while checking entry validity
    if (!isValidEntry) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {IS_DEV ? "🔧 Development Mode" : "🔒 Secure Verification"}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Mode Selection */}
                    {mode === "select" && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h2 className="text-lg font-semibold text-white">Select Login Method</h2>
                                <p className="text-slate-400 text-sm mt-1">Choose authentication type</p>
                            </div>

                            {/* Production Login Button */}
                            <button
                                onClick={() => setMode("prod-google")}
                                className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        </svg>
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                                            🏢 Production Login
                                        </div>
                                        <div className="text-xs text-slate-400">Google + QR (Real Database)</div>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Development Login Button */}
                            {IS_DEV && (
                                <button
                                    onClick={() => setMode("dev")}
                                    className="w-full p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="font-semibold text-white group-hover:text-green-300 transition-colors">
                                                🔧 Development Login
                                            </div>
                                            <div className="text-xs text-slate-400">Email + Password (Dev Database)</div>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            )}

                            {/* Admin Email Info */}
                            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Authorized Admin Email:</span>
                                </div>
                                <div className="text-sm text-white font-medium mt-1">{ADMIN_EMAIL}</div>
                            </div>
                        </div>
                    )}

                    {/* Development Login Form */}
                    {mode === "dev" && (
                        <form onSubmit={handleDevLogin} className="space-y-5">
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setMode("select")}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className="text-lg font-semibold text-white">🔧 Development Login</h2>
                            </div>

                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    Using Development Database (pg_dev)
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="+917073829447"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
                                        placeholder="Enter dev password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Default: Admin@123</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password || !phoneNumber}
                                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>🚀 Login to Dev Dashboard</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Production Step 1: Google Sign-In */}
                    {mode === "prod-google" && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={() => setMode("select")}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className="text-lg font-semibold text-white">🏢 Production Login</h2>
                            </div>

                            {/* Step Indicator */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">1</div>
                                    <span className="text-sm text-white font-medium">Google</span>
                                </div>
                                <div className="w-12 h-px bg-slate-600" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold">2</div>
                                    <span className="text-sm text-slate-400">QR Code</span>
                                </div>
                            </div>

                            <div className="text-center py-4">
                                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Step 1: Google Verify</h3>
                                <p className="text-sm text-slate-400">
                                    Sign in with: <span className="text-blue-400 font-medium">{ADMIN_EMAIL}</span>
                                </p>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span className="font-semibold text-gray-700">Continue with Google</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Production Step 2: QR Verification */}
                    {mode === "prod-qr" && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={() => {
                                        setMode("prod-google")
                                        setGoogleUser(null)
                                        setQrFile(null)
                                        setQrPreview(null)
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className="text-lg font-semibold text-white">🔐 QR Verification</h2>
                            </div>

                            {/* Step Indicator */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">✓</div>
                                    <span className="text-sm text-green-400">Google ✓</span>
                                </div>
                                <div className="w-12 h-px bg-green-500" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">2</div>
                                    <span className="text-sm text-white font-medium">QR Code</span>
                                </div>
                            </div>

                            {/* Google User Verified */}
                            {googleUser && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                    {googleUser.photo && (
                                        <img src={googleUser.photo} alt="" className="w-10 h-10 rounded-full" />
                                    )}
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-white">{googleUser.name}</div>
                                        <div className="text-xs text-green-400">✓ {googleUser.email}</div>
                                    </div>
                                </div>
                            )}

                            {/* QR Upload */}
                            <div className="text-center py-2">
                                <h3 className="text-lg font-semibold text-white mb-1">Step 2: Upload Admin QR</h3>
                                <p className="text-sm text-slate-400">Upload your personal admin QR code</p>
                            </div>

                            {/* File Upload */}
                            <label className="block cursor-pointer">
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${qrPreview
                                    ? "border-purple-500/50 bg-purple-500/10"
                                    : "border-white/20 hover:border-purple-500/50"
                                    }`}>
                                    {qrPreview ? (
                                        <div className="space-y-3">
                                            <img
                                                src={qrPreview}
                                                alt="QR Preview"
                                                className="w-40 h-40 mx-auto rounded-lg object-contain bg-white p-2"
                                            />
                                            <p className="text-sm text-purple-400">✓ QR loaded - Click to change</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 mx-auto bg-slate-700 rounded-xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                Click to upload QR image<br />
                                                <span className="text-xs">PNG, JPG up to 5MB</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrFileChange}
                                    className="hidden"
                                />
                            </label>

                            <button
                                onClick={handleQrVerification}
                                disabled={loading || !qrFile}
                                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>🔓 Verify & Open Dashboard</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate("/")}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← Back to Website
                    </button>
                </div>
            </div>
        </div>
    )
}
