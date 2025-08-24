"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button, Modal } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/dashboard.css"
import axios from "axios"
import Carousel from "react-bootstrap/Carousel"
import { 
  BarChart, Bar, PieChart, Pie, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts"

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarActive, setSidebarActive] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    services: [],
    cards: [],
    bookings: [],
    reviews: [],
    users: [],
    vendorRequests: [],
  })
  
  // Pagination state
  const [pagination, setPagination] = useState({
    services: { page: 1, total: 0, pages: 0 },
    cards: { page: 1, total: 0, pages: 0 },
    bookings: { page: 1, total: 0, pages: 0 },
    reviews: { page: 1, total: 0, pages: 0 },
    users: { page: 1, total: 0, pages: 0 },
    vendorRequests: { page: 1, total: 0, pages: 0 },
  })
  
  // State for modal views
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)

  // State for deletion confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState({ id: null, type: null })

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
      // Always fetch stats for the dashboard overview
      const statsRes = await api.get("/dashboard/admin/stats")
      let newData = { ...dashboardData, stats: statsRes.data }
      let newPagination = { ...pagination }

      // Fetch tab-specific data
      switch (tab) {
        case "dashboard":
          // Stats are already fetched
          break
        case "services":
          const servicesRes = await api.get(`/dashboard/admin/services?page=${page}&limit=5`)
          newData = { ...newData, services: servicesRes.data.data }
          newPagination.services = servicesRes.data.pagination
          break
        case "cards":
          const cardsRes = await api.get(`/dashboard/admin/cards?page=${page}&limit=5`)
          newData = { ...newData, cards: cardsRes.data.data }
          newPagination.cards = cardsRes.data.pagination
          break
        case "bookings":
          const bookingsRes = await api.get(`/dashboard/admin/bookings?page=${page}&limit=5`)
          newData = { ...newData, bookings: bookingsRes.data.data }
          newPagination.bookings = servicesRes.data.pagination
          break
        case "reviews":
          const reviewsRes = await api.get(`/dashboard/admin/reviews?page=${page}&limit=5`)
          newData = { ...newData, reviews: reviewsRes.data.data }
          newPagination.reviews = reviewsRes.data.pagination
          break
        case "users":
          const usersRes = await api.get(`/dashboard/admin/users?page=${page}&limit=5`)
          newData = { ...newData, users: usersRes.data.data }
          newPagination.users = usersRes.data.pagination
          break
        case "vendor-requests":
          const vendorRequestsRes = await api.get(`/dashboard/admin/vendor-requests?page=${page}&limit=5`)
          newData = { ...newData, vendorRequests: vendorRequestsRes.data.data }
          newPagination.vendorRequests = vendorRequestsRes.data.pagination
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
    if (success) navigate("/admin/login")
  }

  const toggleSidebar = () => setSidebarActive(!sidebarActive)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    
    // Reset pagination for the selected tab
    setPagination(prev => ({
      ...prev,
      [tab === 'vendor-requests' ? 'vendorRequests' : tab]: { ...prev[tab === 'vendor-requests' ? 'vendorRequests' : tab], page: 1 }
    }))
    
    fetchDashboardData(tab, 1) // Fetch page 1 when changing tabs
    
    if (window.innerWidth <= 768) {
      setSidebarActive(false)
    }
  }

  // Deletion confirmation functions
  const confirmDelete = (id, type) => {
    setDeleteItem({ id, type })
    setShowDeleteModal(true)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteItem({ id: null, type: null })
  }

  const handleDelete = async () => {
    try {
      switch (deleteItem.type) {
        case 'service-reject':
          await api.delete(`/dashboard/admin/services/${deleteItem.id}/reject`)
          toast.success("Service rejected successfully")
          break
        case 'card-reject':
          await api.delete(`/dashboard/admin/cards/${deleteItem.id}/reject`)
          toast.success("Card rejected successfully")
          break
        case 'review':
          await api.patch(`/dashboard/admin/reviews/${deleteItem.id}/delete`)
          toast.success("Review deleted successfully")
          break
        case 'booking':
          await api.patch(`/dashboard/admin/bookings/${deleteItem.id}/cancel`)
          toast.success("Booking canceled successfully")
          break
        case 'vendor':
          await api.delete(`/admin/users/${deleteItem.id}`)
          toast.success("Vendor deleted successfully")
          break
        case 'service-delete':
          await api.delete(`/admin/services/${deleteItem.id}`)
          toast.success("Service deleted successfully")
          break
        case 'card-delete':
          await api.delete(`/admin/cards/${deleteItem.id}`)
          toast.success("Card deleted successfully")
          break
        default:
          throw new Error("Invalid deletion type")
      }
      fetchDashboardData()
      setShowDeleteModal(false)
      setDeleteItem({ id: null, type: null })
    } catch (error) {
      console.error(`Error ${deleteItem.type} deletion:`, error)
      toast.error(error.response?.data?.message || `Failed to perform deletion`)
    }
  }

  // Admin actions
  const approveService = async (serviceId) => {
    try {
      await api.patch(`/dashboard/admin/services/${serviceId}/approve`)
      toast.success("Service approved successfully")
      fetchDashboardData()
    } catch (error) {
      console.error("Error approving service:", error)
      toast.error("Failed to approve service")
    }
  }

  const rejectService = (serviceId) => {
    confirmDelete(serviceId, 'service-reject')
  }

  const approveCard = async (cardId) => {
    try {
      await api.patch(`/dashboard/admin/cards/${cardId}/approve`)
      toast.success("Card approved successfully")
      fetchDashboardData()
    } catch (error) {
      console.error("Error approving card:", error)
      toast.error("Failed to approve card")
    }
  }

  const rejectCard = (cardId) => {
    confirmDelete(cardId, 'card-reject')
  }

  const cancelBooking = (bookingId) => {
    confirmDelete(bookingId, 'booking')
  }

  const deleteReview = (reviewId) => {
    confirmDelete(reviewId, 'review')
  }

  const toggleUserBlock = async (userId) => {
    try {
      await api.patch(`/dashboard/admin/users/${userId}/toggle-block`)
      toast.success("User status updated successfully")
      fetchDashboardData()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast.error("Failed to update user status")
    }
  }

  const approveVendor = async (vendorId) => {
    try {
      await api.post(`/admins/approve-vendor`, { userId: vendorId })
      toast.success("Vendor approved successfully")
      fetchDashboardData()
    } catch (error) {
      console.error("Error approving vendor:", error)
      toast.error("Failed to approve vendor")
    }
  }

  const rejectVendor = async (vendorId) => {
    try {
      await api.post(`/admins/reject-vendor`, { userId: vendorId })
      toast.success("Vendor rejected successfully")
      fetchDashboardData()
    } catch (error) {
      console.error("Error rejecting vendor:", error)
      toast.error("Failed to reject vendor")
    }
  }

  // View functions for modals
  const viewService = async (serviceId) => {
    try {
      const response = await api.get(`/dashboard/admin/services/${serviceId}`)
      setSelectedService(response.data)
      setShowServiceModal(true)
    } catch (error) {
      console.error("Error fetching service details:", error)
      toast.error("Failed to load service details")
    }
  }

  // Helper function to get appropriate Font Awesome icon class for different field keys
  const getIconForKey = (key) => {
    const iconMap = {
      // Service details
      cancellation_policy: "fa-undo-alt",
      staff: "fa-users",
      venue_type: "fa-building",
      amenities: "fa-concierge-bell",
      parking_space: "fa-parking",
      catering_type: "fa-utensils",
      wheelchair_accessible: "fa-wheelchair",
      expertise: "fa-award",
      services_for: "fa-user-friends",
      location_type: "fa-map-pin",
      home_service: "fa-home",
      mehndi_type: "fa-paint-brush",
      has_team: "fa-users",
      sells_mehndi: "fa-store",
      cities_covered: "fa-city",
      material: "fa-tshirt",
      size: "fa-ruler",
      length: "fa-ruler-vertical",
      bust: "fa-female",
      design: "fa-pen",
      rental_duration: "fa-clock",
      seats: "fa-chair",
      doors: "fa-door-open",
      transmission: "fa-cogs",
      price: "fa-money-bill-alt",
      price_range: "fa-money-bill-wave",
      
      // Card details
      template_type: "fa-file-alt",
      editable_fields: "fa-edit",
      font_options: "fa-font",
      color_options: "fa-palette",
      
      // Vendor details
      brand_name: "fa-building",
      email: "fa-envelope",
      instagram_link: "fa-instagram",
      facebook_link: "fa-facebook",
      booking_email: "fa-envelope-open",
      office_address: "fa-building",
      website_link: "fa-globe",
      map_link: "fa-map-marked"
    };
    
    return iconMap[key] || "fa-info-circle"; // Default icon
  };

  const viewCard = async (cardId) => {
    try {
      const response = await api.get(`/dashboard/admin/cards/${cardId}`)
      setSelectedCard(response.data)
      setShowCardModal(true)
    } catch (error) {
      console.error("Error fetching card details:", error)
      toast.error("Failed to load card details")
    }
  }

  const viewVendor = async (vendorId) => {
    try {
      const response = await api.get(`/dashboard/admin/vendor-requests/${vendorId}`)
      console.log("Vendor request details:", response.data)
      setSelectedVendor(response.data)
      setShowVendorModal(true)
    } catch (error) {
      console.error("Error fetching vendor details:", error)
      toast.error("Failed to load vendor details")
    }
  }

  const revertServiceToPending = async (serviceId) => {
    try {
      await api.patch(`/dashboard/admin/services/${serviceId}/revert`)
      toast.success("Service reverted to pending status")
      fetchDashboardData()
      setShowServiceModal(false)
    } catch (error) {
      console.error("Error reverting service:", error)
      toast.error("Failed to revert service to pending status")
    }
  }

  const revertCardToPending = async (cardId) => {
    try {
      await api.patch(`/dashboard/admin/cards/${cardId}/revert`)
      toast.success("Card reverted to pending status")
      fetchDashboardData()
      setShowCardModal(false)
    } catch (error) {
      console.error("Error reverting card:", error)
      toast.error("Failed to revert card to pending status")
    }
  }

  const deleteCard = (cardId) => {
    confirmDelete(cardId, 'card-delete')
  }

  const deleteVendor = (vendorId) => {
    confirmDelete(vendorId, 'vendor')
  }

  const deleteService = (serviceId) => {
    confirmDelete(serviceId, 'service-delete')
  }

  // Functions to handle pagination changes
  const handlePageChange = (section, newPage) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage }
    }))
    fetchDashboardData(section, newPage)
  }

  // Pagination component
  const PaginationControls = ({ section, currentPage, totalPages }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="pagination-controls">
        <button 
          className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => handlePageChange(section, currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i> Prev
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => handlePageChange(section, currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  // Prepare data for charts
  const { stats } = dashboardData

  // Bar Chart Data: Overview of total services, bookings, and users
  const overviewData = [
    { name: "Services", Total: stats.totalServices || 0, Published: stats.publishedServices || 0 },
    { name: "Bookings", Total: stats.totalBookings || 0, Confirmed: stats.confirmedBookings || 0 },
    { name: "Users", Total: stats.totalUsers || 0, Vendors: stats.totalVendors || 0 },
  ];

  // Pie Chart Data: Service status distribution
  const serviceStatusData = [
    { name: "Pending", value: stats.pendingServices || 0, color: "#f08a5d" },
    { name: "Published", value: stats.publishedServices || 0, color: "#d7385e" },
  ];

  // Area Chart Data: Monthly trends (using current month data)
  const monthlyTrendsData = [
    {
      month: "Current",
      Bookings: stats.confirmedBookings || 0,
      VendorRequests: stats.pendingVendorRequests || 0,
    },
  ];

  // Render loading state
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
      <button className="hamburger" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      <div className={`sidebar ${sidebarActive ? "active" : ""}`}>
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
              className={activeTab === "services" ? "active" : ""}
              onClick={() => handleTabChange("services")}
            >
              <i className="fas fa-concierge-bell"></i> Services
            </a>
          </li>
          <li>
            <a href="#" className={activeTab === "cards" ? "active" : ""} onClick={() => handleTabChange("cards")}>
              <i className="fas fa-envelope"></i> Wedding Cards
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
            <a href="#" className={activeTab === "users" ? "active" : ""} onClick={() => handleTabChange("users")}>
              <i className="fas fa-users"></i> Users
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "vendor-requests" ? "active" : ""}
              onClick={() => handleTabChange("vendor-requests")}
            >
              <i className="fas fa-user-plus"></i> Vendor Requests
            </a>
          </li>
          <li>
            <a href="#" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
      </div>
      <div className="main-content admin-main-content">
        {/* Dashboard */}
        <div className={`content-section ${activeTab === "dashboard" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Welcome, {user?.username || "Admin"}</h1>
          </div>
          <div className="row">
            {/* Platform Overview Bar Chart */}
            <div className="col-md-6 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Platform Overview</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.totalServices + stats.totalBookings + stats.totalUsers || 0}</span>
                    <span className="total-label">Total Activities</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis dataKey="name" stroke="#132742" />
                    <YAxis stroke="#132742" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(0,0,0,0.8)", 
                        border: "none", 
                        borderRadius: "8px", 
                        color: "#fff" 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="Total" fill="#d7385e" radius={[8, 8, 0, 0]} />
                    <Bar 
                      dataKey={overviewData[0].Published ? "Published" : overviewData[1].Confirmed ? "Confirmed" : "Vendors"} 
                      fill="#f08a5d" 
                      radius={[8, 8, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: "#d7385e" }}></span>
                    <span className="legend-text">Total</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: "#f08a5d" }}></span>
                    <span className="legend-text">Published/Confirmed/Vendors</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Status Pie Chart */}
            <div className="col-md-6 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Service Status</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.totalServices || 0}</span>
                    <span className="total-label">Total Services</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      labelLine={false}
                    >
                      {serviceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(0,0,0,0.8)", 
                        border: "none", 
                        borderRadius: "8px", 
                        color: "#fff" 
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {serviceStatusData.map((entry, index) => (
                    <div className="legend-item" key={index}>
                      <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
                      <span className="legend-text">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Trends Area Chart */}
            <div className="col-md-12 mb-4">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Activity Trends</h3>
                  <div className="chart-stats">
                    <span className="total-count">{stats.confirmedBookings + stats.pendingVendorRequests || 0}</span>
                    <span className="total-label">Total Activities</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrendsData}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d7385e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#d7385e" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorVendorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f08a5d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f08a5d" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis dataKey="month" stroke="#132742" />
                    <YAxis stroke="#132742" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(0,0,0,0.8)", 
                        border: "none", 
                        borderRadius: "8px", 
                        color: "#fff" 
                      }} 
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Bookings"
                      stroke="#d7385e"
                      strokeWidth={3}
                      fill="url(#colorBookings)"
                    />
                    <Area
                      type="monotone"
                      dataKey="VendorRequests"
                      stroke="#f08a5d"
                      strokeWidth={3}
                      fill="url(#colorVendorRequests)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: "#d7385e" }}></span>
                    <span className="legend-text">Bookings</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: "#f08a5d" }}></span>
                    <span className="legend-text">Vendor Requests</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className={`content-section ${activeTab === "services" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Services</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Vendor</th>
                    <th>Price Range</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.services.length > 0 ? (
                    dashboardData.services.map((service) => (
                      <tr key={service.service_id}>
                        <td>{service.name}</td>
                        <td>{service.vendor_name}</td>
                        <td>{service.price_range}</td>
                        <td>{service.status}</td>
                        <td>
                          {service.status === "pending" ? (
                            <div className="action-icons">
                              <Button
                                variant="link"
                                className="action-btn view"
                                onClick={() => viewService(service.service_id)}
                                title="View"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button
                                variant="link"
                                className="action-btn approve"
                                onClick={() => approveService(service.service_id)}
                                title="Approve"
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                              <Button 
                                variant="link" 
                                className="action-btn reject"
                                onClick={() => rejectService(service.service_id)}
                                title="Reject"
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </div>
                          ) : service.status === "published" ? (
                            <div className="action-icons">
                              <Button
                                variant="link"
                                className="action-btn view"
                                onClick={() => viewService(service.service_id)}
                                title="View"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button 
                                variant="link" 
                                className="action-btn revert"
                                onClick={() => revertServiceToPending(service.service_id)}
                                title="Revert to Pending"
                              >
                                <i className="fas fa-undo"></i>
                              </Button>
                            </div>
                          ) : (
                            <div className="action-icons">
                              <Button
                                variant="link"
                                className="action-btn view"
                                onClick={() => viewService(service.service_id)}
                                title="View"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No services found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls 
              section="services"
              currentPage={pagination.services.page}
              totalPages={pagination.services.pages}
            />
          </div>
        </div>

        {/* Wedding Cards */}
        <div className={`content-section ${activeTab === "cards" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Wedding Cards</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Vendor</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.cards.length > 0 ? (
                    dashboardData.cards.map((card) => (
                      <tr key={card.card_id}>
                        <td>{card.name}</td>
                        <td>{card.vendor_name}</td>
                        <td>PKR {card.price}</td>
                        <td>{card.status}</td>
                        <td>
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className="action-btn view"
                              onClick={() => viewCard(card.card_id)}
                              title="View"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            {card.status === "pending" ? (
                              <>
                                <Button
                                  variant="link"
                                  className="action-btn approve"
                                  onClick={() => approveCard(card.card_id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </Button>
                                <Button 
                                  variant="link" 
                                  className="action-btn reject"
                                  onClick={() => rejectCard(card.card_id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </>
                            ) : card.status === "published" ? (
                              <Button 
                                variant="link" 
                                className="action-btn revert"
                                onClick={() => revertCardToPending(card.card_id)}
                                title="Revert to Pending"
                              >
                                <i className="fas fa-undo"></i>
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No wedding cards found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls 
              section="cards"
              currentPage={pagination.cards.page}
              totalPages={pagination.cards.pages}
            />
          </div>
        </div>

        {/* Bookings */}
        <div className={`content-section ${activeTab === "bookings" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Booking Logs</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>User</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.bookings.length > 0 ? (
                    dashboardData.bookings.map((booking) => (
                      <tr key={booking.booking_id}>
                        <td>{booking.name}</td>
                        <td>{booking.user_name}</td>
                        <td>{booking.vendor_name}</td>
                        <td>{new Date(booking.date).toLocaleDateString()}</td>
                        <td>{booking.status}</td>
                        <td>
                          {booking.status !== "canceled" && booking.status !== "completed" && (
                            <div className="action-icons">
                              <Button 
                                variant="link" 
                                className="action-btn reject"
                                onClick={() => cancelBooking(booking.booking_id)}
                                title="Cancel Booking"
                              >
                                <i className="fas fa-ban"></i>
                              </Button>
                            </div>
                          )}
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
            <PaginationControls 
              section="bookings"
              currentPage={pagination.bookings.page}
              totalPages={pagination.bookings.pages}
            />
          </div>
        </div>

        {/* Reviews */}
        <div className={`content-section ${activeTab === "reviews" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Reviews</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.reviews.length > 0 ? (
                    dashboardData.reviews.map((review) => (
                      <tr key={review.review_id}>
                        <td>{review.name}</td>
                        <td>{review.user_name}</td>
                        <td>{review.rating} ⭐</td>
                        <td>{review.comment}</td>
                        <td>
                          <div className="action-icons">
                            <Button 
                              variant="link" 
                              className="action-btn reject"
                              onClick={() => deleteReview(review.review_id)}
                              title="Delete Review"
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
                        No reviews found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls 
              section="reviews"
              currentPage={pagination.reviews.page}
              totalPages={pagination.reviews.pages}
            />
          </div>
        </div>

        {/* Users */}
        <div className={`content-section ${activeTab === "users" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Users</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.users.length > 0 ? (
                    dashboardData.users.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.name}</td>
                        <td>{user.phone}</td>
                        <td>{user.role}</td>
                        <td>{user.status}</td>
                        <td>
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className={user.status === "Active" ? "action-btn reject" : "action-btn approve"}
                              onClick={() => toggleUserBlock(user.user_id)}
                              title={user.status === "Active" ? "Block User" : "Unblock User"}
                            >
                              <i className={`fas ${user.status === "Active" ? "fa-ban" : "fa-check-circle"}`}></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls 
              section="users"
              currentPage={pagination.users.page}
              totalPages={pagination.users.pages}
            />
          </div>
        </div>

        {/* Vendor Requests */}
        <div className={`content-section ${activeTab === "vendor-requests" ? "active" : ""}`}>
          <div className="dashboard-header">
            <h1>Vendor Requests</h1>
          </div>
          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.vendorRequests.length > 0 ? (
                    dashboardData.vendorRequests.map((vendor) => (
                      <tr key={vendor.vendor_id}>
                        <td>{vendor.name}</td>
                        <td>{vendor.phone}</td>
                        <td>{vendor.category}</td>
                        <td>{vendor.email}</td>
                        <td>
                          <div className="action-icons">
                            <Button
                              variant="link"
                              className="action-btn view"
                              onClick={() => viewVendor(vendor.vendor_id)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="link"
                              className="action-btn approve"
                              onClick={() => approveVendor(vendor.vendor_id)}
                              title="Approve Vendor"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                            <Button 
                              variant="link" 
                              className="action-btn reject"
                              onClick={() => rejectVendor(vendor.vendor_id)}
                              title="Reject Vendor"
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No vendor requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls 
              section="vendorRequests"
              currentPage={pagination.vendorRequests.page}
              totalPages={pagination.vendorRequests.pages}
            />
          </div>
        </div>
      </div>
      
      {/* Service View Modal */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Service Details</Modal.Title>
          <button className="custom-close-btn" onClick={() => setShowServiceModal(false)}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          {selectedService ? (
            <div className="service-details">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h4>{selectedService.name}</h4>
                  <span className={`status-badge ${selectedService.status}`}>{selectedService.status}</span>
                  <p className="text-muted mt-2">Created: {new Date(selectedService.created_at).toLocaleString()}</p>
                </div>
                <div className="col-md-6 text-end">
                  {selectedService.status === "pending" ? (
                    <div className="d-flex justify-content-end">
                      <Button variant="success" size="sm" className="me-2 btn-custom" onClick={() => {
                        approveService(selectedService.service_id);
                        setShowServiceModal(false);
                      }}>
                        <i className="fas fa-check me-1"></i> Approve
                      </Button>
                      <Button variant="danger" size="sm" className="btn-custom" onClick={() => {
                        rejectService(selectedService.service_id);
                        setShowServiceModal(false);
                      }}>
                        <i className="fas fa-times me-1"></i> Reject
                      </Button>
                    </div>
                  ) : selectedService.status === "published" ? (
                    <div className="d-flex justify-content-end">
                      <Button variant="warning" size="sm" className="btn-custom" onClick={() => {
                        revertServiceToPending(selectedService.service_id);
                        setShowServiceModal(false);
                      }}>
                        <i className="fas fa-undo me-1"></i> Revert to Pending
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-end">
                      <Button variant="danger" size="sm" className="btn-custom" onClick={() => {
                        deleteService(selectedService.service_id);
                        setShowServiceModal(false);
                      }}>
                        <i className="fas fa-trash me-1"></i> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Service Images Carousel */}
              {selectedService.photos && selectedService.photos.length > 0 && (
                <div className="service-preview mb-4">
                  <h5 className="mb-3">Service Photos</h5>
                  <Carousel 
                    indicators={true}
                    controls={true}
                    interval={null}
                  >
                    {selectedService.photos.map((photo, index) => (
                      <Carousel.Item key={index}>
                        <img 
                          className="d-block w-100" 
                          src={photo} 
                          alt={`${selectedService.name} photo ${index + 1}`} 
                          style={{maxHeight: '300px', objectFit: 'contain'}}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </div>
              )}

              {/* Basic Info */}
              <div className="info-section card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Basic Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong><i className="fas fa-store me-2"></i>Vendor:</strong> {selectedService.vendor_name}</p>
                      <p><strong><i className="fas fa-tag me-2"></i>Category:</strong> {selectedService.category}</p>
                      <p><strong><i className="fas fa-money-bill-alt me-2"></i>Price Range:</strong> {selectedService.price_range}</p>
                      {selectedService.discount > 0 && (
                        <p><strong><i className="fas fa-percent me-2"></i>Discount:</strong> {selectedService.discount}%
                          {selectedService.discount_expiry && (
                            <span className="text-muted ms-2">
                              (Expires: {new Date(selectedService.discount_expiry).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="col-md-6">
                      {selectedService.address && (
                        <p><strong><i className="fas fa-map-marker-alt me-2"></i>Address:</strong> {selectedService.address}</p>
                      )}
                      {selectedService.availability && (
                        <>
                          <p><strong><i className="fas fa-clock me-2"></i>Working Hours:</strong> {selectedService.availability.working_hours}</p>
                          <p><strong><i className="fas fa-calendar me-2"></i>Working Days:</strong> {Array.isArray(selectedService.availability.working_days) ? 
                            selectedService.availability.working_days.join(", ") : selectedService.availability.working_days}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="info-section card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Description</h5>
                </div>
                <div className="card-body">
                  <p>{selectedService.description}</p>
                  {selectedService.additional_info && (
                    <div className="mt-3">
                      <h6>Additional Information:</h6>
                      <p>{selectedService.additional_info}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pricing Packages */}
              {selectedService.pricing_packages && selectedService.pricing_packages.length > 0 && (
                <div className="info-section card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Pricing Packages</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {selectedService.pricing_packages.map((pkg, index) => (
                        <div className="col-md-4 mb-3" key={index}>
                          <div className="package-card p-3 border rounded">
                            <h6 className="package-name">{pkg.name}</h6>
                            <p className="package-price mb-2"><i className="fas fa-money-bill-wave me-1"></i> PKR {pkg.price.toLocaleString()}</p>
                            {pkg.inclusions && (
                              <p className="package-inclusions small text-muted">
                                <strong>Includes:</strong> {pkg.inclusions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Category-Specific Details */}
              {selectedService.details && Object.keys(selectedService.details).length > 0 && (
                <div className="info-section card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Category-Specific Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {Object.entries(selectedService.details).map(([key, value]) => {
                        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                          return null;
                        }
                        const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        const formattedValue = Array.isArray(value) ? value.join(", ") : 
                                              typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
                        return (
                          <div className="col-md-6" key={key}>
                            <p className="detail-item">
                              <i className={`fas ${getIconForKey(key)} me-2 text-secondary`}></i>
                              <strong>{formattedKey}:</strong> {formattedValue}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading service details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowServiceModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Card View Modal */}
      <Modal show={showCardModal} onHide={() => setShowCardModal(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Wedding Card Details</Modal.Title>
          <button className="custom-close-btn" onClick={() => setShowCardModal(false)}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          {selectedCard ? (
            <div className="card-details">
              <div className="row mb-3 d-flex">
                <div className="col-md-6">
                  <h4>{selectedCard.name || `${selectedCard.type} Card Template`}</h4>
                  <span className={`status-badge ${selectedCard.status}`}>{selectedCard.status}</span>
                  <p className="text-muted mt-2">Created: {new Date(selectedCard.created_at).toLocaleString()}</p>
                </div>
                <div className="col-md-6 text-end">
                  {selectedCard.status === "pending" ? (
                    <div className="d-flex justify-content-end">
                      <Button variant="success" size="sm" className="me-2 btn-custom" onClick={() => {
                        approveCard(selectedCard.card_id);
                        setShowCardModal(false);
                      }}>
                        <i className="fas fa-check me-1"></i> Approve
                      </Button>
                      <Button variant="danger" size="sm" className="btn-custom" onClick={() => {
                        rejectCard(selectedCard.card_id);
                        setShowCardModal(false);
                      }}>
                        <i className="fas fa-times me-1"></i> Reject
                      </Button>
                    </div>
                  ) : selectedCard.status === "published" ? (
                    <div className="d-flex justify-content-end">
                      <Button variant="warning" size="sm" className="btn-custom" onClick={() => {
                        revertCardToPending(selectedCard.card_id);
                        setShowCardModal(false);
                      }}>
                        <i className="fas fa-undo me-1"></i> Revert to Pending
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-end">
                      <Button variant="danger" size="sm" className="btn-custom" onClick={() => {
                        deleteCard(selectedCard.card_id);
                        setShowCardModal(false);
                      }}>
                        <i className="fas fa-trash me-1"></i> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card Preview */}
              <div className="card-preview mb-4">
                <h5 className="mb-3">Card Preview</h5>
                {selectedCard.type === "editable" ? (
                  <div>
                    <img 
                      src={selectedCard.front_image || selectedCard.template_preview} 
                      alt="Card Preview" 
                      className="img-fluid rounded shadow" 
                      style={{maxHeight: '300px', objectFit: 'contain'}}
                    />
                    <p className="preview-note mt-2 text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      This is an editable card template. Users will be able to customize this design.
                    </p>
                  </div>
                ) : (
                  <Carousel 
                    indicators={true}
                    controls={true}
                    interval={null}
                  >
                    <Carousel.Item>
                      <img 
                        className="d-block w-100" 
                        src={selectedCard.front_image || selectedCard.template_preview} 
                        alt="Card Front" 
                        style={{maxHeight: '300px', objectFit: 'contain'}} 
                      />
                    </Carousel.Item>
                    {selectedCard.gallery && selectedCard.gallery.map((image, index) => (
                      <Carousel.Item key={index}>
                        <img 
                          className="d-block w-100" 
                          src={image} 
                          alt={`Card view ${index + 1}`} 
                          style={{maxHeight: '300px', objectFit: 'contain'}}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
              </div>

              {/* Basic Info */}
              <div className="info-section card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Basic Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong><i className="fas fa-store me-2"></i>Vendor:</strong> {selectedCard.vendor_name}</p>
                      <p><strong><i className="fas fa-tag me-2"></i>Category:</strong> {selectedCard.type}</p>
                      <p><strong><i className="fas fa-money-bill-alt me-2"></i>Price per Card:</strong> PKR {selectedCard.price ? selectedCard.price.toLocaleString() : selectedCard.price_per_card?.toLocaleString()}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong><i className="fas fa-cubes me-2"></i>Quantity Available:</strong> {selectedCard.quantity_available}</p>
                      <p><strong><i className="fas fa-clock me-2"></i>Design Time:</strong> {selectedCard.design_time}</p>
                      {selectedCard.format && (
                        <p><strong><i className="fas fa-file me-2"></i>Format:</strong> {Array.isArray(selectedCard.format) ? 
                          selectedCard.format.join(", ") : selectedCard.format}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedCard.description && (
                <div className="info-section card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Description</h5>
                  </div>
                  <div className="card-body">
                    <p>{selectedCard.description}</p>
                  </div>
                </div>
              )}
              
              {/* Category-Specific Details */}
              {selectedCard.details && Object.keys(selectedCard.details).length > 0 && (
                <div className="info-section card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Category-Specific Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {Object.entries(selectedCard.details).map(([key, value]) => {
                        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                          return null;
                        }
                        const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        const formattedValue = Array.isArray(value) ? value.join(", ") : 
                                              typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
                        return (
                          <div className="col-md-6" key={key}>
                            <p className="detail-item">
                              <i className={`fas ${getIconForKey(key)} me-2 text-secondary`}></i>
                              <strong>{formattedKey}:</strong> {formattedValue}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading card details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCardModal(false)}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>
      
      {/* Vendor Request View Modal */}
      <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Vendor Request Details</Modal.Title>
          <button className="custom-close-btn" onClick={() => setShowVendorModal(false)}>
            <i className="fas fa-times"></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          {selectedVendor ? (
            <div className="vendor-details">
              <div className="row mb-4">
                <div className="col-md-8">
                  <h4>{selectedVendor.name}</h4>
                  <span className="badge bg-primary mb-3">{selectedVendor.category}</span>
                  <div className="vendor-info">
                    <p className="mb-1"><i className="fas fa-phone text-secondary me-2"></i> {selectedVendor.phone}</p>
                    <p className="mb-1"><i className="fas fa-envelope text-secondary me-2"></i> {selectedVendor.email}</p>
                    <p className="mb-1"><i className="fas fa-building text-secondary me-2"></i> {selectedVendor.business_name || selectedVendor.brand_name || selectedVendor.name}</p>
                    {selectedVendor.office_address && (
                      <p className="mb-1"><i className="fas fa-map-marker-alt text-secondary me-2"></i> {selectedVendor.office_address}</p>
                    )}
                    {selectedVendor.website_link && selectedVendor.website_link !== 'N/A' && (
                      <p className="mb-1">
                        <i className="fas fa-globe text-secondary me-2"></i> 
                        <a href={selectedVendor.website_link.startsWith('http') ? selectedVendor.website_link : `https://${selectedVendor.website_link}`} 
                           target="_blank" rel="noopener noreferrer">
                          {selectedVendor.website_link}
                        </a>
                      </p>
                    )}
                    {selectedVendor.map_link && selectedVendor.map_link !== 'N/A' && (
                      <p className="mb-1">
                        <i className="fas fa-map-marked text-secondary me-2"></i> 
                        <a href={selectedVendor.map_link.startsWith('http') ? selectedVendor.map_link : `https://${selectedVendor.map_link}`} 
                           target="_blank" rel="noopener noreferrer">
                          Google Maps Location
                        </a>
                      </p>
                    )}
                    <p className="text-muted mb-1">
                      <i className="fas fa-clock text-secondary me-2"></i> 
                      Submitted: {new Date(selectedVendor.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  {selectedVendor.brand_icon ? (
                    <div className="brand-icon-container">
                      <img 
                        src={selectedVendor.brand_icon} 
                        alt={`${selectedVendor.name} brand icon`} 
                        className="img-fluid rounded brand-icon"
                        style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div className="brand-icon-placeholder">
                      <i className="fas fa-store fa-4x text-secondary"></i>
                      <p className="mt-2 text-muted">No brand icon provided</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Social Media Links */}
              {(selectedVendor.instagram_link || selectedVendor.facebook_link) && (
                <div className="social-links card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="fas fa-share-alt me-2"></i>Social Media</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-wrap">
                      {selectedVendor.instagram_link && selectedVendor.instagram_link !== 'N/A' && (
                        <a 
                          href={selectedVendor.instagram_link.startsWith('http') ? selectedVendor.instagram_link : `https://${selectedVendor.instagram_link}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="social-link me-3 mb-2"
                        >
                          <i className="fab fa-instagram me-1"></i> Instagram
                        </a>
                      )}
                      {selectedVendor.facebook_link && selectedVendor.facebook_link !== 'N/A' && (
                        <a 
                          href={selectedVendor.facebook_link.startsWith('http') ? selectedVendor.facebook_link : `https://${selectedVendor.facebook_link}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="social-link"
                        >
                          <i className="fab fa-facebook me-1"></i> Facebook
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
                
              {/* Contact Details */}
              <div className="contact-details card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="fas fa-address-card me-2"></i>Contact Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong><i className="fas fa-phone me-2 text-secondary"></i>Primary Phone:</strong> {selectedVendor.phone}</p>
                      <p><strong><i className="fas fa-envelope me-2 text-secondary"></i>Email:</strong> {selectedVendor.email}</p>
                    </div>
                    <div className="col-md-6">
                      {selectedVendor.phone_whatsapp && (
                        <p><strong><i className="fab fa-whatsapp me-2 text-secondary"></i>WhatsApp:</strong> {selectedVendor.phone_whatsapp}</p>
                      )}
                      {selectedVendor.booking_email && selectedVendor.booking_email !== selectedVendor.email && (
                        <p><strong><i className="fas fa-envelope-open me-2 text-secondary"></i>Booking Email:</strong> {selectedVendor.booking_email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="additional-info card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="fas fa-info-circle me-2"></i>Additional Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {selectedVendor.years_in_business && selectedVendor.years_in_business !== 'N/A' && (
                      <div className="col-md-6">
                        <p><strong><i className="fas fa-business-time me-2 text-secondary"></i>Years in Business:</strong> {selectedVendor.years_in_business}</p>
                      </div>
                    )}
                    {selectedVendor.description && selectedVendor.description !== 'N/A' && (
                      <div className="col-12 mt-2">
                        <h6><i className="fas fa-quote-left me-2 text-secondary"></i>Business Description:</h6>
                        <p className="ps-4 border-start border-light">{selectedVendor.description}</p>
                      </div>
                    )}
                    {selectedVendor.experience && selectedVendor.experience !== 'N/A' && (
                      <div className="col-12 mt-2">
                        <h6><i className="fas fa-star me-2 text-secondary"></i>Experience:</h6>
                        <p className="ps-4 border-start border-light">{selectedVendor.experience}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Verification Documents */}
              {selectedVendor.documents && selectedVendor.documents.length > 0 && (
                <div className="verification-docs card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="fas fa-file-alt me-2"></i>Verification Documents</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {selectedVendor.documents.map((doc, index) => (
                        <div className="col-md-4 mb-3" key={index}>
                          <div className="document-item text-center">
                            <a href={doc} target="_blank" rel="noopener noreferrer">
                              <i className="fas fa-file-pdf fa-3x mb-2"></i>
                              <p>Document {index + 1}</p>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="alert alert-info">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="fas fa-info-circle fa-2x"></i>
                  </div>
                  <div>
                    <h5 className="alert-heading">Vendor Application</h5>
                    <p className="mb-0">
                      This vendor has applied to offer {selectedVendor.category} services on the EazyWed platform.
                      Please review all details and verification documents carefully before making a decision.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading vendor details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedVendor && selectedVendor.status === 'pending' && (
            <>
              <Button variant="success" onClick={() => {
                approveVendor(selectedVendor.vendor_id);
                setShowVendorModal(false);
              }}>
                <i className="fas fa-check me-1"></i> Approve
              </Button>
              <Button variant="danger" onClick={() => {
                rejectVendor(selectedVendor.vendor_id);
                setShowVendorModal(false);
              }}>
                <i className="fas fa-times me-1"></i> Reject
              </Button>
            </>
          )}
          {selectedVendor && selectedVendor.status === 'approved' && (
            <Button variant="danger" onClick={() => {
              deleteVendor(selectedVendor.vendor_id);
              setShowVendorModal(false);
            }}>
              <i className="fas fa-trash me-1"></i> Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowVendorModal(false)}>
            Close
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
          <p>Are you sure you want to {
            deleteItem.type === 'service-reject' ? 'reject this service' :
            deleteItem.type === 'card-reject' ? 'reject this card' :
            deleteItem.type === 'review' ? 'delete this review' :
            deleteItem.type === 'booking' ? 'cancel this booking' :
            deleteItem.type === 'vendor' ? 'delete this vendor' :
            deleteItem.type === 'service-delete' ? 'delete this service' :
            deleteItem.type === 'card-delete' ? 'delete this card' :
            'perform this action'
          }? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            <i className="fas fa-times me-1"></i> Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i className="fas fa-trash me-1"></i> Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default AdminDashboard