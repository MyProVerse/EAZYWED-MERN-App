"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Modal, Button } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import pkFlag from "../assets/images/pk-flag.png"
import onboardingImg from "../assets/images/contact-us.png"
import axios from "axios"

import Navbar from "./common/Navbar"
import Footer from "./common/Footer"
import EstimateSidebar from "./common/EstimateSidebar"
import "./Contact.css"

const ContactUs = () => {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("+92")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/public/contact`, {
        name: fullName,
        phone,
        message,
      }, { withCredentials: true })

      if (response.status === 200) {
        setShowSuccessModal(true)
        setFullName("")
        setPhone("+92")
        setMessage("")
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to submit inquiry. Please try again."
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <EstimateSidebar />
      <div className="contact-main main-container">
        <div className="logo-onbaording envolop-background" style={{ backgroundImage: `url(${onboardingImg})` }}>
          <h1 className="logo">EazyWed</h1>
        </div>
        <div className="sign-in-form col-6">
          <form id="contact-form" onSubmit={handleSubmit}>
            <h5>Contact Us</h5>
            
            <label htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Enter your full name"
            />

            <label htmlFor="phone">Phone Number *</label>
            <div className="phone-area">
              <img src={pkFlag || "/placeholder.svg"} alt="Pakistan Flag" />
              <input
                type="text"
                name="phone"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+923xxxxxxxxx"
              />
            </div>

            <label htmlFor="message">Message *</label>
            <textarea
              name="message"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Type your message here"
              rows="4"
            />

            <div className="back-forth-buttons">
              <div className="submit--continue-button">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Body className="otp-modal-content">
          <h6>Thank You!</h6>
          <p>Your message has been successfully received. Our team will review it and respond to you shortly.</p>
          <Button
            className="verify-button"
            onClick={() => {
              setShowSuccessModal(false)
              navigate("/")
            }}
          >
            Go to Home
          </Button>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default ContactUs