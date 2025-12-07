import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaEnvelope, FaPhone } from 'react-icons/fa';

const UserProfile = () => {
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                try {
                    const response = await fetch('http://localhost:3000/api/auth/check', {
                        method: 'GET',
                        credentials: 'include',
                    });
                    const data = await response.json();
                    if (data.success) {
                        setUserProfile(data.user);
                    }
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                } finally {
                    setLoading(false);
                }
            } else {
                 setLoading(false);
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-dark text-white">
                <p>Please log in to view your profile.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-dark text-white">
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-white font-display pt-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto w-full">
                <div className="bg-card-dark border border-border-dark rounded-xl shadow-xl overflow-hidden">
                    {/* Header with Background */}
                    <div className="h-32 bg-gradient-to-r from-primary to-blue-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="rounded-full border-4 border-card-dark bg-gray-800 p-1">
                                {currentUser.photoURL ? (
                                    <img 
                                        src={currentUser.photoURL} 
                                        alt="Profile" 
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                ) : (
                                    <FaUserCircle className="w-24 h-24 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="pt-16 pb-8 px-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">
                                    {userProfile?.fullName || currentUser.displayName || 'User'}
                                </h1>
                                <p className="text-text-muted text-sm">
                                    Manage your profile information
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="p-4 bg-gray-900/50 rounded-lg border border-border-dark hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <FaEnvelope />
                                    </div>
                                    <span className="text-text-muted text-sm font-medium">Email Address</span>
                                </div>
                                <p className="text-white font-medium pl-11">{userProfile?.email || currentUser.email}</p>
                            </div>

                            {userProfile?.contactNumber && (
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-border-dark hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                            <FaPhone />
                                        </div>
                                        <span className="text-text-muted text-sm font-medium">Phone Number</span>
                                    </div>
                                    <p className="text-white font-medium pl-11">{userProfile.contactNumber}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
