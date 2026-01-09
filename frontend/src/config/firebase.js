/**
 * Firebase Client Configuration
 * Phone OTP Authentication + Google Sign-In
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";

// Firebase configuration - set these in .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app = null;
let auth = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.useDeviceLanguage();

  // Initialize Google provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope("email");
  googleProvider.addScope("profile");

  console.log("✅ Firebase initialized");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
}

/**
 * Setup invisible reCAPTCHA for phone auth
 */
export function setupRecaptcha(buttonId) {
  if (!auth) {
    console.error("Firebase auth not initialized");
    return null;
  }

  // Clear any existing verifier
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
      console.log("✅ reCAPTCHA verified");
    },
    "expired-callback": () => {
      // Reset reCAPTCHA
      console.warn("⚠️ reCAPTCHA expired");
    },
  });

  return window.recaptchaVerifier;
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phoneNumber) {
  if (!auth) {
    throw new Error("Firebase not initialized");
  }

  // Normalize phone number
  const normalized = phoneNumber.replace(/\s+/g, "");
  const formatted = normalized.startsWith("+")
    ? normalized
    : `+91${normalized}`;

  try {
    const appVerifier = window.recaptchaVerifier;

    if (!appVerifier) {
      throw new Error(
        "reCAPTCHA not initialized. Please refresh and try again."
      );
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formatted,
      appVerifier
    );

    // Store confirmation result for OTP verification
    window.confirmationResult = confirmationResult;

    return {
      success: true,
      phoneNumber: formatted,
    };
  } catch (error) {
    console.error("OTP send error:", error);

    // Map Firebase errors to user-friendly messages
    const errorMessages = {
      "auth/invalid-phone-number": "Invalid phone number format",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/quota-exceeded": "SMS quota exceeded. Please try again later.",
      "auth/captcha-check-failed":
        "Security verification failed. Please refresh.",
      "auth/missing-phone-number": "Phone number is required",
    };

    throw new Error(
      errorMessages[error.code] || "Failed to send OTP. Please try again."
    );
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(otpCode) {
  if (!window.confirmationResult) {
    throw new Error("No OTP session found. Please request a new OTP.");
  }

  try {
    const result = await window.confirmationResult.confirm(otpCode);
    const user = result.user;

    // Get Firebase ID token for backend verification
    const idToken = await user.getIdToken(true);

    return {
      success: true,
      user,
      idToken,
      phoneNumber: user.phoneNumber,
    };
  } catch (error) {
    console.error("OTP verification error:", error);

    const errorMessages = {
      "auth/invalid-verification-code":
        "Invalid OTP. Please check and try again.",
      "auth/code-expired": "OTP has expired. Please request a new one.",
      "auth/missing-verification-code": "Please enter the OTP",
    };

    throw new Error(errorMessages[error.code] || "OTP verification failed");
  }
}

/**
 * Sign out from Firebase
 */
export async function firebaseLogout() {
  if (!auth) return;

  try {
    await firebaseSignOut(auth);
    console.log("✅ Firebase signed out");
  } catch (error) {
    console.error("Firebase sign out error:", error);
  }

  // Clear global references
  window.confirmationResult = null;
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
    window.recaptchaVerifier = null;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error("Firebase not initialized");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get Firebase ID token
    const idToken = await user.getIdToken(true);

    return {
      success: true,
      user,
      idToken,
      email: user.email,
      uid: user.uid,
      name: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);

    const errorMessages = {
      "auth/popup-closed-by-user": "Sign-in cancelled",
      "auth/popup-blocked": "Popup was blocked. Please allow popups.",
      "auth/account-exists-with-different-credential":
        "Account exists with different credential",
      "auth/cancelled-popup-request": "Sign-in cancelled",
    };

    return {
      success: false,
      error: errorMessages[error.code] || "Google sign-in failed",
      code: error.code,
    };
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser() {
  return auth?.currentUser || null;
}

/**
 * Get fresh ID token
 */
export async function getIdToken() {
  const user = auth?.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(true);
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
}

export { auth };
export default app;
