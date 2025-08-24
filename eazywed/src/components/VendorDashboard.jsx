"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button, Modal } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/dashboard.css"
import axios from "axios"
import { generateWhatsAppLink } from "../utils/whatsapp.js"
import createAPI from "../utils/api"
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

// Import the responsive styles
import "../styles/responsive.css"

const VendorDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarActive, setSidebarActive] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      services: { total: 0, published: 0, pending: 0, rejected: 0 },
      cards: { total: 0, published: 0, pending: 0, rejected: 0 },
      bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, canceled: 0 },
      earnings: 0,
    },
    services: [],
    cards: [],
    bookings: [],
  })
  
  // Pagination state
  const [pagination, setPagination] = useState({
    services: { page: 1, total: 0, pages: 0 },
    cards: { page: 1, total: 0, pages: 0 },
    bookings: { page: 1, total: 0, pages: 0 }
  })
  
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState({ id: null, type: null })

  // Use the centralized API instance
  const api = createAPI(navigate)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (tab = activeTab, page = 1) => {
    setIsLoading(true)
    try {
      // Always fetch stats for the dashboard overview
      const statsRes = await api.get("/vendor/dashboard/stats")
      let newData = { ...dashboardData, stats: statsRes.data }
      let newPagination = { ...pagination }

      // Fetch tab-specific data based on the current active tab
      if (tab === "services" || activeTab === "services") {
        const servicesRes = await api.get(`/vendor/dashboard/services?page=${page}&limit=5`)
        newData = { ...newData, services: servicesRes.data.data || servicesRes.data }
        
        // Update pagination state if the response includes pagination data
        if (servicesRes.data.pagination) {
          newPagination.services = servicesRes.data.pagination
        }
      }
      
      if (tab === "cards" || activeTab === "cards") {
        const cardsRes = await api.get(`/vendor/dashboard/cards?page=${page}&limit=5`)
        newData = { ...newData, cards: cardsRes.data.data || cardsRes.data }
        
        // Update pagination state if the response includes pagination data
        if (cardsRes.data.pagination) {
          newPagination.cards = cardsRes.data.pagination
        }
      }
      
      if (tab === "bookings" || activeTab === "bookings") {
        const bookingsRes = await api.get(`/vendor/dashboard/bookings?page=${page}&limit=5`)
        newData = { ...newData, bookings: bookingsRes.data.data || bookingsRes.data }
        
        // Update pagination state if the response includes pagination data
        if (bookingsRes.data.pagination) {
          newPagination.bookings = bookingsRes.data.pagination
        }
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
    if (success) navigate("/vendor/login")
  }

  const toggleSidebar = () => setSidebarActive(!sidebarActive)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    fetchDashboardData(tab)
    
    // Close sidebar on mobile after tab change
    if (window.innerWidth <= 768) {
      setSidebarActive(false)
    }
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    fetchDashboardData(tab)
  }

  const handleChangePage = (tab, page) => {
    // Update active tab if different
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
    // Fetch data for the specified page
    fetchDashboardData(tab, page)
  }

  // Service actions
  const editService = (serviceId) => {
    navigate(`/vendor/services/edit/${serviceId}`)
  }

  const confirmDelete = (id, type) => {
    setDeleteItem({ id, type })
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    try {
      if (deleteItem.type === 'service') {
        await api.delete(`/vendor/services/${deleteItem.id}`)
        toast.success("Service deleted successfully")
      } else if (deleteItem.type === 'card') {
        await api.delete(`/vendor/cards/${deleteItem.id}`)
        toast.success("Card deleted successfully")
      }
      setShowDeleteModal(false)
      setDeleteItem({ id: null, type: null })
      fetchDashboardData(activeTab)
    } catch (error) {
      console.error(`Error deleting ${deleteItem.type}:`, error)
      toast.error(`Failed to delete ${deleteItem.type}`)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteItem({ id: null, type: null })
  }

  const deleteService = (serviceId) => {
    confirmDelete(serviceId, 'service')
  }

  // Card actions
  const addCard = () => {
    navigate("/vendor/cards/add")
  }

  const editCard = (cardId) => {
    navigate(`/vendor/cards/edit/${cardId}`)
  }

  const deleteCard = (cardId) => {
    confirmDelete(cardId, 'card')
  }

  // Booking actions
  const openStatusModal = (booking) => {
    setSelectedBooking(booking)
    setNewStatus(booking.status)
    setShowStatusModal(true)
  }

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value)
  }

  const updateBookingStatus = async (bookingId, status) => {
    try {
      // Validate status
      if (!["pending", "confirmed", "canceled"].includes(status)) {
        toast.error("Invalid booking status");
        return;
      }
      
      // Make API call
      const response = await api.patch(`/vendor/bookings/${bookingId}/status`, { status });
      
      if (response.data && response.data.message) {
        toast.success(`Booking status updated to ${status}`);
        setShowStatusModal(false);
        fetchDashboardData("bookings");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error.response?.data?.message || "Failed to update booking status");
    }
  }

  const confirmBooking = async (bookingId) => {
    try {
      if (!selectedBooking) {
        toast.error("Booking data not found");
        return;
      }
      
      // Update booking status to confirmed
      const updateResponse = await api.patch(`/vendor/bookings/${bookingId}/status`, {
        status: "confirmed"
      });
      
      if (!updateResponse.data || !updateResponse.data.message) {
        throw new Error("Unexpected response from server");
      }
      
      // Try to get user contact info for WhatsApp message
      try {
        const userResponse = await api.get(`/vendor/bookings/${bookingId}/user`);
        const userPhone = userResponse.data.phone;
        const serviceName = selectedBooking.service_name || "your booking";
        
        // Close modal and refresh data
        setShowStatusModal(false);
        fetchDashboardData("bookings");
        
        // Generate WhatsApp message and open in new tab only if we have user phone
        if (userPhone) {
          const message = `Hello! Your booking for "${serviceName}" has been confirmed. Thank you for choosing our services.`;
          const whatsappLink = generateWhatsAppLink(userPhone, message);
          window.open(whatsappLink, '_blank');
        } else {
          console.warn("User phone not available for WhatsApp message");
        }
      } catch (userError) {
        console.error("Error getting user information:", userError);
        // Even if we can't get user info, the booking was still confirmed
        toast.warning("Booking confirmed, but couldn't retrieve user contact information");
        setShowDeleteModal(false);
        fetchDashboardData("bookings");
      }
      
      // Show success message regardless of whether WhatsApp message was sent
      toast.success("Booking confirmed successfully");
      
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error(error.response?.data?.message || "Failed to confirm booking");
    }
  };

  const handleCancel = () => {
    setShowStatusModal(false)
    setSelectedBooking(null)
    setNewStatus("")
  }

  const chatWithUser = (phone, service) => {
    if (!phone) {
      toast.error("User phone number not available");
      return;
    }
    
    try {
      // Sanitize the service name for the message
      const serviceName = service || "your booking";
      
      // Create message with fallback for missing service name
      const message = `Hello! I'm reaching out regarding your booking for "${serviceName}". How can I assist you?`;
      
      // Generate WhatsApp link with proper error handling
      try {
        const whatsappLink = generateWhatsAppLink(phone, message);
        // Open in a new tab
        window.open(whatsappLink, '_blank');
      } catch (linkError) {
        console.error("Error generating WhatsApp link:", linkError);
        // Fallback: provide manual instructions if link generation fails
        toast.error("Couldn't generate WhatsApp link. Please contact the user manually at: " + phone);
      }
    } catch (error) {
      console.error("Error opening WhatsApp chat:", error);
      toast.error("Failed to open WhatsApp. Please try again or contact the user manually.");
    }
  }

  // Chart data preparation
  const { stats } = dashboardData

  const servicesData = [
    { name: 'Published', value: stats.services.published || 0, color: '#4ECDC4' },
    { name: 'Pending', value: stats.services.pending || 0, color: '#FFE66D' },
    { name: 'Rejected', value: stats.services.rejected || 0, color: '#FF6B6B' }
  ]

  const cardsData = [
    { name: 'Published', value: stats.cards.published || 0, color: '#4ECDC4' },
    { name: 'Pending', value: stats.cards.pending || 0, color: '#FFE66D' },
    { name: 'Rejected', value: stats.cards.rejected || 0, color: '#FF6B6B' }
  ]

  const bookingsData = [
    { name: 'Pending', value: stats.bookings.pending || 0, color: '#FFE66D' },
    { name: 'Confirmed', value: stats.bookings.confirmed || 0, color: '#4ECDC4' },
    { name: 'Completed', value: stats.bookings.completed || 0, color: '#95E1D3' },
    { name: 'Canceled', value: stats.bookings.canceled || 0, color: '#FF6B6B' }
  ]

  const businessOverviewData = [
    { name: 'Services', total: stats.services.total || 0, published: stats.services.published || 0 },
    { name: 'Cards', total: stats.cards.total || 0, published: stats.cards.published || 0 },
    { name: 'Bookings', total: stats.bookings.total || 0, published: stats.bookings.confirmed || 0 }
  ]

  const monthlyTrendData = [
    { month: 'Jan', bookings: Math.floor(Math.random() * 15) + 5, earnings: Math.floor(Math.random() * 30000) + 10000 },
    { month: 'Feb', bookings: Math.floor(Math.random() * 15) + 5, earnings: Math.floor(Math.random() * 30000) + 10000 },
    { month: 'Mar', bookings: Math.floor(Math.random() * 15) + 5, earnings: Math.floor(Math.random() * 30000) + 10000 },
    { month: 'Apr', bookings: Math.floor(Math.random() * 15) + 5, earnings: Math.floor(Math.random() * 30000) + 10000 },
    { month: 'May', bookings: Math.floor(Math.random() * 15) + 5, earnings: Math.floor(Math.random() * 30000) + 10000 },
    { month: 'Jun', bookings: stats.bookings.total || 0, earnings: stats.earnings || 0 }
  ]

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    )
  }

  // Calculate total active services (pending + published)
  const totalActive = stats.services.pending + stats.services.published

  return (
    <>
      <button className="hamburger" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      <div className={`sidebar vendor-sidebar ${sidebarActive ? "active" : ""}`}>
        <a href="/" className="sidebar-logo">
          EazyWed
        </a>
        <ul className="sidebar-nav">
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("dashboard");
              }}
              className={activeTab === "dashboard" ? "active" : ""}
            >
              <i className="fas fa-home"></i> Dashboard
            </a>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("services");
              }}
              className={activeTab === "services" ? "active" : ""}
            >
              <i className="fas fa-concierge-bell"></i> Services
            </a>
          </li>
          <li>
            <a 
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("cards");
              }} 
              className={activeTab === "cards" ? "active" : ""}
            >
              <i className="fas fa-envelope"></i> Wedding Cards
            </a>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("bookings");
              }}
              className={activeTab === "bookings" ? "active" : ""}
            >
              <i className="fas fa-calendar-check"></i> Bookings
            </a>
          </li>
          <li>
            <a 
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
      </div>
      <div className="main-content vendor-main-content">
        {/* Dashboard */}
        <div className={`content-section ${activeTab === "dashboard" ? "active" : ""}`}>
          {/* Update the styling for action buttons */}
          <div className="dashboard-header">
            <h1>Welcome, {user?.vendorDetails?.brand_name || user?.full_name || "Vendor"}</h1>
            <div className="action-buttons">
              <Button className="btn-primary me-2" onClick={() => navigate("/vendor/add-service")}>
                <i className="fas fa-plus-circle me-1"></i> Add Service
              </Button>
              <Button className="btn-primary" onClick={() => navigate("/vendor/wedding-card-form")}>
                <i className="fas fa-plus-circle me-1"></i> Add Card
              </Button>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="row">
            {/* Business Overview */}
            <div className="col-lg-8 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Business Overview</h3>
                  <div className="chart-stats">
                    <span className="total-count">{(stats.services.total || 0) + (stats.cards.total || 0)}</span>
                    <span className="total-label">Total Items</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={businessOverviewData}>
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
                    <Bar dataKey="total" fill="#FFE66D" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="published" fill="#4ECDC4" radius={[4, 4, 0, 0]} name="Published" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Services Status */}
            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Services Status</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.services.total || 0}</span>
                    <span className="total-label">Total Services</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={servicesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {servicesData.map((entry, index) => (
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
                  {servicesData.map((item, index) => (
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
            {/* Monthly Trends */}
            <div className="col-lg-8 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Monthly Performance</h3>
                  <div className="chart-stats">
                    <span className="total-count">PKR {(stats.earnings || 0).toLocaleString()}</span>
                    <span className="total-label">Total Earnings</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrendData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1}/>
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
                      dataKey="earnings" 
                      stroke="#4ECDC4" 
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bookings Distribution */}
            <div className="col-lg-4 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Bookings Status</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.bookings.total || 0}</span>
                    <span className="total-label">Total Bookings</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingsData.map((entry, index) => (
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
                  {bookingsData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-text">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className={`content-section ${activeTab === "services" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Services</h1>
            <Button className="btn-primary" onClick={() => navigate("/vendor/add-service")}>
              <i className="fas fa-plus-circle me-1"></i> Add Service
            </Button>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price Range</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.services.length > 0 ? (
                    dashboardData.services.map((service) => (
                      <tr key={service._id}>
                        <td>{service.name}</td>
                        <td>{service.category}</td>
                        <td>{service.price_range}</td>
                        <td>
                          <span
                            className={`badge ${
                              service.status === "published"
                                ? "bg-success"
                                : service.status === "pending"
                                  ? "bg-warning"
                                  : "bg-danger"
                            }`}
                          >
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className="action-btn edit"
                              onClick={() => editService(service._id)}
                              title="Edit Service"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              variant="link" 
                              className="action-btn delete"
                              onClick={() => deleteService(service._id)}
                              title="Delete Service"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No services found. Click "Add Service" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls for Services */}
            <div className="pagination-controls mt-3">
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("services", (pagination.services?.page || 1) - 1)}
                disabled={(pagination.services?.page || 1) <= 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="mx-2">
                Page {pagination.services?.page || 1} of {pagination.services?.pages || 1}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("services", (pagination.services?.page || 1) + 1)}
                disabled={(pagination.services?.page || 1) >= (pagination.services?.pages || 1)}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Wedding Cards */}
        <div className={`content-section ${activeTab === "cards" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Wedding Cards</h1>
            <div className="action-buttons">
              <Button className="btn-primary" onClick={() => navigate("/vendor/wedding-card-form")}>
                <i className="fas fa-plus-circle me-1"></i> Add Card Template
              </Button>
            </div>
          </div>
          <div className="status-summary">
            <div className="summary-tag">
              <span className="tag-dot published"></span>
              <span>Published: {stats.cards.published}</span>
            </div>
            <div className="summary-tag">
              <span className="tag-dot pending"></span>
              <span>Pending: {stats.cards.pending}</span>
            </div>
            <div className="summary-tag">
              <span className="tag-dot rejected"></span>
              <span>Rejected: {stats.cards.rejected}</span>
            </div>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.cards.length > 0 ? (
                    dashboardData.cards.map((card) => (
                      <tr key={card._id}>
                        <td>
                          {card.front_image ? (
                            <img 
                              src={card.front_image || "/placeholder.svg"} 
                              alt="Card Preview" 
                              className="thumbnail-preview" 
                              title="Card Preview"
                            />
                          ) : (
                            <div className="no-preview">No Image</div>
                          )}
                        </td>
                        <td>{card.type.charAt(0).toUpperCase() + card.type.slice(1)}</td>
                        <td>PKR {card.price_per_card.toLocaleString()}</td>
                        <td>{card.quantity_available}</td>
                        <td>
                          <span
                            className={`badge ${
                              card.status === "published"
                                ? "bg-success"
                                : card.status === "pending"
                                  ? "bg-warning"
                                  : "bg-danger"
                            }`}
                          >
                            {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className="action-btn edit"
                              onClick={() => editCard(card._id)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              variant="link"
                              className="action-btn delete"
                              onClick={() => deleteCard(card._id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        <div className="empty-state">
                          <i className="fas fa-envelope-open-text empty-icon"></i>
                          <p>No wedding cards found.</p>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => navigate("/vendor/wedding-card-form")}
                            className="mt-2"
                          >
                            Create Your First Card Template
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls for Cards */}
            <div className="pagination-controls mt-3">
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("cards", (pagination.cards?.page || 1) - 1)}
                disabled={(pagination.cards?.page || 1) <= 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="mx-2">
                Page {pagination.cards?.page || 1} of {pagination.cards?.pages || 1}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("cards", (pagination.cards?.page || 1) + 1)}
                disabled={(pagination.cards?.page || 1) >= (pagination.cards?.pages || 1)}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className={`content-section ${activeTab === "bookings" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Bookings</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Service/Card</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.bookings.length > 0 ? (
                    dashboardData.bookings.map((booking) => (
                      <tr key={booking.booking_id}>
                        <td>{booking.service_name || "Unnamed Booking"}</td>
                        <td>{booking.user_name}</td>
                        <td>{new Date(booking.date).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              booking.status === "confirmed"
                                ? "bg-success"
                                : booking.status === "pending"
                                  ? "bg-warning"
                                  : booking.status === "completed"
                                    ? "bg-primary"
                                    : "bg-danger"
                            }`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td>PKR {booking.price?.toLocaleString() || "N/A"}</td>
                        <td>
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className="action-btn chat"
                              onClick={() => chatWithUser(booking.user_phone, booking.service_name)}
                              title="Chat with User"
                            >
                              <i className="fab fa-whatsapp"></i>
                            </Button>
                            <Button 
                              variant="link" 
                              className="action-btn edit"
                              onClick={() => openStatusModal(booking)}
                              title="Update Status"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls for Bookings */}
            <div className="pagination-controls mt-3">
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("bookings", (pagination.bookings?.page || 1) - 1)}
                disabled={(pagination.bookings?.page || 1) <= 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="mx-2">
                Page {pagination.bookings?.page || 1} of {pagination.bookings?.pages || 1}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handleChangePage("bookings", (pagination.bookings?.page || 1) + 1)}
                disabled={(pagination.bookings?.page || 1) >= (pagination.bookings?.pages || 1)}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Modal */}
      <Modal show={showStatusModal} onHide={handleCancel} centered>
        <Modal.Header>
          <Modal.Title>Update Booking Status</Modal.Title>
          <button className="custom-close-btn" onClick={handleCancel}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <div>
              <div className="mb-3">
                <h5>{selectedBooking.service_name || "Unnamed Booking"}</h5>
                <p><strong>User:</strong> {selectedBooking.user_name}</p>
                <p><strong>Date:</strong> {new Date(selectedBooking.date || selectedBooking.date_time).toLocaleDateString()}</p>
                <p><strong>Price:</strong> PKR {selectedBooking.price?.toLocaleString() || "N/A"}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select 
                  className="form-select" 
                  value={newStatus} 
                  onChange={handleStatusChange}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <Button 
                  variant="info" 
                  onClick={() => {
                    const phone = selectedBooking.user_phone || selectedBooking.user_id?.phone;
                    if (!phone) {
                      toast.error("User phone number not available");
                      return;
                    }
                    const message = `Hello! Regarding your booking for "${selectedBooking.service_name || "your booking"}" with reference ID: ${selectedBooking.booking_id}`;
                    const whatsappLink = generateWhatsAppLink(phone, message);
                    window.open(whatsappLink, '_blank');
                  }}
                >
                  <i className="fab fa-whatsapp me-1"></i> Contact User
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            <i className="fas fa-times me-1"></i> Cancel
          </Button>
          <Button variant="primary" onClick={() => updateBookingStatus(selectedBooking?.booking_id || selectedBooking?._id, newStatus)}>
            <i className="fas fa-save me-1"></i> Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={cancelDelete} centered>
        <Modal.Header>
          <Modal.Title>Confirm Delete</Modal.Title>
          <button className="custom-close-btn" onClick={cancelDelete}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this {deleteItem.type}? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            <i className="fas fa-times me-1"></i> Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i className="fas fa-trash me-1"></i> Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default VendorDashboard
