
"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom" // Import Link
import { Button } from "react-bootstrap"
import onboardingImg from "../assets/images/onboarding.png"
import "../styles/vendor-auth.css"
// import "../styles/admin-auth.css"

const VendorCategoryType = () => {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const navigate = useNavigate()

  const categories = [
    { id: "wedding-venues", icon: "fa-building", label: "Wedding Venues" },
    { id: "photographers", icon: "fa-camera", label: "Photographers" },
    { id: "bridal-makeup", icon: "fa-paint-brush", label: "Bridal Makeup" },
    { id: "henna-artists", icon: "fa-hand-paper", label: "Henna Artists" },
    { id: "bridal-wear", icon: "fa-person-dress", label: "Bridal Wear" },
    { id: "wedding-invitations", icon: "fa-envelope", label: "Wedding Cards" },
    { id: "car-rental", icon: "fa-car", label: "Car Rental" },
  ]

  const handleSelect = (categoryId) => {
    setSelectedCategory(categoryId)
  }

  const handleContinue = () => {
    if (selectedCategory) {
      navigate("/vendor/signup", { state: { category: selectedCategory } })
    }
  }

  // baseUrl is no longer needed for Link, but kept for reference if used elsewhere
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173"

  return (
    <div className="main-container">
      <div className="logo-onboarding" style={{ backgroundImage: `url(${onboardingImg})` }}>
        <h1 className="logo">EazyWed</h1>
      </div>
      <div className="sign-in-form">
        <h4>Join EazyWed</h4>
        <p>What is your line of business?</p>
        <div className="category-type-options">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`category-type-card ${selectedCategory === cat.id ? "selected" : ""}`}
              onClick={() => handleSelect(cat.id)}
            >
              <i className={`fas ${cat.icon}`}></i>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
        <div className="footer-section">
          <div className="redirect-link">
            <Link to="/vendor/login">Already a member?</Link> {/* Replaced <a> with Link */}
          </div>
          <div className="back-forth-buttons">
            <Button onClick={() => navigate("/")} variant="secondary">
              Back
            </Button>
            <Button onClick={handleContinue} disabled={!selectedCategory} variant="primary">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorCategoryType