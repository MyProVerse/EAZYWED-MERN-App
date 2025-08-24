"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const EstimateContext = createContext();

export const EstimateProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estimateItems, setEstimateItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (user) fetchEstimation();
  }, [user]);

  const fetchEstimation = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/dashboard/user/estimations`, {
        withCredentials: true,
      });
      const estimations = response.data.data;
      if (estimations.length > 0) {
        const latestEstimation = estimations[0];
        const items = [
          ...latestEstimation.services.map((s) => ({
            type: "service",
            serviceId: s.service_id,
            packageId: s.package_id,
            name: s.name,
            quantity: s.quantity || 1,
            subtotal: s.package_price ? s.package_price * (s.quantity || 1) : 0,
          })),
          ...latestEstimation.cards.map((c) => ({
            type: "card",
            cardId: c.card_id,
            name: c.name,
            quantity: c.quantity || 1,
            subtotal: c.price_per_card * (c.quantity || 1),
          })),
        ];
        setEstimateItems(items);
        setTotalCost(latestEstimation.total_cost);
      } else {
        setEstimateItems([]);
        setTotalCost(0);
      }
    } catch (error) {
      console.error("Failed to fetch estimation:", error);
      toast.error("Failed to load estimation.");
    } finally {
      setLoading(false);
    }
  };

  const addToEstimate = async (item) => {
    setLoading(true);
    try {
      if (!user) {
        navigate("/signin");
        toast.error("Please sign in to add items to your estimate.");
        return;
      }
      const payload =
        item.type === "service"
          ? { services: [{ serviceId: item.id, packageId: item.packageId, quantity: item.quantity || 1 }] }
          : { cards: [{ cardId: item.id, quantity: item.quantity || 1 }] };

      await axios.post(`${apiUrl}/dashboard/user/estimations`, payload, { withCredentials: true });
      await fetchEstimation();
      toast.success(`${item.name} added to estimate!`);
    } catch (error) {
      console.error("Add to estimation failed:", error);
      toast.error(error.message || "Failed to add to estimate.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromEstimate = async (itemId, type, packageId = null) => {
    setLoading(true);
    try {
      if (!user) {
        navigate("/signin");
        toast.error("Please sign in to remove items from your estimate.");
        return;
      }
      const estimation = await axios.get(`${apiUrl}/dashboard/user/estimations`, { withCredentials: true });
      const estimationId = estimation.data.data[0]?.estimation_id;
      if (!estimationId) throw new Error("No estimation found");

      const endpoint =
        type === "service"
          ? `${apiUrl}/dashboard/user/estimations/${estimationId}/services/${itemId}`
          : `${apiUrl}/dashboard/user/estimations/${estimationId}/cards/${itemId}`;
      await axios.delete(endpoint, { withCredentials: true });
      await fetchEstimation();
      toast.success("Item removed from estimate.");
    } catch (error) {
      console.error("Remove from estimation failed:", error);
      toast.error("Failed to remove item.");
    } finally {
      setLoading(false);
    }
  };

  const clearEstimate = async () => {
    setLoading(true);
    try {
      if (!user) {
        navigate("/signin");
        toast.error("Please sign in to clear your estimate.");
        return;
      }
      const estimation = await axios.get(`${apiUrl}/dashboard/user/estimations`, { withCredentials: true });
      const estimationId = estimation.data.data[0]?.estimation_id;
      if (estimationId) {
        await axios.delete(`${apiUrl}/dashboard/user/estimations/${estimationId}`, { withCredentials: true });
      }
      setEstimateItems([]);
      setTotalCost(0);
      toast.success("Estimation cleared.");
    } catch (error) {
      console.error("Clear estimation failed:", error);
      toast.error("Failed to clear estimate.");
    } finally {
      setLoading(false);
    }
  };

  const convertToBooking = async (dateTime) => {
    setLoading(true);
    try {
      if (!user) {
        navigate("/signin");
        toast.error("Please sign in to convert your estimate to bookings.");
        return;
      }
      const estimation = await axios.get(`${apiUrl}/dashboard/user/estimations`, { withCredentials: true });
      const estimationId = estimation.data.data[0]?.estimation_id;
      if (!estimationId) throw new Error("No estimation to convert");

      const response = await axios.post(
        `${apiUrl}/dashboard/user/estimations/${estimationId}/convert`,
        {
          estimationId,
          date_time: dateTime,
        },
        { withCredentials: true }
      );

      await fetchEstimation();
      toast.success("Estimation converted to bookings!");
      return response.data.bookings;
    } catch (error) {
      console.error("Convert to booking failed:", error);
      toast.error("Failed to convert to bookings.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <EstimateContext.Provider
      value={{
        estimateItems,
        totalCost,
        addToEstimate,
        removeFromEstimate,
        clearEstimate,
        convertToBooking,
        isSidebarOpen,
        toggleSidebar,
        loading,
      }}
    >
      {children}
    </EstimateContext.Provider>
  );
};

export const useEstimate = () => useContext(EstimateContext);