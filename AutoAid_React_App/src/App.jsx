import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
// hello
// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyAccount from './pages/VerifyAccount';
import AccountSuccess from './pages/AccountSuccess';
import ProviderSignup from './pages/ProviderSignup';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProviderApprovals from './pages/admin/ProviderApprovals';
import UserManagement from './pages/admin/UserManagement';
import DisputeResolution from './pages/admin/DisputeResolution';
import AuditLogs from './pages/admin/AuditLogs';

// Service Pages
import BreakdownRepair from './pages/BreakdownRepair';
import LockoutService from './pages/LockoutService';
import TowingService from './pages/TowingService';
import FuelDelivery from './pages/FuelDelivery';
import TemporaryDriver from './pages/TemporaryDriver';
import RoutePlanning from './pages/RoutePlanning';
// import LockoutService from './pages/LockoutService';
// import TowingService from './pages/TowingService';
// import FuelDelivery from './pages/FuelDelivery';
// import TemporaryDriver from './pages/TemporaryDriver';
// import RoutePlanning from './pages/RoutePlanning';

// Provider Pages
import ProviderLayout from './components/ProviderLayout';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderRequests from './pages/provider/ProviderRequests';
import ProviderActiveJob from './pages/provider/ProviderActiveJob';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderHistory from './pages/provider/ProviderHistory';

function App() {
  let a = 10;
  let b = 20;
  return (
    <Router>
      <div className="bg-background-dark font-display text-white min-h-screen">
        <Routes>
          {/* Public Routes without Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-account" element={<VerifyAccount />} />
          <Route path="/account-success" element={<AccountSuccess />} />
          <Route path="/provider-signup" element={<ProviderSignup />} />

          {/* Main Layout Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="careers" element={<Careers />} />
            <Route path="contact" element={<Contact />} />
            <Route path="services/breakdown-repair" element={<BreakdownRepair />} />
            <Route path="services/lockout-service" element={<LockoutService />} />
            <Route path="services/towing-service" element={<TowingService />} />
            <Route path="services/fuel-delivery" element={<FuelDelivery />} />
            <Route path="services/temporary-driver" element={<TemporaryDriver />} />
            <Route path="services/route-planning" element={<RoutePlanning />} />
          </Route>

          {/* Admin Layout Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="providers" element={<ProviderApprovals />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="disputes" element={<DisputeResolution />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Provider Routes */}
          <Route path="/provider" element={<ProviderLayout />}>
            <Route index element={<ProviderDashboard />} />
            <Route path="requests" element={<ProviderRequests />} />
            <Route path="active-job" element={<ProviderActiveJob />} />
            <Route path="profile" element={<ProviderProfile />} />
            <Route path="history" element={<ProviderHistory />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
