/**
 * Tenant Self-Registration Page
 * Step 1: Google Verification
 * Step 2: Simple Info Form
 * Step 3: Formspree submission (creates lead)
 */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"

// Firebase config - Replace with your config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
}

// Initialize Firebase
let app, auth, googleProvider
try {
    app = initializeApp(firebaseConfig, "tenant-registration")
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    googleProvider.addScope('email')
    googleProvider.addScope('profile')
} catch (error) {
    console.error("Firebase init error:", error)
}

// API endpoint for lead submission
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api"// Room preferences
const roomPreferences = [
    { value: "single", label: "Single Sharing", price: "₹8,000/month" },
    { value: "double", label: "Double Sharing", price: "₹6,000/month" },
    { value: "triple", label: "Triple Sharing", price: "₹5,000/month" },
]

export default function TenantRegister() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [googleUser, setGoogleUser] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    // Form data
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        occupation: "",
        roomPreference: "",
        moveInDate: "",
        message: ""
    })

    // Handle Google Sign-In
    const handleGoogleSignIn = async () => {
        if (!auth) {
            setError("Authentication not configured. Please contact admin.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const result = await signInWithPopup(auth, googleProvider)
            const user = result.user

            setGoogleUser({
                email: user.email,
                name: user.displayName,
                photo: user.photoURL,
                uid: user.uid
            })

            // Pre-fill name from Google
            setFormData(prev => ({
                ...prev,
                fullName: user.displayName || ""
            }))

            setStep(2)
        } catch (error) {
            console.error("Google sign-in error:", error)
            if (error.code === 'auth/popup-closed-by-user') {
                setError("Sign-in cancelled. Please try again.")
            } else if (error.code === 'auth/popup-blocked') {
                setError("Pop-up blocked. Please allow pop-ups for this site.")
            } else {
                setError("Sign-in failed. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Validate form
    const validateForm = () => {
        if (!formData.fullName.trim()) return "Please enter your full name"
        if (!formData.phone.trim()) return "Please enter your phone number"
        if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
            return "Please enter a valid 10-digit phone number"
        }
        if (!formData.occupation) return "Please select your occupation"
        if (!formData.roomPreference) return "Please select a room preference"
        if (!formData.moveInDate) return "Please select your expected move-in date"
        return null
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            // Prepare data for backend API
            const submissionData = {
                ...formData,
                email: googleUser.email,
                googleName: googleUser.name,
                googleUid: googleUser.uid
            }

            // Submit to backend
            const response = await fetch(`${API_BASE}/admin-verify/submit-lead`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(submissionData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Submission failed")
            }

            // Sign out from Google (cleanup)
            if (auth) {
                await signOut(auth)
            }

            setSuccess(true)
            setStep(3)
        } catch (error) {
            console.error("Submission error:", error)
            setError(error.message || "Failed to submit your application. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Calculate min date (today)
    const getMinDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                M
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Mahavir PG</h1>
                                <p className="text-xs text-gray-500">Registration</p>
                            </div>
                        </button>

                        {/* Progress Steps */}
                        <div className="hidden sm:flex items-center gap-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= s
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {step > s ? "✓" : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`w-8 h-1 mx-1 rounded ${step > s ? "bg-indigo-600" : "bg-gray-200"
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Step 1: Google Verification */}
                {step === 1 && (
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
                                <p className="text-gray-600">
                                    Sign in with Google to verify you're a real person. We'll only use your email for communication.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                            <p className="text-center text-xs text-gray-500 mt-6">
                                By continuing, you agree to our{" "}
                                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                                {" "}and{" "}
                                <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                            </p>
                        </div>

                        <p className="text-center text-gray-500 mt-8">
                            Already have a room?{" "}
                            <button onClick={() => navigate("/")} className="text-indigo-600 font-semibold hover:underline">
                                Go back home
                            </button>
                        </p>
                    </div>
                )}

                {/* Step 2: Info Form */}
                {step === 2 && googleUser && (
                    <div className="max-w-lg mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                            {/* Verified User Badge */}
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl mb-8">
                                <img
                                    src={googleUser.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(googleUser.name || googleUser.email)}&background=4F46E5&color=fff`}
                                    alt={googleUser.name}
                                    className="w-12 h-12 rounded-full border-2 border-green-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{googleUser.name}</span>
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-600">{googleUser.email}</p>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
                            <p className="text-gray-600 mb-8">Fill in your details and preferences</p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="98765 43210"
                                            maxLength={10}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Occupation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Occupation *
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "student", label: "Student", icon: "🎓" },
                                            { value: "working", label: "Working Professional", icon: "💼" },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, occupation: option.value }))}
                                                className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${formData.occupation === option.value
                                                    ? "border-indigo-500 bg-indigo-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <span className="text-2xl">{option.icon}</span>
                                                <span className="font-medium text-gray-900">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Room Preference */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Preference *
                                    </label>
                                    <div className="space-y-3">
                                        {roomPreferences.map((room) => (
                                            <button
                                                key={room.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, roomPreference: room.value }))}
                                                className={`w-full p-4 border-2 rounded-xl flex items-center justify-between transition-all ${formData.roomPreference === room.value
                                                    ? "border-indigo-500 bg-indigo-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <span className="font-medium text-gray-900">{room.label}</span>
                                                <span className="text-indigo-600 font-semibold">{room.price}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Move-in Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expected Move-in Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="moveInDate"
                                        value={formData.moveInDate}
                                        onChange={handleInputChange}
                                        min={getMinDate()}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Additional Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Any Special Requirements (Optional)
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Tell us about any specific requirements..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Application
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && success && (
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                            <p className="text-gray-600 mb-8">
                                Thank you for your interest in Mahavir PG. We've received your application
                                and will contact you within 24 hours.
                            </p>

                            <div className="p-4 bg-indigo-50 rounded-xl mb-8">
                                <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
                                <ul className="text-sm text-gray-600 space-y-2 text-left">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold">1.</span>
                                        Our team will review your application
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold">2.</span>
                                        We'll call you to schedule a visit
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold">3.</span>
                                        Complete the documentation and move in!
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate("/")}
                                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all"
                                >
                                    Back to Home
                                </button>

                                <a
                                    href="tel:+919876543210"
                                    className="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    📞 Call Us: +91 98765 43210
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
