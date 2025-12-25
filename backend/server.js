import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRoutes from "./routes/auth.js"
import floorRoutes from "./routes/floors.js"
import roomRoutes from "./routes/rooms.js"
import bedRoutes from "./routes/beds.js"
import planRoutes from "./routes/plans.js"
import tenantRoutes from "./routes/tenants.js"
import paymentRoutes from "./routes/payments.js"
import dashboardRoutes from "./routes/dashboard.js"
import { errorHandler } from "./middleware/errorHandler.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/floors", floorRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/beds", bedRoutes)
app.use("/api/plans", planRoutes)
app.use("/api/tenants", tenantRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB")
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })
