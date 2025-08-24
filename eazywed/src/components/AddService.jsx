
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "react-bootstrap"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/add-service.css"
// import "../styles/dashboard.css"


const AddService = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serviceType, setServiceType] = useState(null)
  const queryParams = new URLSearchParams(location.search)
  const typeParam = queryParams.get("type")

  useEffect(() => {
    // If type is specified in URL, set it directly
    if (typeParam === "card") {
      setServiceType("wedding-card-services")
    }
  }, [typeParam])

  const handleSelectService = (type) => {
    setServiceType(type)
  }

  const handleContinue = () => {
    if (serviceType === "wedding-services") {
      navigate("/vendor/wedding-services-form")
    } else if (serviceType === "wedding-card-services") {
      navigate("/vendor/wedding-card-form")
    }
  }

  return (
    <div className="add-service-container">
      <div className="add-service-card">
        <h1>Select Service Type</h1>
        <div className="service-options">
          <div
            className={`service-type ${serviceType === "wedding-services" ? "selected" : ""}`}
            onClick={() => handleSelectService("wedding-services")}
          >
            <i className="fas fa-ring"></i>
            <p>Wedding Services</p>
          </div>
          <div
            className={`service-type ${serviceType === "wedding-card-services" ? "selected" : ""}`}
            onClick={() => handleSelectService("wedding-card-services")}
          >
            <i className="fas fa-envelope"></i>
            <p>Wedding Card Services</p>
          </div>
        </div>
        <Button className="continue-button" disabled={!serviceType} onClick={handleContinue}>
          Continue
        </Button>
        <div className="text-center mt-3">
          <Button variant="outline-secondary" onClick={() => navigate("/vendor/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  )
}

export default AddService