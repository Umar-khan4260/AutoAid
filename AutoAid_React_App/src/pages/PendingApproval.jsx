import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">Account Pending Approval</h2>
                <p className="text-gray-300 mb-6">
                    Your provider account is currently under review by our administrators. 
                    You will receive an email once your account has been approved.
                </p>
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-md p-4 mb-6">
                    <p className="text-yellow-200 text-sm">
                        Please check back later or contact support if you believe this is an error.
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition duration-200"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;
