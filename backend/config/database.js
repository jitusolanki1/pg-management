/**
 * Database Manager - Dual Database Support
 * Production DB for regular users, Dev DB for development login
 */

import mongoose from "mongoose";

// Store connections
let productionConnection = null;
let developmentConnection = null;

// Connection options
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connect to Production Database
 */
export async function connectProductionDB() {
  if (productionConnection && productionConnection.readyState === 1) {
    return productionConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not defined");
  }

  productionConnection = await mongoose.createConnection(
    uri,
    connectionOptions
  );
  console.log("✅ Connected to Production Database");
  return productionConnection;
}

/**
 * Connect to Development Database
 */
export async function connectDevelopmentDB() {
  if (developmentConnection && developmentConnection.readyState === 1) {
    return developmentConnection;
  }

  const uri =
    process.env.MONGODB_DEV_URI ||
    process.env.MONGODB_URI.replace("/pg?", "/pg_dev?");

  developmentConnection = await mongoose.createConnection(
    uri,
    connectionOptions
  );
  console.log("✅ Connected to Development Database");
  return developmentConnection;
}

/**
 * Get appropriate connection based on mode
 */
export function getConnection(isDev = false) {
  if (isDev) {
    return developmentConnection || mongoose.connection;
  }
  return productionConnection || mongoose.connection;
}

/**
 * Check if development mode
 */
export function isDevMode(phoneNumber) {
  const devPhone = process.env.DEV_PHONE || "+917073829447";
  const normalized = phoneNumber
    ?.replace(/\s+/g, "")
    .replace(/^(\+91)?/, "+91");
  return normalized === devPhone;
}

/**
 * Initialize both databases
 */
export async function initializeDatabases() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Connect to main database using mongoose default
      await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
      console.log("✅ Connected to MongoDB (Production)");

      // Also create development connection
      const devUri =
        process.env.MONGODB_DEV_URI ||
        process.env.MONGODB_URI.replace("/pg?", "/pg_dev?");
      developmentConnection = mongoose.createConnection(
        devUri,
        connectionOptions
      );

      developmentConnection.on("connected", () => {
        console.log("✅ Connected to MongoDB (Development)");
      });

      developmentConnection.on("error", (err) => {
        console.error("❌ Development DB error:", err.message);
      });

      return;
    } catch (err) {
      retries++;
      console.error(
        `❌ MongoDB connection attempt ${retries} failed:`,
        err.message
      );
      if (retries < maxRetries) {
        console.log(`⏳ Retrying in 5 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  console.error("❌ Failed to connect to MongoDB after max retries");
  process.exit(1);
}

/**
 * Get Development Connection
 */
export function getDevConnection() {
  return developmentConnection;
}

/**
 * Get models for development database
 */
export function getDevModels() {
  if (!developmentConnection) {
    return null;
  }

  // Import schemas
  const AdminSchema = mongoose.model("Admin").schema;
  const SessionSchema = mongoose.model("Session").schema;
  const FloorSchema = mongoose.model("Floor").schema;
  const RoomSchema = mongoose.model("Room").schema;
  const BedSchema = mongoose.model("Bed").schema;
  const TenantSchema = mongoose.model("Tenant").schema;
  const PaymentSchema = mongoose.model("Payment").schema;
  const PlanSchema = mongoose.model("Plan").schema;

  return {
    Admin: developmentConnection.model("Admin", AdminSchema),
    Session: developmentConnection.model("Session", SessionSchema),
    Floor: developmentConnection.model("Floor", FloorSchema),
    Room: developmentConnection.model("Room", RoomSchema),
    Bed: developmentConnection.model("Bed", BedSchema),
    Tenant: developmentConnection.model("Tenant", TenantSchema),
    Payment: developmentConnection.model("Payment", PaymentSchema),
    Plan: developmentConnection.model("Plan", PlanSchema),
  };
}

export default {
  initializeDatabases,
  getConnection,
  getDevConnection,
  getDevModels,
  isDevMode,
};
