
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button, Modal } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import onboardingImg from "../assets/images/onboarding.png"
import pkFlag from "../assets/images/pk-flag.png"
import "../styles/vendor-auth.css"

const VendorSignup = () => {
  const [formData, setFormData] = useState({
    phone: "+92",
    password: "",
    retypePassword: "",
    vendorRequest: {
      full_name: "",
      email: "",
      whatsapp_number: "+92",
      instagram_link: "",
      facebook_link: "",
      booking_email: "",
      website_link: "",
      office_address: "",
      map_link: "",
      terms_accepted: false,
      category: "",
    },
  })
  const [brandIcon, setBrandIcon] = useState(null)
  const [otp, setOtp] = useState("")
  const [showOtpModal, setShowOtpModal] = useState(false)
  const { registerVendor, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const categoryFromParams = params.get("category")
    const categoryFromState = location.state?.category
    const category = categoryFromState || categoryFromParams

    if (category) {
      setFormData((prev) => ({
        ...prev,
        vendorRequest: { ...prev.vendorRequest, category },
      }))
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith("vendorRequest.")) {
      const field = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        vendorRequest: { ...prev.vendorRequest, [field]: type === "checkbox" ? checked : value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 250 * 1024) {
        toast.error("Brand icon must be less than 250KB", { toastId: "brandIconSize" })
        return
      }
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        toast.error("Brand icon must be JPEG, JPG, or PNG", { toastId: "brandIconFormat" })
        return
      }
      setBrandIcon(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.retypePassword) {
      toast.error("Passwords do not match", { toastId: "passwordMatch" })
      return
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters", { toastId: "passwordLength" })
      return
    }
    if (!formData.vendorRequest.terms_accepted) {
      toast.error("You must accept the terms and conditions", { toastId: "terms" })
      return
    }
    if (!brandIcon) {
      toast.error("Brand icon is required", { toastId: "brandIconRequired" })
      return
    }

    const success = await registerVendor({ ...formData, brand_icon: brandIcon })
    if (success) setShowOtpModal(true)
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    const success = await registerVendor({ ...formData, brand_icon: brandIcon, otp })
    if (success) {
      setShowOtpModal(false)
      navigate("/vendor/under-review", { state: { submissionSuccess: true } })
    }
  }

  return (
    <>
      <div className="main-container">
        <div className="logo-onboarding" style={{ backgroundImage: `url(${onboardingImg})` }}>
          <h1 className="logo">EazyWed</h1>
        </div>
        <div className="sign-in-form">
          <h5>Vendor Registration</h5>
          <p className="instruction">Enter your personal and business information below.</p>
          <form id="vendor-registration-form" onSubmit={handleSubmit}>
            <input type="hidden" name="vendorRequest.category" value={formData.vendorRequest.category} />
            <label htmlFor="brand_icon">Brand Icon *</label>
            <div className="brand-icon-area">
              <div
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleFileChange({ target: { files: e.dataTransfer.files } })
                }}
                onClick={() => document.getElementById("brand_icon").click()}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                <p
                  dangerouslySetInnerHTML={{
                    __html: brandIcon
                      ? `Selected: ${brandIcon.name}`
                      : "Drag & drop your image here or <span>click to upload</span>",
                  }}
                />
              </div>
              <input
                type="file"
                name="brand_icon"
                id="brand_icon"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </div>

            <label htmlFor="vendorRequest.full_name">Full Name *</label>
            <input
              type="text"
              name="vendorRequest.full_name"
              value={formData.vendorRequest.full_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <label htmlFor="vendorRequest.email">Email *</label>
            <input
              type="email"
              name="vendorRequest.email"
              value={formData.vendorRequest.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <label htmlFor="phone">Contact Number *</label>
            <div className="phone-area">
              <img src={pkFlag || "/placeholder.svg"} alt="Pakistan Flag" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <label htmlFor="retypePassword">Retype Password *</label>
            <input
              type="password"
              name="retypePassword"
              value={formData.retypePassword}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label htmlFor="vendorRequest.whatsapp_number">WhatsApp Number</label>
            <div className="phone-area">
              <img src={pkFlag || "/placeholder.svg"} alt="Pakistan Flag" />
              <input
                type="text"
                name="vendorRequest.whatsapp_number"
                value={formData.vendorRequest.whatsapp_number}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <label htmlFor="vendorRequest.instagram_link">Instagram Link *</label>
            <input
              type="url"
              name="vendorRequest.instagram_link"
              value={formData.vendorRequest.instagram_link}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <label htmlFor="vendorRequest.facebook_link">Facebook Link</label>
            <input
              type="url"
              name="vendorRequest.facebook_link"
              value={formData.vendorRequest.facebook_link}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="vendorRequest.booking_email">Booking Email *</label>
            <input
              type="email"
              name="vendorRequest.booking_email"
              value={formData.vendorRequest.booking_email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <label htmlFor="vendorRequest.website_link">Website</label>
            <input
              type="url"
              name="vendorRequest.website_link"
              value={formData.vendorRequest.website_link}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="vendorRequest.office_address">Office Address</label>
            <input
              type="text"
              name="vendorRequest.office_address"
              value={formData.vendorRequest.office_address}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="vendorRequest.map_link">Office Google Maps Link</label>
            <input
              type="url"
              name="vendorRequest.map_link"
              value={formData.vendorRequest.map_link}
              onChange={handleChange}
              disabled={loading}
            />

            <div className="terms-condition">
              <input
                type="checkbox"
                name="vendorRequest.terms_accepted"
                checked={formData.vendorRequest.terms_accepted}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="vendorRequest.terms_accepted">I agree to the Terms and Conditions *</label>
            </div>
            <div className="redirect-link">
              <a href="/signin">Already have an account?</a>
            </div>
            <div className="back-forth-buttons">
              <Button type="button" onClick={() => navigate("/vendor/category")} disabled={loading} variant="secondary">
                Back
              </Button>
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? "Submitting..." : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered>
        <Modal.Body>
          <h6>Enter OTP</h6>
          <input
            type="text"
            id="otpInput"
            placeholder="Enter the OTP sent to your number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleOtpSubmit} disabled={loading} variant="primary">
            {loading ? "Verifying..." : "Verify"}
          </Button>
          <Button onClick={() => setShowOtpModal(false)} disabled={loading} variant="secondary">
            Cancel
          </Button>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default VendorSignup