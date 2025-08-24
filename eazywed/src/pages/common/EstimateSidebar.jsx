import React from 'react';
import { useEstimate } from '../../context/EstimateContext';
import './EstimateSidebar.css';
import { useNavigate } from 'react-router-dom';

const EstimateSidebar = () => {
  const { estimateItems, totalCost, removeFromEstimate, clearEstimate, isSidebarOpen, toggleSidebar, loading } = useEstimate();
  const navigate = useNavigate();

  const handleViewDashboard = () => {
    toggleSidebar();
    navigate('/dashboard');
  };

  return (
    <div className={`estimate-sidebar ${isSidebarOpen ? 'show' : ''}`} id="estimateSidebar">
      <div className="estimate-header">
        <h5>Your Estimate</h5>
        <button className="close-btn" onClick={toggleSidebar}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div id="estimateItems">
        {loading ? (
          <p>Loading...</p>
        ) : estimateItems.length > 0 ? (
          estimateItems.map((item, index) => (
            <div key={index} className="estimate-item">
              <span>{item.name} (x{item.quantity})</span>
              <span>
                PKR {item.subtotal.toLocaleString()}
                <i
                  className="fas fa-trash"
                  onClick={() => removeFromEstimate(
                    item.type === 'service' ? item.serviceId : item.cardId,
                    item.type,
                    item.type === 'service' ? item.packageId : null
                  )}
                ></i>
              </span>
            </div>
          ))
        ) : (
          <p>No items in estimate</p>
        )}
      </div>
      <p className="estimate-total">Total: <span>PKR {totalCost.toLocaleString()}</span></p>
      {estimateItems.length > 0 && (
        <>
          <button
            className="estimate-btn"
            onClick={handleViewDashboard}
          >
            View Dashboard
          </button>
          <button
            className="estimate-btn mt-2"
            onClick={clearEstimate}
            disabled={loading || estimateItems.length === 0}
          >
            Clear Estimate
          </button>
        </>
      )}
    </div>
  );
};

export default EstimateSidebar;