import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  const handleServiceClick = (category) => {
    navigate(`/services?category=${encodeURIComponent(category)}`);
  };

  return (
    <footer>
      <div className="footer-container container">
        <div className="footer-top row">
          <div className="footer-left col-md-6">
            <Link to="/" className="footer-logo">EazyWed</Link>
            <p className="footer-tagline">Where elegance meets joy</p>
          </div>
          <div className="footer-right col-md-6 d-flex flex-md-row justify-content-between">
            <div className="footer-column">
              <h5 className="footer-heading">Company</h5>
              <Link to="/about" className="footer-link">About Us</Link>
              <Link to="/contact" className="footer-link">Contact Us</Link>
              <Link to="/vendors" className="footer-link">Vendors</Link>
            </div>
            <div className="footer-column">
              <h5 className="footer-heading">Services</h5>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Photographers")}
                style={{ cursor: 'pointer' }}
              >
                Photographers
              </div>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Bridal Makeup")}
                style={{ cursor: 'pointer' }}
              >
                Bridal Makeup
              </div>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Wedding Venues")}
                style={{ cursor: 'pointer' }}
              >
                Wedding Venues
              </div>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Henna Artists")}
                style={{ cursor: 'pointer' }}
              >
                Henna Artists
              </div>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Car Rental")}
                style={{ cursor: 'pointer' }}
              >
                Car Rental
              </div>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Wedding Cards")}
                style={{ cursor: 'pointer' }}
              >
                Wedding Cards
              </div>
              <div
                className="footer-link"
                onClick={() => handleServiceClick("Bridal Wear")}
                style={{ cursor: 'pointer' }}
              >
                Bridal Wear
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          EazyWed © All Rights Reserved 2025
        </div>
      </div>
    </footer>
  );
};

export default Footer;