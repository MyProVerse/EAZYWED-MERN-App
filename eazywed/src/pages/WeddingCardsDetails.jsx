"use client"

import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Navbar from "./common/Navbar"
import Footer from "./common/Footer"
import EstimateSidebar from "./common/EstimateSidebar"
import { fetchCardDetails, checkCardAvailability } from "../services/api"
import { useEstimate } from "../context/EstimateContext"
import { useAuth } from "../context/AuthContext"
import "./details-page.css"

const WeddingCardsDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToEstimate } = useEstimate()
  const { user, isLoading } = useAuth()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("Details")
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState("")
  const [reviewsPage, setReviewsPage] = useState(1)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const reviewsPerPage = 5
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    const loadCard = async () => {
      try {
        const data = await fetchCardDetails(id)
        setCard(data)
        document.title = `${data.name} - Card Details | EazyWed`
      } catch (err) {
        setError("Failed to load card details.")
        toast.error("Failed to load card details.")
      } finally {
        setLoading(false)
      }
    }
    loadCard()
  }, [id])

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    document.getElementById(`dp-section-${tab.toLowerCase()}`).scrollIntoView({ behavior: "smooth" })
  }

  const validateDate = () => date && new Date(date) >= new Date(today)

  const handleBook = async () => {
    if (!user) {
      toast.error("Please sign in to book a card")
      navigate("/signin")
      return
    }

    if (!validateDate()) {
      toast.error("Please select a valid delivery date.")
      return
    }
    try {
      const payload = { card_template_id: id, date_time: date, quantity }
      const response = await fetch("http://localhost:5000/dashboard/user/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Please sign in to book")
          navigate("/signin")
        } else {
          throw new Error("Booking failed")
        }
      } else {
        const data = await response.json()
        toast.success(`Booking created! Booking ID: ${data.booking.booking_id}`)
        setTimeout(() => navigate("/dashboard"), 2000)
      }
    } catch (err) {
      console.error("Booking failed:", err)
      toast.error(err.message || "Booking failed.")
    }
  }

  const handleAddToEstimate = async () => {
    try {
      const item = {
        type: "card",
        id: card.id,
        quantity,
        name: card.name,
        subtotal: card.pricePerCard * quantity,
      }
      await addToEstimate(item)
    } catch (err) {
      console.error("Add to estimate failed:", err)
      toast.error("Failed to add to estimate.")
    }
  }

  const handleCustomize = async () => {
    if (card.type !== "editable") {
      toast.error("This card is not customizable")
      return
    }

    try {
      navigate(`/public-editor/${id}`)
    } catch (err) {
      console.error("Navigation to editor failed:", err)
      toast.error("Failed to load editor.")
    }
  }

  const handleAvailabilityCheck = async () => {
    if (!validateDate()) {
      toast.error("Please select a valid delivery date.")
      return
    }
    try {
      const payload = { date, quantity }
      const { whatsappLink } = await checkCardAvailability(id, payload)
      window.open(whatsappLink, "_blank")
      toast.success("WhatsApp inquiry opened!")
    } catch (err) {
      console.error("Availability check failed:", err)
      toast.error("Failed to check availability.")
    }
  }

  const handleWhatsAppContact = () => {
    if (!card?.vendorPhone) {
      toast.error("Vendor contact not available.")
      return
    }
    const whatsappLink = `https://wa.me/${card.vendorPhone.replace("+", "")}`
    window.open(whatsappLink, "_blank")
  }

  const loadMoreReviews = () => setReviewsPage((prev) => prev + 1)

  const calculateRatingBars = () => {
    if (!card?.reviews.length) return Array(5).fill(0)
    const counts = Array(5).fill(0)
    card.reviews.forEach((r) => counts[5 - r.stars]++)
    return counts.map((count) => (count / card.reviews.length) * 100)
  }

  const getDetailIcon = (key) => {
    const icons = {
      Type: "fa-tag",
      Format: "fa-file-alt",
      "Design Time": "fa-clock",
      Dimensions: "fa-ruler-combined",
    }
    return icons[key] || "fa-info"
  }

  if (loading) return <div className="dp-loading">Loading...</div>
  if (error) return <div className="dp-error">{error}</div>
  if (!card) return null

  const displayedReviews = card.reviews.slice(0, reviewsPage * reviewsPerPage)
  const ratingBars = calculateRatingBars()

  return (
    <>
      <Navbar />
      <EstimateSidebar />
      <div className="dp-container">
        <nav className="dp-breadcrumb">
          <a href="/">Home</a> {" > "} <a href="/services/cards">Wedding Cards</a> {" > "} <span>{card.name}</span>
        </nav>

        <div className="dp-nav-section">
          <ul>
            {["Details", "Pricing", "Reviews"].map((tab) => (
              <li key={tab}>
                <a
                  href={`#dp-section-${tab.toLowerCase()}`}
                  className={activeTab === tab ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault()
                    handleTabClick(tab)
                  }}
                >
                  {tab}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="dp-section dp-section-1" id="dp-section-details">
          <div className="dp-subsection-1">
            <div className="dp-profile">
              <div className="dp-profile-img">
                <img
                  src={card.vendorBrandIcon || card.frontImage || "assets/images/default-profile.jpeg"}
                  alt="Profile"
                />
              </div>
              <div className="dp-profile-info">
                <h1>{card.name}</h1>
                <div className="dp-rating">
                  <i className="fas fa-star"></i> {card.avgRating} ({card.reviewCount})
                </div>
                <div className="dp-address">
                  <i className="fas fa-map-marker-alt"></i> {card.city}
                </div>
              </div>
            </div>
            {["type", "format", "designTime", "dimensions"].some((key) => card[key]) && (
              <div className="dp-details">
                <h3>Details</h3>
                <dl className="dp-details-grid">
                  {Object.entries({
                    Type: card.type,
                    Format: card.format?.join(", "),
                    "Design Time": card.designTime,
                    Dimensions: card.dimensions,
                  }).map(
                    ([key, value]) =>
                      value &&
                      (Array.isArray(value) ? value.length > 0 : true) && (
                        <React.Fragment key={key}>
                          <dt>
                            <i className={`fas ${getDetailIcon(key)}`}></i> {key}:
                          </dt>
                          <dd>{value}</dd>
                        </React.Fragment>
                      ),
                  )}
                </dl>
              </div>
            )}
            {card.description && (
              <div className="dp-details">
                <h3>Description</h3>
                <div className="dp-description">{card.description}</div>
              </div>
            )}
          </div>
          <div className="dp-subsection-2">
            <div className="dp-carousel">
              <div className="dp-carousel-inner">
                <div className="dp-carousel-item active">
                  <img
                    src={card.frontImage || "/placeholder.svg"}
                    alt="Card Image"
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    data-bs-toggle="modal"
                    data-bs-target="#imageModal"
                    data-src={card.frontImage || "/placeholder.svg"}
                  />
                </div>
              </div>
            </div>
            <div className="dp-price-buttons">
              <div className="dp-action-buttons">
                <button className="dp-btn" onClick={handleWhatsAppContact}>
                  <i className="fab fa-whatsapp"></i> Contact via WhatsApp
                </button>
                {card.type === "editable" && (
                  <button className="dp-btn" style={{ marginLeft: "10px" }} onClick={handleCustomize}>
                    Customize
                  </button>
                )}
              </div>
              <div className="dp-price-range">{card.pricePerCard.toLocaleString()} PKR</div>
            </div>
          </div>
        </div>

        <div className="dp-section" id="dp-section-pricing">
          <h3 className="dp-section-title">Pricing & Availability</h3>
          <div className="dp-package-details">
            <div className="dp-inclusions-section">
              <h4>Pricing</h4>
              <div className="dp-package-price">{card.pricePerCard.toLocaleString()} PKR per card</div>
              <div>Quantity Available: {card.quantityAvailable}</div>
              <div className="dp-quantity-selector">
                <button onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} disabled={quantity <= 1}>
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => Math.min(card.quantityAvailable, prev + 1))}
                  disabled={quantity >= card.quantityAvailable}
                >
                  +
                </button>
              </div>
              <button className="dp-btn" onClick={handleAddToEstimate}>
                Add to Estimate
              </button>
              <button
                className="dp-btn"
                style={{ marginLeft: "10px" }}
                onClick={() => setShowBookingModal(true)}
                disabled={card.quantityAvailable === 0}
              >
                Book Now
              </button>
              {card.quantityAvailable === 0 && (
                <span style={{ color: "red", marginLeft: "10px" }}>Out of stock</span>
              )}
            </div>
            <div className="dp-availability-section">
              <input
                type="date"
                className="dp-calendar"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
              />
              <button className="dp-btn" onClick={handleAvailabilityCheck} disabled={!date}>
                Check Availability
              </button>
            </div>
          </div>
        </div>

        <div className="dp-section" id="dp-section-reviews">
          <h3 className="dp-section-title">Reviews</h3>
          <div className="dp-review-counter">
            <div className="dp-total-rating">
              {card.avgRating} Average{" "}
              <span>
                <i className="fas fa-star"></i> ({card.reviewCount} Reviews)
              </span>
            </div>
            <div className="dp-rating-bars">
              {[5, 4, 3, 2, 1].map((stars, idx) => (
                <div key={idx} className="dp-rating-bar">
                  <span>
                    <i className="fas fa-star"></i> {stars}
                  </span>
                  <div className="dp-bar">
                    <div
                      className="dp-bar-fill"
                      style={{
                        width: `${ratingBars[5 - stars]}%`,
                        backgroundColor: card.reviews.length ? "#d7385e" : "#ccc",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dp-reviews-list">
            {displayedReviews.map((review, idx) => (
              <div key={idx} className="dp-review-item">
                <div className="dp-stars">{"★".repeat(review.stars)}</div>
                <p>
                  "{review.comment || "No comment"}" - {review.user} ({new Date(review.createdAt).toLocaleDateString()})
                </p>
              </div>
            ))}
          </div>
          {displayedReviews.length < card.reviews.length && (
            <button className="dp-btn" onClick={loadMoreReviews}>
              Load More
            </button>
          )}
        </div>
      </div>

      {showBookingModal && (
        <div className="dp-modal">
          <div className="dp-modal-dialog">
            <div className="dp-modal-content">
              <div className="dp-modal-header">
                <h5 className="dp-modal-title">Book Card</h5>
                <button type="button" className="dp-btn-close" onClick={() => setShowBookingModal(false)}>
                  ×
                </button>
              </div>
              <div className="dp-modal-body">
                <div className="mb-3">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    className="dp-calendar"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="dp-modal-footer">
                <button className="dp-btn dp-btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Close
                </button>
                <button className="dp-btn" onClick={handleBook}>
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="modal fade" id="imageModal" tabIndex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="imageModalLabel">
                Image Preview
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <img src="/placeholder.svg" id="zoomImage" alt="Zoomed Image" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default WeddingCardsDetails