import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import EstimateSidebar from './common/EstimateSidebar';
import { fetchServiceDetails, checkServiceAvailability } from '../services/api';
import { useEstimate } from '../context/EstimateContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './details-page.css';
import createAPI from '../utils/api';

const categoryFields = {
  Photographers: ['expertise', 'staff', 'cities_covered', 'cancellation_policy'],
  "Wedding Venues": ['venue_type', 'amenities', 'parking_space', 'catering_type', 'wheelchair_accessible', 'staff', 'cancellation_policy'],
  "Bridal Makeup": ['services_for', 'location_type', 'staff', 'home_service', 'expertise', 'cities_covered', 'cancellation_policy'],
  "Henna Artists": ['services_for', 'mehndi_type', 'expertise', 'has_team', 'sells_mehndi', 'cities_covered', 'cancellation_policy'],
  "Bridal Wear": ['material', 'size', 'length', 'bust', 'design', 'rental_duration', 'cancellation_policy'],
  "Car Rental": ['seats', 'doors', 'transmission', 'cancellation_policy'],
};

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToEstimate } = useEstimate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Details');
  const [activePackage, setActivePackage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const reviewsPerPage = 5;
  const today = new Date().toISOString().split('T')[0];
  const api = createAPI(navigate);

  useEffect(() => {
    const loadService = async () => {
      try {
        const data = await fetchServiceDetails(id);
        setService(data);
        document.title = `${data.name} - Service Details | EazyWed`;
      } catch (err) {
        if (err.response?.status === 403) {
          setError('This service is not currently available.');
          toast.error('This service is not currently available.');
        } else {
          setError('Failed to load service details.');
          toast.error('Failed to load service details.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadService();
  }, [id]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    document.getElementById(`dp-section-${tab.toLowerCase()}`).scrollIntoView({ behavior: 'smooth' });
  };

  const handlePackageClick = (index) => setActivePackage(index);

  const validateDates = (isModal = false) => {
    const datesToCheck = isModal ? { date: modalDate, startDate: modalStartDate, endDate: modalEndDate } : { date, startDate, endDate };
    if (service?.isRental) {
      if (!datesToCheck.startDate || !datesToCheck.endDate) return false;
      const start = new Date(datesToCheck.startDate);
      const end = new Date(datesToCheck.endDate);
      return start >= new Date(today) && end > start;
    }
    return datesToCheck.date && new Date(datesToCheck.date) >= new Date(today);
  };

  const handleAvailabilityCheck = async (e) => {
    e.stopPropagation();
    console.log("handleAvailabilityCheck called");
    if (!validateDates(false)) {
      toast.error('Please select valid date(s) for availability check.');
      return;
    }
    try {
      const payload = service.isRental
        ? { startDate, endDate, packageId: service.pricingPackages[activePackage]._id, quantity: service.category === "Wedding Venues" ? quantity : 1 }
        : { date, packageId: service.pricingPackages[activePackage]._id, quantity: service.category === "Wedding Venues" ? quantity : 1 };
      const { whatsappLink } = await checkServiceAvailability(id, payload);
      window.open(whatsappLink, '_blank');
      toast.success('WhatsApp inquiry opened for availability!');
    } catch (err) {
      console.error('Availability check failed:', err);
      toast.error('Failed to check availability.');
    }
  };

  const handleBookClick = (packageId) => (e) => {
    e.stopPropagation();
    console.log("handleBookClick called with packageId:", packageId);
    if (!user) {
      toast.error('Please sign in to book a service.');
      navigate('/signin');
      return;
    }
    setSelectedPackageId(packageId);
    setModalDate('');
    setModalStartDate('');
    setModalEndDate('');
    setShowDateModal(true);
  };

  const handleBook = async (e) => {
    e.stopPropagation();
    console.log("handleBook called");
    if (!validateDates(true)) {
      toast.error('Please select valid date(s) for booking.');
      return;
    }
    try {
      const payload = service.isRental
        ? { service_id: id, package_id: selectedPackageId, date_time: modalStartDate, end_date: modalEndDate, quantity: service.category === "Wedding Venues" ? quantity : 1 }
        : { service_id: id, package_id: selectedPackageId, date_time: modalDate, quantity: service.category === "Wedding Venues" ? quantity : 1 };

      const response = await api.post('/dashboard/user/bookings', payload);
      const data = response.data;

      toast.success(`Booking created! Booking ID: ${data.booking.booking_id}`);
      if (data.whatsappLink) {
        console.log("Opening WhatsApp link for booking confirmation");
        window.open(data.whatsappLink, '_blank');
      }
      setShowDateModal(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Booking failed:', err);
      if (err.response) {
        toast.error(err.response.data.message || 'Booking failed.');
        if (err.response.status === 401 || err.response.status === 403) {
          navigate('/signin');
        }
      } else {
        toast.error('Booking failed.');
      }
    }
  };

  const handleAddToEstimate = async () => {
    try {
      const pkg = service.pricingPackages[activePackage];
      const item = {
        type: 'service',
        id: service.id,
        packageId: pkg._id,
        quantity: service.category === "Wedding Venues" ? quantity : 1,
        name: `${service.name} - ${pkg.name}`,
        subtotal: pkg.price * (service.category === "Wedding Venues" ? quantity : 1),
      };
      await addToEstimate(item);
    } catch (err) {
      console.error('Add to estimate failed:', err);
      toast.error('Failed to add to estimate.');
    }
  };

  const handleWhatsAppContact = () => {
    if (!service?.vendorPhone) {
      toast.error("Vendor contact not available.");
      return;
    }
    const whatsappLink = `https://wa.me/${service.vendorPhone.replace("+", "")}`;
    window.open(whatsappLink, "_blank");
  };

  const loadMoreReviews = () => setReviewsPage((prev) => prev + 1);

  const calculateRatingBars = () => {
    if (!service?.reviews.length) return Array(5).fill(0);
    const counts = Array(5).fill(0);
    service.reviews.forEach((r) => counts[5 - r.stars]++);
    return counts.map((count) => (count / service.reviews.length) * 100);
  };

  const getDetailIcon = (key) => {
    const icons = {
      expertise: "fa-lightbulb",
      staff: "fa-users",
      cities_covered: "fa-map-marked-alt",
      cancellation_policy: "fa-file-contract",
      venue_type: "fa-building",
      amenities: "fa-concierge-bell",
      parking_space: "fa-parking",
      catering_type: "fa-utensils",
      wheelchair_accessible: "fa-wheelchair",
      services_for: "fa-user-friends",
      location_type: "fa-store",
      home_service: "fa-home",
      mehndi_type: "fa-paint-brush",
      has_team: "fa-users-cog",
      sells_mehndi: "fa-shopping-bag",
      material: "fa-tshirt",
      size: "fa-ruler",
      length: "fa-ruler-vertical",
      bust: "fa-ruler-horizontal",
      design: "fa-palette",
      rental_duration: "fa-clock",
      seats: "fa-chair",
      doors: "fa-door-open",
      transmission: "fa-cogs",
    };
    return icons[key] || "fa-info";
  };

  const getCoordinates = () => {
    const defaultCoords = [31.5204, 74.3587];
    if (service?.location_map) {
      const latLngMatch = service.location_map.match(/[@!3d](-?\d+\.\d+)[,!4d](-?\d+\.\d+)/);
      if (latLngMatch) {
        const lat = parseFloat(latLngMatch[1]);
        const lng = parseFloat(latLngMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return [lat, lng];
        }
      }
    }
    return defaultCoords;
  };

  const getMapSource = () => {
    return !!(service?.location_map || service?.vendorDetails?.office_address || service?.city);
  };

  if (loading) return <div className="dp-loading">Loading...</div>;
  if (error) return <div className="dp-error">{error}</div>;
  if (!service) return null;

  const displayedReviews = service.reviews.slice(0, reviewsPage * reviewsPerPage);
  const ratingBars = calculateRatingBars();
  const relevantDetails = categoryFields[service.category] || [];

  return (
    <>
      <Navbar />
      <EstimateSidebar />
      <div className="dp-container">
        <nav className="dp-breadcrumb(clock">
          <a href="/">Home</a> {' > '} <a href={`/services/${service.category.toLowerCase()}`}>{service.category}</a> {' > '} <span>{service.name}</span>
        </nav>

        <div className="dp-nav-section">
          <ul>
            {['Details', 'Pricing', 'Location', 'Reviews'].map((tab) => (
              <li key={tab}>
                <a
                  href={`#dp-section-${tab.toLowerCase()}`}
                  className={activeTab === tab ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); handleTabClick(tab); }}
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
                <img src={service.brandIcon || service.photos[0] || 'assets/images/default-profile.jpeg'} alt="Profile" />
              </div>
              <div className="dp-profile-info">
                <h1>{service.name}</h1>
                <div className="dp-rating">
                  <i className="fas fa-star"></i> {service.avgRating} ({service.reviewCount})
                </div>
                <div className="dp-address">
                  <i className="fas fa-map-marker-alt"></i> {service.city}
                </div>
              </div>
            </div>
            {Object.keys(service.details).filter(key => relevantDetails.includes(key) && service.details[key]).length > 0 && (
              <div className="dp-details">
                <h3>Details</h3>
                <dl className="dp-details-grid">
                  {Object.entries(service.details)
                    .filter(([key]) => relevantDetails.includes(key))
                    .map(([key, value]) => (
                      value && (Array.isArray(value) ? value.length > 0 : true) && (
                        <React.Fragment key={key}>
                          <dt><i className={`fas ${getDetailIcon(key)}`}></i> {key.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</dt>
                          <dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
                        </React.Fragment>
                      )
                    ))}
                </dl>
              </div>
            )}
            {service.description && (
              <div className="dp-details">
                <h3>Description</h3>
                <div className="dp-description">{service.description}</div>
              </div>
            )}
            {typeof service.additionalInfo === 'string' && service.additionalInfo.trim() !== '' && (
              <div className="dp-additional-details">
                <h3>Additional Details</h3>
                <div className="dp-description">{service.additionalInfo}</div>
              </div>
            )}
          </div>
          <div className="dp-subsection-2">
            {service.discount > 0 && <div className="dp-discount-label">{service.discount}% Off</div>}
            <div id="carouselExample" className="carousel slide dp-carousel">
              <div className="carousel-inner dp-carousel-inner">
                {service.photos.slice(0, 5).map((photo, idx) => (
                  <div key={idx} className={`carousel-item dp-carousel-item ${idx === 0 ? 'active' : ''}`}>
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Image ${idx + 1}`}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      data-bs-toggle="modal"
                      data-bs-target="#imageModal"
                      data-src={photo || "/placeholder.svg"}
                    />
                  </div>
                ))}
              </div>
              {service.photos.length > 1 && (
                <>
                  <button className="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon dp-carousel-control" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
                    <span className="carousel-control-next-icon dp-carousel-control" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </>
              )}
            </div>
            <div className="dp-price-buttons">
              <div className="dp-action-buttons">
                <button className="dp-btn" onClick={handleWhatsAppContact}>
                  <i className="fab fa-whatsapp"></i> Contact via WhatsApp
                </button>
              </div>
              <div className="dp-price-range">{service.priceRange} PKR</div>
            </div>
          </div>
        </div>

        <div className="dp-section" id="dp-section-pricing">
          <h3 className="dp-section-title">Pricing & Packages</h3>
          <div className="dp-pricing-container">
            <div className="dp-pricing-tabs">
              {service.pricingPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className={`dp-tab-box ${idx === activePackage ? 'active' : ''}`}
                  onClick={() => handlePackageClick(idx)}
                >
                  {pkg.name}
                </div>
              ))}
            </div>
            <div className="dp-package-content">
              {service.pricingPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="dp-package-details"
                  style={{ display: idx === activePackage ? 'flex' : 'none' }}
                >
                  <div className="dp-inclusions-section">
                    <h4>{pkg.name} Package</h4>
                    <ul className="dp-inclusions">
                      {Array.isArray(pkg.inclusions) ? (
                        pkg.inclusions.map((item, i) => (
                          <li key={i} className="dp-inclusion-item"><i className="fas fa-check"></i> {item}</li>
                        ))
                      ) : (
                        <li className="dp-inclusion-item"><i className="fas fa-check"></i> {pkg.inclusions || 'No inclusions specified'}</li>
                      )}
                    </ul>
                    <div className="dp-package-price">{pkg.price.toLocaleString()} PKR</div>
                    {service.category === "Wedding Venues" && (
                      <div className="dp-quantity-selector">
                        <button
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => setQuantity((prev) => prev + 1)}
                        >
                          +
                        </button>
                      </div>
                    )}
                    <button className="dp-btn" onClick={handleAddToEstimate}>Add to Estimate</button>
                    <button className="dp-btn" style={{ marginLeft: '10px' }} onClick={handleBookClick(pkg._id)}>
                      Book Now
                    </button>
                  </div>
                  <div className="dp-availability-section">
                    {service.isRental ? (
                      <div className="dp-calendar-range">
                        <input
                          type="date"
                          className="dp-calendar"
                          value={startDate}
                          min={today}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (new Date(e.target.value) >= new Date(endDate)) setEndDate('');
                          }}
                          placeholder="Start Date"
                        />
                        <input
                          type="date"
                          className="dp-calendar"
                          value={endDate}
                          min={startDate ? new Date(new Date(startDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                          onChange={(e) => setEndDate(e.target.value)}
                          placeholder="End Date"
                        />
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="dp-calendar"
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        placeholder="Select Date"
                      />
                    )}
                    <button
                      className="dp-btn"
                      onClick={handleAvailabilityCheck}
                      disabled={service.isRental ? !startDate || !endDate : !date}
                    >
                      Check Availability
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(service.location_map || service.vendorDetails?.office_address) && (
          <div className="dp-section" id="dp-section-location">
            <h3 className="dp-section-title">Location</h3>
            <div className="dp-map">
              {getMapSource() ? (
                <MapContainer center={getCoordinates()} zoom={13} style={{ width: '100%', height: '400px' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={getCoordinates()}>
                    <Popup>{service?.vendorDetails?.office_address || service?.city || 'Service Location'}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <img src="/assets/images/map.jpg" alt="Map Placeholder" style={{ width: '100%', height: '400px' }} />
              )}
            </div>
            <div className="dp-address-text">{service.address || service.city}</div>
          </div>
        )}

        <div className="dp-section" id="dp-section-reviews">
          <h3 className="dp-section-title">Reviews</h3>
          <div className="dp-review-counter">
            <div className="dp-total-rating">
              {service.avgRating} Average <span>
                <i className="fas fa-star"></i> ({service.reviewCount} Reviews)
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
                      style={{ width: `${ratingBars[5 - stars]}%`, backgroundColor: service.reviews.length ? '#d7385e' : '#ccc' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dp-reviews-list">
            {displayedReviews.map((review, idx) => (
              <div key={idx} className="dp-review-item">
                <div className="dp-stars">{'★'.repeat(review.stars)}</div>
                <p>
                  "{review.comment || 'No comment'}" - {review.user} ({new Date(review.createdAt).toLocaleDateString()})
                </p>
              </div>
            ))}
          </div>
          {displayedReviews.length < service.reviews.length && (
            <button className="dp-btn" onClick={loadMoreReviews}>
              Load More
            </button>
          )}
        </div>
      </div>

      {showDateModal && (
        <div className="dp-modal">
          <div className="dp-modal-dialog">
            <div className="dp-modal-content">
              <div className="dp-modal-header">
                <h5 className="dp-modal-title">Select Booking Date</h5>
                <button type="button" className="dp-btn-close" onClick={() => setShowDateModal(false)}>
                  ×
                </button>
              </div>
              <div className="dp-modal-body">
                {service.isRental ? (
                  <>
                    <label>Start Date:</label>
                    <input
                      type="date"
                      className="dp-calendar"
                      value={modalStartDate}
                      min={today}
                      onChange={(e) => {
                        setModalStartDate(e.target.value);
                        if (new Date(e.target.value) >= new Date(modalEndDate)) setModalEndDate('');
                      }}
                    />
                    <label className="mt-2">End Date:</label>
                    <input
                      type="date"
                      className="dp-calendar"
                      value={modalEndDate}
                      min={modalStartDate ? new Date(new Date(modalStartDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                      onChange={(e) => setModalEndDate(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label>Date:</label>
                    <input
                      type="date"
                      className="dp-calendar"
                      value={modalDate}
                      min={today}
                      onChange={(e) => setModalDate(e.target.value)}
                    />
                  </>
                )}
              </div>
              <div className="dp-modal-footer">
                <button type="button" className="dp-btn dp-btn-secondary" onClick={() => setShowDateModal(false)}>
                  Close
                </button>
                <button type="button" className="dp-btn" onClick={handleBook}>
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
  );
};

export default ServiceDetails;