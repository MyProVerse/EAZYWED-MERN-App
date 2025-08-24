import express from "express";
import mongoose from "mongoose";
import Service from "../models/Service.js";
import CardTemplate from "../models/CardTemplate.js";
import Recommendation from "../models/Recommendation.js";
import Review from "../models/Review.js";
import ContactMessage from "../models/ContactMessage.js"; 
import { getPersonalizedRecommendations, getPopularRecommendations } from "../utils/recommendationEngine.js";
import { generateWhatsAppLink } from "../utils/whatsapp.js";
import { sendOTP } from "../utils/twilio.js";
import axios from "axios";

const router = express.Router();

const formatResponse = (data, pagination = null) => {
  return pagination ? { data, pagination } : { data };
};

const handleError = (res, error, customMessage = "Server error") => {
  console.error(`${customMessage}:`, error);
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: customMessage });
};

const formatService = (service) => ({
  id: service._id,
  type: "service",
  title: service.name,
  image: service.photos?.[0] || "",
  rating: service.avg_rating || 0,
  reviewCount: service.review_count || 0,
  city: service.city,
  discount: service.discount ? `${service.discount}% Off` : null,
  price: service.pricing_packages?.[0]?.price || 0,
  category: service.category,
  refundPolicy: service.details?.cancellation_policy || "Not specified",
});

const formatCard = (card) => ({
  id: card._id,
  type: "card",
  title: card.name || `${card.type} Card`, // Changed from description to name
  image: card.front_image || card.gallery?.[0] || "",
  price: card.price_per_card || 0,
  rating: card.avg_rating || 0,
  reviewCount: card.review_count || 0,
  city: card.city,
  category: "Wedding Cards",
  refundPolicy: "Not specified",
});

export const getSlidersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { city } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }

    let services = [];
    let cards = [];

    const baseQuery = { status: "published" };
    if (city) baseQuery.city = city;

    if (category === "Recommendations") {
      const recommendations = await Recommendation.find()
        .populate("service_id")
        .limit(10);
      services = recommendations.map((rec) => rec.service_id).filter(Boolean);
      if (city) services = services.filter((s) => s.city === city);
    } else if (category === "Discounts") {
      services = await Service.find({ ...baseQuery, discount: { $gt: 0 } })
        .limit(10);
    } else if (category === "Wedding Cards") {
      cards = await CardTemplate.find(baseQuery)
        .limit(10);
    } else {
      services = await Service.find({ ...baseQuery, category, discount: { $in: [0, null] } })
        .limit(10);
    }

    const formattedServices = services.map(formatService);
    const formattedCards = cards.map(formatCard);

    return res.status(200).json(formatResponse([...formattedServices, ...formattedCards]));
  } catch (error) {
    return handleError(res, error, "Slider fetch error");
  }
};

export const getDiscountedServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, city, budgetMin, budgetMax } = req.query;
    const skip = (page - 1) * parseInt(limit);

    const query = { discount: { $gt: 0 }, status: "published" };
    if (city) query.city = city;
    if (budgetMin || budgetMax) {
      query["pricing_packages.price"] = {};
      if (budgetMin) query["pricing_packages.price"].$gte = Number(budgetMin);
      if (budgetMax) query["pricing_packages.price"].$lte = Number(budgetMax);
    }

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    const formattedServices = services.map(formatService);

    return res.status(200).json(
      formatResponse(formattedServices, {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      })
    );
  } catch (error) {
    return handleError(res, error, "Discounted services error");
  }
};

export const searchServices = async (req, res) => {
  try {
    const { query, page = 1, limit = 10, city, category } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const skip = (page - 1) * parseInt(limit);
    const searchRegex = new RegExp(query, "i");

    const serviceQuery = {
      status: "published",
      $or: [{ name: searchRegex }, { description: searchRegex }],
    };
    if (city) serviceQuery.city = city;
    if (category) serviceQuery.category = category;

    const cardQuery = {
      status: "published",
      $or: [{ name: searchRegex }, { description: searchRegex }], // Updated to include name in search
    };
    if (city) cardQuery.city = city;

    const [services, cards, totalServices, totalCards] = await Promise.all([
      Service.find(serviceQuery).skip(skip).limit(parseInt(limit)),
      CardTemplate.find(cardQuery).skip(skip).limit(parseInt(limit)),
      Service.countDocuments(serviceQuery),
      CardTemplate.countDocuments(cardQuery),
    ]);

    const formattedServices = services.map(formatService);
    const formattedCards = cards.map(formatCard);
    const total = totalServices + totalCards;

    return res.status(200).json(
      formatResponse([...formattedServices, ...formattedCards], {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      })
    );
  } catch (error) {
    return handleError(res, error, "Search error");
  }
};

export const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      city, 
      budgetMin, 
      budgetMax, 
      refundPolicy 
    } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }

    const skip = (page - 1) * parseInt(limit);
    const isCardCategory = category === "Wedding Cards";

    const serviceQuery = { status: "published" };
    const cardQuery = { status: "published" };

    if (!isCardCategory) serviceQuery.category = category;
    if (city) {
      serviceQuery.city = city;
      cardQuery.city = city;
    }
    if (budgetMin || budgetMax) {
      serviceQuery["pricing_packages.price"] = {};
      if (budgetMin) serviceQuery["pricing_packages.price"].$gte = Number(budgetMin);
      if (budgetMax) serviceQuery["pricing_packages.price"].$lte = Number(budgetMax);
      cardQuery.price_per_card = {};
      if (budgetMin) cardQuery.price_per_card.$gte = Number(budgetMin);
      if (budgetMax) cardQuery.price_per_card.$lte = Number(budgetMax);
    }
    if (refundPolicy) {
      serviceQuery["details.cancellation_policy"] = refundPolicy;
    }

    let services = [];
    let cards = [];
    let totalServices = 0;
    let totalCards = 0;

    if (!isCardCategory) {
      totalServices = await Service.countDocuments(serviceQuery);
      services = await Service.find(serviceQuery)
        .skip(skip)
        .limit(parseInt(limit));
    }
    if (isCardCategory || category === "all") {
      totalCards = await CardTemplate.countDocuments(cardQuery);
      cards = await CardTemplate.find(cardQuery)
        .skip(skip)
        .limit(parseInt(limit));
    }

    const formattedServices = services.map(formatService);
    const formattedCards = cards.map(formatCard);
    const total = totalServices + totalCards;

    return res.status(200).json(
      formatResponse([...formattedServices, ...formattedCards], {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      })
    );
  } catch (error) {
    return handleError(res, error, "Services by category error");
  }
};

export const getDiscountedServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }

    const skip = (page - 1) * parseInt(limit);
    const query = { category, discount: { $gt: 0 }, status: "published" };

    const [total, services] = await Promise.all([
      Service.countDocuments(query),
      Service.find(query)
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    const formattedServices = services.map(formatService);

    return res.status(200).json(
      formatResponse(formattedServices, {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      })
    );
  } catch (error) {
    return handleError(res, error, "Discounted services by category error");
  }
};

export const getServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id)
      .populate("vendor_id", "phone vendorDetails.whatsapp_number full_name vendorDetails.brand_name")
      .lean();

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.status !== "published") {
      return res.status(403).json({ message: "Service is not published" });
    }

    const reviews = await Review.find({ service_id: id, isActive: true })
      .populate("user_id", "full_name")
      .lean();

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
        : 0;

    const vendorPhone = service.vendor_id?.vendorDetails?.whatsapp_number || service.vendor_id?.phone;

    const serviceData = {
      id: service._id,
      name: service.name,
      category: service.category,
      vendorName: service.vendor_id?.vendorDetails?.brand_name || service.vendor_id?.full_name || "Unknown Vendor",
      vendorId: service.vendor_id?._id,
      vendorPhone,
      priceRange: service.price_range,
      description: service.description,
      additionalInfo: service.additional_info || [],
      photos: service.photos || [],
      discount: service.discount || 0,
      discountExpiry: service.discount_expiry || null,
      availability: service.availability || { working_hours: "", working_days: [] },
      pricingPackages: service.pricing_packages || [],
      details: service.details || {},
      city: service.city,
      avgRating: parseFloat(avgRating),
      reviewCount: reviews.length,
      reviews: reviews.map((r) => ({
        id: r._id,
        user: r.user_id?.full_name || "Anonymous",
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      isRental: ["Car Rental", "Bridal Wear"].includes(service.category),
      location_map: service.location_map || '',
    };

    return res.status(200).json(serviceData);
  } catch (error) {
    return handleError(res, error, "Get service details error");
  }
};

export const checkServiceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, packageId, quantity = 1, startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id)
      .populate("vendor_id", "phone vendorDetails.whatsapp_number")
      .lean();

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.status !== "published") {
      return res.status(403).json({ message: "Service is not published" });
    }

    const isRental = ["Car Rental", "Bridal Wear"].includes(service.category);

    if (isRental && (!startDate || !endDate)) {
      return res.status(400).json({ message: "Start date and end date are required for rental services" });
    }

    if (!isRental && !date) {
      return res.status(400).json({ message: "Date is required for non-rental services" });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const vendorPhone = service.vendor_id?.vendorDetails?.whatsapp_number || service.vendor_id?.phone;

    if (!vendorPhone) {
      return res.status(400).json({ message: "Vendor contact not available" });
    }

    let message = `Inquiry for ${service.name}`;
    if (packageId) {
      const pkg = service.pricing_packages.find((p) => p._id.toString() === packageId);
      message += `, Package: ${pkg?.name || "Unknown"}`;
    }
    if (quantity) message += `, Quantity: ${quantity}`;
    if (isRental && startDate && endDate) {
      message += `, Rental from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    } else if (date) {
      message += `, Date: ${new Date(date).toLocaleDateString()}`;
    }

    const whatsappLink = generateWhatsAppLink(vendorPhone, message);
    return res.status(200).json({ whatsappLink });
  } catch (error) {
    return handleError(res, error, "Check availability error");
  }
};

export const getServiceFilters = async (req, res) => {
  try {
    const [categories, cities, refundPolicies] = await Promise.all([
      Service.distinct("category", { status: "published" }),
      Service.distinct("city", { status: "published" }),
      Service.distinct("details.cancellation_policy", { status: "published" }),
    ]);

    return res.status(200).json(
      formatResponse({
        categories: [...categories, "Wedding Cards"],
        cities: cities.filter((loc) => loc && loc.trim() !== ""),
        refundPolicies: refundPolicies.filter((policy) => policy),
      })
    );
  } catch (error) {
    return handleError(res, error, "Service filters error");
  }
};

export const getTrendingSearches = async (req, res) => {
  try {
    const recommendations = await getPopularRecommendations(5);

    const formattedTrending = recommendations.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
    }));

    return res.status(200).json(formatResponse(formattedTrending));
  } catch (error) {
    return handleError(res, error, "Trending searches error");
  }
};

export const getLocations = async (req, res) => {
  try {
    const cities = await Service.distinct("city", { status: "published" });
    return res.status(200).json(
      formatResponse(cities.filter((loc) => loc && loc.trim() !== ""))
    );
  } catch (error) {
    return handleError(res, error, "Get locations error");
  }
};

export const getCardsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * parseInt(limit);
    const query = { status: "published" };

    if (type && ["simple", "editable", "static", "non-editable"].includes(type)) {
      query.type = type;
    }

    const [total, cards] = await Promise.all([
      CardTemplate.countDocuments(query),
      CardTemplate.find(query)
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    const formattedCards = cards.map(formatCard);

    return res.status(200).json(
      formatResponse(formattedCards, {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      })
    );
  } catch (error) {
    return handleError(res, error, "Cards by type error");
  }
};

export const getCardDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid card ID" });
    }

    const card = await CardTemplate.findById(id)
      .populate("vendor_id", "phone vendorDetails.whatsapp_number full_name vendorDetails.brand_name")
      .lean();

    if (!card) {
      return res.status(404).json({ message: "Card template not found" });
    }

    if (card.status !== "published") {
      return res.status(403).json({ message: "Card template not published" });
    }

    const reviews = await Review.find({ card_template_id: id, isActive: true })
      .populate("user_id", "full_name")
      .lean();

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
        : 0;

    const vendorPhone = card.vendor_id?.vendorDetails?.whatsapp_number || card.vendor_id?.phone;

    const cardData = {
      id: card._id,
      name: card.name || `${card.type} Card`, // Already uses name
      vendorName: card.vendor_id?.vendorDetails?.brand_name || card.vendor_id?.full_name || "Unknown Vendor",
      vendorId: card.vendor_id?._id,
      vendorPhone,
      pricePerCard: card.price_per_card,
      quantityAvailable: card.quantity_available,
      frontImage: card.front_image || "",
      description: card.description || "",
      type: card.type,
      format: card.format || [],
      designTime: card.design_time || "",
      settings: card.settings || {},
      gallery: card.gallery || [],
      dimensions: card.dimensions || "",
      city: card.city,
      avgRating: parseFloat(avgRating),
      reviewCount: reviews.length,
      reviews: reviews.map((r) => ({
        id: r._id,
        user: r.user_id?.full_name || "Anonymous",
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };

    return res.status(200).json(cardData);
  } catch (error) {
    return handleError(res, error, "Get card details error");
  }
};

export const editCardTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching card template for editing: ID=${id}, User=${req.user?._id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`Invalid card ID format: ${id}`);
      return res.status(400).json({ message: "Invalid card ID" });
    }

    const card = await CardTemplate.findById(id).lean();
    if (!card) {
      console.error(`Card template not found: ID=${id}`);
      return res.status(404).json({ message: "Card template not found" });
    }

    if (card.status !== "published") {
      console.error(`Card template not published: ID=${id}, Status=${card.status}`);
      return res.status(403).json({ message: "Card template is not published" });
    }

    if (card.type !== "editable") {
      console.error(`Card is not editable: ID=${id}, Type=${card.type}`);
      return res.status(400).json({ message: "Only editable card templates can be edited" });
    }

    let settings = card.settings;
    if (typeof settings === "string") {
      try {
        settings = JSON.parse(settings);
        console.log(`Parsed card settings: ID=${id}`);
      } catch (error) {
        console.error(`Error parsing card settings: ID=${id}, Error=${error.message}`);
        return res.status(400).json({ message: "Invalid card settings format" });
      }
    }

    if (!settings.canvasJSON) {
      console.error(`Card settings missing canvasJSON: ID=${id}`);
      return res.status(400).json({ message: "Card settings missing canvasJSON" });
    }

    console.log(`Successfully fetched editable card template: ID=${id}`);
    return res.status(200).json(
      formatResponse({
        id: card._id,
        type: card.type,
        frontImage: card.front_image,
        settings: {
          ...settings,
          width: settings.width || 800,
          height: settings.height || 600,
        },
      })
    );
  } catch (error) {
    console.error(`Edit card template error: ID=${req.params.id}, Error=${error.message}`);
    return handleError(res, error, "Edit card template error");
  }
};

export const submitContactInquiry = async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    // Validate fields
    if (!name || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate name (letters, spaces, hyphens only, min 2 characters)
    const nameRegex = /^[a-zA-Z\s-]{2,}$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({ message: "Name must be at least 2 characters and contain only letters, spaces, or hyphens" });
    }

    // Normalize and validate phone number
    const normalizedPhone = phone.replace(/\s/g, "").replace(/^0/, "+92");
    const phoneRegex = /^\+92[0-9]{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ message: "Invalid phone number format. Use +923xxxxxxxxx" });
    }

    // Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      return res.status(400).json({ message: "Message must be at least 10 characters long" });
    }
    if (trimmedMessage.length > 500) {
      return res.status(400).json({ message: "Message cannot exceed 500 characters" });
    }

    // Check rate limit (1 message per phone number per week)
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const lastMessage = await ContactMessage.findOne({
      phone: normalizedPhone,
      submittedAt: { $gte: new Date(Date.now() - ONE_WEEK_MS) },
    });

    if (lastMessage) {
      return res.status(429).json({ 
        message: "You have already submitted a message. Please wait 7 days before submitting another." 
      });
    }

    // Save contact message
    const contactMessage = new ContactMessage({
      name: name.trim(),
      phone: normalizedPhone,
      message: trimmedMessage,
    });
    await contactMessage.save();

    // Send OTP (simulating message delivery to admin)
    await sendOTP(normalizedPhone, `Contact Inquiry from ${name.trim()}: ${trimmedMessage}`);

    return res.status(200).json({ message: "Inquiry submitted successfully" });
  } catch (error) {
    return handleError(res, error, "Contact inquiry error");
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit) || 10;

    let recommendations;
    if (userId) {
      recommendations = await getPersonalizedRecommendations(userId, limit);
    } else {
      recommendations = await getPopularRecommendations(limit);
    }

    const formattedRecommendations = recommendations.map((item) => ({
      id: item.id,
      title: item.name,
      category: item.category,
      image: item.image || "",
      type: item.type,
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      city: item.city || "",
    }));

    return res.status(200).json(formatResponse(formattedRecommendations));
  } catch (error) {
    return handleError(res, error, "Recommendations error");
  }
};

export const chatbotQuery = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API key not configured" });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a wedding planning assistant. Provide a concise and helpful response to the following user query related to wedding planning: "${query}"`
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      return res.status(500).json({ message: "No response from AI model" });
    }

    return res.status(200).json({ response: generatedText });
  } catch (error) {
    console.error("Chatbot API error:", error.response?.data || error.message);
    return handleError(res, error, "Chatbot error");
  }
};

export const checkCardAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid card ID" });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const card = await CardTemplate.findById(id)
      .populate("vendor_id", "phone vendorDetails.whatsapp_number")
      .lean();

    if (!card) {
      return res.status(404).json({ message: "Card template not found" });
    }

    if (card.status !== "published") {
      return res.status(403).json({ message: "Card template is not published" });
    }

    if (card.quantity_available < quantity) {
      return res.status(400).json({ message: "Insufficient quantity available" });
    }

    const vendorPhone = card.vendor_id?.vendorDetails?.whatsapp_number || card.vendor_id?.phone;

    if (!vendorPhone) {
      return res.status(400).json({ message: "Vendor contact not available" });
    }

    const message = `Inquiry for ${card.name || `${card.type} Card`}, Quantity: ${quantity}, Delivery Date: ${new Date(date).toLocaleDateString()}`; // Changed to use name

    const whatsappLink = generateWhatsAppLink(vendorPhone, message);
    return res.status(200).json({ whatsappLink });
  } catch (error) {
    return handleError(res, error, "Check card availability error");
  }
};