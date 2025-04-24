import express from "express";
import {
  getAdminDashboardStats,
  getAdminServices,
  getAdminCards,
  getAdminBookings,
  getAdminReviews,
  getAdminUsers,
  getAdminVendorRequests,
  approveService,
  rejectService,
  approveCard,
  rejectCard,
  cancelBooking,
  deleteReview,
  toggleUserBlock,
  getUserDashboardStats,
  getUserEstimations,
  getUserBookings,
  getUserReviews,
  submitReview,
  cancelUserBooking,
  removeEstimation,
  getServiceById,
  getCardById,
  getVendorRequestById,
  revertServiceToPending,
  revertCardToPending,
  createEstimation,
  convertEstimationToBookings,
  createBooking,
} from "../controllers/dashboardController.js";
import { verifyToken, adminCheck, userCheck } from "../middleware/auth.js";

const router = express.Router();

// Admin Dashboard Routes
router.get("/admin/stats", verifyToken, adminCheck, getAdminDashboardStats);
router.get("/admin/services", verifyToken, adminCheck, getAdminServices);
router.get("/admin/cards", verifyToken, adminCheck, getAdminCards);
router.get("/admin/bookings", verifyToken, adminCheck, getAdminBookings);
router.get("/admin/reviews", verifyToken, adminCheck, getAdminReviews);
router.get("/admin/users", verifyToken, adminCheck, getAdminUsers);
router.get("/admin/vendor-requests", verifyToken, adminCheck, getAdminVendorRequests);

// Admin Detail View Routes
router.get("/admin/services/:serviceId", verifyToken, adminCheck, getServiceById);
router.get("/admin/cards/:cardId", verifyToken, adminCheck, getCardById);
router.get("/admin/vendor-requests/:vendorId", verifyToken, adminCheck, getVendorRequestById);

// Admin Actions
router.patch("/admin/services/:serviceId/approve", verifyToken, adminCheck, approveService);
router.delete("/admin/services/:serviceId/reject", verifyToken, adminCheck, rejectService);
router.patch("/admin/cards/:cardId/approve", verifyToken, adminCheck, approveCard);
router.delete("/admin/cards/:cardId/reject", verifyToken, adminCheck, rejectCard);
router.patch("/admin/bookings/:bookingId/cancel", verifyToken, adminCheck, cancelBooking);
router.patch("/admin/reviews/:reviewId/delete", verifyToken, adminCheck, deleteReview);
router.patch("/admin/users/:userId/toggle-block", verifyToken, adminCheck, toggleUserBlock);
router.patch("/admin/services/:serviceId/revert", verifyToken, adminCheck, revertServiceToPending);
router.patch("/admin/cards/:cardId/revert", verifyToken, adminCheck, revertCardToPending);

// User Dashboard Routes
router.get("/user/stats", verifyToken, userCheck, getUserDashboardStats);
router.get("/user/estimations", verifyToken, userCheck, getUserEstimations);
router.get("/user/bookings", verifyToken, userCheck, getUserBookings);
router.get("/user/reviews", verifyToken, userCheck, getUserReviews);

// User Actions
router.post("/user/estimations", verifyToken, userCheck, createEstimation);
router.post("/user/estimations/:estimationId/convert", verifyToken, userCheck, convertEstimationToBookings);
router.post("/user/bookings", verifyToken, userCheck, createBooking);
router.post("/user/reviews", verifyToken, userCheck, submitReview);
router.patch("/user/bookings/:bookingId/cancel", verifyToken, userCheck, cancelUserBooking);
router.delete("/user/estimations/:estimationId", verifyToken, userCheck, removeEstimation);
router.delete("/user/estimations/:estimationId/services/:serviceId", verifyToken, userCheck, removeEstimation);
router.delete("/user/estimations/:estimationId/cards/:cardId", verifyToken, userCheck, removeEstimation);

export default router;