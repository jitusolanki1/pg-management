/**
 * Admin Verification Page
 * SECURITY ARCHITECTURE:
 *
 * DEVELOPMENT MODE:
 * - Option A: Email + Password login (no QR)
 * - Option B: Upload DEV QR image for verification
 * - No Google auth required
 * - No camera auto-open
 *
 * PRODUCTION MODE:
 * - Step 1: Google Authentication (mandatory)
 * - Step 2: QR Verification (upload or scan)
 * - Step 3: Access granted
 * - No password fallback
 */

import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { useAuth } from "../../context/AuthContext"

// ============================================
// CONFIGURATION
// ============================================

const API_BASE = import.meta.env.VITE_API_URL + "/api"
const IS_DEV = import.meta.env.DEV
const IS_PROD = !IS_DEV

// Firebase config for Google Auth (Production only)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase (only if config exists)
let firebaseAuth = null
let googleProvider = null

if (IS_PROD && firebaseConfig.apiKey && firebaseConfig.apiKey !== "your-api-key") {
    try {
        const app = initializeApp(firebaseConfig, "admin-auth")
        firebaseAuth = getAuth(app)
        googleProvider = new GoogleAuthProvider()
        googleProvider.addScope('email')
        googleProvider.addScope('profile')
    } catch (error) {
        console.error("Firebase initialization failed:", error)
    }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminVerify() {
    const navigate = useNavigate()
    const { setAuthDirect } = useAuth()

    // State
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Development mode state
    const [devEmail, setDevEmail] = useState("")
    const [devPassword, setDevPassword] = useState("")

    // Production mode state
    const [prodStep, setProdStep] = useState("google") // "google" | "qr" | "complete"
    const [googleUser, setGoogleUser] = useState(null)
    const [showCamera, setShowCamera] = useState(false)

    // File input ref
    const fileInputRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    // ============================================
    // DEVELOPMENT MODE HANDLERS
    // ============================================

    /**
     * Dev Login with Email/Password
     */
    const handleDevLogin = async (e) => {
        e.preventDefault()
        if (!devEmail || !devPassword) {
            setError("Please enter email and password")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const response = await fetch(`${API_BASE}/admin-verify/dev/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: devEmail,
                    password: devPassword
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Login failed")
            }

            // Set auth state directly
            if (data.success && data.data) {
                setAuthDirect(data.data.token, data.data.admin, data.data.expiresAt)
                navigate("/admin/dashboard")
            }
        } catch (err) {
            setError(err.message || "Authentication failed")
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Dev Login with QR Upload
     */
    const handleDevQRUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        setError("")

        try {
            // Read file as base64
            const base64 = await fileToBase64(file)

            const response = await fetch(`${API_BASE}/admin-verify/dev/qr-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrImage: base64 })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "QR verification failed")
            }

            if (data.success && data.data) {
                setAuthDirect(data.data.token, data.data.admin, data.data.expiresAt)
                navigate("/admin/dashboard")
            }
        } catch (err) {
            setError(err.message || "QR verification failed")
        } finally {
            setIsLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    // ============================================
    // PRODUCTION MODE HANDLERS
    // ============================================

    /**
     * Production Step 1: Google Sign-In
     */
    const handleGoogleSignIn = async () => {
        if (!firebaseAuth || !googleProvider) {
            setError("Google authentication not configured")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const result = await signInWithPopup(firebaseAuth, googleProvider)
            const user = result.user

            // Verify with backend
            const response = await fetch(`${API_BASE}/admin-verify/prod/google-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    googleToken: await user.getIdToken(),
                    googleEmail: user.email,
                    googleUid: user.uid,
                    googleName: user.displayName
                })
            })

            const data = await response.json()

            if (!response.ok) {
                // Sign out of Firebase on failure
                await signOut(firebaseAuth)
                throw new Error(data.message || "Google verification failed")
            }

            // Store Google user info for QR step
            setGoogleUser({
                email: user.email,
                name: user.displayName,
                uid: user.uid,
                verificationToken: data.data.verificationToken
            })

            // Proceed to QR verification
            setProdStep("qr")
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in cancelled")
            } else {
                setError("Verification failed")
            }
            console.error("Google auth error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Production Step 2: QR Upload
     */
    const handleProdQRUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !googleUser) return

        setIsLoading(true)
        setError("")

        try {
            const base64 = await fileToBase64(file)

            const response = await fetch(`${API_BASE}/admin-verify/prod/qr-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qrImage: base64,
                    verificationToken: googleUser.verificationToken,
                    googleEmail: googleUser.email
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "QR verification failed")
            }

            if (data.success && data.data) {
                setAuthDirect(data.data.token, data.data.admin, data.data.expiresAt)
                setProdStep("complete")

                // Sign out of Firebase (we only use it for verification)
                if (firebaseAuth) {
                    await signOut(firebaseAuth)
                }

                navigate("/admin/dashboard")
            }
        } catch (err) {
            setError("Verification failed")
            console.error("QR verify error:", err)
        } finally {
            setIsLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    /**
     * Production Step 2: Camera Scan
     */
    const startCameraScan = async () => {
        setShowCamera(true)
        setError("")

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
        } catch (err) {
            setError("Camera access denied")
            setShowCamera(false)
        }
    }

    const stopCameraScan = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setShowCamera(false)
    }, [])

    /**
     * Capture and verify from camera
     */
    const captureAndVerify = async () => {
        if (!videoRef.current || !googleUser) return

        setIsLoading(true)
        setError("")

        try {
            // Capture frame from video
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(videoRef.current, 0, 0)
            const base64 = canvas.toDataURL('image/png')

            const response = await fetch(`${API_BASE}/admin-verify/prod/qr-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qrImage: base64,
                    verificationToken: googleUser.verificationToken,
                    googleEmail: googleUser.email
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "QR verification failed")
            }

            if (data.success && data.data) {
                stopCameraScan()
                setAuthDirect(data.data.token, data.data.admin, data.data.expiresAt)

                if (firebaseAuth) {
                    await signOut(firebaseAuth)
                }

                navigate("/admin/dashboard")
            }
        } catch (err) {
            setError("QR not recognized. Try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const clearError = () => setError("")

    // ============================================
    // RENDER: DEVELOPMENT MODE
    // ============================================

    if (IS_DEV) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Dev Mode Badge */}
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                            Development Mode
                        </span>
                    </div>

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
                            <span className="text-white text-2xl font-bold">M</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Development Admin Login</h1>
                        <p className="text-slate-400 text-sm mt-2">Internal testing only</p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* OPTION A: Email/Password Login */}
                        <form onSubmit={handleDevLogin} className="space-y-4">
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-semibold text-white">Option A: Credentials</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={devEmail}
                                    onChange={(e) => { setDevEmail(e.target.value); clearError() }}
                                    placeholder="admin@pgmanagement.com"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={devPassword}
                                    onChange={(e) => { setDevPassword(e.target.value); clearError() }}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    autoComplete="current-password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !devEmail || !devPassword}
                                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Dev Login
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-white/20" />
                            <span className="text-slate-400 text-sm">or</span>
                            <div className="flex-1 h-px bg-white/20" />
                        </div>

                        {/* OPTION B: DEV QR Upload */}
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-white mb-4">Option B: Dev QR</h2>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleDevQRUpload}
                                className="hidden"
                                id="dev-qr-upload"
                            />

                            <label
                                htmlFor="dev-qr-upload"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-all cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Dev QR Image
                            </label>

                            <p className="text-slate-500 text-xs mt-3">
                                Dev QR generated via: <code className="bg-slate-800 px-1 rounded">npm run generate-dev-qr</code>
                            </p>
                        </div>
                    </div>

                    {/* Back Link */}
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

    // ============================================
    // RENDER: PRODUCTION MODE
    // ============================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Production Mode Badge */}
                <div className="text-center mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Secure Admin Access
                    </span>
                </div>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30">
                        <span className="text-white text-2xl font-bold">M</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Secure Admin Verification</h1>
                    <p className="text-slate-400 text-sm mt-2">Multi-factor authentication required</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <StepIndicator step={1} label="Google" active={prodStep === "google"} complete={prodStep !== "google"} />
                    <div className={`w-8 h-0.5 ${prodStep !== "google" ? "bg-indigo-500" : "bg-slate-600"}`} />
                    <StepIndicator step={2} label="QR" active={prodStep === "qr"} complete={prodStep === "complete"} />
                    <div className={`w-8 h-0.5 ${prodStep === "complete" ? "bg-indigo-500" : "bg-slate-600"}`} />
                    <StepIndicator step={3} label="Access" active={prodStep === "complete"} complete={false} />
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Step 1: Google Auth */}
                    {prodStep === "google" && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-semibold text-white mb-2">Step 1: Google Verification</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Sign in with your authorized Google account
                            </p>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
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

                    {/* Step 2: QR Verification */}
                    {prodStep === "qr" && !showCamera && (
                        <div className="text-center">
                            {/* User Info */}
                            {googleUser && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                    <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Google verified: {googleUser.email}
                                    </div>
                                </div>
                            )}

                            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-semibold text-white mb-2">Step 2: QR Verification</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Verify your admin QR code
                            </p>

                            <div className="space-y-4">
                                {/* Upload QR */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProdQRUpload}
                                    className="hidden"
                                    id="prod-qr-upload"
                                />

                                <label
                                    htmlFor="prod-qr-upload"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Upload QR Image
                                </label>

                                {/* Scan QR */}
                                <button
                                    onClick={startCameraScan}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Scan with Camera
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Camera View */}
                    {prodStep === "qr" && showCamera && (
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-white mb-4">Scan QR Code</h2>

                            <div className="relative rounded-xl overflow-hidden mb-4">
                                <video
                                    ref={videoRef}
                                    className="w-full aspect-square object-cover"
                                    playsInline
                                />
                                <div className="absolute inset-0 border-4 border-indigo-500/50 rounded-xl pointer-events-none">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={stopCameraScan}
                                    className="flex-1 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={captureAndVerify}
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? "Verifying..." : "Capture & Verify"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            stopCameraScan()
                            navigate("/")
                        }}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← Back to Website
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StepIndicator({ step, label, active, complete }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${complete ? "bg-indigo-500 text-white" :
                active ? "bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500" :
                    "bg-slate-700 text-slate-400"
                }`}>
                {complete ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : step}
            </div>
            <span className={`text-xs mt-1 ${active ? "text-indigo-400" : "text-slate-500"}`}>{label}</span>
        </div>
    )
}
