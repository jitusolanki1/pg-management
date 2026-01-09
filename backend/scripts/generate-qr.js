/**
 * QR Code Generation Scripts
 *
 * Usage:
 *   Generate DEV QR:  node scripts/generate-qr.js dev
 *   Generate PROD QR: node scripts/generate-qr.js prod <admin-email>
 *
 * Security:
 * - DEV QR: Static content, used only in development
 * - PROD QR: Unique per admin, hash stored in database
 */

import crypto from "crypto";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ============================================
// CONFIGURATION
// ============================================

const OUTPUT_DIR = path.join(__dirname, "..", "generated-qr");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pg";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Hash string using SHA-256
 */
const hashString = (str) =>
  crypto.createHash("sha256").update(str).digest("hex");

/**
 * Generate random string
 */
const generateRandom = (length = 32) =>
  crypto.randomBytes(length).toString("hex");

/**
 * Ensure output directory exists
 */
const ensureOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
};

/**
 * Save QR code as image
 */
const saveQRCode = async (content, filename) => {
  ensureOutputDir();
  const filepath = path.join(OUTPUT_DIR, filename);
  await QRCode.toFile(filepath, content, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  return filepath;
};

// ============================================
// DEV QR GENERATION
// ============================================

const generateDevQR = async () => {
  console.log("\n🔧 Generating DEVELOPMENT QR Code...\n");

  // DEV QR content format: DEV_QR:{random}
  const random = generateRandom(16);
  const content = `DEV_QR:${random}`;
  const hash = hashString(content);

  // Save QR code
  const filename = `dev-qr-${Date.now()}.png`;
  const filepath = await saveQRCode(content, filename);

  console.log("✅ DEV QR Generated Successfully!\n");
  console.log("=====================================");
  console.log(`📁 File: ${filepath}`);
  console.log(`📝 Content: ${content}`);
  console.log(`🔐 Hash: ${hash}`);
  console.log("=====================================\n");

  console.log("📋 Add this to your .env file:");
  console.log(`   DEV_QR_HASH=${hash}\n`);

  console.log("⚠️  IMPORTANT:");
  console.log("   - This QR is for DEVELOPMENT ONLY");
  console.log("   - Do NOT use in production");
  console.log("   - Keep the generated image secure\n");

  return { content, hash, filepath };
};

// ============================================
// PROD QR GENERATION
// ============================================

const generateProdQR = async (adminEmail) => {
  if (!adminEmail) {
    console.error("❌ Error: Admin email required");
    console.log("   Usage: node scripts/generate-qr.js prod <admin-email>");
    process.exit(1);
  }

  console.log("\n🔒 Generating PRODUCTION QR Code...\n");
  console.log(`   Admin: ${adminEmail}\n`);

  // Connect to database
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }

  // Import Admin model
  const AdminSchema = new mongoose.Schema({
    email: String,
    name: String,
    phoneNumber: String,
    qrHash: { type: String, select: false },
    googleEmail: String,
    isActive: Boolean,
  });

  const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

  // Find admin
  const admin = await Admin.findOne({
    email: adminEmail.toLowerCase(),
    isActive: true,
  });

  if (!admin) {
    console.error(`❌ Admin not found: ${adminEmail}`);
    console.log("   Make sure the admin exists and is active");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Generate unique QR content
  // Format: ADMIN_QR:{adminId}:{random}
  const random = generateRandom(16);
  const content = `ADMIN_QR:${admin._id}:${random}`;
  const hash = hashString(content);

  // Update admin with QR hash
  admin.qrHash = hash;
  await admin.save();

  // Also set googleEmail if not set
  if (!admin.googleEmail) {
    admin.googleEmail = admin.email;
    await admin.save();
  }

  // Save QR code
  const safeEmail = adminEmail.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `admin-qr-${safeEmail}-${Date.now()}.png`;
  const filepath = await saveQRCode(content, filename);

  await mongoose.disconnect();

  console.log("\n✅ PRODUCTION QR Generated Successfully!\n");
  console.log("=====================================");
  console.log(`👤 Admin: ${admin.name} (${admin.email})`);
  console.log(`📁 File: ${filepath}`);
  console.log(`🔐 Hash stored in database`);
  console.log("=====================================\n");

  console.log("📋 Instructions:");
  console.log("   1. Send the QR image SECURELY to the admin");
  console.log("   2. Admin should store it safely (not on shared devices)");
  console.log("   3. Admin will upload this QR during login\n");

  console.log("⚠️  SECURITY NOTES:");
  console.log("   - Each admin has a UNIQUE QR");
  console.log("   - QR content is NOT stored (only hash)");
  console.log("   - If compromised, regenerate immediately");
  console.log("   - Do NOT share or commit QR images\n");

  return { hash, filepath, adminId: admin._id };
};

// ============================================
// LIST ADMINS
// ============================================

const listAdmins = async () => {
  console.log("\n📋 Listing all admins...\n");

  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }

  const AdminSchema = new mongoose.Schema({
    email: String,
    name: String,
    qrHash: { type: String, select: false },
    isActive: Boolean,
  });

  const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

  const admins = await Admin.find({ isActive: true }).select("+qrHash");

  if (admins.length === 0) {
    console.log("   No active admins found\n");
  } else {
    console.log("   Active Admins:");
    admins.forEach((admin, i) => {
      const hasQR = admin.qrHash ? "✅" : "❌";
      console.log(`   ${i + 1}. ${admin.email} - QR: ${hasQR}`);
    });
    console.log();
  }

  await mongoose.disconnect();
};

// ============================================
// MAIN
// ============================================

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  console.log("\n╔════════════════════════════════════╗");
  console.log("║     PG Management QR Generator     ║");
  console.log("╚════════════════════════════════════╝");

  switch (command) {
    case "dev":
      await generateDevQR();
      break;

    case "prod":
      await generateProdQR(args[1]);
      break;

    case "list":
      await listAdmins();
      break;

    default:
      console.log("\n📖 Usage:\n");
      console.log("   Generate DEV QR:");
      console.log("   node scripts/generate-qr.js dev\n");
      console.log("   Generate PROD QR for admin:");
      console.log("   node scripts/generate-qr.js prod <admin-email>\n");
      console.log("   List all admins:");
      console.log("   node scripts/generate-qr.js list\n");
  }

  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
