import React from 'react';
import { Link } from 'react-router-dom';
import './VendorCard.css';

const VendorCard = ({ name, icon, path }) => (
  <Link to={path} className="vendorCard">
    <i className={`fas ${icon}`}></i>
    <p>{name}</p>
  </Link>
);

export default VendorCard;