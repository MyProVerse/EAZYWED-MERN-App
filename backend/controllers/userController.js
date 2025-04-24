import User from "../models/User.js"
import BlockedUsers from "../models/BlockedUsers.js"
import OTP from "../models/OTP.js"
import { sendOTP } from "../utils/twilio.js"
import { generateToken } from "../middleware/auth.js"
import { NODE_ENV } from "../config/env.js"
import bcrypt from "bcrypt"
import { uploadBrandIcon } from "../utils/cloudinary.js"

export const signIn = async (req, res) => {
  const { phone } = req.body

  if (!phone) return res.status(400).json({ message: "Phone is required" })
  if (!/^\+923[0-4][0-9]{8}$/.test(phone)) return res.status(400).json({ message: "Invalid Pakistani phone number" })

  try {
    const user = await User.findOne({ phone })
    if (!user) return res.status(404).json({ message: "User not found" })

    const isBlocked = await BlockedUsers.findOne({ phone })
    if (isBlocked) return res.status(403).json({ message: "User is blocked" })

    const otpRecord = await OTP.findOne({ phone, role: "user" }) // Always use "user" role for OTP
    const now = new Date()
    if (otpRecord && otpRecord.requestCount >= 5) {
      const cooldownEnd = new Date(otpRecord.lastRequestTime.getTime() + 15 * 60 * 1000)
      if (now < cooldownEnd) {
        const waitTime = Math.ceil((cooldownEnd - now) / 60000)
        return res.status(429).json({ message: `Too many requests. Please wait ${waitTime} minutes.` })
      } else {
        otpRecord.requestCount = 0
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await OTP.findOneAndUpdate(
      { phone, role: "user" },
      {
        otpCode: otp,
        expiresAt,
        requestCount: (otpRecord?.requestCount || 0) + 1,
        lastRequestTime: now,
        verified: false,
      },
      { upsert: true },
    )

    await sendOTP(phone, otp)
    res.status(200).json({ message: "OTP sent successfully" })
  } catch (error) {
    console.error("User sign-in error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const verifySignInOtp = async (req, res) => {
  const { phone, otp } = req.body

  if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required" })

  try {
    const user = await User.findOne({ phone })
    if (!user) return res.status(404).json({ message: "User not found" })

    const otpRecord = await OTP.findOne({ phone, otpCode: otp, role: "user" })
    if (!otpRecord || new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" })
    }

    if (otpRecord.verified) {
      return res.status(400).json({ message: "OTP has already been used" })
    }

    otpRecord.verified = true
    await otpRecord.save()

    // Generate token with user's actual role (user or vendor)
    const token = await generateToken(user._id, user.role)
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
        user: { id: user._id, phone: user.phone, username: user.username, role: user.role },
      })

    await OTP.deleteOne({ _id: otpRecord._id })
  } catch (error) {
    console.error("User OTP verify error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const signUp = async (req, res) => {
  const { full_name, phone } = req.body

  if (!full_name || !phone) return res.status(400).json({ message: "Full name and phone are required" })
  if (!/^\+923[0-4][0-9]{8}$/.test(phone)) return res.status(400).json({ message: "Invalid Pakistani phone number" })

  try {
    const existingUser = await User.findOne({ phone })
    if (existingUser) return res.status(400).json({ message: "Phone already registered" })

    const otpRecord = await OTP.findOne({ phone, role: "user" })
    const now = new Date()
    if (otpRecord && otpRecord.requestCount >= 5) {
      const cooldownEnd = new Date(otpRecord.lastRequestTime.getTime() + 15 * 60 * 1000)
      if (now < cooldownEnd) {
        const waitTime = Math.ceil((cooldownEnd - now) / 60000)
        return res.status(429).json({ message: `Too many requests. Please wait ${waitTime} minutes.` })
      } else {
        otpRecord.requestCount = 0
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await OTP.findOneAndUpdate(
      { phone, role: "user" },
      {
        otpCode: otp,
        expiresAt,
        requestCount: (otpRecord?.requestCount || 0) + 1,
        lastRequestTime: now,
        verified: false,
      },
      { upsert: true },
    )

    await sendOTP(phone, otp)
    res.status(200).json({ message: "OTP sent successfully", full_name })
  } catch (error) {
    console.error("User sign-up error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const verifySignUpOtp = async (req, res) => {
  const { full_name, phone, otp } = req.body

  if (!full_name || !phone || !otp) return res.status(400).json({ message: "Full name, phone, and OTP are required" })

  try {
    const otpRecord = await OTP.findOne({ phone, otpCode: otp, role: "user" })
    if (!otpRecord || new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" })
    }

    if (otpRecord.verified) {
      return res.status(400).json({ message: "OTP has already been used" })
    }

    otpRecord.verified = true
    await otpRecord.save()

    const username = `user${phone.replace("+", "")}` // e.g., +923000000003 -> user923000000003
    const user = await User.create({
      full_name,
      phone,
      username,
      role: "user",
    })

    const token = await generateToken(user._id, "user")
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      })
      .status(201)
      .json({
        message: "Registration successful",
        user: { id: user._id, phone: user.phone, username: user.username, role: user.role },
      })

    await OTP.deleteOne({ _id: otpRecord._id })
  } catch (error) {
    console.error("User sign-up OTP verify error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const registerVendor = async (req, res) => {
  const { phone, password, vendorRequest, brand_icon } = req.normalizedBody

  if (!phone || !password || !vendorRequest?.category) {
    return res.status(400).json({
      message: "Phone, password, and vendor category are required",
      missing: { phone: !phone, password: !password, category: !vendorRequest?.category },
    })
  }
  if (!/^\+923[0-4][0-9]{8}$/.test(phone)) return res.status(400).json({ message: "Invalid Pakistani phone number" })
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" })

  if (!brand_icon) return res.status(400).json({ message: "Brand icon is required" })
  const maxSize = 250 * 1024
  if (brand_icon.size > maxSize) return res.status(400).json({ message: "Brand icon must be less than 250KB" })
  const allowedFormats = ["image/jpeg", "image/jpg", "image/png"]
  if (!allowedFormats.includes(brand_icon.mimetype))
    return res.status(400).json({ message: "Brand icon must be JPEG, JPG, or PNG" })

  try {
    const isBlocked = await BlockedUsers.findOne({ phone })
    if (isBlocked) return res.status(403).json({ message: "User is blocked" })

    const user = await User.findOne({ phone })
    if (user) {
      if (user.vendorRequest.status === "pending")
        return res.status(400).json({ message: "Vendor request already pending" })
      if (user.vendorRequest.status === "approved") return res.status(400).json({ message: "Already a vendor" })
      if (user.vendorRequest.rejectionCount >= 3) {
        const cooldownEnd = new Date(user.vendorRequest.lastRejectionTime.getTime() + 7 * 24 * 60 * 60 * 1000)
        if (new Date() < cooldownEnd) {
          const daysLeft = Math.ceil((cooldownEnd - new Date()) / (24 * 60 * 60 * 1000))
          return res.status(429).json({ message: `Too many rejections. Please wait ${daysLeft} days.` })
        } else {
          user.vendorRequest.rejectionCount = 0 // Reset after cooldown
        }
      }
      if (vendorRequest.full_name && vendorRequest.full_name !== user.full_name) {
        return res.status(400).json({ message: `Please use your existing full name: ${user.full_name}` })
      }
    }

    const otpRecord = await OTP.findOne({ phone, role: "vendor" })
    const now = new Date()
    if (otpRecord && otpRecord.requestCount >= 5) {
      const cooldownEnd = new Date(otpRecord.lastRequestTime.getTime() + 15 * 60 * 1000)
      if (now < cooldownEnd) {
        const waitTime = Math.ceil((cooldownEnd - now) / 60000)
        return res.status(429).json({ message: `Too many requests. Please wait ${waitTime} minutes.` })
      } else {
        otpRecord.requestCount = 0
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await OTP.findOneAndUpdate(
      { phone, role: "vendor" },
      {
        otpCode: otp,
        expiresAt,
        requestCount: (otpRecord?.requestCount || 0) + 1,
        lastRequestTime: now,
        verified: false,
        resetToken: brand_icon.data.toString("base64"), // Store brand icon temporarily
      },
      { upsert: true },
    )

    await sendOTP(phone, otp)
    res.status(200).json({ message: "OTP sent successfully", phone, password, vendorRequest })
  } catch (error) {
    console.error("Vendor register error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const verifyVendorOtp = async (req, res) => {
  const { phone, otp, password, vendorRequest } = req.normalizedBody

  if (!phone || !otp || !password || !vendorRequest || !vendorRequest.category) {
    return res.status(400).json({
      message: "All fields are required",
      missing: {
        phone: !phone,
        otp: !otp,
        password: !password,
        category: !vendorRequest?.category,
      },
    })
  }
  if (vendorRequest.terms_accepted !== true) return res.status(400).json({ message: "Terms must be accepted" })

  try {
    const otpRecord = await OTP.findOne({ phone, otpCode: otp, role: "vendor" })
    if (!otpRecord || new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" })
    }

    if (otpRecord.verified) {
      return res.status(400).json({ message: "OTP has already been used" })
    }

    // Normalize the category value to match the enum in the schema
    if (vendorRequest.category) {
      // Map hyphenated/lowercase values to properly formatted enum values
      const categoryMap = {
        "wedding-venues": "Wedding Venues",
        "photographers": "Photographers",
        "bridal-makeup": "Bridal Makeup",
        "henna-artists": "Henna Artists",
        "bridal-wear": "Bridal Wear",
        "car-rental": "Car Rental",
        "wedding-cards": "Wedding Cards",
        "wedding-invitations": "Wedding Invitations"
      };
      
      // Convert to lowercase and replace spaces with hyphens for matching
      const normalizedCategory = vendorRequest.category.toLowerCase().replace(/\s+/g, '-');
      
      // Use the mapped value or keep the original if no mapping exists
      vendorRequest.category = categoryMap[normalizedCategory] || vendorRequest.category;
    }

    otpRecord.verified = true
    await otpRecord.save()

    let user = await User.findOne({ phone })
    const hashedPassword = await bcrypt.hash(password, 10)
    let brandIconUrl

    if (otpRecord.resetToken) {
      const brandIconBuffer = Buffer.from(otpRecord.resetToken, "base64")
      const brandIconData = {
        buffer: brandIconBuffer,
        mimetype: req.normalizedBody.brand_icon?.mimetype || "image/jpeg",
      }
      brandIconUrl = await uploadBrandIcon(brandIconData)
    } else {
      return res.status(400).json({ message: "Brand icon data missing from OTP record" })
    }

    const username = `user${phone.replace("+", "")}` // e.g., +923000000003 -> user923000000003

    if (user) {
      if (user.vendorRequest.status === "approved") return res.status(400).json({ message: "Already a vendor" })
      if (vendorRequest.full_name && vendorRequest.full_name !== user.full_name) {
        return res.status(400).json({ message: `Please use your existing full name: ${user.full_name}` })
      }
      // Update existing user
      user.username = username // Ensure username is set correctly
      user.vendorRequest = {
        ...vendorRequest,
        brand_icon: brandIconUrl,
        status: "pending",
        terms_accepted: true,
        submittedAt: new Date(),
      }
      user.password = hashedPassword
      await user.save()
    } else {
      // Create new user
      user = await User.create({
        phone,
        username, // Set username explicitly here
        full_name: vendorRequest.full_name || phone.slice(-10),
        password: hashedPassword,
        role: "user", // Remains 'user' until approved
        vendorRequest: {
          ...vendorRequest,
          brand_icon: brandIconUrl,
          status: "pending",
          terms_accepted: true,
          submittedAt: new Date(),
        },
      })
    }

    await OTP.deleteOne({ _id: otpRecord._id })
    res.status(200).json({ message: "Vendor request submitted successfully, awaiting approval" })
  } catch (error) {
    console.error("Vendor OTP verify error:", error)
    res.status(500).json({ message: "Server error", details: error.message })
  }
}
