/**
 * Generate Production Admin QR Code
 * Run: node scripts/generate-admin-qr.js
 *
 * This generates a unique QR code for the production admin
 * The QR hash will be stored in .env as ADMIN_QR_HASH
 */

import crypto from "crypto";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate unique admin secret
const timestamp = Date.now();
const randomBytes = crypto.randomBytes(32).toString("hex");
const adminEmail = process.env.ADMIN_EMAIL || "js7073829447@gmail.com";

// Create unique QR content
const qrContent = `PROD_ADMIN_QR:${adminEmail}:${randomBytes}:${timestamp}`;

// Generate hash for verification
const qrHash = crypto.createHash("sha256").update(qrContent).digest("hex");

console.log("\n" + "=".repeat(60));
console.log("🔐 PRODUCTION ADMIN QR GENERATOR");
console.log("=".repeat(60));
console.log("\n📧 Admin Email:", adminEmail);
console.log("🔑 QR Content Length:", qrContent.length);
console.log("\n⚠️  IMPORTANT: Add this to your .env file:");
console.log("=".repeat(60));
console.log(`\nADMIN_QR_HASH=${qrHash}\n`);
console.log("=".repeat(60));

// Generate QR code image
const outputPath = path.join(__dirname, "..", "admin-qr.png");

QRCode.toFile(
  outputPath,
  qrContent,
  {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  },
  (err) => {
    if (err) {
      console.error("❌ Error generating QR:", err);
      process.exit(1);
    }

    console.log("\n✅ QR Code generated successfully!");
    console.log("📁 File saved to:", outputPath);
    console.log("\n🔒 SECURITY NOTES:");
    console.log("   - Keep this QR code secure");
    console.log("   - Only share with authorized admin");
    console.log("   - Delete after transferring to admin device");
    console.log("   - Never commit QR image to git");
    console.log("\n" + "=".repeat(60) + "\n");
  }
);
