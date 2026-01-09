/**
 * Firebase Admin SDK Configuration
 * Used for server-side Firebase token verification
 */

import admin from "firebase-admin";

// Firebase service account configuration
// In production, use a service account JSON file or environment variables
const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL,
};

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  try {
    // Try to initialize with service account
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      console.log("✅ Firebase Admin initialized with service account");
    } else {
      // Fallback: Initialize without credential for development
      // WARNING: This won't work for phone auth verification in production
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "pg-management-dev",
      });
      console.log(
        "⚠️ Firebase Admin initialized without service account (DEV MODE)"
      );
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error.message);
  }
}

/**
 * Verify Firebase ID token from phone authentication
 */
export async function verifyFirebaseToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    return {
      success: true,
      uid: decodedToken.uid,
      phone: decodedToken.phone_number,
      authTime: decodedToken.auth_time,
      exp: decodedToken.exp,
    };
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);
    return {
      success: false,
      error: error.code || "VERIFICATION_FAILED",
    };
  }
}

/**
 * Revoke all refresh tokens for a user (force logout)
 */
export async function revokeUserTokens(uid) {
  try {
    await admin.auth().revokeRefreshTokens(uid);
    return { success: true };
  } catch (error) {
    console.error("Token revocation failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get Firebase user by phone number
 */
export async function getUserByPhone(phoneNumber) {
  try {
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return { success: true, user };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return { success: false, notFound: true };
    }
    return { success: false, error: error.message };
  }
}

export default admin;
