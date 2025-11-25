import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProviderApprovals from './pages/admin/ProviderApprovals';
import UserManagement from './pages/admin/UserManagement';
import DisputeResolution from './pages/admin/DisputeResolution';
import AuditLogs from './pages/admin/AuditLogs';

import BreakdownRepair from './pages/BreakdownRepair';
import LockoutService from './pages/LockoutService';

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
            <Route path="/services/breakdown-repair" element={<BreakdownRepair />} />
            <Route path="/services/lockout-service" element={<LockoutService />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="providers" element={<ProviderApprovals />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="disputes" element={<DisputeResolution />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
