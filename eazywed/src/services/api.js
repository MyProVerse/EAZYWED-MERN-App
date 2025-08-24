import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/public`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const fetchSliders = (category, city) =>
  api.get(`/sliders/${category}`, { params: { city } }).then((res) => res.data.data);

export const fetchDiscountedServices = (params = {}) =>
  api.get("/discounts", { params }).then((res) => res.data);

export const fetchTrendingSearches = () =>
  api.get("/trending").then((res) => res.data.data);

export const fetchServiceFilters = () =>
  api.get("/filters").then((res) => res.data.data);

export const fetchCardsByType = (type) =>
  api.get(`/cards/${type}`).then((res) => res.data.data);

export const fetchServiceDetails = (id) =>
  api.get(`/service/${id}`).then((res) => res.data);

export const fetchCardDetails = (id) =>
  api.get(`/card/${id}`).then((res) => res.data);

export const fetchCardEditDetails = (id) =>
  api.get(`/card/${id}/edit`).then((res) => res.data.data); // Updated to use shared instance and return .data.data

export const searchServices = (params) =>
  api.get("/search", { params }).then((res) => res.data);

export const fetchServicesByCategory = (category, params) =>
  api.get(`/services/${category}`, { params }).then((res) => res.data);

export const fetchDiscountedServicesByCategory = (category, params = {}) =>
  api.get(`/discounts/${category}`, { params }).then((res) => res.data);

export const checkServiceAvailability = (id, payload) =>
  api.post(`/service/${id}/availability`, payload).then((res) => res.data);

export const checkCardAvailability = (id, payload) =>
  api.post(`/card/${id}/availability`, payload).then((res) => res.data);

export const fetchRecommendations = (city) =>
  api.get("/recommendations", { params: { city } }).then((res) => res.data.data);