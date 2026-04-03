import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, 
    FaToolbox, FaIdCard, FaEdit, FaSave, FaStar, 
    FaBriefcase, FaCar, FaTimes, FaCamera 
} from 'react-icons/fa';

const ProviderProfile = () => {
    const { currentUser, fetchUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        age: '',
        gender: '',
        location: '',
        services: '',
        chargesPerHour: '',
        vehicleNumber: '',
        vehicleMake: '',
        vehicleModel: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                fullName: currentUser.fullName || '',
                contactNumber: currentUser.contactNumber || '',
                age: currentUser.providerDetails?.age || '',
                gender: currentUser.providerDetails?.gender || '',
                location: currentUser.location || '',
                services: currentUser.providerDetails?.serviceType || '',
                chargesPerHour: currentUser.providerDetails?.chargesPerHour || '',
                vehicleNumber: currentUser.providerDetails?.vehicleDetails?.number || '',
                vehicleMake: currentUser.providerDetails?.vehicleDetails?.make || '',
                vehicleModel: currentUser.providerDetails?.vehicleDetails?.model || ''
            });
        }
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

    const handleSave = async (e) => {
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
                credentials: 'include'
            });
            
            const result = await response.json();
            if (result.success) {
                setIsEditing(false);
                // The context update will trigger re-renders
                if (currentUser) await fetchUserProfile(currentUser); 
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating profile');
        } finally {
            setUpdating(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:3000/${imagePath.replace(/\\/g, '/')}`;
    };

    if (!currentUser) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header with Title and Mode Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        My Professional Profile
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Manage your expert services and presence on AutoAid
                    </p>
                </div>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase text-sm tracking-widest transition-all ${
                        isEditing 
                            ? 'bg-red-500/10 text-red-500 border-2 border-red-500/20 hover:bg-red-500/20' 
                            : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95'
                    }`}
                >
                    {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image & Stats */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Image Card */}
                    <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark p-8 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative mb-6">
                                <div className="w-40 h-40 rounded-full border-4 border-primary/20 p-1 group-hover:border-primary/40 transition-colors">
                                    {(imagePreview || getImageUrl(currentUser.providerDetails?.profileImage)) ? (
                                        <img 
                                            src={imagePreview || getImageUrl(currentUser.providerDetails?.profileImage)} 
                                            alt="Profile" 
                                            className="w-full h-full rounded-full object-cover shadow-2xl"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                            <FaUser size={64} />
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-full cursor-pointer shadow-2xl hover:scale-110 active:scale-90 transition-transform">
                                        <FaCamera size={20} />
                                        <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                )}
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase text-center w-full truncate">
                                {currentUser.fullName}
                            </h2>
                            <span className="mt-2 px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
                                Verified Provider
                            </span>
                        </div>
                        {/* Decorative BG element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Avg Rating', value: currentUser.providerDetails?.averageRating || '0.0', icon: FaStar, color: 'text-yellow-400' },
                            { label: 'Successes', value: currentUser.providerDetails?.completedJobsCount || '0', icon: FaBriefcase, color: 'text-green-400' },
                            { label: 'Reviews', value: currentUser.providerDetails?.totalRatings || '0', icon: FaEnvelope, color: 'text-blue-400' },
                            { label: 'Status', value: currentUser.status || 'Active', icon: FaIdCard, color: 'text-purple-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-3xl text-center shadow-lg hover:shadow-xl transition-all">
                                <stat.icon className={`mx-auto mb-3 ${stat.color}`} size={28} />
                                <p className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-none">{stat.value}</p>
                                <p className="text-[10px] font-black text-gray-500 uppercase mt-2 tracking-tighter">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Detailed Info Form / View */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Personal & Professional Section */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark p-8 shadow-2xl transition-colors duration-300">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-light dark:border-border-dark">
                                <FaToolbox className="text-primary" size={24} />
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Expertise & Contact</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Services Expertise</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="services" value={formData.services}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Towing, Battery Repair"
                                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl flex flex-wrap gap-2 min-h-[56px]">
                                            {formData.services.split(',').map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Primary Phone</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="contactNumber" value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl flex items-center gap-3 min-h-[56px]">
                                            <FaPhone className="text-gray-400" />
                                            <span className="font-bold">{formData.contactNumber}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Email Address</label>
                                    <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl flex items-center gap-3 min-h-[56px]">
                                        <FaEnvelope className="text-gray-400" />
                                        <span className="font-bold">{currentUser.email}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Registered Gender</label>
                                    {isEditing ? (
                                        <select 
                                            name="gender" value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-all font-medium appearance-none"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl min-h-[56px] flex items-center">
                                            <span className="font-bold">{formData.gender || 'Not specified'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Age (Years)</label>
                                    {isEditing ? (
                                        <input 
                                            type="number" name="age" value={formData.age}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl min-h-[56px] flex items-center">
                                            <span className="font-bold">{formData.age || '--'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Base Location</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="location" value={formData.location}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl min-h-[56px] flex items-center gap-3">
                                            <FaMapMarkerAlt className="text-red-400" />
                                            <span className="font-bold">{formData.location || 'Not updated'}</span>
                                        </div>
                                    )}
                                </div>

                                {currentUser.providerDetails?.serviceType?.includes('driver') && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Hourly Charges (PKR)</label>
                                        {isEditing ? (
                                            <input 
                                                type="number" name="chargesPerHour" value={formData.chargesPerHour}
                                                onChange={handleInputChange} min="200" max="1000"
                                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl min-h-[56px] flex items-center">
                                                <span className="font-black text-primary text-xl">Rs. {formData.chargesPerHour || '0'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vehicle Section */}
                        {['Towing', 'Breakdown'].some(s => currentUser.providerDetails?.serviceType?.includes(s)) && (
                            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark p-8 shadow-2xl transition-colors duration-300">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-light dark:border-border-dark">
                                    <FaCar className="text-blue-500" size={24} />
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Vehicle Management</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Plate Number</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" name="vehicleNumber" value={formData.vehicleNumber}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary outline-none transition-all"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl font-black text-center border-2 border-gray-200 dark:border-gray-700">
                                                {formData.vehicleNumber || '---'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Make</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" name="vehicleMake" value={formData.vehicleMake}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary outline-none transition-all"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl font-bold uppercase">
                                                {formData.vehicleMake || '---'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Model</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" name="vehicleModel" value={formData.vehicleModel}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700/50 rounded-2xl p-4 text-gray-900 dark:text-white focus:border-primary outline-none transition-all"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-2xl font-bold">
                                                {formData.vehicleModel || '---'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex justify-end p-4">
                                <button 
                                    type="submit" disabled={updating}
                                    className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-sm tracking-widest px-12 py-4 rounded-3xl shadow-xl shadow-green-500/20 active:scale-95 transition-all disabled:bg-gray-400"
                                >
                                    {updating ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <><FaSave /> Commit Changes</>}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProviderProfile;
