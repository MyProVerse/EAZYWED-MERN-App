import express from "express";
import {
  getSlidersByCategory,
  getDiscountedServices,
  searchServices,
  getServicesByCategory,
  getDiscountedServicesByCategory,
  getServiceDetails,
  checkServiceAvailability,
  getCardsByType,
  getCardDetails,
  editCardTemplate,
  submitContactInquiry,
  getRecommendations,
  chatbotQuery,
  getServiceFilters,
  getTrendingSearches,
  getLocations,
  checkCardAvailability
} from "../controllers/publicController.js";
import { verifyToken, userCheck } from "../middleware/auth.js";

const router = express.Router();

// Service Routes
router.get("/sliders/:category", getSlidersByCategory);
router.get("/discounts", getDiscountedServices);
router.get("/search", searchServices);
router.get("/services/:category", getServicesByCategory);
router.get("/discounts/:category", getDiscountedServicesByCategory);
router.get("/service/:id", getServiceDetails);
router.post("/service/:id/availability", checkServiceAvailability);
router.get("/filters", getServiceFilters);
router.get("/trending", getTrendingSearches);
router.get("/locations", getLocations);

// Card Template Routes
router.get("/cards/:type", getCardsByType);
router.get("/card/:id", getCardDetails);
router.post("/card/:id/availability", checkCardAvailability);
router.get("/card/:id/edit", editCardTemplate);

// General Routes
router.post("/contact", submitContactInquiry);
router.get("/recommendations", getRecommendations);
router.post("/chatbot", chatbotQuery);

export default router;