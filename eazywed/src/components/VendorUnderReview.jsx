
"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "react-bootstrap"
import onboardingImg from "../assets/images/onboarding.png"
import "../styles/vendor-auth.css"

const VendorUnderReview = () => {
  const navigate = useNavigate()

  return (
    <div className="main-container">
      <div className="logo-onboarding" style={{ backgroundImage: `url(${onboardingImg})` }}>
        <h1 className="logo">EazyWed</h1>
      </div>
      <div className="sign-in-form">
        <h4>Welcome to EazyWed</h4>
        <h5>Application Under Review</h5>
        <p className="review-message">
          Thank you for registering as a vendor! Your application has been submitted and is currently under review by
          our admin team. You'll be notified once it's approved.
        </p>
        <div className="back-forth-buttons">
          <div className="submit--continue-button">
            <Button onClick={() => navigate("/")} variant="primary">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorUnderReview