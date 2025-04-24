






"use client"

import { useState } from "react"
import "../styles/custom.css"

function OTPModal({ show, onHide, onVerify, phone, error: externalError }) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(externalError)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onVerify(otp)
      onHide()
    } catch (err) {
      setError(err.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`otp-modal ${show ? "show" : ""}`}>
      <div className="otp-modal-content">
        <h6>Enter OTP</h6>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter the OTP sent to your number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            required
          />
          <button className="verify-button" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
          <button className="cancel-button" type="button" onClick={onHide} disabled={loading}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

export default OTPModal
