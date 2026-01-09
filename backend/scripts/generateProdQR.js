#!/usr/bin/env node
/**
 * Generate Production Admin QR Code
 *
 * Usage: node scripts/generateProdQR.js <admin-email>
 *
 * This script generates a unique QR code for a specific admin.
 * The QR hash is stored in the admin's database record.
 */

import QRCode from "qrcode";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Admin schema (minimal for this script)
const adminSchema = new mongoose.Schema({
  email: String,
  name: String,
  qrHash: String,
  qrGeneratedAt: Date,
});

// Generate unique admin QR content
const generateAdminQRContent = (adminId, adminEmail) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(32).toString("hex");
  return `PROD_ADMIN_${adminId}_${adminEmail}_${timestamp}_${random}`;
};

// Hash the content
const hashContent = (content) => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

async function main() {
  const adminEmail = process.argv[2];

  if (!adminEmail) {
    console.error("Usage: node scripts/generateProdQR.js <admin-email>");
    console.error("Example: node scripts/generateProdQR.js admin@example.com");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("PRODUCTION ADMIN QR CODE GENERATOR");
  console.log("=".repeat(60));
  console.log("");
  console.log(`Generating QR for: ${adminEmail}`);
  console.log("");

  // Connect to database
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/pg";

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to database");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }

  // Get or create Admin model
  const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

  // Find admin
  const admin = await Admin.findOne({ email: adminEmail.toLowerCase() });

  if (!admin) {
    console.error(`❌ Admin not found: ${adminEmail}`);
    console.error("   Please create the admin account first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✅ Found admin: ${admin.name || admin.email}`);
  console.log("");

  // Check if admin already has a QR
  if (admin.qrHash) {
    console.log("⚠️  This admin already has a QR code assigned.");
    console.log("   Generating a new one will INVALIDATE the old QR.");
    console.log("");

    // In a real scenario, you might want to prompt for confirmation
    // For now, we'll proceed with regeneration
    console.log("   Proceeding with regeneration...");
    console.log("");
  }

  // Generate content and hash
  const qrContent = generateAdminQRContent(admin._id.toString(), admin.email);
  const qrHash = hashContent(qrContent);

  // Update admin with new QR hash
  admin.qrHash = qrHash;
  admin.qrGeneratedAt = new Date();
  await admin.save();

  console.log("✅ QR Hash saved to database");
  console.log("");

  // Generate QR code image
  const outputDir = path.join(__dirname, "..", "generated-qr");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeEmail = adminEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const outputPath = path.join(outputDir, `admin-qr-${safeEmail}.png`);

  await QRCode.toFile(outputPath, qrContent, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#1a1a2e",
      light: "#FFFFFF",
    },
  });

  console.log("✅ QR Code Image Saved:");
  console.log(`   ${outputPath}`);
  console.log("");
  console.log("=".repeat(60));
  console.log("INSTRUCTIONS:");
  console.log("=".repeat(60));
  console.log("");
  console.log("1. Securely deliver this QR image to the admin:");
  console.log(`   ${outputPath}`);
  console.log("");
  console.log("2. The admin must keep this QR private and secure");
  console.log("");
  console.log("3. If compromised, regenerate with this script");
  console.log("");
  console.log("⚠️  NEVER share or commit QR images!");
  console.log("⚠️  The generated-qr folder is in .gitignore");
  console.log("");

  await mongoose.disconnect();
  console.log("✅ Done");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
