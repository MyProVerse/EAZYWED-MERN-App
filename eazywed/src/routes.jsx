"use client"

import React, { lazy, Suspense } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import SignIn from "./components/SignIn"
import SignUp from "./components/SignUp"
import NotFound from "./components/NotFound"
import Loading from "./components/Loading"
import ContactUs from "./pages/ContactUs"
import AboutUs from "./pages/AboutUs"

const Dashboard = lazy(() => import("./components/Dashboard"))
const AdminLogin = lazy(() => import("./components/AdminLogin"))
const AdminResetRequest = lazy(() => import("./components/AdminResetRequest"))
const AdminResetPassword = lazy(() => import("./components/AdminResetPassword"))
const AdminDashboard = lazy(() => import("./components/AdminDashboard"))
const VendorCategoryType = lazy(() => import("./components/VendorCategoryType"))
const VendorSignup = lazy(() => import("./components/VendorSignup"))
const VendorUnderReview = lazy(() => import("./components/VendorUnderReview"))
const VendorLogin = lazy(() => import("./components/VendorLogin"))
const VendorResetRequest = lazy(() => import("./components/VendorResetRequest"))
const VendorResetPassword = lazy(() => import("./components/VendorResetPassword"))
const VendorDashboard = lazy(() => import("./components/VendorDashboard"))
const AddService = lazy(() => import("./components/AddService"))
const WeddingServicesForm = lazy(() => import("./components/WeddingServicesForm"))
const WeddingCardForm = lazy(() => import("./components/WeddingCardForm"))
const CardEditor = lazy(() => import("./components/CardEditor"))
const PublicEditor = lazy(() => import("./pages/PublicEditor")) // Added

import Home from "./pages/Home"
const Listings = lazy(() => import("./pages/Listings"))
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"))
const WeddingCardsDetails = lazy(() => import("./pages/WeddingCardsDetails"))
const Deals = lazy(() => import("./pages/Deals"))
const Chatbot = lazy(() => import("./pages/Chatbot"))

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Loading />
  if (!user || !allowedRoles.includes(user.role)) {
    const redirectTo = allowedRoles.includes("user")
      ? "/signin"
      : allowedRoles.includes("vendor")
        ? "/vendor/login"
        : "/admin/login"
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }
  return children
}

export const ProtectedResetRoute = ({ children, type }) => {
  const { checkResetToken, checkVendorResetToken } = useAuth()
  const [isValid, setIsValid] = React.useState(null)
  const checkFunction = type === "vendor" ? checkVendorResetToken : checkResetToken

  React.useEffect(() => {
    const validate = async () => {
      const valid = await checkFunction()
      setIsValid(valid)
    }
    validate()
  }, [checkFunction])

  if (isValid === null) return <Loading />
  return isValid ? (
    children
  ) : (
    <Navigate to={type === "vendor" ? "/vendor/reset-request" : "/admin/reset-request"} replace />
  )
}

export const ProtectedVendorSignupRoute = ({ children }) => {
  const location = useLocation()
  const categoryFromState = location.state?.category
  const params = new URLSearchParams(location.search)
  const categoryFromParams = params.get("category")
  const hasCategory = categoryFromState || categoryFromParams

  return hasCategory ? children : <Navigate to="/vendor/category" replace />
}

export const ProtectedVendorReviewRoute = ({ children }) => {
  const location = useLocation()
  const submissionSuccess = location.state?.submissionSuccess

  return submissionSuccess ? children : <Navigate to="/vendor/category" replace />
}

const AppRoutes = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/services" element={<Listings />} />
      <Route path="/services/:category" element={<Listings />} />
      <Route path="/services/:category/:id" element={<ServiceDetails />} />
      <Route path="/cards/:id" element={<WeddingCardsDetails />} />
      <Route path="/deals" element={<Deals />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["user", "vendor"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/reset-request" element={<AdminResetRequest />} />
      <Route
        path="/admin/reset-password"
        element={
          <ProtectedResetRoute type="admin">
            <AdminResetPassword />
          </ProtectedResetRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-service"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
            <div>Add Service (Placeholder)</div>
          </ProtectedRoute>
        }
      />
      <Route path="/vendor/category" element={<VendorCategoryType />} />
      <Route
        path="/vendor/signup"
        element={
          <ProtectedVendorSignupRoute>
            <VendorSignup />
          </ProtectedVendorSignupRoute>
        }
      />
      <Route
        path="/vendor/under-review"
        element={
          <ProtectedVendorReviewRoute>
            <VendorUnderReview />
          </ProtectedVendorReviewRoute>
        }
      />
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/reset-request" element={<VendorResetRequest />} />
      <Route
        path="/vendor/reset-password"
        element={
          <ProtectedResetRoute type="vendor">
            <VendorResetPassword />
          </ProtectedResetRoute>
        }
      />
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/add-service"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <AddService />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/wedding-services-form"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <WeddingServicesForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/services/edit/:serviceId"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <WeddingServicesForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/wedding-card-form"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <WeddingCardForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/cards/edit/:cardId"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <WeddingCardForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/card-editor"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <CardEditor />
          </ProtectedRoute>
        }
      />
     <Route path="/public-editor/:cardId" element={<PublicEditor />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
)

export default AppRoutes