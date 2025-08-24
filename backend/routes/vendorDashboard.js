import express from "express"
import { verifyToken, vendorCheck } from "../middleware/auth.js"
import { normalizeServiceRequest } from "../middleware/serviceNormalizer.js"
import { normalizeCardRequest } from "../middleware/cardNormalizer.js"
import {
  getVendorDashboardStats,
  getVendorServices,
  getVendorServiceById,
  createService,
  updateService,
  deleteService,
  getVendorCards,
  getVendorBookings,
  updateBookingStatus,
} from "../controllers/vendorServiceController.js"
import {
  createCardTemplate,
  getCardTemplateById,
  updateCardTemplate,
  deleteCardTemplate,
} from "../controllers/cardTemplateController.js"

const router = express.Router()

// Apply middleware to all routes
router.use(verifyToken, vendorCheck)

// Dashboard stats
router.get("/stats", getVendorDashboardStats)

// Service routes
router.get("/services", getVendorServices)
router.get("/services/:serviceId", getVendorServiceById)
router.post("/services", normalizeServiceRequest, createService)
router.put("/services/:serviceId", normalizeServiceRequest, updateService)
router.delete("/services/:serviceId", deleteService)

// Card template routes
router.get("/cards", getVendorCards)
router.get("/cards/:cardId", getCardTemplateById)
router.post("/cards", normalizeCardRequest, createCardTemplate)
router.put("/cards/:cardId", normalizeCardRequest, updateCardTemplate)
router.delete("/cards/:cardId", deleteCardTemplate)

// Booking routes
router.get("/bookings", getVendorBookings)
router.patch("/bookings/:bookingId/status", updateBookingStatus)

export default router

