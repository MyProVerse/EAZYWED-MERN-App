// recommendationEngine.js
import mongoose from "mongoose";
import Service from "../models/Service.js";
import CardTemplate from "../models/CardTemplate.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

// Helper function to normalize scores (0–100)
const normalizeScore = (value, min, max) => {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
};

// Helper function to get user preferences based on bookings and reviews
const getUserPreferences = async (userId) => {
  try {
    const bookings = await Booking.find({ user_id: userId }).select("service_id card_template_id");
    const reviews = await Review.find({ user_id: userId }).select("service_id card_template_id");

    const categories = new Set();
    const cardTypes = new Set();

    for (const booking of bookings) {
      if (booking.service_id) {
        const service = await Service.findById(booking.service_id).select("category");
        if (service) categories.add(service.category);
      }
      if (booking.card_template_id) {
        const card = await CardTemplate.findById(booking.card_template_id).select("type");
        if (card) cardTypes.add(card.type);
      }
    }

    for (const review of reviews) {
      if (review.service_id) {
        const service = await Service.findById(review.service_id).select("category");
        if (service) categories.add(service.category);
      }
      if (review.card_template_id) {
        const card = await CardTemplate.findById(review.card_template_id).select("type");
        if (card) cardTypes.add(card.type);
      }
    }

    return { categories: [...categories], cardTypes: [...cardTypes] };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return { categories: [], cardTypes: [] };
  }
};

// Helper function to calculate item score
const calculateItemScore = (item, preferences, maxMetrics) => {
  const { maxRating, maxReviews, maxBookings } = maxMetrics;

  // Rating score (40% weight)
  const ratingScore = item.avg_rating ? normalizeScore(item.avg_rating, 0, maxRating) * 0.4 : 0;

  // Review/engagement score (20% weight)
  const reviewScore = item.review_count
    ? normalizeScore(item.review_count, 0, maxReviews) * 0.2
    : 0;

  // Booking/popularity score (20% weight)
  const bookingScore = item.booking_count
    ? normalizeScore(item.booking_count, 0, maxBookings) * 0.2
    : 0;

  // Recency score (10% weight, within 30 days)
  const daysSinceCreation = item.createdAt
    ? Math.floor((Date.now() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24))
    : 30;
  const recencyScore = normalizeScore(30 - Math.min(30, daysSinceCreation), 0, 30) * 0.1;

  // Content similarity score (10% weight)
  let similarityScore = 0;
  if (preferences) {
    if (item.category && preferences.categories.includes(item.category)) {
      similarityScore = 50;
    } else if (item.type && preferences.cardTypes.includes(item.type)) {
      similarityScore = 50;
    }
  }

  return ratingScore + reviewScore + bookingScore + recencyScore + (similarityScore * 0.1);
};

// Get personalized recommendations
export const getPersonalizedRecommendations = async (userId, limit = 10) => {
  try {
    const preferences = userId ? await getUserPreferences(userId) : null;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch services with booking counts
    const services = await Service.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "service_id",
          pipeline: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "bookings",
        },
      },
      {
        $addFields: {
          booking_count: { $arrayElemAt: ["$bookings.count", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          avg_rating: 1,
          review_count: 1,
          createdAt: 1,
          booking_count: { $ifNull: ["$booking_count", 0] },
          photos: 1,
          price_range: 1,
          city: 1,
          vendor_name: {
            $ifNull: ["$vendor.vendorDetails.brand_name", "$vendor.full_name", "Unknown"],
          },
        },
      },
    ]);

    // Fetch card templates with booking counts
    const cards = await CardTemplate.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "card_template_id",
          pipeline: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "bookings",
        },
      },
      {
        $addFields: {
          booking_count: { $arrayElemAt: ["$bookings.count", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $concat: ["$type", " Card Template"] },
          type: 1,
          avg_rating: 1,
          review_count: 1,
          createdAt: 1,
          booking_count: { $ifNull: ["$booking_count", 0] },
          front_image: 1,
          price_per_card: 1,
          city: 1,
          vendor_name: {
            $ifNull: ["$vendor.vendorDetails.brand_name", "$vendor.full_name", "Unknown"],
          },
        },
      },
    ]);

    // Calculate max metrics for normalization
    const maxRating = 5;
    const maxReviews = Math.max(
      ...services.map((s) => s.review_count || 0),
      ...cards.map((c) => c.review_count || 0),
      1
    );
    const maxBookings = Math.max(
      ...services.map((s) => s.booking_count || 0),
      ...cards.map((c) => c.booking_count || 0),
      1
    );

    // Combine items
    const items = [
      ...services.map((s) => ({ ...s, item_type: "service" })),
      ...cards.map((c) => ({ ...c, item_type: "card" })),
    ];

    // Score and sort items
    const scoredItems = items.map((item) => ({
      ...item,
      score: calculateItemScore(item, preferences, { maxRating, maxReviews, maxBookings }),
    }));

    scoredItems.sort((a, b) => b.score - a.score);
    const topItems = scoredItems.slice(0, limit);

    // Format for slider
    return topItems.map((item) => ({
      id: item._id,
      name: item.name,
      title: item.name, // Added for consistency
      type: item.item_type,
      category: item.category || item.type,
      vendor_name: item.vendor_name,
      price: item.price_range || item.price_per_card || 0,
      rating: item.avg_rating || 0,
      image: item.photos?.[0] || item.front_image || "",
      city: item.city || "",
    }));
  } catch (error) {
    console.error("Personalized recommendations error:", error);
    throw new Error("Failed to fetch personalized recommendations");
  }
};

// Get popular recommendations
export const getPopularRecommendations = async (limit = 10) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch services
    const services = await Service.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "service_id",
          pipeline: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "bookings",
        },
      },
      {
        $addFields: {
          booking_count: { $arrayElemAt: ["$bookings.count", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          avg_rating: 1,
          review_count: 1,
          createdAt: 1,
          booking_count: { $ifNull: ["$booking_count", 0] },
          photos: 1,
          price_range: 1,
          city: 1,
          vendor_name: {
            $ifNull: ["$vendor.vendorDetails.brand_name", "$vendor.full_name", "Unknown"],
          },
        },
      },
    ]);

    // Fetch cards
    const cards = await CardTemplate.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "card_template_id",
          pipeline: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "bookings",
        },
      },
      {
        $addFields: {
          booking_count: { $arrayElemAt: ["$bookings.count", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $concat: ["$type", " Card Template"] },
          type: 1,
          avg_rating: 1,
          review_count: 1,
          createdAt: 1,
          booking_count: { $ifNull: ["$booking_count", 0] },
          front_image: 1,
          price_per_card: 1,
          city: 1,
          vendor_name: {
            $ifNull: ["$vendor.vendorDetails.brand_name", "$vendor.full_name", "Unknown"],
          },
        },
      },
    ]);

    // Calculate max metrics
    const maxRating = 5;
    const maxReviews = Math.max(
      ...services.map((s) => s.review_count || 0),
      ...cards.map((c) => c.review_count || 0),
      1
    );
    const maxBookings = Math.max(
      ...services.map((s) => s.booking_count || 0),
      ...cards.map((c) => c.booking_count || 0),
      1
    );

    // Combine items
    const items = [
      ...services.map((s) => ({ ...s, item_type: "service" })),
      ...cards.map((c) => ({ ...c, item_type: "card" })),
    ];

    // Score and sort items
    const scoredItems = items.map((item) => ({
      ...item,
      score: calculateItemScore(item, null, { maxRating, maxReviews, maxBookings }),
    }));

    scoredItems.sort((a, b) => b.score - a.score);
    const topItems = scoredItems.slice(0, limit);

    // Format for slider
    return topItems.map((item) => ({
      id: item._id,
      name: item.name,
      title: item.name, // Added for consistency
      type: item.item_type,
      category: item.category || item.type,
      vendor_name: item.vendor_name,
      price: item.price_range || item.price_per_card || 0,
      rating: item.avg_rating || 0,
      image: item.photos?.[0] || item.front_image || "",
      city: item.city || "",
    }));
  } catch (error) {
    console.error("Popular recommendations error:", error);
    throw new Error("Failed to fetch popular recommendations");
  }
};