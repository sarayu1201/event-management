import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import BottomNavigation from "./components/BottomNavigation";

import Home from "./pages/Home";
import EventsList from "./pages/EventsList";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OrganiserLogin from "./pages/OrganiserLogin";
import OrganiserSignup from "./pages/OrganiserSignup";
import PromoterLogin from "./pages/PromoterLogin";
import PromoterSignup from "./pages/PromoterSignup";
import Checkout from "./pages/Checkout";
import FakePaymentGateway from "./pages/FakePaymentGateway";
import MockCheckout from "./pages/MockCheckout";
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
import GateScanner from "./pages/GateScanner";
import VisualTicketDesigner from "./pages/VisualTicketDesigner";
import CheckInOperations from "./pages/CheckInOperations";
import ObservabilityDashboard from "./pages/ObservabilityDashboard";
import FeatureFlags from "./pages/FeatureFlags";
import WebhookManagement from "./pages/WebhookManagement";
import TableLayoutDesigner from "./pages/TableLayoutDesigner";
import TableBookingFlow from "./pages/TableBookingFlow";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Refunds from "./pages/Refunds";
import Privacy from "./pages/Privacy";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import ListYourEvent from "./pages/ListYourEvent";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/list-your-event" element={<ListYourEvent />} />

        {/* User auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Organiser auth */}
        <Route path="/organiser/login" element={<OrganiserLogin />} />
        <Route path="/organiser/signup" element={<OrganiserSignup />} />

        {/* Promoter auth */}
        <Route path="/promoter/login" element={<PromoterLogin />} />
        <Route path="/promoter/signup" element={<PromoterSignup />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Gate Scanner Interface */}
        <Route path="/gate-scanner" element={<GateScanner />} />

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
          path="/events/:id/tables"
          element={
            <ProtectedRoute role="user">
              <TableBookingFlow />
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
          path="/payment/mock-checkout"
          element={
            <ProtectedRoute role="user">
              <MockCheckout />
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
        <Route
          path="/organiser/events/:id/designer"
          element={
            <ProtectedRoute role="organiser">
              <VisualTicketDesigner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/:id/operations"
          element={
            <ProtectedRoute role="organiser">
              <CheckInOperations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/:id/lounge"
          element={
            <ProtectedRoute role="organiser">
              <TableLayoutDesigner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/webhooks"
          element={
            <ProtectedRoute role="organiser">
              <WebhookManagement />
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
        <Route
          path="/admin/observability"
          element={
            <ProtectedRoute role="admin">
              <ObservabilityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feature-flags"
          element={
            <ProtectedRoute role="admin">
              <FeatureFlags />
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
      <BottomNavigation />
    </AuthProvider>
  );
}

export default App;
