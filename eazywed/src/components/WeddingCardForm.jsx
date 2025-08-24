"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/card-form.css"
import createAPI from "../utils/api"

const WeddingCardForm = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { cardId } = useParams()
  const isEditMode = !!cardId
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cardType, setCardType] = useState("static")
  const [formData, setFormData] = useState({
    type: "static",
    name: "",
    price_per_card: "",
    quantity_available: "",
    city: "",
    format: [],
    design_time: "",
    description: "",
  })
  const [frontImage, setFrontImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [cardSettings, setCardSettings] = useState(null)

  const api = createAPI(navigate)

  useEffect(() => {
    if (isEditMode && cardId) {
      fetchCardData()
    }
  }, [cardId])

  const fetchCardData = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/vendor/dashboard/cards/${cardId}`)
      const card = response.data

      console.log("Fetched card data:", card)

      setCardType(card.type)

      setFormData({
        type: card.type,
        name: card.name || "",
        price_per_card: card.price_per_card,
        quantity_available: card.quantity_available,
        city: card.city || "",
        format: Array.isArray(card.format) ? card.format : [card.format],
        design_time: card.design_time,
        description: card.description || "",
      })

      if (card.type === "editable" && card.settings) {
        console.log("Found card settings:", card.settings)
        
        let parsedSettings = card.settings
        if (typeof card.settings === 'string') {
          try {
            parsedSettings = JSON.parse(card.settings)
            console.log("Successfully parsed settings:", parsedSettings)
          } catch (error) {
            console.error("Error parsing settings:", error)
            toast.error("Card settings format is invalid")
          }
        }
        
        setCardSettings(parsedSettings)
      } else {
        console.log("No settings found or card is not editable type")
      }

      if (card.front_image) {
        setImagePreview(card.front_image)
      }
    } catch (error) {
      console.error("Error fetching card data:", error)
      toast.error("Failed to load card data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardTypeSelect = (type) => {
    setCardType(type)
    setFormData((prev) => ({ ...prev, type }))
    if (type === "editable") {
      setFrontImage(null)
      setImagePreview(null)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "format") {
      const formatArray = value.split(",").map(item => item.trim()).filter(item => item)
      setFormData((prev) => ({ ...prev, [name]: formatArray }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less")
      return
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Image must be JPEG, JPG, or PNG")
      return
    }

    setFrontImage(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageChange({ target: { files: [file] } })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeImage = () => {
    setFrontImage(null)
    setImagePreview(null)
  }

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      toast.error("Card name is required and must be at least 3 characters")
      return false
    }

    if (!formData.price_per_card || formData.price_per_card <= 0) {
      toast.error("Price per card must be greater than 0")
      return false
    }

    if (!formData.quantity_available || formData.quantity_available <= 0) {
      toast.error("Quantity available must be greater than 0")
      return false
    }

    if (!formData.city) {
      toast.error("City is required")
      return false
    }

    if (!formData.format || formData.format.length === 0) {
      toast.error("Format is required")
      return false
    }

    if (!formData.design_time) {
      toast.error("Design time is required")
      return false
    }

    if (!formData.description) {
      toast.error("Description is required")
      return false
    }

    if (cardType === "static" && !frontImage && !imagePreview) {
      toast.error("Front image is required for static cards")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (cardType === "editable") {
      const formattedData = {
        ...formData,
        format: formData.format
      }

      if (isEditMode) {
        console.log("Navigating to editor with existing card settings:", cardSettings)
        navigate(`/vendor/card-editor`, {
          state: {
            cardId,
            formData: formattedData,
            cardSettings: cardSettings
          }
        })
      } else {
        navigate(`/vendor/card-editor`, {
          state: {
            formData: formattedData
          }
        })
      }
      return
    }

    const cardFormData = new FormData()
    cardFormData.append("type", cardType)
    cardFormData.append("name", formData.name)
    cardFormData.append("price_per_card", formData.price_per_card)
    cardFormData.append("quantity_available", formData.quantity_available)
    cardFormData.append("city", formData.city)
    cardFormData.append("design_time", formData.design_time)
    cardFormData.append("description", formData.description)

    formData.format.forEach(format => {
      cardFormData.append("format", format)
    })

    if (frontImage) {
      cardFormData.append("front_image", frontImage)
    }

    try {
      setIsSubmitting(true)
      
      let response
      if (isEditMode) {
        response = await api.put(`/vendor/dashboard/cards/${cardId}`, cardFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        toast.success("Card updated successfully")
      } else {
        response = await api.post("/vendor/dashboard/cards", cardFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        toast.success("Card created successfully")
      }

      console.log("Card response:", response.data)
      
      setTimeout(() => {
        navigate("/vendor/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error submitting card:", error)
      toast.error(error.response?.data?.message || "Failed to submit card")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFormatDisplayValue = () => {
    return formData.format.join(", ")
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading card data...</p>
      </div>
    )
  }

  return (
    <div className="service-form-container">
      <div className="service-form-card">
        <h1>{isEditMode ? "Edit Wedding Card" : "Add Wedding Card"}</h1>

        {!isEditMode && (
          <div className="card-type-selection">
            <div
              className={`card-type ${cardType === "static" ? "selected" : ""}`}
              onClick={() => handleCardTypeSelect("static")}
            >
              <i className="fas fa-envelope"></i>
              <p>Non-Editable Card</p>
              <small>Upload a pre-designed card image</small>
            </div>
            <div
              className={`card-type ${cardType === "editable" ? "selected" : ""}`}
              onClick={() => handleCardTypeSelect("editable")}
            >
              <i className="fas fa-edit"></i>
              <p>Editable Card</p>
              <small>Create a customizable card in our editor</small>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {cardType === "static" && (
            <div className="form-group">
              <label htmlFor="front_image">Card Image (max 5MB) *</label>
              <div
                className="image-upload-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  id="front_image"
                  onChange={handleImageChange}
                  accept="image/jpeg,image/jpg,image/png"
                />
                <label htmlFor="front_image">
                  <i className="fas fa-upload upload-icon"></i>
                  <span>Click to upload or drag and drop an image</span>
                </label>
                <p className="upload-placeholder">JPEG, JPG, PNG (max 5MB)</p>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Card Preview" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={removeImage}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Card Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Elegant Floral Wedding Card"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price_per_card">Price Per Card (PKR) *</label>
            <input
              type="number"
              id="price_per_card"
              name="price_per_card"
              value={formData.price_per_card}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g., 500"
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity_available">Quantity Available *</label>
            <input
              type="number"
              id="quantity_available"
              name="quantity_available"
              value={formData.quantity_available}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g., 100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City *</label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            >
              <option value="">Select City</option>
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="format">Format (comma-separated) *</label>
            <input
              type="text"
              id="format"
              name="format"
              value={getFormatDisplayValue()}
              onChange={handleChange}
              required
              placeholder="e.g., PNG, JPG, PDF"
            />
          </div>

          <div className="form-group">
            <label htmlFor="design_time">Design Time *</label>
            <input
              type="text"
              id="design_time"
              name="design_time"
              value={formData.design_time}
              onChange={handleChange}
              required
              placeholder="e.g., 7-8 Days"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your card design, include any special details or customization options"
              rows="4"
            ></textarea>
          </div>

          <div className="form-actions">
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/vendor/dashboard")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : cardType === "editable" ? (
                isEditMode ? "Continue to Editor" : "Continue to Editor"
              ) : isEditMode ? (
                "Update Card"
              ) : (
                "Create Card"
              )}
            </Button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  )
}

export default WeddingCardForm