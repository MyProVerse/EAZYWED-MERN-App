"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import Navbar from "./common/Navbar"
import Footer from "./common/Footer"
import EstimateSidebar from "./common/EstimateSidebar"
import { fetchDiscountedServices, fetchDiscountedServicesByCategory, fetchServiceFilters } from "../services/api"
import "./Deals.css"

const Deals = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    cities: [],
    categories: [],
  })
  const [activeFilters, setActiveFilters] = useState({
    city: [],
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  })
  const [activeCategory, setActiveCategory] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(true)

  const currentPage = Number.parseInt(searchParams.get("page") || "1")
  const categoryParam = searchParams.get("category")

  useEffect(() => {
    document.title = "Exclusive Deals & Discounts | EazyWed"

    const loadFilters = async () => {
      try {
        const filterData = await fetchServiceFilters()
        const cities = filterData.cities || []
        const requiredCities = ["Lahore", "Islamabad", "Karachi"]
        const mergedCities = [...new Set([...cities, ...requiredCities])]

        // Exclude "Wedding Cards" from categories
        const filteredCategories = (filterData.categories || []).filter(category => category !== "Wedding Cards")

        setFilters({
          cities: mergedCities,
          categories: filteredCategories,
        })

        if (categoryParam && filteredCategories.includes(categoryParam)) {
          setActiveCategory(categoryParam)
        }
      } catch (err) {
        console.error("Failed to load filters:", err)
        setError("Failed to load filters. Please try again later.")
      }
    }

    loadFilters()
  }, [categoryParam])

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true)
      try {
        const params = {
          page: currentPage,
          limit: 10,
        }

        if (activeFilters.city.length > 0) {
          params.city = activeFilters.city.join(",")
        }

        let response
        if (activeCategory) {
          response = await fetchDiscountedServicesByCategory(activeCategory, params)
        } else {
          response = await fetchDiscountedServices(params)
        }

        setServices(response.data || [])
        setPagination(response.pagination || { total: 0, page: 1, pages: 1 })
      } catch (err) {
        console.error("Failed to load services:", err)
        setError("Failed to load discounted services. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [currentPage, activeFilters, activeCategory])

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters)
    setSearchParams({ page: "1", ...(activeCategory ? { category: activeCategory } : {}) })
  }

  const handlePageChange = (page) => {
    setSearchParams({
      page: page.toString(),
      ...(activeCategory ? { category: activeCategory } : {}),
    })
    window.scrollTo(0, 0)
  }

  const handleCategoryClick = (category) => {
    setActiveCategory(category)
    setSearchParams({ page: "1", ...(category ? { category } : {}) })
  }

  const handleCardClick = (service) => {
    navigate(`/services/${service.category.toLowerCase().replace(/\s+/g, "-")}/${service.id}`)
  }

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen)
  }

  return (
    <>
      <Navbar />
      <EstimateSidebar />
      <div className="deals-page-container">
        <h1 className="deals-page-title">Exclusive Deals & Discounts</h1>

        <div className="deals-page-content">
          {/* Sidebar Filters */}
          <div className="deals-sidebar">
            <div className="deals-filter-header" onClick={toggleFilter}>
              FILTER <i className={`fas fa-chevron-${isFilterOpen ? "up" : "down"}`}></i>
            </div>
            <div className={`deals-filter-content ${isFilterOpen ? "show" : ""}`}>
              <div className="deals-filter-section">
                <div className="deals-filter-title">City</div>
                <div className="deals-filter-options">
                  {filters.cities.map((city) => (
                    <div className="deals-filter-option" key={city}>
                      <input
                        type="checkbox"
                        id={city}
                        checked={activeFilters.city.includes(city)}
                        onChange={() => {
                          const newFilters = { ...activeFilters }
                          const index = newFilters.city.indexOf(city)
                          if (index === -1) {
                            newFilters.city.push(city)
                          } else {
                            newFilters.city.splice(index, 1)
                          }
                          handleFilterChange(newFilters)
                        }}
                      />
                      <label htmlFor={city}>{city}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="deals-main-content">
            {/* Service Navigation */}
            <div className="deals-service-nav">
              <a
                href="#"
                className={activeCategory === null ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault()
                  handleCategoryClick(null)
                }}
              >
                All Categories
              </a>
              {filters.categories.map((category) => (
                <a
                  href="#"
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault()
                    handleCategoryClick(category)
                  }}
                >
                  {category}
                </a>
              ))}
            </div>

            <div className="deals-results-header">
              <div className="deals-results-count">
                {loading ? "Loading..." : `${services.length} OF ${pagination.total} DISCOUNTED RESULTS`}
              </div>
            </div>

            {loading ? (
              <div className="deals-loading-spinner">Loading...</div>
            ) : error ? (
              <div className="deals-error-message">{error}</div>
            ) : services.length === 0 ? (
              <div className="deals-no-results">No discounted services found. Try adjusting your filters.</div>
            ) : (
              <div className="deals-service-cards">
                {services.map((service) => (
                  <div key={service.id} className="deals-service-card" onClick={() => handleCardClick(service)}>
                    <div className="deals-card-image">
                      <img src={service.image || "/placeholder.svg?height=234&width=343"} alt={service.title} />
                      {service.discount && <div className="deals-discount-label">{service.discount}</div>}
                    </div>
                    <div className="deals-card-content">
                      <div className="deals-card-top">
                        <div className="deals-card-title">{service.title}</div>
                        <div className="deals-card-details">
                          <div className="deals-card-rating">
                            <i className="fas fa-star"></i> {service.rating} ({service.reviewCount})
                          </div>
                          <div className="deals-card-address">
                            <i className="fas fa-map-marker-alt"></i> {service.city}
                          </div>
                          <div className="deals-card-description">
                            {service.description || "Exclusive deal with amazing discount! Limited time offer."}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="deals-card-divider"></div>
                        <div className="deals-card-footer">
                          <div className="deals-card-footer-title">{service.title}</div>
                          <div className="deals-card-footer-price">Starting at PKR {service.price?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="deals-pagination">
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  Previous
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                  const pageNum = page
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={currentPage === pageNum ? "active" : ""}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  } else if (
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === pagination.pages - 1 && currentPage < pagination.pages - 2)
                  ) {
                    return (
                      <span key={pageNum} className="deals-pagination-ellipsis">
                        ...
                      </span>
                    )
                  }
                  return null
                })}

                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Deals