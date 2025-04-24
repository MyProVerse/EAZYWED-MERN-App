import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/env.js"
import { Admin } from "../models/Admin.js"
import User from "../models/User.js"
import BlockedUsers from "../models/BlockedUsers.js"

export const generateToken = async (id, type, expiresIn = "1h") => {
  let role
  if (type === "admin") {
    const admin = await Admin.findById(id)
    if (!admin) throw new Error("Admin not found")
    role = admin.role
  } else if (type === "user" || type === "vendor") {
    const user = await User.findById(id)
    if (!user) throw new Error("User not found")
    role = user.role
  } else {
    throw new Error("Invalid type for token generation")
  }
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn })
}

export const generateResetToken = (otpId, expiresIn = "10m") => {
  return jwt.sign({ otpId }, JWT_SECRET, { expiresIn })
}

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: "No token provided" })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    let entity

    // Check if user is blocked
    if (decoded.role === "user" || decoded.role === "vendor") {
      const blockedUser = await BlockedUsers.findOne({ userId: decoded.id })
      if (blockedUser) {
        return res.status(403).json({ message: "Your account has been blocked" })
      }
    }

    if (decoded.role === "superadmin" || decoded.role === "moderator") {
      entity = await Admin.findById(decoded.id)
      if (!entity) return res.status(404).json({ message: "Admin not found" })
    } else {
      entity = await User.findById(decoded.id)
      if (!entity) return res.status(404).json({ message: "User not found" })
    }

    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" })
  }
}

export const verifyResetToken = (req, res, next) => {
  const token = req.cookies.resetToken
  if (!token) return res.status(401).json({ message: "No reset token provided" })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.otpId = decoded.otpId
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" })
  }
}

export const adminCheck = (req, res, next) => {
  if (!req.user || !["superadmin", "moderator"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied: Admins only" })
  }
  next()
}

export const vendorCheck = (req, res, next) => {
  if (!req.user || req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied: Vendors only" })
  }
  next()
}

export const userCheck = (req, res, next) => {
  // Allow vendors to access user routes (vendors can also be users)
  if (!req.user || (req.user.role !== "user" && req.user.role !== "vendor")) {
    return res.status(403).json({ message: "Access denied: Users only" })
  }
  next()
}

