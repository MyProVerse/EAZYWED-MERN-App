import User from "../models/User.js";
import Service from "../models/Service.js";
import CardTemplate from "../models/CardTemplate.js";
import Booking from "../models/Booking.js";
import OTP from "../models/OTP.js";
import { sendOTP } from "../utils/twilio.js";
import { generateToken, generateResetToken } from "../middleware/auth.js";
import { NODE_ENV } from "../config/env.js";
import bcrypt from "bcrypt";
import { generateWhatsAppLink } from "../utils/whatsapp.js";
import mongoose from "mongoose"; // Added missing import


export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) return res.status(400).json({ message: "Username/phone and password are required" });

  try {
    const vendor = await User.findOne({ $or: [{ username: identifier }, { phone: identifier }], role: "vendor" });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = await generateToken(vendor._id, "vendor");
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        vendor: { id: vendor._id, phone: vendor.phone, username: vendor.username, role: vendor.role },
      });
  } catch (error) {
    console.error("Vendor login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: "Phone is required" });

  try {
    const vendor = await User.findOne({ phone, role: "vendor" });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const otpRecord = await OTP.findOne({ phone, role: "vendor" });
    const now = new Date();
    if (otpRecord && otpRecord.requestCount >= 5) {
      const cooldownEnd = new Date(otpRecord.lastRequestTime.getTime() + 15 * 60 * 1000);
      if (now < cooldownEnd) {
        const waitTime = Math.ceil((cooldownEnd - now) / 60000);
        return res.status(429).json({ message: `Too many requests. Please wait ${waitTime} minutes.` });
      } else {
        otpRecord.requestCount = 0;
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { phone, role: "vendor" },
      {
        otpCode: otp,
        expiresAt,
        requestCount: (otpRecord?.requestCount || 0) + 1,
        lastRequestTime: now,
        verified: false,
      },
      { upsert: true },
    );

    await sendOTP(phone, otp);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Vendor OTP request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required" });

  try {
    const otpRecord = await OTP.findOne({ phone, otpCode: otp, role: "vendor" });
    if (!otpRecord || new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (otpRecord.verified) {
      return res.status(400).json({ message: "OTP has already been used" });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const token = generateResetToken(otpRecord._id, "10m");
    res
      .cookie("resetToken", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
      })
      .status(200)
      .json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Vendor OTP verify error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const { otpId } = req;
    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord || !otpRecord.verified || otpRecord.role !== "vendor") {
      return res.status(400).json({ message: "Invalid or unverified OTP" });
    }

    const vendor = await User.findOne({ phone: otpRecord.phone, role: "vendor" });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.password = await bcrypt.hash(newPassword, 10);
    await vendor.save();

    res.clearCookie("resetToken").status(200).json({ message: "Password reset successfully" });
    await OTP.deleteOne({ _id: otpRecord._id });
  } catch (error) {
    console.error("Vendor reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkResetToken = async (req, res) => {
  try {
    const { otpId } = req;
    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord || !otpRecord.verified || otpRecord.role !== "vendor") {
      return res.status(401).json({ message: "Invalid or unverified reset token" });
    }
    res.status(200).json({ message: "Token valid" });
  } catch (error) {
    console.error("Check reset token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const serviceData = req.normalizedService;

    const newService = new Service({ ...serviceData, vendor_id: vendorId });
    await newService.save();
    res.status(201).json({ message: "Service created successfully", service: newService });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { serviceId } = req.params;
    const updateData = req.normalizedService;

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, vendor_id: vendorId },
      { ...updateData, status: "pending" },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service updated successfully", service });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { serviceId } = req.params;

    const service = await Service.findOneAndDelete({ _id: serviceId, vendor_id: vendorId });
    if (!service) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { serviceId } = req.params;

    const service = await Service.findOne({ _id: serviceId, vendor_id: vendorId });
    if (!service) return res.status(404).json({ message: "Service not found" });

    res.status(200).json(service);
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const cardData = req.normalizedCard;

    const newCard = new CardTemplate({ ...cardData, vendor_id: vendorId });
    await newCard.save();
    res.status(201).json({ message: "Card template created successfully", card: newCard });
  } catch (error) {
    console.error("Create card template error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { cardId } = req.params;
    const updateData = req.normalizedCard;

    const card = await CardTemplate.findOneAndUpdate(
      { _id: cardId, vendor_id: vendorId },
      { ...updateData, status: "pending" },
      { new: true }
    );
    if (!card) return res.status(404).json({ message: "Card template not found" });

    res.status(200).json({ message: "Card template updated successfully", card });
  } catch (error) {
    console.error("Update card template error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { cardId } = req.params;

    const card = await CardTemplate.findOneAndDelete({ _id: cardId, vendor_id: vendorId });
    if (!card) return res.status(404).json({ message: "Card template not found" });

    res.status(200).json({ message: "Card template deleted successfully" });
  } catch (error) {
    console.error("Delete card template error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { cardId } = req.params;

    const card = await CardTemplate.findOne({ _id: cardId, vendor_id: vendorId });
    if (!card) return res.status(404).json({ message: "Card template not found" });

    res.status(200).json(card);
  } catch (error) {
    console.error("Get card template error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBookingDetails = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, vendor_id: vendorId })
      .populate("user_id", "username full_name phone")
      .populate("service_id", "name")
      .populate("card_template_id");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json(booking);
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBookingStatus = async (req, res) => {
  const vendorId = req.user.id;
  const { bookingId } = req.params;
  const { status } = req.body;

  try {
    if (!["pending", "confirmed", "completed", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findOne({ _id: bookingId, vendor_id: vendorId }).session(session);
      if (!booking) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Booking not found or you are not authorized" });
      }

      const validTransitions = {
        pending: ["confirmed", "canceled"],
        confirmed: ["completed", "canceled"],
        completed: [],
        canceled: [],
      };
      if (!validTransitions[booking.status].includes(status)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Invalid status transition from ${booking.status} to ${status}`,
        });
      }

      // Restore resources if canceling
      if (status === "canceled") {
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
      }

      booking.status = status;
      if (status === "completed" && !booking.completed_at) {
        booking.completed_at = new Date();
        booking.reviewAllowed = true;
      }
      if (status === "confirmed" && !booking.event_date) {
        booking.event_date = booking.date_time;
      }
      await booking.save({ session });

      // Notify user
      const user = await User.findById(booking.user_id);
      if (user) {
        let itemName = "a service";
        if (booking.service_id) {
          const service = await Service.findById(booking.service_id);
          itemName = service?.name || "a service";
        } else if (booking.card_template_id) {
          const card = await CardTemplate.findById(booking.card_template_id);
          itemName = card?.name || `${card?.type} Card`;
        }
        const message = `Your booking for ${itemName} has been updated to ${status}.`;
        await sendOTP(user.phone, message);
        if (status === "confirmed") {
          const whatsappLink = generateWhatsAppLink(
            user.phone,
            `Hello! Your booking for ${itemName} has been confirmed. Thank you for choosing our services.`
          );
          // Note: WhatsApp link can be used by frontend
        }
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Booking status updated successfully",
        booking: {
          booking_id: booking._id,
          status: booking.status,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    const totalBookings = await Booking.countDocuments({ vendor_id: vendorId });
    
    const bookings = await Booking.find({ vendor_id: vendorId })
      .populate("user_id", "full_name phone")
      .populate("service_id", "name")
      .populate("card_template_id", "name type")
      .sort({ date_time: -1 })
      .skip(skip)
      .limit(limit);
    
    const formattedBookings = bookings.map((booking) => ({
      booking_id: booking._id,
      service_id: booking.service_id,
      service_name: booking.service_id?.name || booking.card_template_id?.name || `${booking.card_template_id?.type?.charAt(0).toUpperCase() + (booking.card_template_id?.type?.slice(1) || '')} Card Template`,
      user_id: booking.user_id._id,
      user_name: booking.user_id.full_name,
      user_phone: booking.user_id.phone,
      date: booking.date_time,
      status: booking.status,
      price: booking.price,
    }));
    
    const totalPages = Math.ceil(totalBookings / limit);
    
    res.status(200).json({
      data: formattedBookings,
      pagination: {
        total: totalBookings,
        page,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching vendor bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBookingUserInfo = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, vendor_id: vendorId }).populate(
      "user_id",
      "username full_name phone"
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json(booking.user_id);
  } catch (error) {
    console.error("Get booking user info error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { serviceId, cardId, date } = req.body;

    if (!serviceId && !cardId) {
      return res.status(400).json({ message: "Service ID or Card ID is required" });
    }
    if (!date) return res.status(400).json({ message: "Date is required" });

    const eventDate = new Date(date);
    const bookings = await Booking.find({
      vendor_id: vendorId,
      status: "confirmed",
      event_date: {
        $gte: new Date(eventDate.setHours(0, 0, 0, 0)),
        $lte: new Date(eventDate.setHours(23, 59, 59, 999)),
      },
    });

    const isAvailable = bookings.length === 0;
    const vendor = await User.findById(vendorId);
    const whatsappLink = generateWhatsAppLink(
      vendor.phone,
      `Hi, I’d like to check your availability for ${serviceId ? "a service" : "a card"} on ${eventDate.toLocaleDateString()}.`
    );

    res.status(200).json({ isAvailable, whatsappLink });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const totalServices = await Service.countDocuments({ vendor_id: vendorId });
    const publishedServices = await Service.countDocuments({ vendor_id: vendorId, status: "published" });
    const pendingServices = await Service.countDocuments({ vendor_id: vendorId, status: "pending" });

    const totalCards = await CardTemplate.countDocuments({ vendor_id: vendorId });
    const publishedCards = await CardTemplate.countDocuments({ vendor_id: vendorId, status: "published" });
    const pendingCards = await CardTemplate.countDocuments({ vendor_id: vendorId, status: "pending" });

    const totalBookings = await Booking.countDocuments({ vendor_id: vendorId });
    const confirmedBookings = await Booking.countDocuments({ vendor_id: vendorId, status: "confirmed" });
    const completedBookings = await Booking.countDocuments({ vendor_id: vendorId, status: "completed" });

    const now = new Date();
    const upcomingBookings = await Booking.countDocuments({
      vendor_id: vendorId,
      status: "confirmed",
      event_date: { $gt: now },
    });

    res.status(200).json({
      totalServices,
      publishedServices,
      pendingServices,
      totalCards,
      publishedCards,
      pendingCards,
      totalBookings,
      confirmedBookings,
      completedBookings,
      upcomingBookings,
    });
  } catch (error) {
    console.error("Vendor dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};