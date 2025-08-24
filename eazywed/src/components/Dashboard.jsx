"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button, Modal, Form } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/dashboard.css"
import axios from "axios"
import { generateWhatsAppLink } from "../utils/whatsapp"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarActive, setSidebarActive] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    estimations: [],
    bookings: [],
    reviews: [],
  })
  
  const [pagination, setPagination] = useState({
    estimations: { page: 1, total: 0, pages: 0 },
    bookings: { page: 1, total: 0, pages: 0 },
    reviews: { page: 1, total: 0, pages: 0 }
  })
  
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  
  const [reviewData, setReviewData] = useState({
    bookingId: '',
    service_id: '',
    serviceName: '',
    rating: 5,
    comment: ''
  })

  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    estimationId: '',
    service_id: '',
    card_template_id: '',
    package_id: '',
    serviceName: '',
    eventDate: new Date().toISOString().split('T')[0],
    isFullEstimation: false // Added to track full estimation conversion
  })

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState({ id: null, type: null, service_id: null, card_template_id: null })

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (tab = activeTab, page = 1) => {
    setIsLoading(true)
    try {
      const statsRes = await api.get("/dashboard/user/stats")
      let newData = { ...dashboardData, stats: statsRes.data }
      let newPagination = { ...pagination }

      switch (tab) {
        case "dashboard":
          break
        case "estimations":
          const estimationsRes = await api.get(`/dashboard/user/estimations?page=${page}&limit=5`)
          newData = { ...newData, estimations: estimationsRes.data.data || estimationsRes.data }
          if (estimationsRes.data.pagination) {
            newPagination.estimations = estimationsRes.data.pagination
          }
          break
        case "bookings":
          const bookingsRes = await api.get(`/dashboard/user/bookings?page=${page}&limit=5`)
          newData = { ...newData, bookings: bookingsRes.data.data || bookingsRes.data }
          if (bookingsRes.data.pagination) {
            newPagination.bookings = bookingsRes.data.pagination
          }
          break
        case "reviews":
          const reviewsRes = await api.get(`/dashboard/user/reviews?page=${page}&limit=5`)
          newData = { ...newData, reviews: reviewsRes.data.data || reviewsRes.data }
          if (reviewsRes.data.pagination) {
            newPagination.reviews = reviewsRes.data.pagination
          }
          break
        default:
          break
      }

      setDashboardData(newData)
      setPagination(newPagination)
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error)
      toast.error(`Failed to load ${tab} data`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const success = await logout()
    if (success) navigate("/signin")
  }

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    fetchDashboardData(tab)
    if (window.innerWidth <= 768) {
      setSidebarActive(false)
    }
  }

  const handleChangePage = (tab, page) => {
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
    fetchDashboardData(tab, page)
  }

  const confirmDelete = (id, type, service_id = null, card_template_id = null) => {
    setDeleteItem({ id, type, service_id, card_template_id })
    setShowDeleteModal(true)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteItem({ id: null, type: null, service_id: null, card_template_id: null })
  }

  const handleDelete = async () => {
    try {
      if (deleteItem.type === 'estimation') {
        let url = `/dashboard/user/estimations/${deleteItem.id}`
        if (deleteItem.service_id) {
          url += `/services/${deleteItem.service_id}`
        } else if (deleteItem.card_template_id) {
          url += `/cards/${deleteItem.card_template_id}`
        }
        await api.delete(url)
        toast.success(deleteItem.service_id ? "Service removed from estimation" : deleteItem.card_template_id ? "Card removed from estimation" : "Estimation removed successfully")
        fetchDashboardData("estimations")
      } else if (deleteItem.type === 'booking') {
        await api.patch(`/dashboard/user/bookings/${deleteItem.id}/cancel`)
        toast.success("Booking canceled successfully")
        fetchDashboardData("bookings")
      }
      setShowDeleteModal(false)
      setDeleteItem({ id: null, type: null, service_id: null, card_template_id: null })
    } catch (error) {
      console.error(`Error ${deleteItem.type === 'estimation' ? 'removing estimation' : 'canceling booking'}:`, error)
      toast.error(error.response?.data?.message || `Failed to ${deleteItem.type === 'estimation' ? 'remove estimation' : 'cancel booking'}`)
    }
  }

  const removeEstimation = async (estimationId, service_id = null, card_template_id = null) => {
    confirmDelete(estimationId, 'estimation', service_id, card_template_id)
  }

  const cancelBooking = async (bookingId) => {
    confirmDelete(bookingId, 'booking')
  }

  const bookServiceOrCard = (estimationId, service_id = null, card_template_id = null, isFullEstimation = false) => {
    const estimation = dashboardData.estimations.find(est => est.estimation_id === estimationId)
    if (!estimation) {
      toast.error("Estimation not found")
      return
    }
    
    let itemName = '', package_id = ''
    if (!isFullEstimation) {
      if (service_id) {
        const service = estimation.services.find(svc => svc.service_id === service_id)
        if (!service) {
          toast.error("Service not found in estimation")
          return
        }
        itemName = service.name
        package_id = service.package_id
      } else if (card_template_id) {
        const card = estimation.cards.find(crd => crd.card_id === card_template_id)
        if (!card) {
          toast.error("Card not found in estimation")
          return
        }
        itemName = card.name
      }
    } else {
      itemName = `Estimation #${estimationId.substring(0, 8)}`
    }

    setBookingData({
      estimationId,
      service_id: service_id || '',
      card_template_id: card_template_id || '',
      package_id: package_id || '',
      serviceName: itemName,
      eventDate: new Date().toISOString().split('T')[0],
      isFullEstimation
    })
    setShowBookingModal(true)
  }

  const handleBookingChange = (e) => {
    const { name, value } = e.target
    setBookingData({
      ...bookingData,
      [name]: value
    })
  }

  const submitBooking = async () => {
    try {
      const estimation = dashboardData.estimations.find(est => est.estimation_id === bookingData.estimationId)
      if (!estimation) {
        toast.error("Estimation not found")
        return
      }

      let response
      if (bookingData.isFullEstimation) {
        // Convert entire estimation to bookings
        const payload = {
          estimationId: bookingData.estimationId,
          date_time: bookingData.eventDate
        }
        response = await api.post('/dashboard/user/estimations/:estimationId/convert'.replace(':estimationId', bookingData.estimationId), payload)
      } else {
        // Book single item
        let payload
        if (bookingData.service_id) {
          const service = estimation.services.find(svc => svc.service_id === bookingData.service_id)
          if (!service) throw new Error("Service not found in estimation")
          payload = {
            service_id: bookingData.service_id,
            package_id: service.package_id || bookingData.package_id,
            date_time: bookingData.eventDate,
            quantity: service.quantity || 1
          }
        } else if (bookingData.card_template_id) {
          const card = estimation.cards.find(crd => crd.card_id === bookingData.card_template_id)
          if (!card) throw new Error("Card not found in estimation")
          payload = {
            card_template_id: bookingData.card_template_id,
            date_time: bookingData.eventDate,
            quantity: card.quantity || 1
          }
        } else {
          throw new Error("Either service_id or card_template_id is required")
        }

        response = await api.post('/dashboard/user/bookings', payload)
      }

      if (response.data.message.includes("successfully")) {
        toast.success(bookingData.isFullEstimation ? "Estimation converted to bookings successfully!" : "Booking created successfully!")
        setShowBookingModal(false)
        setBookingData({
          estimationId: '',
          service_id: '',
          card_template_id: '',
          package_id: '',
          serviceName: '',
          eventDate: new Date().toISOString().split('T')[0],
          isFullEstimation: false
        })
        await fetchDashboardData("bookings")
        await fetchDashboardData("estimations")
      }
    } catch (error) {
      console.error("Error booking item:", error)
      const errorMsg = error.response?.data?.message || error.message || "Failed to book item"
      if (errorMsg === "You cannot book your own service or card") {
        toast.error("You cannot book your own service or card")
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleWriteReview = (booking) => {
    setReviewData({
      bookingId: booking.booking_id,
      service_id: booking.service_id,
      serviceName: booking.name,
      rating: 5,
      comment: ''
    })
    setShowReviewModal(true)
  }

  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setReviewData({
      ...reviewData,
      [name]: value
    })
  }

  const submitReview = async (e) => {
    e.preventDefault()
    
    if (!reviewData.bookingId || !reviewData.rating) {
      toast.error("Please provide all required information")
      return
    }
    
    try {
      await api.post('/dashboard/user/reviews', {
        bookingId: reviewData.bookingId,
        rating: parseInt(reviewData.rating),
        comment: reviewData.comment
      })
      
      toast.success("Review submitted successfully")
      setShowReviewModal(false)
      fetchDashboardData("reviews")
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error(error.response?.data?.message || "Failed to submit review")
    }
  }

  const chatVendor = (vendorPhone, serviceName) => {
    const whatsappLink = generateWhatsAppLink(vendorPhone, `Inquiry about ${serviceName}`)
    window.open(whatsappLink, "_blank")
  }

  // Chart data preparation
  const { stats } = dashboardData

  const bookingStatusData = [
    { name: 'Pending', value: stats.pendingBookings || 0, color: '#FF6B6B' },
    { name: 'Confirmed', value: stats.confirmedBookings || 0, color: '#4ECDC4' },
    { name: 'Completed', value: stats.completedBookings || 0, color: '#45B7D1' }
  ]

  const estimationTrendData = [
    { month: 'Jan', estimations: Math.floor(Math.random() * 20) + 5, cost: Math.floor(Math.random() * 50000) + 10000 },
    { month: 'Feb', estimations: Math.floor(Math.random() * 20) + 5, cost: Math.floor(Math.random() * 50000) + 10000 },
    { month: 'Mar', estimations: Math.floor(Math.random() * 20) + 5, cost: Math.floor(Math.random() * 50000) + 10000 },
    { month: 'Apr', estimations: Math.floor(Math.random() * 20) + 5, cost: Math.floor(Math.random() * 50000) + 10000 },
    { month: 'May', estimations: Math.floor(Math.random() * 20) + 5, cost: Math.floor(Math.random() * 50000) + 10000 },
    { month: 'Jun', estimations: stats.estimations || 0, cost: stats.totalEstimationCost || 0 }
  ]

  const activityData = [
    { name: 'Estimations', value: stats.estimations || 0, color: '#FF6B6B' },
    { name: 'Bookings', value: stats.bookings || 0, color: '#4ECDC4' },
    { name: 'Reviews', value: stats.reviews || 0, color: '#45B7D1' }
  ]

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <button className="hamburger" id="hamburgerToggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      <div className={`sidebar user-sidebar ${sidebarActive ? "active" : ""}`} id="sidebar">
        <a href="/" className="sidebar-logo">
          EazyWed
        </a>
        <ul className="sidebar-nav">
          <li>
            <a
              href="#"
              className={activeTab === "dashboard" ? "active" : ""}
              onClick={() => handleTabChange("dashboard")}
            >
              <i className="fas fa-home"></i> Dashboard
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "estimations" ? "active" : ""}
              onClick={() => handleTabChange("estimations")}
            >
              <i className="fas fa-calculator"></i> Estimations
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "bookings" ? "active" : ""}
              onClick={() => handleTabChange("bookings")}
            >
              <i className="fas fa-calendar-check"></i> Bookings
            </a>
          </li>
          <li>
            <a href="#" className={activeTab === "reviews" ? "active" : ""} onClick={() => handleTabChange("reviews")}>
              <i className="fas fa-star"></i> Reviews
            </a>
          </li>
          <li>
            <a href="#" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
      </div>
      <div className="main-content user-main-content" id="mainContent">
        <div className={`content-section ${activeTab === "dashboard" ? "active" : ""}`} id="dashboard">
          <div className="dashboard-header">
            <h1>Welcome, {user?.username || "User"}</h1>
            <Button className="btn-primary" onClick={() => navigate("/services")}>
              <i className="fas fa-search me-1"></i> Browse Services
            </Button>
          </div>
          
          {/* Analytics Charts */}
          <div className="row">
            {/* Activity Overview Chart */}
            <div className="col-lg-8 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Activity Overview</h3>
                  <div className="chart-stats">
                    <span className="total-count">{(stats.estimations || 0) + (stats.bookings || 0) + (stats.reviews || 0)}</span>
                    <span className="total-label">Total Activities</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '10px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]}>
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Booking Status Distribution */}
            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Booking Status</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.bookings || 0}</span>
                    <span className="total-label">Total Bookings</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '10px',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {bookingStatusData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-text">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Estimation Trend */}
            <div className="col-lg-8 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Estimation Trends</h3>
                  <div className="chart-stats">
                    <span className="total-count">PKR {(stats.totalEstimationCost || 0).toLocaleString()}</span>
                    <span className="total-label">Total Value</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={estimationTrendData}>
                    <defs>
                      <linearGradient id="colorEstimations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '10px',
                        color: '#fff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="estimations" 
                      stroke="#FF6B6B" 
                      fillOpacity={1} 
                      fill="url(#colorEstimations)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reviews Rating Chart */}
            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Review Performance</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.avgRating?.toFixed(1) || '0.0'}</span>
                    <span className="total-label">Avg Rating</span>
                  </div>
                </div>
                <div className="rating-display">
                  <div className="rating-circle">
                    <div className="rating-value">{stats.avgRating?.toFixed(1) || '0.0'}</div>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i 
                          key={star} 
                          className={`fas fa-star ${star <= (stats.avgRating || 0) ? 'active' : ''}`}
                        ></i>
                      ))}
                    </div>
                    <div className="rating-count">{stats.reviews || 0} Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`content-section ${activeTab === "estimations" ? "active" : ""}`} id="estimations">
          <div className="dashboard-header">
            <h1>Estimations</h1>
            <Button className="btn-primary" onClick={() => navigate("/services")}>
              <i className="fas fa-plus-circle me-1"></i> Add Services
            </Button>
          </div>
          <div className="card">
            {dashboardData.estimations.length > 0 ? (
              dashboardData.estimations.map((estimation) => (
                <div key={estimation.estimation_id} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4>Estimation #{estimation.estimation_id.substring(0, 8)}</h4>
                    <Button
                      variant="primary"
                      className="btn-custom"
                      onClick={() => bookServiceOrCard(estimation.estimation_id, null, null, true)}
                      title="Convert Entire Estimation to Bookings"
                    >
                      <i className="fas fa-calendar-check me-1"></i> Convert to Bookings
                    </Button>
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Package</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimation.services.map((service) => (
                          <tr key={service.service_id}>
                            <td>{service.name}</td>
                            <td>{service.package_name || 'N/A'}</td>
                            <td>PKR {service.package_price.toLocaleString()}</td>
                            <td>{service.quantity}</td>
                            <td>PKR {(service.package_price * service.quantity).toLocaleString()}</td>
                            <td>
                              <div className="action-icons">
                                <Button
                                  variant="link"
                                  className="action-btn remove"
                                  onClick={() => removeEstimation(estimation.estimation_id, service.service_id)}
                                  title="Remove"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                                <Button
                                  variant="link"
                                  className="action-btn book"
                                  onClick={() => bookServiceOrCard(estimation.estimation_id, service.service_id)}
                                  title="Book Service"
                                >
                                  <i className="fas fa-calendar-check"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {estimation.cards.map((card) => (
                          <tr key={card.card_id}>
                            <td>{card.name}</td>
                            <td>N/A</td>
                            <td>PKR {card.price_per_card.toLocaleString()}</td>
                            <td>{card.quantity}</td>
                            <td>PKR {(card.price_per_card * card.quantity).toLocaleString()}</td>
                            <td>
                              <div className="action-icons">
                                <Button
                                  variant="link"
                                  className="action-btn remove"
                                  onClick={() => removeEstimation(estimation.estimation_id, null, card.card_id)}
                                  title="Remove"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                                <Button
                                  variant="link"
                                  className="action-btn book"
                                  onClick={() => bookServiceOrCard(estimation.estimation_id, null, card.card_id)}
                                  title="Book Card"
                                >
                                  <i className="fas fa-calendar-check"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-between mt-3">
                    <h5>Total: PKR {estimation.total_cost.toLocaleString()}</h5>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p>No estimations found. Browse services to create an estimation.</p>
                <Button variant="primary" onClick={() => navigate("/services")}>
                  <i className="fas fa-search me-1"></i> Browse Services
                </Button>
              </div>
            )}
          </div>
          
          <div className="pagination-controls mt-3">
            <button 
              className="pagination-btn"
              onClick={() => handleChangePage("estimations", pagination.estimations.page - 1)}
              disabled={pagination.estimations.page <= 1}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>
            <span className="mx-2">
              Page {pagination.estimations.page} of {pagination.estimations.pages}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => handleChangePage("estimations", pagination.estimations.page + 1)}
              disabled={pagination.estimations.page >= pagination.estimations.pages}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className={`content-section ${activeTab === "bookings" ? "active" : ""}`} id="bookings">
          <div className="dashboard-header">
            <h1>Bookings</h1>
            <Button className="btn-primary" onClick={() => navigate("/services")}>
              <i className="fas fa-plus-circle me-1"></i> Book New Service
            </Button>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Service/Card</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.bookings.length > 0 ? (
                    dashboardData.bookings.map((booking) => (
                      <tr key={booking.booking_id}>
                        <td>{booking.name}</td>
                        <td>{booking.status}</td>
                        <td>{new Date(booking.date).toLocaleDateString()}</td>
                        <td>PKR {booking.price?.toLocaleString() || "N/A"}</td>
                        <td>
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className="action-btn chat"
                              onClick={() => chatVendor(booking.vendor_phone, booking.name)}
                              title="Chat with Vendor"
                            >
                              <i className="fab fa-whatsapp"></i>
                            </Button>
                            {booking.status === "pending" && (
                              <Button 
                                variant="link" 
                                className="action-btn cancel"
                                onClick={() => cancelBooking(booking.booking_id)}
                                title="Cancel Booking"
                              >
                                <i className="fas fa-times-circle"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="pagination-controls mt-3">
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("bookings", pagination.bookings.page - 1)}
                disabled={pagination.bookings.page <= 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="mx-2">
                Page {pagination.bookings.page} of {pagination.bookings.pages}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("bookings", pagination.bookings.page + 1)}
                disabled={pagination.bookings.page >= pagination.bookings.pages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div className={`content-section ${activeTab === "reviews" ? "active" : ""}`} id="reviews">
          <div className="dashboard-header">
            <h1>Reviews</h1>
          </div>
          <div className="card">
            {dashboardData.reviews.length > 0 ? (
              dashboardData.reviews.map((item) => (
                <div key={item.booking_id} className="mb-4 p-3 border-bottom">
                  <h5>Completed Booking: {item.name}</h5>
                  <p>Date: {new Date(item.date).toLocaleDateString()}</p>
                  {item.review ? (
                    <div className="mt-3 p-3 bg-light rounded">
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">Rating:</span>
                        <span className="text-warning">{Array(item.review.rating).fill("★").join("")}</span>
                        <span className="text-muted">
                          {Array(5 - item.review.rating)
                            .fill("☆")
                            .join("")}
                        </span>
                      </div>
                      <p className="mb-0">
                        <strong>Comment:</strong> {item.review.comment || "No comment provided"}
                      </p>
                      <small className="text-muted">
                        Submitted on {new Date(item.review.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p>You haven't reviewed this service yet.</p>
                      <Button
                        variant="primary"
                        className="btn-custom"
                        onClick={() => handleWriteReview(item)}
                      >
                        <i className="fas fa-star me-1"></i> Write a Review
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p>No completed bookings found to review.</p>
              </div>
            )}
            
            <div className="pagination-controls mt-3">
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("reviews", pagination.reviews.page - 1)}
                disabled={pagination.reviews.page <= 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="mx-2">
                Page {pagination.reviews.page} of {pagination.reviews.pages}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("reviews", pagination.reviews.page + 1)}
                disabled={pagination.reviews.page >= pagination.reviews.pages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header>
          <Modal.Title>Review for {reviewData.serviceName}</Modal.Title>
          <button className="custom-close-btn" onClick={() => setShowReviewModal(false)}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitReview}>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <Form.Select
                value={reviewData.rating}
                onChange={handleReviewChange}
                name="rating"
              >
                <option value="5">5 Stars - Excellent</option>
                <option value="4">4 Stars - Very Good</option>
                <option value="3">3 Stars - Good</option>
                <option value="2">2 Stars - Fair</option>
                <option value="1">1 Star - Poor</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reviewData.comment}
                onChange={handleReviewChange}
                name="comment"
                placeholder="Share your experience with this service..."
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              <i className="fas fa-paper-plane me-1"></i> Submit Review
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            <i className="fas fa-times me-1"></i> Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header>
          <Modal.Title>Book: {bookingData.serviceName}</Modal.Title>
          <button className="custom-close-btn" onClick={() => setShowBookingModal(false)}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Event Date</Form.Label>
              <Form.Control
                type="date"
                name="eventDate"
                value={bookingData.eventDate}
                onChange={handleBookingChange}
                min={new Date().toISOString().split('T')[0]}
              />
              <Form.Text className="text-muted">
                Select the date for your event
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitBooking}>
            Confirm Booking
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={cancelDelete} centered>
        <Modal.Header>
          <Modal.Title>Confirm Delete</Modal.Title>
          <button className="custom-close-btn" onClick={cancelDelete}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to {deleteItem.type === 'estimation' ? 'remove this estimation' : 'cancel this booking'}? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            <i className="fas fa-times me-1"></i> Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i className="fas fa-trash me-1"></i> {deleteItem.type === 'estimation' ? 'Remove' : 'Cancel Booking'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default Dashboard