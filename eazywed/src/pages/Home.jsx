import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './common/Navbar';
import SearchBar from './common/SearchBar';
import Slider from './common/Slider';
import VendorCard from './common/VendorCard';
import EstimateSidebar from './common/EstimateSidebar';
import Footer from './common/Footer';
import './Home.css';
import { fetchSliders, fetchDiscountedServices, fetchTrendingSearches, fetchRecommendations } from '../services/api';

const categories = [
  'Recommendations', 'Discounts', 'Wedding Venues', 'Photographers', 'Bridal Makeup', 
  'Henna Artists', 'Bridal Wear', 'Wedding Cards', 'Car Rental'
];

const vendorCategories = [
  { name: 'Wedding Venues', icon: 'fa-building', path: '/services?category=Wedding Venues' },
  { name: 'Photographers', icon: 'fa-camera', path: '/services?category=Photographers' },
  { name: 'Bridal Makeup', icon: 'fa-paint-brush', path: '/services?category=Bridal Makeup' },
  { name: 'Henna Artists', icon: 'fa-hand-paper', path: '/services?category=Henna Artists' },
  { name: 'Bridal Wear', icon: 'fa-person-dress', path: '/services?category=Bridal Wear' },
  { name: 'Car Rental', icon: 'fa-car', path: '/services?category=Car Rental' },
  { name: 'Wedding Invitation', icon: 'fa-envelope', path: '/services?category=Wedding Cards' },
];

const Home = () => {
  const navigate = useNavigate();
  const [sliderData, setSliderData] = useState({});
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sliders = await Promise.all(categories.map(async (cat) => {
          if (cat === 'Discounts') return { category: cat, data: (await fetchDiscountedServices()).data };
          if (cat === 'Recommendations') return { category: cat, data: await fetchRecommendations() };
          if (cat === 'Wedding Cards') return { category: cat, data: await fetchSliders('Wedding Cards') };
          return { category: cat, data: await fetchSliders(cat) };
        }));
        const trending = await fetchTrendingSearches();
        setSliderData(Object.fromEntries(sliders.map(s => [s.category, s.data])));
        setTrendingSearches(trending);
      } catch (error) {
        console.error('Failed to fetch slider data:', error);
        setError('Failed to load slider data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (query) => {
    navigate(`/services?${new URLSearchParams(query).toString()}`);
  };

  return (
    <div className="home">
      <Navbar />
      <EstimateSidebar />
      <div className="search-services">
        <div id="hero-section-20250617" className="hero-section">
          <div className="hero-content">
            <h1>Plan your <span>Shadi</span> in 3 minutes</h1>
            <p>Discover the best wedding vendors and create your dream wedding with ease</p>
          </div>
        </div>
        <SearchBar onSearch={handleSearch} trendingSearches={trendingSearches} />
        <div className="vendorArea">
          <h2 className="vendorTitle">Find Every Wedding Vendor You Need</h2>
          <div className="vendorList">
            {vendorCategories.map((vendor) => (
              <VendorCard key={vendor.name} {...vendor} />
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading sliders...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        categories.map((category, index) => (
          sliderData[category]?.length > 0 && (
            <Slider
              key={category}
              category={category}
              data={sliderData[category]}
              index={index}
            />
          )
        ))
      )}
      <Footer />
    </div>
  );
};

export default Home;