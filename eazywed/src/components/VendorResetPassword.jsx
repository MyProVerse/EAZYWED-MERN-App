

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import onboardingImg from "../assets/images/onboarding.png"
// import "../styles/admin-auth.css"

const VendorResetPassword = () => {
  const [newPassword, setNewPassword] = useState("")
  const [retypePassword, setRetypePassword] = useState("")
  const { resetVendorPassword, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters", { toastId: "passwordLength" })
      return
    }
    if (newPassword !== retypePassword) {
      toast.error("Passwords do not match", { toastId: "passwordMatch" })
      return
    }

    const success = await resetVendorPassword(newPassword)
    if (success) {
      setTimeout(() => navigate("/vendor/login", { replace: true }), 1000)
    }
  }

  return (
    <>
      <div className="main-container">
        <div className="logo-onboarding" style={{ backgroundImage: `url(${onboardingImg})` }}>
          <h1 className="logo">EazyWed</h1>
        </div>
        <div className="sign-in-form">
          <h4>Welcome to EazyWed</h4>
          <form id="vendor-reset-password-form" onSubmit={handleSubmit}>
            <h5>Reset Password</h5>
            <label htmlFor="new-password">New Password *</label>
            <input
              type="password"
              name="new-password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
            <label htmlFor="retype-password">Retype Password *</label>
            <input
              type="password"
              name="retype-password"
              id="retype-password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              required
              disabled={loading}
            />
            <div className="back-forth-buttons">
              <div className="back-button">
                <Button type="button" onClick={() => navigate("/vendor/reset-request")} disabled={loading}>
                  Back
                </Button>
              </div>
              <div className="submit-continue-button">
                <Button type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default VendorResetPassword
