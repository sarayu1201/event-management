import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import EventsList from "./pages/EventsList";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OrganiserLogin from "./pages/OrganiserLogin";
import OrganiserSignup from "./pages/OrganiserSignup";
import PromoterLogin from "./pages/PromoterLogin";
import Checkout from "./pages/Checkout";
import FakePaymentGateway from "./pages/FakePaymentGateway";
import PaymentStatus from "./pages/PaymentStatus";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import CreateEvent from "./pages/CreateEvent";
import OrganiserEvents from "./pages/OrganiserEvents";
import ManageEvent from "./pages/ManageEvent";
import PromoterDashboard from "./pages/PromoterDashboard";
import PromoterEvents from "./pages/PromoterEvents";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Refunds from "./pages/Refunds";
import Privacy from "./pages/Privacy";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:id" element={<EventDetail />} />

        {/* User auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Organiser auth */}
        <Route path="/organiser/login" element={<OrganiserLogin />} />
        <Route path="/organiser/signup" element={<OrganiserSignup />} />

        {/* Promoter auth (login only — no public signup) */}
        <Route path="/promoter/login" element={<PromoterLogin />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Booking flow (user only) */}
        <Route
          path="/checkout/:id"
          element={
            <ProtectedRoute role="user">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:bookingId"
          element={
            <ProtectedRoute role="user">
              <FakePaymentGateway />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/status"
          element={
            <ProtectedRoute role="user">
              <PaymentStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-confirmation/:bookingId"
          element={
            <ProtectedRoute role="user">
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute role="user">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Organiser dashboard */}
        <Route
          path="/organiser/dashboard"
          element={
            <ProtectedRoute role="organiser">
              <OrganiserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/create-event"
          element={
            <ProtectedRoute role="organiser">
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events"
          element={
            <ProtectedRoute role="organiser">
              <OrganiserEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/:id"
          element={
            <ProtectedRoute role="organiser">
              <ManageEvent />
            </ProtectedRoute>
          }
        />

        {/* Promoter dashboard */}
        <Route
          path="/promoter/dashboard"
          element={
            <ProtectedRoute role="promoter">
              <PromoterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoter/events"
          element={
            <ProtectedRoute role="promoter">
              <PromoterEvents />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legal Policy Pages for Whitelisting */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}

export default App;
