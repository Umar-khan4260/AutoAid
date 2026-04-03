import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    FaUserCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, 
    FaStar, FaBriefcase, FaIdCard, FaCar, FaEdit, FaSave, FaTimes, FaCamera 
} from 'react-icons/fa';

const UserProfile = () => {
    const { currentUser, fetchUserProfile } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        age: '',
        gender: '',
        vehicleNumber: '',
        vehicleMake: '',
        vehicleModel: '',
        chargesPerHour: '',
        location: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                try {
                    const response = await fetch('http://localhost:3000/api/auth/check', {
                        method: 'GET',
                        credentials: 'include',
                    });
                    const data = await response.json();
                    if (data.success) {
                        setUserProfile(data.user);
                        // Initialize form data
                        setFormData({
                            fullName: data.user.fullName || '',
                            contactNumber: data.user.contactNumber || '',
                            age: data.user.providerDetails?.age || '',
                            gender: data.user.providerDetails?.gender || '',
                            vehicleNumber: data.user.providerDetails?.vehicleDetails?.number || '',
                            vehicleMake: data.user.providerDetails?.vehicleDetails?.make || '',
                            vehicleModel: data.user.providerDetails?.vehicleDetails?.model || '',
                            chargesPerHour: data.user.providerDetails?.chargesPerHour || '',
                            location: data.user.location || ''
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    toast.error("Failed to load profile data");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProfile();
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) data.append(key, formData[key]);
            });
            if (profileImage) {
                data.append('profileImage', profileImage);
            }

            const response = await fetch('http://localhost:3000/api/auth/profile', {
                method: 'PUT',
                body: data,
                // credentials: 'include' is important for cookies
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                setUserProfile(result.user);
                setIsEditing(false);
                toast.success("Profile updated successfully!");
                // Refresh global auth state
                if (currentUser) fetchUserProfile(currentUser);
            } else {
                toast.error(result.error || "Failed to update profile");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("An error occurred while updating profile");
        } finally {
            setUpdating(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:3000/${imagePath.replace(/\\/g, '/')}`;
    };

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isProvider = userProfile?.role === 'provider';

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-5xl mx-auto w-full">
                {/* Profile Header Card */}
                <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden mb-8">
                    <div className="h-48 bg-gradient-to-r from-primary via-blue-600 to-indigo-700 relative">
                        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                            <div className="relative group">
                                <div className="rounded-full border-4 border-white dark:border-card-dark bg-gray-100 dark:bg-gray-800 p-1 shadow-xl">
                                    {imagePreview || getImageUrl(userProfile?.providerDetails?.profileImage) ? (
                                        <img 
                                            src={imagePreview || getImageUrl(userProfile?.providerDetails?.profileImage)} 
                                            alt="Profile" 
                                            className="w-32 h-32 rounded-full object-cover"
                                        />
                                    ) : (
                                        <FaUserCircle className="w-32 h-32 text-gray-400" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-2 right-2 p-2 bg-primary hover:bg-primary-hover text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                                        <FaCamera size={16} />
                                        <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                )}
                            </div>
                            <div className="mb-4">
                                <h1 className="text-3xl font-bold text-white drop-shadow-md">
                                    {userProfile?.fullName || 'User Name'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        isProvider ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {userProfile?.role}
                                    </span>
                                    {isProvider && (
                                        <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                                            <FaStar size={12} />
                                            {userProfile.providerDetails?.averageRating || '0.0'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
                        >
                            {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
                        </button>
                    </div>

                    <div className="pt-20 pb-8 px-8">
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* Detailed Form Fields */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-border-dark pb-2 mb-4">
                                            <FaUserCircle /> Personal Information
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-muted">Full Name</label>
                                            <input 
                                                type="text" name="fullName" value={formData.fullName} 
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-muted">Contact Number</label>
                                            <input 
                                                type="text" name="contactNumber" value={formData.contactNumber} 
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-muted">Age</label>
                                                <input 
                                                    type="number" name="age" value={formData.age} 
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-muted">Gender</label>
                                                <select 
                                                    name="gender" value={formData.gender} 
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {isProvider && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-border-dark pb-2 mb-4">
                                                <FaBriefcase /> Professional Details
                                            </h3>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-muted">Location</label>
                                                <input 
                                                    type="text" name="location" value={formData.location} 
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                            {userProfile.providerDetails?.serviceType?.includes('driver') && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-text-muted">Charges Per Hour (PKR 200-1000)</label>
                                                    <input 
                                                        type="number" name="chargesPerHour" value={formData.chargesPerHour} 
                                                        onChange={handleInputChange} min="200" max="1000"
                                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Vehicle details for towing/mechanics */}
                                            {['Towing Service', 'Breakdown Repair'].some(s => userProfile.providerDetails?.serviceType?.includes(s)) && (
                                                <div className="space-y-4 pt-2">
                                                    <p className="text-xs font-bold text-text-muted uppercase">Vehicle Information</p>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-text-muted">Vehicle Number</label>
                                                        <input 
                                                            type="text" name="vehicleNumber" value={formData.vehicleNumber} 
                                                            onChange={handleInputChange}
                                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-text-muted">Make</label>
                                                            <input 
                                                                type="text" name="vehicleMake" value={formData.vehicleMake} 
                                                                onChange={handleInputChange}
                                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-text-muted">Model</label>
                                                            <input 
                                                                type="text" name="vehicleModel" value={formData.vehicleModel} 
                                                                onChange={handleInputChange}
                                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" disabled={updating}
                                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                                    >
                                        {updating ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <><FaSave /> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-12">
                                {/* Stats View for Providers */}
                                {isProvider && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Rating', value: userProfile.providerDetails?.averageRating || '0.0', icon: FaStar, color: 'text-yellow-400' },
                                            { label: 'Total Reviews', value: userProfile.providerDetails?.totalRatings || '0', icon: FaEnvelope, color: 'text-blue-400' },
                                            { label: 'Completed Jobs', value: userProfile.providerDetails?.completedJobsCount || '0', icon: FaBriefcase, color: 'text-green-400' },
                                            { label: 'Status', value: userProfile.status || 'Active', icon: FaUserCircle, color: 'text-purple-400' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-border-dark p-4 rounded-2xl text-center">
                                                <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
                                                <p className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-none">{stat.value}</p>
                                                <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-widest">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Personal Info Display */}
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                            Contact Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><FaEnvelope /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-text-muted uppercase">Email Address</p>
                                                    <p className="font-medium">{userProfile.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><FaPhone /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-text-muted uppercase">Phone Number</p>
                                                    <p className="font-medium">{userProfile.contactNumber || 'Not provided'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500"><FaMapMarkerAlt /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-text-muted uppercase">Base Location</p>
                                                    <p className="font-medium">{userProfile.location || 'Not updated'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Info Display */}
                                    {isProvider && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold flex items-center gap-3">
                                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                                Professional Details
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><FaBriefcase /></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-text-muted uppercase">Services Provided</p>
                                                        <p className="font-medium capitalize">{userProfile.providerDetails?.serviceType}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><FaIdCard /></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-text-muted uppercase">Provider ID / Status</p>
                                                        <p className="font-medium">{userProfile.uid.substring(0, 15)}... | {userProfile.status}</p>
                                                    </div>
                                                </div>
                                                {userProfile.providerDetails?.vehicleDetails?.number && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><FaCar /></div>
                                                        <div>
                                                            <p className="text-xs font-bold text-text-muted uppercase">Primary Vehicle</p>
                                                            <p className="font-medium">{userProfile.providerDetails.vehicleDetails.make} {userProfile.providerDetails.vehicleDetails.model} ({userProfile.providerDetails.vehicleDetails.number})</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
