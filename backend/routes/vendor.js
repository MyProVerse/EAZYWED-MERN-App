import express from "express";
import {
  login,
  requestOtp,
  verifyOtp,
  resetPassword,
  checkResetToken,
  createService,
  updateService,
  deleteService,
  getVendorService,
  createCardTemplate,
  updateCardTemplate,
  deleteCardTemplate,
  getVendorCardTemplate,
  updateBookingStatus,
  getBookingDetails,
  getVendorBookings,
  getBookingUserInfo,
  checkAvailability,
  getVendorDashboardStats,
} from "../controllers/vendorController.js";
import { verifyToken, verifyResetToken, vendorCheck } from "../middleware/auth.js";
import { uploadServicePhotos, uploadCardImage, handleMulterError, normalizeServiceData, normalizeCardData } from "../middleware/vendorNormalizer.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", login);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.patch("/reset-password", verifyResetToken, resetPassword);
router.get("/check-reset-token", verifyResetToken, checkResetToken);

router.post("/services", verifyToken, vendorCheck, uploadServicePhotos, handleMulterError, normalizeServiceData, createService);
router.put("/services/:serviceId", verifyToken, vendorCheck, uploadServicePhotos, handleMulterError, normalizeServiceData, updateService);
router.delete("/services/:serviceId", verifyToken, vendorCheck, deleteService);
router.get("/services/:serviceId", verifyToken, vendorCheck, getVendorService);

router.post("/cards", verifyToken, vendorCheck, uploadCardImage, handleMulterError, normalizeCardData, createCardTemplate);
router.put("/cards/:cardId", verifyToken, vendorCheck, uploadCardImage, handleMulterError, normalizeCardData, updateCardTemplate);
router.delete("/cards/:cardId", verifyToken, vendorCheck, deleteCardTemplate);
router.get("/cards/:cardId", verifyToken, vendorCheck, getVendorCardTemplate);

router.get("/bookings/:bookingId", verifyToken, vendorCheck, getBookingDetails);
router.patch("/bookings/:bookingId/status", verifyToken, vendorCheck, updateBookingStatus);
router.get("/bookings/:bookingId/user", verifyToken, vendorCheck, getBookingUserInfo);
router.get("/bookings", verifyToken, vendorCheck, getVendorBookings);
router.post("/check-availability", verifyToken, vendorCheck, checkAvailability);

router.get("/stats", verifyToken, vendorCheck, getVendorDashboardStats);

router.get("/dashboard", verifyToken, vendorCheck, (req, res) => {
  res.status(200).json({ message: "Welcome to Vendor Dashboard", vendor: req.user });
});

router.get("/check-auth", verifyToken, vendorCheck, (req, res) => {
  try {
    User.findById(req.user.id)
      .select("-password")
      .then((vendorData) => {
        if (!vendorData) {
          return res.status(404).json({ message: "Vendor not found", authenticated: false });
        }
        res.status(200).json({ message: "Authenticated", user: { ...vendorData.toObject(), role: req.user.role } });
      })
      .catch((err) => {
        console.error("Vendor fetch error:", err);
        res.status(200).json({ message: "Authenticated with limited data", user: req.user });
      });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
});

export default router;