import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import DriverSearch from './pages/DriverSearch';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProviderApprovals from './pages/admin/ProviderApprovals';
import UserManagement from './pages/admin/UserManagement';
import DisputeResolution from './pages/admin/DisputeResolution';
import AuditLogs from './pages/admin/AuditLogs';

function App() {
  return (
    <Router>
      <div className="bg-background-dark font-display text-white min-h-screen">
        <Navbar />
        <main className="flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/search" element={<DriverSearch />} />

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
                <Route path="services/temporary-driver" element={<NearbyProviders overrideServiceType="Temporary Driver" />} />
                <Route path="services/route-planning" element={<RoutePlanning />} />
                <Route path="nearby-providers" element={<NearbyProviders />} />
                <Route path="profile" element={<UserProfile />} />
              </Route>

              {/* Admin Layout Routes */}
              <Route path="/admin" element={
                <ProtectedRoute role="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="providers" element={<ProviderApprovals />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="disputes" element={<DisputeResolution />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="manage-admins" element={<AdminManagement />} />
                <Route path="contact-messages" element={<ContactMessages />} />
              </Route>

              {/* Provider Routes */}
              <Route path="/provider" element={
                <ProtectedRoute role="provider">
                  <ProviderLayout />
                </ProtectedRoute>
              }>
                <Route index element={<ProviderDashboard />} />
                <Route path="requests" element={<ProviderRequests />} />
                <Route path="active-job" element={<ProviderActiveJob />} />
                <Route path="profile" element={<ProviderProfile />} />
                <Route path="history" element={<ProviderHistory />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
