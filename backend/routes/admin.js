import express from "express"
import {
  login,
  requestOtp,
  verifyOtp,
  resetPassword,
  checkResetToken,
  approveVendor,
  rejectVendor
} from "../controllers/adminController.js"
import { verifyToken, verifyResetToken, adminCheck } from "../middleware/auth.js"
import {  Admin } from "../models/Admin.js"

const router = express.Router()

router.post("/login", login) //admins/login
router.post("/request-otp", requestOtp)
router.post("/verify-otp", verifyOtp)
router.patch("/reset-password", verifyResetToken, resetPassword)
router.get("/check-reset-token", verifyResetToken, checkResetToken)
router.get("/dashboard", verifyToken, adminCheck, (req, res) => {
  res.status(200).json({ message: "Welcome to Admin Dashboard", admin: req.user })
})
router.get("/check-auth", verifyToken, adminCheck, (req, res) => {
  try {
    Admin.findById(req.user.id)
      .select("-password")
      .then((adminData) => {
        if (!adminData) {
          return res.status(404).json({
            message: "Admin not found",
            authenticated: false
          });
        }
        res.status(200).json({
          message: "Authenticated",
          user: { ...adminData.toObject(), role: req.user.role },
        });
      })
      .catch((err) => {
        console.error("Admin fetch error:", err)
        res.status(200).json({
          message: "Authenticated with limited data",
          user: req.user,
        })
      })
  } catch (error) {
    console.error("Auth check error:", error)
    res.status(401).json({ message: "Authentication failed" })
  }
})
router.post("/approve-vendor", verifyToken, adminCheck, approveVendor)
router.post("/reject-vendor", verifyToken, adminCheck, rejectVendor)

export default router

