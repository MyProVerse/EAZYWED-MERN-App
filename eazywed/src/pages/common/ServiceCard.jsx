import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./ServiceCard.css";

const ServiceCard = ({ service }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/services/${service.category}/${service.id}`);
  };

  return (
    <Card className="service-card" onClick={handleClick}>
      <Row noGutters>
        <Col xs={12} sm={4} className="card-image">
          <Card.Img src={service.image} alt={service.title} />
          {service.discount && <div className="discount-label">{service.discount}</div>}
        </Col>
        <Col xs={12} sm={8} className="card-content">
          <div className="card-top">
            <Card.Title className="card-title">{service.title}</Card.Title>
            <div className="card-details">
              <div className="card-rating">
                <i className="fas fa-star"></i> {service.rating} ({service.reviewCount})
              </div>
              <div className="card-address">
                <i className="fas fa-map-marker-alt"></i> {service.city}
              </div>
              <div className="card-description">
                {service.description || "No description available"}
              </div>
            </div>
          </div>
          <div className="card-divider"></div>
          <div className="card-footer">
            <div className="card-footer-title">{service.title}</div>
            <div className="card-footer-price">Starting at PKR {service.price}</div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default ServiceCard;