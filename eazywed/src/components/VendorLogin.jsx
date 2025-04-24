
"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "react-bootstrap"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import pkFlag from "../assets/images/pk-flag.png"
import onboardingImg from "../assets/images/onboarding.png"
// import "../styles/admin-auth.css"

const VendorLogin = () => {
  const [identifier, setIdentifier] = useState("+92")
  const [password, setPassword] = useState("")
  const { vendorLogin, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await vendorLogin(identifier, password)
    if (success) {
      navigate("/vendor/dashboard", { replace: true })
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
          <form id="vendor-login-form" onSubmit={handleSubmit}>
            <h5>Vendor Login</h5>
            <label htmlFor="identifier">Username or Phone *</label>
            <div className="phone-area">
              <img src={pkFlag || "/placeholder.svg"} alt="Pakistan Flag" />
              <input
                type="text"
                name="identifier"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <label htmlFor="password">Password *</label>
            <div className="password-area">
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="redirect-link pt-3">
              <Link to="/vendor/reset-request">Forgot Password?</Link>
            </div>
            <div className="redirect-link pt-3">
              <Link to="/vendor/category">Want to Be a Vendor?</Link>
            </div>
            <div className="back-forth-buttons">
              <div className="back-button">
                <Button type="button" onClick={() => navigate("/")} disabled={loading}>
                  Back
                </Button>
              </div>
              <div className="submit-continue-button">
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Continue"}
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

export default VendorLogin