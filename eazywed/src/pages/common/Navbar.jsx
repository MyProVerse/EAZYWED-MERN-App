import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEstimate } from '../../context/EstimateContext';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { estimateItems, toggleSidebar } = useEstimate();
  const location = useLocation();
  const navigate = useNavigate();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const services = [
    { name: 'Wedding Venues', path: '/services?category=Wedding Venues', icon: 'fa-building', iconClass: 'icon-1' },
    { name: 'Photographers', path: '/services?category=Photographers', icon: 'fa-camera', iconClass: 'icon-2' },
    { name: 'Bridal Makeup', path: '/services?category=Bridal Makeup', icon: 'fa-paint-brush', iconClass: 'icon-3' },
    { name: 'Henna Artists', path: '/services?category=Henna Artists', icon: 'fa-hand-paper', iconClass: 'icon-1' },
    { name: 'Bridal Wear', path: '/services?category=Bridal Wear', icon: 'fa-person-dress', iconClass: 'icon-2' },
    { name: 'Wedding Invitations', path: '/services?category=Wedding Cards', icon: 'fa-envelope', iconClass: 'icon-3' },
    { name: 'Car Rental', path: '/services?category=Car Rental', icon: 'fa-car', iconClass: 'icon-1' },
  ];

  const handleLogout = () => {
    logout();
    setIsUserOpen(false);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.dropdown')) {
      setIsServicesOpen(false);
      setIsUserOpen(false);
    }
  };

  const handleSearchClick = () => {
    if (isHomePage) {
      navigate('/services');
    } else {
      setIsSearchModalOpen(true);
    }
  };

  const handleSearch = (query) => {
    setIsSearchModalOpen(false);
    navigate(`/services?${new URLSearchParams(query).toString()}`);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isHomePage = location.pathname === '/';

  return (
    <>
      <nav className="navbar py-3 navbar-expand-lg navbar-light fixed-top">
        <div className="header-container">
          <div className="navbar-left">
            <Link className="navbar-brand" to="/">EazyWed</Link>
            <ul className="navbar-nav">
              <li className="nav-item dropdown user-dropdown">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  onClick={() => setIsUserOpen(!isUserOpen)}
                >
                  <i className="fas fa-user"></i>
                  <span id="dropdown-label">{user ? user.full_name : 'Account'}</span>
                  <i className={`fas fa-chevron-down dropdown-toggle-chevron ${isUserOpen ? 'rotate' : ''}`}></i>
                </Link>
                <ul className={`dropdown-menu ${isUserOpen ? 'show' : ''}`} id="userDropdownMenu">
                  {user ? (
                    <>
                      {(user.role === 'user' || user.role === 'vendor') && (
                        <li>
                          <Link className="dropdown-item" to="/dashboard">
                            User Dashboard
                          </Link>
                        </li>
                      )}
                      {user.role === 'vendor' && (
                        <li>
                          <Link className="dropdown-item" to="/vendor/dashboard">
                            Vendor Dashboard
                          </Link>
                        </li>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/dashboard">
                              Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/admin/dashboard">
                              Admin Dashboard
                            </Link>
                          </li>
                        </>
                      )}
                      <li><Link className="dropdown-item" to="/" onClick={handleLogout}>Logout</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link className="dropdown-item" to="/signin">Sign In</Link></li>
                      <li><Link className="dropdown-item" to="/signup">Sign Up</Link></li>
                      <li><Link className="dropdown-item" to="/vendor/login">Vendor Login</Link></li>
                    </>
                  )}
                </ul>
              </li>
            </ul>
          </div>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
            aria-label="Toggle navigation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav menu-links">
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">Home</Link>
              </li>
              <li className="nav-item dropdown">
                <Link
                  className="nav-link "
                  to="#"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  Services <i className={`fas fa-chevron-down dropdown-toggle-chevron ${isServicesOpen ? 'rotate' : ''}`}></i>
                </Link>
                <ul className={`dropdown-menu ${isServicesOpen ? 'show' : ''}`}>
                  {services.map((service) => (
                    <li key={service.name}>
                      <Link className="dropdown-item" to={service.path}>
                        <span className={`menu-icon ${service.iconClass}`}><i className={`fas ${service.icon}`}></i></span>
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/deals' ? 'active' : ''}`} to="/deals">Deals</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`} to="/contact">Contact Us</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} to="/about">About Us</Link>
              </li>
              <li className="nav-item list-business-btn-mobile">
                <Link className="btn list-business-btn" to="/vendor/category">List Your Business</Link>
              </li>
              <li className="nav-item search-mobile">
                {!isHomePage && (
                  <Link className="nav-link icon-link" to="#" onClick={handleSearchClick}>
                    <i className="fas fa-search"></i> Search
                  </Link>
                )}
              </li>
              <li className="nav-item ai-mobile">
                <Link className="nav-link icon-link" to="/chatbot"><i className="fas fa-robot"></i> AI</Link>
              </li>
              <li className="nav-item estimate-mobile">
                <Link className="nav-link icon-link" to="#" onClick={toggleSidebar}>
                  <i className="fas fa-calculator"></i> <span>{estimateItems.length}</span>
                </Link>
              </li>
            </ul>
          </div>
          <ul className="navbar-nav d-flex align-items-center">
            <li className="nav-item list-business-btn-desktop">
              <Link className="btn list-business-btn" to="/vendor/category">List Your Business</Link>
            </li>
            <li className="nav-item search-desktop">
              {!isHomePage && (
                <Link className="nav-link icon-link" to="#" onClick={handleSearchClick}>
                  <i className="fas fa-search"></i>
                </Link>
              )}
            </li>
            <li className="nav-item ai-desktop">
              <Link className="nav-link icon-link" to="/chatbot"><i className="fas fa-robot"></i> AI</Link>
            </li>
            <li className="nav-item estimate-desktop">
              <Link className="nav-link icon-link" to="#" onClick={toggleSidebar}>
                <i className="fas fa-calculator"></i> <span>{estimateItems.length}</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {isSearchModalOpen && (
        <div className="search-modal" style={modalStyles.overlay}>
          <div className="search-modal-content" style={modalStyles.content}>
            <button
              className="close-modal-btn"
              onClick={() => setIsSearchModalOpen(false)}
              style={modalStyles.closeButton}
            >
              ×
            </button>
            <SearchBar onSearch={handleSearch} trendingSearches={[]} />
          </div>
        </div>
      )}
    </>
  );
};

// Inline styles for the modal
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
  },
  content: {
    backgroundColor: '#fff',
    paddingTop: '40px',
    borderRadius: '8px',
    position: 'relative',
    maxWidth: '800px',
    width: '90%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
  },
};

export default Navbar;