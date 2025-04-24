
"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "react-bootstrap"
import onboardingImg from "../assets/images/onboarding.png"
import "../styles/admin-auth.css" // Reuse for consistency

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="main-container">
      <div className="logo-onboarding" style={{ backgroundImage: `url(${onboardingImg})` }}>
        <h1 className="logo">EazyWed</h1>
      </div>
      <div className="sign-in-form">
        <h4 style={{ color: "#D7385E" }}>404 - Page Not Found</h4>
        <p style={{ fontFamily: "Poppins", color: "#1E314B", marginBottom: "30px" }}>
          Oops! It seems you've wandered off the path. Let's get you back home.
        </p>
        <div className="back-forth-buttons" style={{ justifyContent: "center" }}>
          <div className="submit-continue-button">
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound