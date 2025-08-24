"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./common/Navbar";
import Footer from "./common/Footer";
import EstimateSidebar from "./common/EstimateSidebar";
import { fetchServicesByCategory, fetchServiceFilters, searchServices } from "../services/api";
import "./Deals.css"; // Reuse Deals.css as the base styling
import "./Listings.css"; // Specific overrides for Listings

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    cities: [],
    categories: [],
    refundPolicies: [],
  });
  const [activeFilters, setActiveFilters] = useState({
    city: [],
    priceRanges: [],
    refundPolicy: [],
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const currentPage = Number.parseInt(searchParams.get("page") || "1");
  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("query");

  const priceRanges = [
    { label: "1 - 10,000", min: 1, max: 10000 },
    { label: "10,001 - 20,000", min: 10001, max: 20000 },
    { label: "20,001 - 30,000", min: 20001, max: 30000 },
    { label: "30,001 - 50,000", min: 30001, max: 50000 },
    { label: "50,001 - 100,000", min: 50001, max: 100000 },
  ];

  useEffect(() => {
    document.title = searchQuery
      ? `Search Results for "${searchQuery}" | EazyWed`
      : categoryParam
      ? `${categoryParam} | EazyWed`
      : "Service Listings | EazyWed";

    const loadFilters = async () => {
      try {
        const filterData = await fetchServiceFilters();
        const cities = filterData.cities || [];
        const requiredCities = ["Lahore", "Islamabad", "Karachi"];
        const mergedCities = [...new Set([...cities, ...requiredCities])];

        setFilters({
          cities: mergedCities,
          categories: filterData.categories || [],
          refundPolicies: filterData.refundPolicies || [],
        });
      } catch (err) {
        console.error("Failed to load filters:", err);
        setError("Failed to load filters. Please try again later.");
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: 10,
        };

        if (activeFilters.city.length > 0) {
          params.city = activeFilters.city.join(",");
        }
        if (activeFilters.priceRanges.length > 0) {
          const minPrices = activeFilters.priceRanges.map((range) => priceRanges.find((r) => r.label === range).min);
          const maxPrices = activeFilters.priceRanges.map((range) => priceRanges.find((r) => r.label === range).max);
          params.budgetMin = Math.min(...minPrices);
          params.budgetMax = Math.max(...maxPrices);
        }
        if (activeFilters.refundPolicy.length > 0) {
          params.refundPolicy = activeFilters.refundPolicy[0]; // Assuming single selection for simplicity
        }

        let response;
        if (searchQuery) {
          params.query = searchQuery;
          response = await searchServices(params);
        } else {
          response = await fetchServicesByCategory(categoryParam || "all", params);
        }

        setServices(response.data || []);
        setPagination(response.pagination || { total: 0, page: 1, pages: 1 });
      } catch (err) {
        console.error("Failed to load services:", err);
        setError("Failed to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [currentPage, activeFilters, categoryParam, searchQuery]);

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters };
    const index = newFilters[filterType].indexOf(value);
    if (index === -1) {
      newFilters[filterType].push(value);
    } else {
      newFilters[filterType].splice(index, 1);
    }
    setActiveFilters(newFilters);
    setSearchParams({
      page: "1",
      ...(searchQuery ? { query: searchQuery } : {}),
      ...(categoryParam ? { category: categoryParam } : {}),
    });
  };

  const handlePageChange = (page) => {
    setSearchParams({
      page: page.toString(),
      ...(searchQuery ? { query: searchQuery } : {}),
      ...(categoryParam ? { category: categoryParam } : {}),
    });
    window.scrollTo(0, 0);
  };

  const handleCardClick = (service) => {
    if (service.type === "service") {
      navigate(`/services/${service.category.toLowerCase().replace(/\s+/g, "-")}/${service.id}`);
    } else if (service.type === "card") {
      navigate(`/cards/${service.id}`);
    }
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <>
      <Navbar />
      <EstimateSidebar />
      <div className="deals-page-container">
        <h1 className="deals-page-title">
          {searchQuery
            ? `Search Results for "${searchQuery}"`
            : categoryParam
            ? `${categoryParam}`
            : "All Wedding Services"}
        </h1>

        <div className="deals-page-content">
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
                        id={`city-${city}`}
                        checked={activeFilters.city.includes(city)}
                        onChange={() => handleFilterChange("city", city)}
                      />
                      <label htmlFor={`city-${city}`}>{city}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="deals-filter-section">
                <div className="deals-filter-title">Price Range</div>
                <div className="deals-filter-options">
                  {priceRanges.map((range) => (
                    <div className="deals-filter-option" key={range.label}>
                      <input
                        type="checkbox"
                        id={`price-${range.label}`}
                        checked={activeFilters.priceRanges.includes(range.label)}
                        onChange={() => handleFilterChange("priceRanges", range.label)}
                      />
                      <label htmlFor={`price-${range.label}`}>{range.label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="deals-filter-section">
                <div className="deals-filter-title">Refund Policy</div>
                <div className="deals-filter-options">
                  {filters.refundPolicies.map((policy) => (
                    <div className="deals-filter-option" key={policy}>
                      <input
                        type="checkbox"
                        id={`refund-${policy}`}
                        checked={activeFilters.refundPolicy.includes(policy)}
                        onChange={() => handleFilterChange("refundPolicy", policy)}
                      />
                      <label htmlFor={`refund-${policy}`}>{policy}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="deals-main-content">
            <div className="deals-results-header">
              <div className="deals-results-count">
                {loading ? "Loading..." : `${services.length} OF ${pagination.total} RESULTS`}
              </div>
            </div>

            {loading ? (
              <div className="deals-loading-spinner">Loading...</div>
            ) : error ? (
              <div className="deals-error-message">{error}</div>
            ) : services.length === 0 ? (
              <div className="deals-no-results">No services found. Try adjusting your filters or search.</div>
            ) : (
              <div className="deals-service-cards">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="deals-service-card"
                    onClick={() => handleCardClick(service)}
                  >
                    <div className="deals-card-image">
                      <img
                        src={service.image || "/placeholder.svg?height=234&width=343"}
                        alt={service.title}
                      />
                      {service.discount && (
                        <div className="deals-discount-label">{service.discount}</div>
                      )}
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
                            {service.description || "Explore this amazing wedding service!"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="deals-card-divider"></div>
                        <div className="deals-card-footer">
                          <div className="deals-card-footer-title">{service.title}</div>
                          <div className="deals-card-footer-price">
                            Starting at PKR {service.price?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="deals-pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                  const pageNum = page;
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
                    );
                  } else if (
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === pagination.pages - 1 && currentPage < pagination.pages - 2)
                  ) {
                    return (
                      <span key={pageNum} className="deals-pagination-ellipsis">
                        ...
                      </span>
                    );
                  }
                  return null;
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
  );
};

export default Listings;