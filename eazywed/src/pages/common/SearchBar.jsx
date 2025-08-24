import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({ onSearch, trendingSearches }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('serviceCity');
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const [name, setName] = useState('');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setService('');
    setCity('');
    setName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let query = {};
    if (activeTab === 'serviceCity' && service && city) {
      query = { category: service, city };
    } else if (activeTab === 'nameSearch' && name) {
      query = { query: name };
    } else {
      alert('Please fill in the required fields.');
      return;
    }
    navigate(`/services?${new URLSearchParams(query).toString()}`);
    onSearch(query);
  };

  const handleTrendingClick = (search) => {
    const path = search.type === 'service' 
      ? `/services/${search.category}/${search.id}` 
      : `/cards/${search.id}`;
    navigate(path);
  };

  return (
    <div className="searchBox">
      <div className="searchTabs">
        <button
          className={`tabBtn ${activeTab === 'serviceCity' ? 'active' : ''}`}
          onClick={() => handleTabChange('serviceCity')}
        >
          Service & City
        </button>
        <button
          className={`tabBtn ${activeTab === 'nameSearch' ? 'active' : ''}`}
          onClick={() => handleTabChange('nameSearch')}
        >
          Search by Name
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div
          className="searchFields"
          style={{ display: activeTab === 'serviceCity' ? 'flex' : 'none' }}
          id="serviceCity"
        >
          <div className="searchField">
            <select value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">Select Service</option>
              <option value="Wedding Venues">Wedding Venues</option>
              <option value="Photographers">Photographers</option>
              <option value="Bridal Makeup">Bridal Makeup</option>
              <option value="Henna Artists">Henna Artists</option>
              <option value="Bridal Wear">Bridal Wear</option>
              <option value="Car Rental">Car Rental</option>
              <option value="Wedding Cards">Wedding Cards</option>
            </select>
          </div>
          <span className="search-divider"></span>
          <div className="searchField">
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Select City</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Karachi">Karachi</option>
              <option value="Rawalpindi">Rawalpindi</option>
            </select>
          </div>
          <button type="submit" className="searchBtn">Search</button>
        </div>
        <div
          className="nameSearch"
          style={{
            display: activeTab === 'nameSearch' ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
          id="nameSearch"
        >
          <input
            type="text"
            placeholder="Search by name (e.g., Wedding Venues, Photographers)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="searchBtn">Search</button>
        </div>
      </form>
      <div className="trendingSearches">
        <span className="trendingLabel">Popular Searches:</span>
        {trendingSearches.slice(0, 5).map((search) => (
          <span
            key={search.id}
            className="trendingItem"
            onClick={() => handleTrendingClick(search)}
          >
            {search.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;