"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/card-form.css"
import axios from "axios"

const WeddingServicesForm = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const isEditMode = !!serviceId
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    city: "",
    address: "",
    location_map: "",
    description: "",
    additional_info: "",
    price_range: "",
    discount: "",
    discount_expiry: "",
    working_hours: "",
    working_days: [],
    details: {},
    pricing_packages: [{ name: "", price: "", inclusions: "" }],
  })
  const [photos, setPhotos] = useState([])
  const [photoPreview, setPhotoPreview] = useState([])

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true,
  })

  const categoryFields = {
    // Same as provided, unchanged
    Photographers: [
      {
        id: "expertise",
        label: "Expertise *",
        type: "select",
        multiple: true,
        options: ["Weddings", "Birthdays", "Corporate", "Parties", "Engagements"],
        required: true,
      },
      {
        id: "staff",
        label: "Staff Gender *",
        type: "select",
        multiple: true,
        options: ["Male", "Female"],
        required: true,
      },
      {
        id: "cities_covered",
        label: "Cities Covered *",
        type: "text",
        placeholder: "e.g., Lahore, Islamabad",
        required: true,
      },
      {
        id: "cancellation_policy",
        label: "Cancellation Policy *",
        type: "select",
        options: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
        required: true,
      },
    ],
    "Wedding Venues": [
      {
        id: "venue_type",
        label: "Venue Type *",
        type: "select",
        options: ["Hall", "Marquee", "Banquet", "Outdoor"],
        required: true,
      },
      { id: "amenities", label: "Amenities", type: "text", placeholder: "e.g., Decor, Sound, BBQ" },
      { id: "parking_space", label: "Parking Space (vehicles)", type: "number" },
      {
        id: "catering_type",
        label: "Catering Type *",
        type: "select",
        options: ["Internal", "External"],
        required: true,
      },
      {
        id: "wheelchair_accessible",
        label: "Wheelchair Accessible *",
        type: "select",
        options: ["true", "false"],
        required: true,
      },
      {
        id: "staff",
        label: "Staff Gender *",
        type: "select",
        multiple: true,
        options: ["Male", "Female"],
        required: true,
      },
      {
        id: "cancellation_policy",
        label: "Cancellation Policy *",
        type: "select",
        options: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
        required: true,
      },
    ],
    "Bridal Makeup": [
      {
        id: "services_for",
        label: "Services For *",
        type: "select",
        multiple: true,
        options: ["Male", "Female"],
        required: true,
      },
      {
        id: "location_type",
        label: "Location Type *",
        type: "select",
        options: ["Salon", "Home", "Studio"],
        required: true,
      },
      {
        id: "staff",
        label: "Staff Gender *",
        type: "select",
        multiple: true,
        options: ["Male", "Female"],
        required: true,
      },
      {
        id: "home_service",
        label: "Home Service Available *",
        type: "select",
        options: ["true", "false"],
        required: true,
      },
      {
        id: "expertise",
        label: "Expertise *",
        type: "select",
        multiple: true,
        options: ["Weddings", "Parties", "Engagements"],
        required: true,
      },
      {
        id: "cities_covered",
        label: "Cities Covered *",
        type: "text",
        placeholder: "e.g., Lahore, Islamabad",
        required: true,
      },
      {
        id: "cancellation_policy",
        label: "Cancellation Policy *",
        type: "select",
        options: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
        required: true,
      },
    ],
    "Henna Artists": [
      {
        id: "services_for",
        label: "Services For *",
        type: "select",
        multiple: true,
        options: ["Male", "Female"],
        required: true,
      },
      {
        id: "mehndi_type",
        label: "Mehndi Type *",
        type: "select",
        options: ["Organic/Natural", "Artificial", "Chemical"],
        required: true,
      },
      {
        id: "expertise",
        label: "Expertise *",
        type: "select",
        multiple: true,
        options: ["Arabic", "Indian", "Modern"],
        required: true,
      },
      { id: "has_team", label: "Has Team *", type: "select", options: ["true", "false"], required: true },
      { id: "sells_mehndi", label: "Sells Mehndi *", type: "select", options: ["true", "false"], required: true },
      {
        id: "cities_covered",
        label: "Cities Covered *",
        type: "text",
        placeholder: "e.g., Lahore, Islamabad",
        required: true,
      },
      {
        id: "cancellation_policy",
        label: "Cancellation Policy *",
        type: "select",
        options: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
        required: true,
      },
    ],
    "Bridal Wear": [
      { id: "material", label: "Material *", type: "text", placeholder: "e.g., Net, Silk", required: true },
      { id: "size", label: "Size *", type: "select", options: ["S", "M", "L", "XL"], required: true },
      { id: "length", label: "Length (inches) *", type: "number", required: true },
      { id: "bust", label: "Bust (inches) *", type: "number", required: true },
      { id: "design", label: "Design *", type: "text", placeholder: "e.g., Front cut with lehnga", required: true },
      {
        id: "rental_duration",
        label: "Rental Duration (days, e.g., 5-12) *",
        type: "text",
        placeholder: "e.g., 5-12",
        required: true,
      },
      {
        id: "cancellation_policy",
        label: "Cancellation Policy *",
        type: "select",
        options: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
        required: true,
      },
    ],
    "Car Rental": [
      { id: "seats", label: "Seats *", type: "number", required: true },
      { id: "doors", label: "Doors *", type: "number", required: true },
      { id: "transmission", label: "Transmission *", type: "select", options: ["auto", "manual"], required: true },
      {
        id: "cancellation_policy",
        label: "Cancellation Policy *",
        type: "select",
        options: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
        required: true,
      },
    ],
  }

  useEffect(() => {
    if (isEditMode) {
      fetchServiceData()
    }
  }, [serviceId])

  const fetchServiceData = async () => {
    try {
      const response = await api.get(`/vendor/dashboard/services/${serviceId}`)
      const service = response.data

      setFormData({
        category: service.category,
        name: service.name,
        city: service.city || "",
        address: service.address || "",
        location_map: service.location_map || "",
        description: service.description,
        additional_info: service.additional_info || "",
        price_range: service.price_range,
        discount: service.discount || "",
        discount_expiry: service.discount_expiry ? new Date(service.discount_expiry).toISOString().split("T")[0] : "",
        working_hours: service.availability.working_hours,
        working_days: service.availability.working_days,
        details: service.details || {},
        pricing_packages:
          service.pricing_packages.length > 0 ? service.pricing_packages : [{ name: "", price: "", inclusions: "" }],
      })

      setPhotoPreview(service.photos)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching service:", error)
      toast.error("Failed to load service data")
      navigate("/vendor/dashboard")
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === "working_days") {
      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
      setFormData((prev) => ({
        ...prev,
        working_days: selectedOptions,
      }))
    } else if (name.startsWith("details.")) {
      const fieldName = name.split(".")[1]

      if (type === "select-multiple") {
        const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [fieldName]: selectedOptions,
          },
        }))
      } else if (
        fieldName === "wheelchair_accessible" ||
        fieldName === "home_service" ||
        fieldName === "has_team" ||
        fieldName === "sells_mehndi"
      ) {
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [fieldName]: value === "true",
          },
        }))
      } else if (fieldName === "rental_duration") {
        const durationArray = value.split("-").map(Number)
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [fieldName]: durationArray,
          },
        }))
      } else if (type === "number") {
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [fieldName]: Number(value),
          },
        }))
      } else if (fieldName === "cities_covered" || fieldName === "amenities") {
        const valuesArray = value.split(",").map((item) => item.trim())
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [fieldName]: valuesArray,
          },
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [fieldName]: value,
          },
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handlePackageChange = (index, field, value) => {
    const updatedPackages = [...formData.pricing_packages]
    updatedPackages[index][field] = field === "price" ? Number(value) : value
    setFormData((prev) => ({
      ...prev,
      pricing_packages: updatedPackages,
    }))
  }

  const addPackage = () => {
    setFormData((prev) => ({
      ...prev,
      pricing_packages: [...prev.pricing_packages, { name: "", price: "", inclusions: "" }],
    }))
  }

  const removePackage = (index) => {
    if (formData.pricing_packages.length > 1) {
      const updatedPackages = [...formData.pricing_packages]
      updatedPackages.splice(index, 1)
      setFormData((prev) => ({
        ...prev,
        pricing_packages: updatedPackages,
      }))
    }
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)

    if (photos.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 photos")
      return
    }

    const validFiles = [...photos]
    const validPreviews = [...photoPreview]

    files.forEach((file) => {
      if (file.size > 500 * 1024) {
        toast.error(`File ${file.name} exceeds the 500KB limit`)
        return
      }

      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        toast.error(`File ${file.name} must be JPEG, JPG, or PNG`)
        return
      }

      validFiles.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        validPreviews.push(e.target.result)
        setPhotoPreview([...validPreviews])
      }
      reader.readAsDataURL(file)
    })

    setPhotos(validFiles)
  }

  const removePhoto = (index) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    const updatedPreviews = photoPreview.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    setPhotoPreview(updatedPreviews)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    handlePhotoChange({ target: { files } })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const validateForm = () => {
    if (!formData.category) {
      toast.error("Please select a category")
      return false
    }

    if (!formData.name) {
      toast.error("Service name is required")
      return false
    }

    if (!formData.city) {
      toast.error("City is required")
      return false
    }

    if (!formData.description) {
      toast.error("Description is required")
      return false
    }

    if (!formData.price_range || !/^\d+-\d+$/.test(formData.price_range)) {
      toast.error("Price range must be in the format min-max (e.g., 1000-3000)")
      return false
    }

    if (!formData.working_hours) {
      toast.error("Working hours are required")
      return false
    }

    if (!formData.working_days.length) {
      toast.error("Please select at least one working day")
      return false
    }

    if (!isEditMode && photos.length === 0) {
      toast.error("Please upload at least one photo")
      return false
    }

    const fields = categoryFields[formData.category] || []
    for (const field of fields) {
      if (field.required) {
        const value = formData.details[field.id]
        if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          toast.error(`${field.label.replace(" *", "")} is required`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const serviceFormData = new FormData()

      serviceFormData.append("category", formData.category)
      serviceFormData.append("name", formData.name)
      serviceFormData.append("city", formData.city)
      serviceFormData.append("address", formData.address)
      serviceFormData.append("location_map", formData.location_map || "")
      serviceFormData.append("description", formData.description)
      serviceFormData.append("additional_info", formData.additional_info || "")
      serviceFormData.append("price_range", formData.price_range)
      serviceFormData.append("discount", formData.discount || "0")
      
      if (formData.discount_expiry) {
        serviceFormData.append("discount_expiry", formData.discount_expiry)
      }
      
      serviceFormData.append("availability[working_hours]", formData.working_hours)
      formData.working_days.forEach(day => {
        serviceFormData.append("availability[working_days][]", day)
      })
      
      photos.forEach(photo => {
        serviceFormData.append("photos", photo)
      })
      
      formData.pricing_packages.forEach((pkg, index) => {
        if (pkg.name && pkg.price) {
          serviceFormData.append(`pricing_packages[${index}][name]`, pkg.name)
          serviceFormData.append(`pricing_packages[${index}][price]`, pkg.price)
          serviceFormData.append(`pricing_packages[${index}][inclusions]`, pkg.inclusions || "")
        }
      })
      
      for (const [key, value] of Object.entries(formData.details)) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            serviceFormData.append(`details[${key}][]`, item)
          })
        } else if (value !== null && value !== undefined) {
          serviceFormData.append(`details[${key}]`, value)
        }
      }

      let response
      if (isEditMode) {
        response = await api.put(`/vendor/dashboard/services/${serviceId}`, serviceFormData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        toast.success("Service updated successfully and is awaiting approval.")
      } else {
        response = await api.post("/vendor/dashboard/services", serviceFormData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        toast.success("Service created successfully and is awaiting approval.")
      }

      setTimeout(() => {
        navigate("/vendor/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Service submission error:", error)
      
      if (error.response?.status === 500) {
        toast.error("Server error. The service could not be saved. Please try again later or contact support.")
      } else if (error.response?.status === 413) {
        toast.error("The photos you uploaded are too large. Please resize them and try again.")
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || "Invalid service data. Please check your inputs and try again.")
      } else if (error.response?.status === 401) {
        toast.error("Your session has expired. Please log in again.")
        setTimeout(() => logout(), 2000)
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to submit service. Please check your connection and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && isEditMode) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading service data...</p>
      </div>
    )
  }

  return (
    <div className="service-form-container">
      <div className="service-form-card">
        <h1>{isEditMode ? "Edit Service" : "Add Wedding Service"}</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={isEditMode}
            >
              <option value="">Select Category</option>
              <option value="Photographers">Photographers</option>
              <option value="Wedding Venues">Wedding Venues</option>
              <option value="Bridal Makeup">Bridal Makeup</option>
              <option value="Henna Artists">Henna Artists</option>
              <option value="Bridal Wear">Bridal Wear</option>
              <option value="Car Rental">Car Rental</option>
            </select>
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
            <label htmlFor="photos">Photos (1-5, max 500KB each) *</label>
            <div
              className="photo-upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                id="photos"
                onChange={handlePhotoChange}
                multiple
                accept="image/jpeg,image/jpg,image/png"
              />
              <label htmlFor="photos">
                <i className="fas fa-upload upload-icon"></i>
                <span>Click to upload or drag and drop photos</span>
              </label>
              <p className="upload-placeholder">JPEG, JPG, PNG (max 500KB each, up to 5 photos)</p>
              <div className="photo-preview">
                {photoPreview.map((src, index) => (
                  <div key={index} className="preview-item">
                    <img src={src} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-photo"
                      onClick={() => removePhoto(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Service Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Moon's Photography"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="e.g., 123 Main St, Lahore"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location_map">Location Map URL</label>
            <input
              type="text"
              id="location_map"
              name="location_map"
              value={formData.location_map}
              onChange={handleChange}
              placeholder="e.g., Google Maps URL"
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
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="additional_info">Additional Information</label>
            <textarea
              id="additional_info"
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="price_range">Price Range (PKR, e.g., 1000-3000) *</label>
            <input
              type="text"
              id="price_range"
              name="price_range"
              value={formData.price_range}
              onChange={handleChange}
              required
              placeholder="e.g., 1000-3000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="discount">Discount (%)</label>
            <input
              type="number"
              id="discount"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="discount_expiry">Discount Expiry</label>
            <input
              type="date"
              id="discount_expiry"
              name="discount_expiry"
              value={formData.discount_expiry}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="working_hours">Working Hours *</label>
            <input
              type="text"
              id="working_hours"
              name="working_hours"
              value={formData.working_hours}
              onChange={handleChange}
              required
              placeholder="e.g., 9 AM - 5 PM"
            />
          </div>

          <div className="form-group">
            <label htmlFor="working_days">Working Days *</label>
            <select
              id="working_days"
              name="working_days"
              value={formData.working_days}
              onChange={handleChange}
              multiple
              required
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          {formData.category && (
            <div className="category-specific-fields">
              <h3>Category-Specific Details</h3>
              {(categoryFields[formData.category] || []).map((field) => (
                <div className="form-group" key={field.id}>
                  <label htmlFor={field.id}>{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      id={field.id}
                      name={`details.${field.id}`}
                      value={formData.details[field.id] || (field.multiple ? [] : "")}
                      onChange={handleChange}
                      multiple={field.multiple}
                      required={field.required}
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      id={field.id}
                      name={`details.${field.id}`}
                      value={formData.details[field.id] || ""}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pricing-packages">
            <h3>Pricing Packages</h3>
            {formData.pricing_packages.map((pkg, index) => (
              <div className="package-row" key={index}>
                <div className="form-group">
                  <label>Package Name</label>
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) => handlePackageChange(index, "name", e.target.value)}
                    placeholder="e.g., Basic Package"
                  />
                </div>
                <div className="form-group">
                  <label>Price (PKR)</label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => handlePackageChange(index, "price", e.target.value)}
                    placeholder="e.g., 10000"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Inclusions</label>
                  <input
                    type="text"
                    value={pkg.inclusions}
                    onChange={(e) => handlePackageChange(index, "inclusions", e.target.value)}
                    placeholder="e.g., 2 hours, 100 photos"
                  />
                </div>
                {formData.pricing_packages.length > 1 && (
                  <button type="button" className="remove-package-btn" onClick={() => removePackage(index)}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-package-btn" onClick={addPackage}>
              <i className="fas fa-plus"></i> Add Package
            </button>
          </div>

          <div className="form-actions">
            <Button variant="outline-secondary" onClick={() => navigate("/vendor/dashboard")} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Submitting..." : isEditMode ? "Update Service" : "Create Service"}
            </Button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  )
}

export default WeddingServicesForm