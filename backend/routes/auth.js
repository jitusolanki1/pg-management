import express from "express"
import jwt from "jsonwebtoken"
import Admin from "../models/Admin.js"

const router = express.Router()

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    })

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Register (First time setup only)
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, name } = req.body

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" })
    }

    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] })
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" })
    }

    const admin = await Admin.create({ username, email, password, name })

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
