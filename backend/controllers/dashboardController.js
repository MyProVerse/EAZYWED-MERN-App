import User from "../models/User.js";
import Service from "../models/Service.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import CardTemplate from "../models/CardTemplate.js";
import BlockedUsers from "../models/BlockedUsers.js";
import { sendOTP } from "../utils/twilio.js";
import Estimation from "../models/Estimation.js";
import mongoose from "mongoose";
import { generateWhatsAppLink } from "../utils/whatsapp.js"; // Import utility

// Admin Dashboard Stats
export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalServices = await Service.countDocuments();
    const publishedServices = await Service.countDocuments({ status: "published" });
    const pendingServices = await Service.countDocuments({ status: "pending" });

    const totalCards = await CardTemplate.countDocuments();
    const publishedCards = await CardTemplate.countDocuments({ status: "published" });
    const pendingCards = await CardTemplate.countDocuments({ status: "pending" });

    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });

    const totalUsers = await User.countDocuments({ role: "user" });
    const totalVendors = await User.countDocuments({ role: "vendor" });

    const pendingVendorRequests = await User.countDocuments({ "vendorRequest.status": "pending" });
    const totalEstimations = await Estimation.countDocuments();

    const pendingActions = pendingServices + pendingCards + pendingVendorRequests;

    res.status(200).json({
      totalServices,
      publishedServices,
      pendingServices,
      totalCards,
      publishedCards,
      pendingCards,
      totalBookings,
      confirmedBookings,
      totalUsers,
      totalVendors,
      pendingVendorRequests,
      totalEstimations,
      pendingActions,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Services List
export const getAdminServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalServices = await Service.countDocuments();
    const services = await Service.find()
      .populate("vendor_id", "username full_name vendorDetails.brand_name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedServices = services.map((service) => ({
      service_id: service._id,
      name: service.name,
      vendor_id: service.vendor_id._id,
      vendor_name: service.vendor_id.vendorDetails?.brand_name || service.vendor_id.full_name,
      price_range: service.price_range,
      status: service.status,
      category: service.category,
      created_at: service.createdAt,
    }));

    const totalPages = Math.ceil(totalServices / limit);

    res.status(200).json({
      data: formattedServices,
      pagination: { total: totalServices, page, pages: totalPages },
    });
  } catch (error) {
    console.error("Admin services error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Cards List
export const getAdminCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalCards = await CardTemplate.countDocuments();
    const cards = await CardTemplate.find()
      .populate("vendor_id", "username full_name vendorDetails.brand_name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedCards = cards.map((card) => ({
      card_id: card._id,
      name: card.name || `${card.type} Card Template`, // Use name field
      vendor_id: card.vendor_id._id,
      vendor_name: card.vendor_id.vendorDetails?.brand_name || card.vendor_id.full_name,
      price: card.price_per_card,
      status: card.status,
      created_at: card.createdAt,
    }));

    const totalPages = Math.ceil(totalCards / limit);

    res.status(200).json({
      data: formattedCards,
      pagination: { total: totalCards, page, pages: totalPages },
    });
  } catch (error) {
    console.error("Admin cards error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Bookings List
export const getAdminBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalBookings = await Booking.countDocuments();
    const bookings = await Booking.find()
      .populate("user_id", "username full_name")
      .populate("vendor_id", "username full_name vendorDetails.brand_name")
      .populate("service_id", "name")
      .populate("card_template_id", "name type")
      .sort({ date_time: -1 })
      .skip(skip)
      .limit(limit);

    const formattedBookings = bookings.map((booking) => ({
      booking_id: booking._id,
      service_id: booking.service_id?._id || booking.card_template_id?._id,
      name: booking.service_id?.name || booking.card_template_id?.name || `${booking.card_template_id?.type} Card`, // Use name field
      user_id: booking.user_id._id,
      user_name: booking.user_id.full_name,
      vendor_id: booking.vendor_id._id,
      vendor_name: booking.vendor_id.vendorDetails?.brand_name || booking.vendor_id.full_name,
      date: booking.date_time,
      status: booking.status,
      price: booking.price,
    }));

    const totalPages = Math.ceil(totalBookings / limit);

    res.status(200).json({
      data: formattedBookings,
      pagination: { total: totalBookings, page, pages: totalPages },
    });
  } catch (error) {
    console.error("Admin bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Reviews List
export const getAdminReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalReviews = await Review.countDocuments({ isActive: true });
    const reviews = await Review.find({ isActive: true })
      .populate("user_id", "username full_name")
      .populate("service_id", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedReviews = reviews.map((review) => ({
      review_id: review._id,
      service_id: review.service_id?._id || review.card_template_id?._id,
      name: review.service_id?.name || "Wedding Card",
      user_id: review.user_id._id,
      user_name: review.user_id.full_name,
      rating: review.stars,
      comment: review.comment,
      created_at: review.createdAt,
    }));

    const totalPages = Math.ceil(totalReviews / limit);

    res.status(200).json({
      data: formattedReviews,
      pagination: { total: totalReviews, page, pages: totalPages },
    });
  } catch (error) {
    console.error("Admin reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Users List
export const getAdminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const blockedUsers = await BlockedUsers.find();
    const blockedUserIds = blockedUsers.map((user) => user.userId?.toString());

    const formattedUsers = users.map((user) => ({
      user_id: user._id,
      name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: blockedUserIds.includes(user._id.toString()) ? "Blocked" : "Active",
      created_at: user.createdAt,
    }));

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      data: formattedUsers,
      pagination: { total: totalUsers, page, pages: totalPages },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Vendor Requests List
export const getAdminVendorRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalVendorRequests = await User.countDocuments({ "vendorRequest.status": "pending" });
    const vendorRequests = await User.find({ "vendorRequest.status": "pending" })
      .sort({ "vendorRequest.submittedAt": -1 })
      .skip(skip)
      .limit(limit);

    const formattedRequests = vendorRequests.map((user) => ({
      vendor_id: user._id,
      name: user.full_name,
      phone: user.phone,
      category: user.vendorRequest.category,
      email: user.vendorRequest.email,
      brand_icon: user.vendorRequest.brand_icon,
      submitted_at: user.vendorRequest.submittedAt,
    }));

    const totalPages = Math.ceil(totalVendorRequests / limit);

    res.status(200).json({
      data: formattedRequests,
      pagination: { total: totalVendorRequests, page, pages: totalPages },
    });
  } catch (error) {
    console.error("Admin vendor requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve Service
export const approveService = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    service.status = "published";
    await service.save();

    const vendor = await User.findById(service.vendor_id);
    if (vendor) {
      await sendOTP(vendor.phone, `Your service "${service.name}" has been approved and is now published.`);
    }

    res.status(200).json({ message: "Service approved successfully" });
  } catch (error) {
    console.error("Approve service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject Service
export const rejectService = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const vendorId = service.vendor_id;
    await Service.findByIdAndDelete(serviceId);

    const vendor = await User.findById(vendorId);
    if (vendor) {
      await sendOTP(
        vendor.phone,
        `Your service "${service.name}" has been rejected. Please review our guidelines and try again.`
      );
    }

    res.status(200).json({ message: "Service rejected successfully" });
  } catch (error) {
    console.error("Reject service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve Card
export const approveCard = async (req, res) => {
  const { cardId } = req.params;

  try {
    const card = await CardTemplate.findById(cardId);
    if (!card) return res.status(404).json({ message: "Card template not found" });

    card.status = "published";
    await card.save();

    const vendor = await User.findById(card.vendor_id);
    if (vendor) {
      await sendOTP(vendor.phone, `Your wedding card template has been approved and is now published.`);
    }

    res.status(200).json({ message: "Card template approved successfully" });
  } catch (error) {
    console.error("Approve card error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject Card
export const rejectCard = async (req, res) => {
  const { cardId } = req.params;

  try {
    const card = await CardTemplate.findById(cardId);
    if (!card) return res.status(404).json({ message: "Card template not found" });

    const vendorId = card.vendor_id;
    await CardTemplate.findByIdAndDelete(cardId);

    const vendor = await User.findById(vendorId);
    if (vendor) {
      await sendOTP(
        vendor.phone,
        `Your wedding card template has been rejected. Please review our guidelines and try again.`
      );
    }

    res.status(200).json({ message: "Card template rejected successfully" });
  } catch (error) {
    console.error("Reject card error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel Booking (Admin)
export const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Booking not found" });
      }

      // Restore resources
      if (booking.service_id) {
        const service = await Service.findById(booking.service_id).session(session);
        if (service) {
          if (service.booking_type === "quantity-based") {
            service.quantity_available += booking.quantity || 1;
            await service.save({ session });
          } else if (service.booking_type === "event-based" && booking.date_time) {
            const slot = service.availability_slots.find(
              (s) =>
                new Date(s.date).toISOString().split("T")[0] ===
                new Date(booking.date_time).toISOString().split("T")[0]
            );
            if (slot) {
              slot.is_booked = false;
              slot.reserved_by = null;
              slot.reservation_expiry = null;
              await service.save({ session });
            }
          }
        }
      } else if (booking.card_template_id) {
        const card = await CardTemplate.findById(booking.card_template_id).session(session);
        if (card) {
          card.quantity_available += booking.quantity || 1;
          await card.save({ session });
        }
      }

      booking.status = "canceled";
      await booking.save({ session });

      const user = await User.findById(booking.user_id);
      const vendor = await User.findById(booking.vendor_id);

      if (user) await sendOTP(user.phone, `Your booking has been canceled by the admin.`);
      if (vendor) await sendOTP(vendor.phone, `A booking has been canceled by the admin.`);

      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ message: "Booking canceled successfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.isActive = false;
    await review.save();

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle User Block
export const toggleUserBlock = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const blockedUser = await BlockedUsers.findOne({ userId });

    if (blockedUser) {
      await BlockedUsers.findByIdAndDelete(blockedUser._id);
      res.status(200).json({ message: "User unblocked successfully" });
    } else {
      await BlockedUsers.create({ userId, phone: user.phone, reason: "Blocked by admin" });
      res.status(200).json({ message: "User blocked successfully" });
    }
  } catch (error) {
    console.error("Toggle user block error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Dashboard Stats
export const getUserDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const estimations = await Estimation.find({ userId }).countDocuments();
    const totalEstimationCost = await Estimation.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } },
    ]);

    const bookings = await Booking.find({ user_id: userId });
    const pendingBookings = bookings.filter((b) => b.status === "pending").length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
    const completedBookings = bookings.filter((b) => b.status === "completed" && b.completed_at).length;

    const now = new Date();
    const upcomingEvents = bookings.filter(
      (b) => b.status === "confirmed" && b.event_date && new Date(b.event_date) > now
    ).length;

    const reviews = await Review.find({ user_id: userId });
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1) : 0;

    res.status(200).json({
      estimations,
      totalEstimationCost: totalEstimationCost[0]?.total || 0,
      bookings: bookings.length,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      upcomingEvents,
      reviews: reviews.length,
      avgRating: parseFloat(avgRating),
    });
  } catch (error) {
    console.error("User dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Estimations List
export const getUserEstimations = async (req, res) => {
  const userId = req.user.id;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalEstimations = await Estimation.countDocuments({ userId });
    const estimations = await Estimation.find({ userId })
      .populate({
        path: "services.serviceId",
        select: "name price_range pricing_packages",
      })
      .populate({
        path: "cards.cardId",
        select: "type price_per_card",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedEstimations = estimations.map((est) => ({
      estimation_id: est._id,
      services: est.services.map((service) => {
        const serviceData = service.serviceId;
        const selectedPackage = serviceData?.pricing_packages.find(
          (pkg) => pkg._id.toString() === service.packageId.toString()
        );
        return {
          service_id: serviceData?._id,
          name: serviceData?.name || "Unknown Service",
          price_range: serviceData?.price_range || "N/A",
          package_id: service.packageId,
          package_name: selectedPackage?.name || "N/A",
          package_price: selectedPackage?.price || 0,
          quantity: service.quantity,
        };
      }),
      cards: est.cards.map((card) => ({
        card_id: card.cardId?._id,
        name: card.cardId ? `${card.cardId.type} Card Template` : "Unknown Card",
        price_per_card: card.cardId?.price_per_card || 0,
        quantity: card.quantity,
      })),
      total_cost: est.totalCost,
      status: est.status,
      created_at: est.createdAt,
    }));

    const totalPages = Math.ceil(totalEstimations / limit);

    res.status(200).json({
      data: formattedEstimations,
      pagination: { total: totalEstimations, page, pages: totalPages },
    });
  } catch (error) {
    console.error("User estimations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Bookings List
export const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalBookings = await Booking.countDocuments({ user_id: userId });
    const bookings = await Booking.find({ user_id: userId })
      .populate("service_id", "name")
      .populate("card_template_id")
      .populate("vendor_id", "phone vendorDetails.whatsapp_number")
      .sort({ date_time: -1 })
      .skip(skip)
      .limit(limit);

    const formattedBookings = bookings.map((booking) => ({
      booking_id: booking._id,
      service_id: booking.service_id?._id || booking.card_template_id?._id,
      name: booking.service_id?.name || "Wedding Card",
      status: booking.status,
      date: booking.date_time,
      vendor_id: booking.vendor_id._id,
      vendor_phone: booking.vendor_id.vendorDetails?.whatsapp_number || booking.vendor_id.phone,
      price: booking.price,
      completed_at: booking.completed_at,
    }));

    const totalPages = Math.ceil(totalBookings / limit);

    res.status(200).json({
      data: formattedBookings,
      pagination: { total: totalBookings, page, pages: totalPages },
    });
  } catch (error) {
    console.error("User bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Reviews List
export const getUserReviews = async (req, res) => {
  const userId = req.user.id;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalCompletedBookings = await Booking.countDocuments({ user_id: userId, status: "completed" });
    const completedBookings = await Booking.find({ user_id: userId, status: "completed" })
      .populate("service_id", "name")
      .populate("card_template_id")
      .sort({ completed_at: -1 })
      .skip(skip)
      .limit(limit);

    const bookingIds = completedBookings.map((booking) => booking._id);
    const reviews = await Review.find({ user_id: userId, booking_id: { $in: bookingIds } });

    const formattedData = completedBookings.map((booking) => {
      const review = reviews.find((r) => r.booking_id.toString() === booking._id.toString());
      const serviceName = booking.service_id?.name || "Wedding Card";
      return {
        booking_id: booking._id,
        service_id: booking.service_id?._id || booking.card_template_id?._id,
        name: serviceName,
        date: booking.date_time,
        completed_at: booking.completed_at,
        event_date: booking.event_date,
        review: review
          ? { review_id: review._id, rating: review.stars, comment: review.comment, created_at: review.createdAt }
          : null,
      };
    });

    const totalPages = Math.ceil(totalCompletedBookings / limit);

    res.status(200).json({
      data: formattedData,
      pagination: { total: totalCompletedBookings, page, pages: totalPages },
    });
  } catch (error) {
    console.error("User reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit Review
export const submitReview = async (req, res) => {
  const userId = req.user.id;
  const { bookingId, rating, comment } = req.body;

  try {
    if (!bookingId || !rating) {
      return res.status(400).json({ message: "Booking ID and rating are required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user_id: userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }

    if (booking.status !== "completed" || !booking.reviewAllowed) {
      return res.status(400).json({ message: "You can only review completed bookings with review allowed" });
    }

    const existingReview = await Review.findOne({ booking_id: bookingId, user_id: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this booking" });
    }

    const serviceId = booking.service_id;
    const cardId = booking.card_template_id;

    const newReview = new Review({
      user_id: userId,
      booking_id: bookingId,
      service_id: serviceId || null,
      card_template_id: cardId || null,
      stars: rating,
      comment: comment || "",
    });

    await newReview.save();

    // Update avg_rating and review_count
    if (serviceId) {
      const serviceReviews = await Review.find({ service_id: serviceId, isActive: true });
      const totalStars = serviceReviews.reduce((sum, review) => sum + review.stars, 0);
      const avgRating = totalStars / serviceReviews.length;
      await Service.findByIdAndUpdate(serviceId, {
        avg_rating: avgRating,
        review_count: serviceReviews.length,
      });
    } else if (cardId) {
      const cardReviews = await Review.find({ card_template_id: cardId, isActive: true });
      const totalStars = cardReviews.reduce((sum, review) => sum + review.stars, 0);
      const avgRating = totalStars / cardReviews.length;
      await CardTemplate.findByIdAndUpdate(cardId, {
        avg_rating: avgRating,
        review_count: cardReviews.length,
      });
    }

    res.status(201).json({
      message: "Review submitted successfully",
      review: {
        review_id: newReview._id,
        rating: newReview.stars,
        comment: newReview.comment,
        created_at: newReview.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel User Booking
export const cancelUserBooking = async (req, res) => {
  const userId = req.user.id;
  const { bookingId } = req.params;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findOne({ _id: bookingId, user_id: userId, status: "pending" }).session(session);
      if (!booking) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Pending booking not found or not authorized" });
      }

      // Restore resources
      if (booking.service_id) {
        const service = await Service.findById(booking.service_id).session(session);
        if (service) {
          if (service.booking_type === "quantity-based") {
            service.quantity_available += booking.quantity || 1;
            await service.save({ session });
          } else if (service.booking_type === "event-based" && booking.date_time) {
            const slot = service.availability_slots.find(
              (s) =>
                new Date(s.date).toISOString().split("T")[0] ===
                new Date(booking.date_time).toISOString().split("T")[0]
            );
            if (slot) {
              slot.is_booked = false;
              slot.reserved_by = null;
              slot.reservation_expiry = null;
              await service.save({ session });
            }
          }
        }
      } else if (booking.card_template_id) {
        const card = await CardTemplate.findById(booking.card_template_id).session(session);
        if (card) {
          card.quantity_available += booking.quantity || 1;
          await card.save({ session });
        }
      }

      booking.status = "canceled";
      await booking.save({ session });

      const vendor = await User.findById(booking.vendor_id);
      if (vendor) {
        await sendOTP(vendor.phone, `A booking has been canceled by the user.`);
      }

      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ message: "Booking canceled successfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Cancel user booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Service Details
export const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId)
      .populate("vendor_id", "username full_name vendorDetails.brand_name")
      .lean();

    if (!service) return res.status(404).json({ message: "Service not found" });

    const serviceData = {
      service_id: service._id,
      name: service.name,
      category: service.category,
      vendor_name: service.vendor_id.vendorDetails?.brand_name || service.vendor_id.full_name,
      vendor_id: service.vendor_id._id,
      price_range: service.price_range,
      description: service.description,
      additional_info: service.additional_info || "",
      photos: service.photos || [],
      status: service.status,
      created_at: service.createdAt,
      address: service.address || "",
      location_map: service.location_map || "",
      discount: service.discount || 0,
      discount_expiry: service.discount_expiry || null,
      availability: service.availability || { working_hours: "", working_days: [] },
      pricing_packages: service.pricing_packages || [],
      details: service.details || {},
    };

    res.status(200).json(serviceData);
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Card Details
export const getCardById = async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await CardTemplate.findById(cardId)
      .populate("vendor_id", "username full_name vendorDetails.brand_name")
      .lean();

    if (!card) return res.status(404).json({ message: "Card template not found" });

    const cardData = {
      card_id: card._id,
      name: card.name || `${card.type} Card Template`, // Use name field
      vendor_name: card.vendor_id.vendorDetails?.brand_name || card.vendor_id.full_name,
      vendor_id: card.vendor_id._id,
      price_per_card: card.price_per_card,
      quantity_available: card.quantity_available,
      front_image: card.front_image || "",
      description: card.description || "",
      type: card.type,
      format: card.format || [],
      design_time: card.design_time || "",
      settings: card.settings || {},
      status: card.status,
      created_at: card.createdAt,
      gallery: card.gallery || [],
      dimensions: card.dimensions || "",
    };

    res.status(200).json(cardData);
  } catch (error) {
    console.error("Error fetching card details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Get Vendor Request Details
export const getVendorRequestById = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const user = await User.findById(vendorId).select("username full_name phone vendorRequest").lean();

    if (!user || !user.vendorRequest) return res.status(404).json({ message: "Vendor request not found" });

    const vendorData = {
      vendor_id: user._id,
      name: user.full_name || user.username,
      phone: user.phone || "N/A",
      email: user.vendorRequest.email || "N/A",
      category: user.vendorRequest.category || "N/A",
      brand_name: user.vendorRequest.brand_name || user.full_name || "N/A",
      brand_icon: user.vendorRequest.brand_icon || "",
      office_address: user.vendorRequest.office_address || "N/A",
      years_in_business: user.vendorRequest.years_in_business || "N/A",
      website_link: user.vendorRequest.website_link || "N/A",
      map_link: user.vendorRequest.map_link || "N/A",
      description: user.vendorRequest.description || "N/A",
      experience: user.vendorRequest.experience || "N/A",
      documents: user.vendorRequest.verification_documents || [],
      instagram_link: user.vendorRequest.instagram_link || "N/A",
      facebook_link: user.vendorRequest.facebook_link || "N/A",
      booking_email: user.vendorRequest.booking_email || "N/A",
      phone_whatsapp: user.vendorRequest.phone_whatsapp || user.vendorRequest.whatsapp_number || "N/A",
      submittedAt: user.vendorRequest.submittedAt,
      status: user.vendorRequest.status || "pending",
    };

    res.status(200).json(vendorData);
  } catch (error) {
    console.error("Error fetching vendor request details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Revert Service to Pending
export const revertServiceToPending = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (service.status !== "published") {
      return res.status(400).json({ message: "Only published services can be reverted to pending" });
    }

    service.status = "pending";
    await service.save();

    const vendor = await User.findById(service.vendor_id);
    if (vendor) {
      await sendOTP(vendor.phone, `Your service "${service.name}" has been reverted to pending status for review.`);
    }

    res.status(200).json({ message: "Service successfully reverted to pending status" });
  } catch (error) {
    console.error("Revert service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Revert Card to Pending
export const revertCardToPending = async (req, res) => {
  const { cardId } = req.params;

  try {
    const card = await CardTemplate.findById(cardId);
    if (!card) return res.status(404).json({ message: "Card template not found" });

    if (card.status !== "published") {
      return res.status(400).json({ message: "Only published cards can be reverted to pending" });
    }

    card.status = "pending";
    await card.save();

    const vendor = await User.findById(card.vendor_id);
    if (vendor) {
      await sendOTP(vendor.phone, `Your card template has been reverted to pending status for review.`);
    }

    res.status(200).json({ message: "Card successfully reverted to pending status" });
  } catch (error) {
    console.error("Revert card error:", error);
    res.status(500).json({ message: "Server error" });
  }
};















export const createEstimation = async (req, res) => {
  // Create or update an estimation for services and/or cards
  const userId = req.user.id;
  const { services = [], cards = [], date_time } = req.body;

  try {
    // Validate input
    if (!services.length && !cards.length) {
      return res.status(400).json({
        message: "At least one service or card is required to create an estimation",
      });
    }

    // Check for existing active estimation
    let estimation = await Estimation.findOne({ userId, status: "active" });

    if (estimation) {
      // Update existing estimation
      services.forEach((newService) => {
        const existingService = estimation.services.find(
          (s) =>
            s.serviceId.toString() === newService.serviceId &&
            s.packageId.toString() === newService.packageId
        );
        if (existingService) {
          existingService.quantity = newService.quantity || 1;
        } else {
          estimation.services.push({
            serviceId: newService.serviceId,
            packageId: newService.packageId,
            quantity: newService.quantity || 1,
          });
        }
      });

      cards.forEach((newCard) => {
        const existingCard = estimation.cards.find(
          (c) => c.cardId.toString() === newCard.cardId
        );
        if (existingCard) {
          existingCard.quantity = newCard.quantity || 1;
        } else {
          estimation.cards.push({
            cardId: newCard.cardId,
            quantity: newCard.quantity || 1,
          });
        }
      });

      // Remove items with zero quantity
      estimation.services = estimation.services.filter((s) => s.quantity > 0);
      estimation.cards = estimation.cards.filter((c) => c.quantity > 0);

      await estimation.save();
    } else {
      // Create new estimation
      estimation = new Estimation({
        userId,
        services: services.map((s) => ({
          serviceId: s.serviceId,
          packageId: s.packageId,
          quantity: s.quantity || 1,
        })),
        cards: cards.map((c) => ({
          cardId: c.cardId,
          quantity: c.quantity || 1,
        })),
        status: "active",
      });

      await estimation.save();
    }

    // Return estimation details
    res.status(201).json({
      message: estimation.isNew ? "Estimation created successfully" : "Estimation updated successfully",
      estimation: {
        estimation_id: estimation._id,
        services: estimation.services,
        cards: estimation.cards,
        total_cost: estimation.totalCost,
        status: estimation.status,
        created_at: estimation.createdAt,
      },
    });
  } catch (error) {
    console.error("Create estimation error:", error);
    res.status(500).json({
      message: "Failed to create estimation",
      error: error.message || "An unexpected error occurred",
    });
  }
};



// Remove an estimation or specific items
export const removeEstimation = async (req, res) => {
  const userId = req.user.id;
  const { estimationId, serviceId, cardId } = req.params;

  try {
    // Validate estimation
    const estimation = await Estimation.findOne({ _id: estimationId, userId });
    if (!estimation) {
      return res.status(404).json({
        message: "Estimation not found or not authorized",
      });
    }

    // Handle specific item deletion
    if (serviceId || cardId) {
      if (serviceId) {
        estimation.services = estimation.services.filter(
          (s) => s.serviceId.toString() !== serviceId
        );
      }
      if (cardId) {
        estimation.cards = estimation.cards.filter(
          (c) => c.cardId.toString() !== cardId
        );
      }

      // Update total cost
      let totalCost = 0;
      for (const service of estimation.services) {
        const serviceData = await Service.findById(service.serviceId);
        if (serviceData) {
          const pkg = serviceData.pricing_packages.find(
            (p) => p._id.toString() === service.packageId.toString()
          );
          if (pkg) totalCost += pkg.price * (service.quantity || 1);
        }
      }
      for (const card of estimation.cards) {
        const cardData = await CardTemplate.findById(card.cardId);
        if (cardData) {
          totalCost += cardData.price_per_card * (card.quantity || 1);
        }
      }
      estimation.totalCost = totalCost;

      // Save updated estimation or delete if empty
      if (estimation.services.length === 0 && estimation.cards.length === 0) {
        await Estimation.findByIdAndDelete(estimationId);
        return res.status(200).json({ message: "Estimation removed successfully" });
      } else {
        await estimation.save();
        return res.status(200).json({ message: "Item removed from estimation successfully" });
      }
    } else {
      // Delete entire estimation if no specific item is targeted
      await Estimation.findByIdAndDelete(estimationId);
      return res.status(200).json({ message: "Estimation removed successfully" });
    }
  } catch (error) {
    console.error("Remove estimation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const createBooking = async (req, res) => {
  console.log("createBooking called with payload:", req.body);
  const userId = req.user.id;
  const { service_id, package_id, card_template_id, date_time, quantity = 1, end_date } = req.body;

  try {
    if (!service_id && !card_template_id) {
      return res.status(400).json({ message: "Either service_id or card_template_id is required" });
    }
    if (service_id && card_template_id) {
      return res.status(400).json({ message: "Cannot book both a service and a card template" });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    if (date_time && isNaN(new Date(date_time).getTime())) {
      return res.status(400).json({ message: "Invalid date_time format" });
    }
    if (end_date && isNaN(new Date(end_date).getTime())) {
      return res.status(400).json({ message: "Invalid end_date format" });
    }

    let vendor_id, price, booking;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (service_id) {
        const service = await Service.findById(service_id).populate("vendor_id").session(session);
        if (!service) return res.status(404).json({ message: "Service not found" });
        if (service.status !== "published") return res.status(403).json({ message: "Service is not published" });
        if (!package_id) return res.status(400).json({ message: "Package ID is required for services" });

        const selectedPackage = service.pricing_packages.find(
          (pkg) => pkg._id.toString() === package_id.toString()
        );
        if (!selectedPackage) return res.status(400).json({ message: "Invalid package ID" });

        vendor_id = service.vendor_id._id;
        if (vendor_id.toString() === userId.toString()) {
          return res.status(403).json({ message: "You cannot book your own service" });
        }

        // Check for existing booking for the same service and time
        const existingBooking = await Booking.findOne({
          service_id,
          user_id: userId,
          date_time,
          status: { $in: ["pending", "confirmed"] },
        });
        if (existingBooking) {
          return res.status(400).json({ message: "You have already booked this service for the specified time" });
        }

        price = selectedPackage.price * (service.category === "Wedding Venues" ? quantity : 1);
        if (service.discount > 0 && (!service.discount_expiry || new Date(service.discount_expiry) > new Date())) {
          price = price * (1 - service.discount / 100);
        }

        const isRental = ["Bridal Wear", "Car Rental"].includes(service.category);

        booking = new Booking({
          user_id: userId,
          vendor_id,
          service_id,
          package_id,
          status: "pending",
          date_time: isRental ? date_time : date_time || null,
          event_date: isRental ? end_date : date_time || null,
          price,
          quantity: service.category === "Wedding Venues" ? quantity : 1,
        });
      } else if (card_template_id) {
        const card = await CardTemplate.findById(card_template_id).populate("vendor_id").session(session);
        if (!card) return res.status(404).json({ message: "Card template not found" });
        if (card.status !== "published") return res.status(403).json({ message: "Card template is not published" });
        if (card.quantity_available === 0) {
          return res.status(400).json({ message: "No cards available for booking" });
        }
        if (quantity > card.quantity_available) {
          return res.status(400).json({
            message: `Requested quantity ${quantity} exceeds available ${card.quantity_available}`,
          });
        }

        vendor_id = card.vendor_id._id;
        if (vendor_id.toString() === userId.toString()) {
          return res.status(403).json({ message: "You cannot book your own card template" });
        }

        price = card.price_per_card * quantity;
        if (card.discount > 0 && (!card.discount_expiry || new Date(card.discount_expiry) > new Date())) {
          price = price * (1 - card.discount / 100);
        }

        card.quantity_available -= quantity;
        await card.save({ session });

        booking = new Booking({
          user_id: userId,
          vendor_id,
          card_template_id,
          status: "pending",
          date_time: date_time || null,
          price,
          quantity,
        });
      }

      await booking.save({ session });
      await session.commitTransaction();

      const vendor = await User.findById(vendor_id);
      const user = await User.findById(userId);
      if (vendor) {
        await sendOTP(vendor.phone, `A new booking has been requested by ${user.full_name}.`);
      }

      res.status(201).json({
        message: "Booking created successfully. Please wait for vendor confirmation.",
        booking: {
          booking_id: booking._id,
          service_id: booking.service_id || booking.card_template_id,
          status: booking.status,
          date: booking.date_time,
          price: booking.price,
          quantity: booking.quantity,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: error.message || "Failed to create booking" });
  }
};

export const convertEstimationToBookings = async (req, res) => {
  const userId = req.user.id;
  const { estimationId, date_time } = req.body;

  try {
    // Validate estimation
    const estimation = await Estimation.findOne({ _id: estimationId, userId });
    if (!estimation) {
      return res.status(404).json({
        message: "Estimation not found or you are not authorized",
      });
    }
    if (!date_time) {
      return res.status(400).json({ message: "Date and time are required" });
    }

    // Start transaction for atomic updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bookings = [];

      // Process services
      for (const service of estimation.services) {
        const serviceData = await Service.findById(service.serviceId).session(session);
        if (!serviceData) {
          console.warn(`Service ${service.serviceId} not found, skipping`);
          continue;
        }
        if (serviceData.status !== "published") {
          throw new Error(`Service ${service.serviceId} is not published`);
        }
        if (serviceData.vendor_id.toString() === userId.toString()) {
          throw new Error(`You cannot book your own service ${service.serviceId}`);
        }
        const selectedPackage = serviceData.pricing_packages.find((pkg) =>
          pkg._id.equals(service.packageId)
        );
        if (!selectedPackage) {
          console.warn(`Package ${service.packageId} not found, skipping`);
          continue;
        }

        // Check for existing booking for the same service and time
        const existingBooking = await Booking.findOne({
          service_id: service.serviceId,
          user_id: userId,
          date_time,
          status: { $in: ["pending", "confirmed"] },
        });
        if (existingBooking) {
          throw new Error(`You have already booked service ${service.serviceId} for the specified time`);
        }

        const booking = new Booking({
          user_id: userId,
          vendor_id: serviceData.vendor_id,
          service_id: service.serviceId,
          package_id: service.packageId,
          status: "pending",
          date_time,
          price: selectedPackage.price * (service.quantity || 1),
          quantity: service.quantity || 1,
        });
        await booking.save({ session });
        bookings.push(booking);
      }

      // Process cards with atomic quantity update
      for (const card of estimation.cards) {
        const cardData = await CardTemplate.findOne({
          _id: card.cardId,
          status: "published",
          quantity_available: { $gte: card.quantity },
        }).session(session);
        if (!cardData) {
          throw new Error(`Card ${card.cardId} not found, not published, or insufficient quantity`);
        }
        if (cardData.vendor_id.toString() === userId.toString()) {
          throw new Error(`You cannot book your own card template ${card.cardId}`);
        }

        cardData.quantity_available -= card.quantity;
        await cardData.save({ session });

        const booking = new Booking({
          user_id: userId,
          vendor_id: cardData.vendor_id,
          card_template_id: card.cardId,
          status: "pending",
          date_time,
          price: cardData.price_per_card * (card.quantity || 1),
          quantity: card.quantity || 1,
        });
        await booking.save({ session });
        bookings.push(booking);
      }

      // Mark estimation as completed
      estimation.status = "completed";
      await estimation.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Notify vendors
      const vendorIds = [...new Set(bookings.map((b) => b.vendor_id.toString()))];
      for (const vendorId of vendorIds) {
        const vendor = await User.findById(vendorId);
        if (vendor) {
          await sendOTP(vendor.phone, `New bookings have been requested from an estimation.`);
        }
      }

      // Return booking details
      res.status(200).json({
        message: "Estimation converted to bookings successfully. Please wait for vendor confirmation.",
        bookings: bookings.map((b) => ({
          booking_id: b._id,
          service_id: b.service_id || b.card_template_id,
          status: b.status,
          date: b.date_time,
          price: b.price,
          quantity: b.quantity,
        })),
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Convert estimation error:", error);
    res.status(500).json({
      message: "Failed to convert estimation to bookings",
      error: error.message || "An unexpected error occurred",
    });
  }
};
