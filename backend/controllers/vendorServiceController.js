import Service from "../models/Service.js";
import CardTemplate from "../models/CardTemplate.js";
import Booking from "../models/Booking.js";
import { uploadServiceImages } from "../utils/cloudinary.js";
import mongoose from "mongoose";

export const getVendorDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const totalServices = await Service.countDocuments({ vendor_id: vendorId });
    const publishedServices = await Service.countDocuments({ vendor_id: vendorId, status: "published" });
    const pendingServices = await Service.countDocuments({ vendor_id: vendorId, status: "pending" });
    const rejectedServices = await Service.countDocuments({ vendor_id: vendorId, status: "rejected" });

    const totalCards = await CardTemplate.countDocuments({ vendor_id: vendorId });
    const publishedCards = await CardTemplate.countDocuments({ vendor_id: vendorId, status: "published" });
    const pendingCards = await CardTemplate.countDocuments({ vendor_id: vendorId, status: "pending" });
    const rejectedCards = await CardTemplate.countDocuments({ vendor_id: vendorId, status: "rejected" });

    const totalBookings = await Booking.countDocuments({ vendor_id: vendorId });
    const pendingBookings = await Booking.countDocuments({ vendor_id: vendorId, status: "pending" });
    const confirmedBookings = await Booking.countDocuments({ vendor_id: vendorId, status: "confirmed" });
    const completedBookings = await Booking.countDocuments({ vendor_id: vendorId, status: "completed" });
    const canceledBookings = await Booking.countDocuments({ vendor_id: vendorId, status: "canceled" });

    const earnings = await Booking.aggregate([
      { $match: { vendor_id: new mongoose.Types.ObjectId(vendorId), status: "completed" } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    res.status(200).json({
      services: {
        total: totalServices,
        published: publishedServices,
        pending: pendingServices,
        rejected: rejectedServices,
      },
      cards: {
        total: totalCards,
        published: publishedCards,
        pending: pendingCards,
        rejected: rejectedCards,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        canceled: canceledBookings,
      },
      earnings: earnings.length > 0 ? earnings[0].total : 0,
    });
  } catch (error) {
    console.error("Error fetching vendor dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorServices = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    const totalServices = await Service.countDocuments({ vendor_id: vendorId });
    
    const services = await Service.find({ vendor_id: vendorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(totalServices / limit);
    
    res.status(200).json({
      data: services,
      pagination: {
        total: totalServices,
        page,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching vendor services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorServiceById = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const serviceId = req.params.serviceId;

    const service = await Service.findOne({ _id: serviceId, vendor_id: vendorId });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    console.error("Error fetching vendor service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const serviceData = req.normalizedBody;

    if (!serviceData.category || !serviceData.name || !serviceData.city || !serviceData.description || !serviceData.price_range) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let photoUrls = [];
    if (serviceData.photos && serviceData.photos.length > 0) {
      if (serviceData.photos.length < 1 || serviceData.photos.length > 5) {
        return res.status(400).json({ message: "Please upload 1 to 5 photos" });
      }

      photoUrls = await uploadServiceImages(serviceData.photos);
    } else {
      return res.status(400).json({ message: "At least one photo is required" });
    }

    const newService = new Service({
      ...serviceData,
      vendor_id: vendorId,
      photos: photoUrls,
      status: "pending",
    });

    await newService.save();
    res.status(201).json({ message: "Service created successfully", service: newService });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const serviceId = req.params.serviceId;
    const updateData = req.normalizedBody;

    const service = await Service.findOne({ _id: serviceId, vendor_id: vendorId });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (updateData.photos && updateData.photos.length > 0) {
      if (updateData.photos.length < 1 || updateData.photos.length > 5) {
        return res.status(400).json({ message: "Please upload 1 to 5 photos" });
      }

      const photoUrls = await uploadServiceImages(updateData.photos);
      updateData.photos = photoUrls;
    } else {
      delete updateData.photos;
    }

    if (service.status === "published") {
      updateData.status = "pending";
    }

    const updatedService = await Service.findByIdAndUpdate(serviceId, updateData, { new: true, runValidators: true });

    res.status(200).json({ message: "Service updated successfully", service: updatedService });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const serviceId = req.params.serviceId;

    const service = await Service.findOne({ _id: serviceId, vendor_id: vendorId });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const bookings = await Booking.countDocuments({ service_id: serviceId });
    if (bookings > 0) {
      return res.status(400).json({ message: "Cannot delete service with existing bookings" });
    }

    await Service.findByIdAndDelete(serviceId);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorCards = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    const totalCards = await CardTemplate.countDocuments({ vendor_id: vendorId });
    
    const cards = await CardTemplate.find({ vendor_id: vendorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(totalCards / limit);
    
    res.status(200).json({
      data: cards,
      pagination: {
        total: totalCards,
        page,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching vendor cards:", error);
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