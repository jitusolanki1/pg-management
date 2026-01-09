#!/usr/bin/env node
/**
 * Generate Development QR Code
 *
 * Usage: node scripts/generateDevQR.js
 *
 * This script generates a static DEV QR code for local testing.
 * The QR hash should be added to .env as DEV_QR_HASH
 */

import QRCode from "qrcode";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate unique dev QR content
const generateDevQRContent = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString("hex");
  // Must start with "DEV_QR:" prefix for backend validation
  return `DEV_QR:${timestamp}:${random}`;
};

// Hash the content
const hashContent = (content) => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

async function main() {
  console.log("=".repeat(60));
  console.log("DEVELOPMENT QR CODE GENERATOR");
  console.log("=".repeat(60));
  console.log("");

  // Generate content
  const qrContent = generateDevQRContent();
  const qrHash = hashContent(qrContent);

  console.log("✅ QR Content Generated (KEEP SECRET!):");
  console.log(`   ${qrContent}`);
  console.log("");
  console.log("✅ QR Hash (ADD TO .env):");
  console.log(`   DEV_QR_HASH=${qrHash}`);
  console.log("");

  // Generate QR code image
  const outputDir = path.join(__dirname, "..", "generated-qr");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "dev-admin-qr.png");

  await QRCode.toFile(outputPath, qrContent, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
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
  console.log("1. Add to your .env file:");
  console.log(`   DEV_QR_HASH=${qrHash}`);
  console.log("");
  console.log("2. Keep the QR image safe:");
  console.log(`   ${outputPath}`);
  console.log("");
  console.log("3. Use this QR ONLY in development mode");
  console.log("");
  console.log("⚠️  NEVER share or commit the raw QR content!");
  console.log("⚠️  The generated-qr folder is in .gitignore");
  console.log("");

  // Add to .gitignore if not already
  const gitignorePath = path.join(__dirname, "..", ".gitignore");
  const gitignoreContent = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf8")
    : "";

  if (!gitignoreContent.includes("generated-qr")) {
    fs.appendFileSync(
      gitignorePath,
      "\n# Generated QR codes (sensitive)\ngenerated-qr/\n"
    );
    console.log("✅ Added generated-qr/ to .gitignore");
  }
}

main().catch(console.error);
