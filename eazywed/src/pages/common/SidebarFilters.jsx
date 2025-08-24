import React from "react";
import { Accordion, Form } from "react-bootstrap";
import "./SidebarFilters.css";

const SidebarFilters = ({ filterOptions, onFilterChange }) => {
  return (
    <div className="sidebar">
      <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>FILTER</Accordion.Header>
          <Accordion.Body>
            <div className="filter-section">
              <div className="filter-title">City</div>
              {filterOptions.cities?.map((city) => (
                <Form.Check
                  key={city}
                  type="checkbox"
                  id={`city-${city}`}
                  label={city}
                  onChange={(e) => onFilterChange("city", city, e.target.checked)}
                />
              ))}
            </div>
            <div className="filter-section">
              <div className="filter-title">Budget (per person)</div>
              <Form.Check
                type="checkbox"
                id="budget-5000-10000"
                label="PKR 5,000 - 10,000"
                onChange={(e) =>
                  onFilterChange("budgetMin", "5000", e.target.checked) &&
                  onFilterChange("budgetMax", "10000", e.target.checked)
                }
              />
              <Form.Check
                type="checkbox"
                id="budget-10000-20000"
                label="PKR 10,000 - 20,000"
                onChange={(e) =>
                  onFilterChange("budgetMin", "10000", e.target.checked) &&
                  onFilterChange("budgetMax", "20000", e.target.checked)
                }
              />
            </div>
            <div className="filter-section">
              <div className="filter-title">Discount</div>
              <Form.Check
                type="checkbox"
                id="discount-yes"
                label="Yes"
                onChange={(e) => onFilterChange("discount", "true", e.target.checked)}
              />
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default SidebarFilters;