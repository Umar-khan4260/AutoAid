import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import AdminLayout from './components/AdminLayout';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyAccount from './pages/VerifyAccount';
import AccountSuccess from './pages/AccountSuccess';
import ProviderSignup from './pages/ProviderSignup';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProviderApprovals from './pages/admin/ProviderApprovals';
import UserManagement from './pages/admin/UserManagement';
import DisputeResolution from './pages/admin/DisputeResolution';
import AuditLogs from './pages/admin/AuditLogs';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route without Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/account-success" element={<AccountSuccess />} />
        <Route path="/provider-signup" element={<ProviderSignup />} />

        {/* Main Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="providers" element={<ProviderApprovals />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="disputes" element={<DisputeResolution />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
