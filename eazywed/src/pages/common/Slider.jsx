import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Slider.css';

const Slider = ({ category, data, index }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [activeLocation, setActiveLocation] = useState('Lahore');

  const locations = ['Lahore', 'Islamabad', 'Karachi'];
  const theme = index % 2 === 0 ? 'dark' : 'light';

  useEffect(() => {
    const filtered = data.filter((item) => {
      if (!item.city) {
        console.warn(`Item with ID ${item.id} has no city defined`, item);
        return false;
      }
      return item.city.toLowerCase() === activeLocation.toLowerCase();
    });
    setFilteredData(filtered);
  }, [activeLocation, data]);

  const handleSlide = (direction) => {
    const visibleCards = window.innerWidth > 991 ? 4 : window.innerWidth > 576 ? 3 : 1;
    const totalCards = filteredData.length;
    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, totalCards - visibleCards + 1));
    } else {
      setCurrentIndex((prev) => (prev - 1 + Math.max(1, totalCards - visibleCards + 1)) % Math.max(1, totalCards - visibleCards + 1));
    }
  };

  const handleLocationChange = (location) => {
    setActiveLocation(location);
    setCurrentIndex(0);
  };

  const handleCardClick = (item) => {
    const path = item.type === 'service' ? `/services/${item.category.toLowerCase()}/${item.id}` : `/cards/${item.id}`;
    navigate(path);
  };

  const getListingPath = () => {
    if (category === 'Discounts') return '/deals';
    return `/services?category=${category}`;
  };

  return (
    <div className={`slider-wrapper ${theme === 'dark' ? 'slider-dark' : 'slider-light'}`}>
      <div className="container">
        <section className="slider-section">
          <div className="slider-header">
            <h2 className="slider-title">
              {category === 'Discounts' ? 'Exclusive Deals & Discounts' : category === 'Recommendations' ? 'Recommended for You' : `Top ${category} Services`}
            </h2>
            {category !== 'Recommendations' && (
              <a
                href="#"
                className="slider-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(getListingPath());
                }}
              >
                View All
              </a>
            )}
          </div>
          <div className="slider-nav">
            {locations.map((loc) => (
              <a
                key={loc}
                href="#"
                className={activeLocation === loc ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  handleLocationChange(loc);
                }}
              >
                {loc}
              </a>
            ))}
          </div>
          <div className="slider-container">
            <div
              className="slider-track"
              style={{ transform: `translateX(-${currentIndex * (100 / (window.innerWidth > 991 ? 4 : window.innerWidth > 576 ? 3 : 1))}%)` }}
            >
              {filteredData.map((item) => (
                <div key={item.id} className="slider-card" onClick={() => handleCardClick(item)}>
                  <div className="card-image">
                    <img src={item.image || 'assets/images/wedding-venues.jpg'} alt={item.title} />
                    {item.discount && <div className="discount-label">{item.discount}</div>}
                  </div>
                  <div className="card-content">
                    <div className="card-title">{item.title}</div>
                    <div className="card-details">
                      <div className="card-rating">
                        <i className="fas fa-star"></i> {item.rating} ({item.reviewCount})
                      </div>
                      <div className="card-location">
                        <i className="fas fa-map-marker-alt"></i> {item.city}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="slider-buttons">
            <button className="slider-btn" onClick={() => handleSlide('prev')}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <button className="slider-btn" onClick={() => handleSlide('next')}>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Slider;