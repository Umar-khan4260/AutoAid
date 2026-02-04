import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (role && currentUser.role !== role) {
        return <Navigate to="/" replace />; // Redirect to home if unauthorized
    }

    if (role === 'provider' && currentUser.status === 'pending') {
        return <Navigate to="/pending-approval" replace />;
    }

    return children;
};

export default ProtectedRoute;
