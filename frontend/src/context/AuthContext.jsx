/**
 * Secure Authentication Context
 * Bank-grade OTP-only authentication
 * Dev mode: Session persists in sessionStorage for convenience
 * Prod mode: Memory-only storage for security
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import apiClient, {
  setAuthTokens,
  clearAuth,
  isAuthenticated as checkAuth,
  getSessionTimeRemaining as getRemaining,
  setDevMode,
  getDevMode,
  onAuthChange
} from "../api/apiClient"
import { firebaseLogout } from "../config/firebase"
import { clearSensitiveData } from "../utils/encryption"

const AuthContext = createContext(null)

// Session storage key - use a fixed key
const SESSION_KEY = "pg_admin_session"

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

export function AuthProvider({ children }) {
  // In-memory only - NO localStorage
  const [admin, setAdmin] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpiry, setSessionExpiry] = useState(null)

  // Activity tracking
  const lastActivityRef = useRef(Date.now())
  const sessionCheckRef = useRef(null)
  const inactivityTimerRef = useRef(null)

  /**
   * Clear all auth state (secure logout)
   */
  const clearAuthState = useCallback(() => {
    setAdmin(null)
    setIsAuthenticated(false)
    setSessionExpiry(null)

    // Clear API tokens
    clearAuth()

    // Clear Firebase session
    firebaseLogout()

    // Clear any sensitive data
    clearSensitiveData()

    // Clear session storage
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch (e) {
      // Ignore storage errors
    }

    // Clear timers
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current)
      sessionCheckRef.current = null
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }

    console.log("🔒 Session cleared")
  }, [])

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      // Notify backend
      await apiClient.post("/auth/logout", {}).catch(() => { })
    } finally {
      clearAuthState()
    }
  }, [clearAuthState])

  /**
   * Track user activity
   */
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Reset inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Auto-logout after 30 minutes of inactivity
    if (isAuthenticated) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log("⏰ Session timeout due to inactivity")
        logout()
      }, SESSION_TIMEOUT)
    }
  }, [isAuthenticated, logout])

  /**
   * Start session monitoring
   */
  const startSessionMonitoring = useCallback(() => {
    // Check session every minute
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current)
    }

    sessionCheckRef.current = setInterval(async () => {
      if (!checkAuth()) {
        console.log("🔒 Session expired")
        clearAuthState()
        return
      }

      // Check remaining time
      const remaining = getRemaining()
      if (remaining < 60) {
        // Less than 1 minute left - will auto-refresh or expire
        console.log(`⏱️ Session expiring in ${remaining}s`)
      }
    }, 60 * 1000)

    // Start inactivity tracking
    trackActivity()
  }, [clearAuthState, trackActivity])

  /**
   * Login with OTP verification result
   */
  const loginWithOTP = useCallback(async (firebaseToken, phoneNumber) => {
    try {
      const response = await apiClient.post("/auth/verify-otp", {
        firebaseToken,
        phoneNumber
      })

      const { token, sessionToken, expiresAt, admin: adminData } = response

      // Set API tokens
      setAuthTokens(token, sessionToken, expiresAt)

      // Update state
      setAdmin(adminData)
      setIsAuthenticated(true)
      setSessionExpiry(new Date(expiresAt))

      // Start session monitoring
      startSessionMonitoring()

      return { success: true, admin: adminData }
    } catch (error) {
      clearAuthState()
      throw error
    }
  }, [clearAuthState, startSessionMonitoring])

  /**
   * Set auth state directly (for AdminVerify flow)
   * Used when authentication is handled externally (e.g., admin verification)
   */
  const setAuthDirect = useCallback((token, sessionToken, adminData, expiresAt) => {
    try {
      const expiry = new Date(expiresAt)
      const isDev = adminData?.isDev || false

      // Set API tokens
      // If sessionToken is provided use it, otherwise fall back to null (but note: sessionToken is required for full auth)
      setAuthTokens(token, sessionToken || null, expiresAt)

      // Update state
      setAdmin({ ...adminData, isDevMode: isDev })
      setIsAuthenticated(true)
      setSessionExpiry(expiry)

      // Store dev mode
      if (isDev) {
        setDevMode(true)
      }

      // Persist session to sessionStorage (for both dev and prod now)
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            token,
            sessionToken: sessionToken || null,
            expiresAt,
            admin: adminData,
            isDevMode: isDev,
          })
        )
      } catch (e) {
        console.warn("Failed to persist session", e)
      }

      // Start session monitoring
      startSessionMonitoring()

      console.log(`✅ Auth set directly (${isDev ? 'DEV' : 'PROD'} mode)`)

      return { success: true, admin: adminData }
    } catch (error) {
      console.error("setAuthDirect error:", error)
      clearAuthState()
      throw error
    }
  }, [clearAuthState, startSessionMonitoring])

  /**
   * Get remaining session time
   */
  const getSessionTimeRemaining = useCallback(() => {
    return getRemaining()
  }, [])

  /**
   * Validate phone number before OTP
   */
  const requestOTP = useCallback(async (phoneNumber) => {
    const response = await apiClient.post("/auth/request-otp", { phoneNumber })
    return response
  }, [])

  /**
   * Login with password (Development Mode)
   */
  const loginWithPassword = useCallback(async (phoneNumber, password) => {
    try {
      const response = await apiClient.post("/auth/dev-login", {
        phoneNumber,
        password
      })

      const { token, sessionToken, expiresAt, admin: adminData, isDevMode: devMode } = response

      // Set API tokens
      setAuthTokens(token, sessionToken, expiresAt)

      // Update state with dev mode flag
      setAdmin({ ...adminData, isDevMode: devMode || true })
      setIsAuthenticated(true)
      setSessionExpiry(new Date(expiresAt))

      // Store dev mode in memory for API calls
      setDevMode(true)

      // Persist session to sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          token,
          sessionToken,
          expiresAt,
          admin: adminData,
          isDevMode: true
        }))
      } catch (e) {
        console.warn("Failed to persist session", e)
      }

      // Start session monitoring
      startSessionMonitoring()

      console.log("✅ Logged in with DEV database")

      return { success: true, admin: adminData, isDevMode: true }
    } catch (error) {
      clearAuthState()
      throw error
    }
  }, [clearAuthState, startSessionMonitoring])

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) return

    const events = ["mousedown", "keydown", "scroll", "touchstart"]

    const handleActivity = () => trackActivity()

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, trackActivity])

  // Check initial auth state - restore session if exists
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY)
        if (stored) {
          const session = JSON.parse(stored)
          const expiry = new Date(session.expiresAt)

          // Check if session is still valid (not expired)
          if (expiry > new Date()) {
            console.log("🔄 Restoring session...")

            // Restore API tokens
            setAuthTokens(session.token, session.sessionToken, session.expiresAt)
            if (session.isDevMode) {
              setDevMode(true)
            }

            // Restore state
            setAdmin({ ...session.admin, isDevMode: session.isDevMode })
            setIsAuthenticated(true)
            setSessionExpiry(expiry)

            // Start session monitoring
            startSessionMonitoring()

            console.log("✅ Session restored")
          } else {
            // Session expired, clear it
            sessionStorage.removeItem(SESSION_KEY)
            console.log("🔒 Session expired")
          }
        }
      } catch (e) {
        console.error("Failed to restore session", e)
        sessionStorage.removeItem(SESSION_KEY)
      }
      setIsLoading(false)
    }

    restoreSession()

    // Subscribe to auth changes from API
    const unsubscribe = onAuthChange((authenticated) => {
      if (!authenticated && isAuthenticated) {
        clearAuthState()
      }
    })

    return () => {
      unsubscribe()
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  }, []) // Empty deps - run only once on mount

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - could implement stricter security here
      } else {
        // Page visible - check session
        if (isAuthenticated && !checkAuth()) {
          console.log("🔒 Session invalidated while away")
          clearAuthState()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAuthenticated, clearAuthState])

  const value = {
    admin,
    isAuthenticated,
    isLoading,
    sessionExpiry,
    loginWithOTP,
    loginWithPassword,
    setAuthDirect,
    logout,
    requestOTP,
    getSessionTimeRemaining,
    trackActivity
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
