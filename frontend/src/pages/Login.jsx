/**
 * Bank-Grade OTP Login
 * Phone authentication with Firebase OTP
 * Development mode: Password login for admin phone
 */

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { setupRecaptcha, sendOTP, verifyOTP } from "../config/firebase"
import { Button } from "../components/ui/Button"

// OTP cooldown in seconds
const OTP_COOLDOWN = 60
// OTP expiry in seconds
const OTP_EXPIRY = 60

// Development mode phone number
const DEV_PHONE = "7073829447"

export default function Login() {
  // Form state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [step, setStep] = useState("phone") // 'phone' | 'otp' | 'password'

  // Status state
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [otpExpiry, setOtpExpiry] = useState(0)
  const [isDevMode, setIsDevMode] = useState(false)

  // Refs
  const otpInputsRef = useRef([])
  const cooldownRef = useRef(null)
  const expiryRef = useRef(null)

  const navigate = useNavigate()
  const { requestOTP, loginWithOTP, loginWithPassword, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => {
        setCooldown(c => c - 1)
      }, 1000)
    }
    return () => clearTimeout(cooldownRef.current)
  }, [cooldown])

  // OTP expiry timer
  useEffect(() => {
    if (otpExpiry > 0) {
      expiryRef.current = setTimeout(() => {
        setOtpExpiry(e => e - 1)
      }, 1000)
    } else if (step === "otp" && otpExpiry === 0) {
      setError("OTP expired. Please request a new one.")
    }
    return () => clearTimeout(expiryRef.current)
  }, [otpExpiry, step])

  // Setup reCAPTCHA on mount
  useEffect(() => {
    if (step === "phone") {
      // Small delay to ensure button is mounted
      const timer = setTimeout(() => {
        setupRecaptcha("send-otp-button")
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [step])

  /**
   * Handle phone number submission
   */
  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validate phone number
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setLoading(true)

    try {
      // Check if phone is authorized with backend
      const result = await requestOTP(`+91${cleaned}`)

      // Check if development mode (password login)
      if (result.devMode || cleaned === DEV_PHONE) {
        setIsDevMode(true)
        setStep("password")
        setLoading(false)
        return
      }

      // Send OTP via Firebase
      await sendOTP(`+91${cleaned}`)

      // Move to OTP step
      setStep("otp")
      setCooldown(OTP_COOLDOWN)
      setOtpExpiry(OTP_EXPIRY)

      // Focus first OTP input
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 100)

    } catch (err) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle OTP input change
   */
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otpCode]
    newOtp[index] = value
    setOtpCode(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (value && index === 5 && newOtp.every(d => d !== "")) {
      handleOtpSubmit(null, newOtp.join(""))
    }
  }

  /**
   * Handle OTP input keydown
   */
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  /**
   * Handle OTP paste
   */
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtpCode(pasted.split(""))
      otpInputsRef.current[5]?.focus()
      handleOtpSubmit(null, pasted)
    }
  }

  /**
   * Handle Password Submit (Development Mode)
   */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!password) {
      setError("Please enter password")
      return
    }

    setLoading(true)

    try {
      const cleaned = phoneNumber.replace(/\D/g, "")
      await loginWithPassword(`+91${cleaned}`, password)
      navigate("/", { replace: true })
    } catch (err) {
      setError(err.message || "Invalid password")
      setPassword("")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle OTP verification
   */
  const handleOtpSubmit = async (e, code = null) => {
    e?.preventDefault()
    setError("")

    const otp = code || otpCode.join("")
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP")
      return
    }

    if (otpExpiry <= 0) {
      setError("OTP expired. Please request a new one.")
      return
    }

    setLoading(true)

    try {
      // Verify OTP with Firebase
      const firebaseResult = await verifyOTP(otp)

      if (!firebaseResult.success) {
        throw new Error("OTP verification failed")
      }

      // Complete login with backend
      await loginWithOTP(firebaseResult.idToken, firebaseResult.phoneNumber)

      // Navigate to dashboard
      navigate("/", { replace: true })

    } catch (err) {
      setError(err.message || "Verification failed")
      // Clear OTP on error
      setOtpCode(["", "", "", "", "", ""])
      otpInputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    if (cooldown > 0) return

    setError("")
    setLoading(true)

    try {
      const cleaned = phoneNumber.replace(/\D/g, "")

      // Re-setup reCAPTCHA
      setupRecaptcha("resend-otp-button")

      // Send new OTP
      await sendOTP(`+91${cleaned}`)

      setCooldown(OTP_COOLDOWN)
      setOtpExpiry(OTP_EXPIRY)
      setOtpCode(["", "", "", "", "", ""])
      otpInputsRef.current[0]?.focus()

    } catch (err) {
      setError(err.message || "Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Go back to phone input
   */
  const handleBack = () => {
    setStep("phone")
    setOtpCode(["", "", "", "", "", ""])
    setPassword("")
    setError("")
    setIsDevMode(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Security Badge */}
      <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-green-400 text-xs font-medium">Bank-Grade Security</span>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PG Admin</h1>
          <p className="text-slate-400">Secure OTP Authentication</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === "phone" ? (
            /* Phone Input Step */
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-white/5 border border-r-0 border-white/10 rounded-l-lg text-slate-400 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    placeholder="Enter your mobile number"
                    required
                    autoFocus
                    maxLength={10}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  We'll send a verification code to this number
                </p>
              </div>

              <Button
                id="send-otp-button"
                type="submit"
                disabled={loading || phoneNumber.length !== 10}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : step === "password" ? (
            /* Password Input Step (Development Mode) */
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Back button */}
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-slate-400 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change number
              </button>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-4">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-yellow-400 text-xs font-medium">Development Mode</span>
                </div>
                <p className="text-slate-300 mb-1">Admin Login</p>
                <p className="text-white font-semibold">+91 {phoneNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="Enter admin password"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          ) : (
            /* OTP Input Step */
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {/* Back button */}
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-slate-400 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change number
              </button>

              <div className="text-center">
                <p className="text-slate-300 mb-1">Enter the 6-digit code sent to</p>
                <p className="text-white font-semibold">+91 {phoneNumber}</p>
              </div>

              {/* OTP Inputs */}
              <div className="flex justify-center gap-2">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center">
                {otpExpiry > 0 ? (
                  <p className="text-slate-400 text-sm">
                    Code expires in <span className="text-yellow-400 font-mono">{otpExpiry}s</span>
                  </p>
                ) : (
                  <p className="text-red-400 text-sm">Code expired</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || otpCode.some(d => !d) || otpExpiry <= 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Login"
                )}
              </Button>

              {/* Resend */}
              <div className="text-center">
                <button
                  id="resend-otp-button"
                  type="button"
                  onClick={handleResendOTP}
                  disabled={cooldown > 0 || loading}
                  className={`text-sm ${cooldown > 0 ? "text-slate-500" : "text-purple-400 hover:text-purple-300"} transition-colors`}
                >
                  {cooldown > 0 ? (
                    `Resend OTP in ${cooldown}s`
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-xs">
            Protected by Firebase & AES-256 encryption
          </p>
          <p className="text-slate-600 text-xs mt-2">
            &copy; {new Date().getFullYear()} PG Management System
          </p>
        </div>
      </div>

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  )
}
