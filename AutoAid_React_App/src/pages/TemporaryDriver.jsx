import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPhone, FaUserTie, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaRoute } from 'react-icons/fa';
import CustomSelect from '../components/CustomSelect';
import { validatePhoneNumber } from '../utils/formValidation';

const TemporaryDriver = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        pickupLocation: '',
        destination: '',
        tripDate: '',
        tripTime: '',
        drivingDuration: '',
        driverGender: '',
        tripType: '',
        contactNumber: '',
        specialRequirements: ''
    });

    const [errors, setErrors] = useState({});

    const driverGenderOptions = [
        { value: '', label: 'Select Preferred Gender', disabled: true },
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'No Preference', label: 'No Preference' }
    ];

    const tripTypeOptions = [
        { value: '', label: 'Select Trip Type', disabled: true },
        { value: 'One-Way', label: 'One-Way Trip' },
        { value: 'Round Trip', label: 'Round Trip' },
        { value: 'Multi-Stop', label: 'Multi-Stop Journey' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate contact number
        if (!validatePhoneNumber(formData.contactNumber)) {
            newErrors.contactNumber = 'Please enter a valid Pakistani phone number (e.g., 0300-1234567)';
        }

        // Validate driving duration
        const duration = parseFloat(formData.drivingDuration);
        if (!formData.drivingDuration || isNaN(duration) || duration <= 0) {
            newErrors.drivingDuration = 'Please enter a valid duration (greater than 0 hours)';
        } else if (duration > 24) {
            newErrors.drivingDuration = 'Maximum duration is 24 hours for a single booking';
        }

        // Validate trip date (should be today or future date)
        if (formData.tripDate) {
            const selectedDate = new Date(formData.tripDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.tripDate = 'Trip date cannot be in the past';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Please login to request a service.');
            return;
        }

        if (validateForm()) {
            try {
                const response = await fetch('http://localhost:3000/api/services/request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        uid: currentUser.uid,
                        serviceType: 'Temporary Driver',
                        contactNumber: formData.contactNumber,
                        details: formData
                    }),
                });

                if (response.ok) {
                    console.log('Temporary Driver Request submitted:', formData);
                    navigate('/nearby-providers', { state: { serviceType: 'Temporary Driver' } });
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error || 'Failed to submit request'}`);
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('Network error. Please try again.');
            }
        }
    };

    // Get today's date for min date validation
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="gradient-text">Temporary Driver Service</span>
                    </h1>
                    <p className="text-gray-600 dark:text-text-muted text-lg max-w-2xl mx-auto">
                        Need a professional driver? Our AI-powered system will match you with the most suitable and trusted driver based on your preferences and trip details.
                    </p>
                </div>

                <div className="glassmorphism rounded-2xl p-8 md:p-10 shadow-lg dark:shadow-glow-lg border border-gray-200 dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pickup Location */}
                            <div className="space-y-2">
                                <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Pickup Location
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaMapMarkerAlt className="text-primary/70" />
                                    </div>
                                    <input
                                        type="text"
                                        id="pickupLocation"
                                        name="pickupLocation"
                                        required
                                        placeholder="Enter pickup address"
                                        value={formData.pickupLocation}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="space-y-2">
                                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Destination
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaRoute className="text-primary/70" />
                                    </div>
                                    <input
                                        type="text"
                                        id="destination"
                                        name="destination"
                                        required
                                        placeholder="Enter destination address"
                                        value={formData.destination}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Trip Date */}
                            <div className="space-y-2">
                                <label htmlFor="tripDate" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Trip Date
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCalendarAlt className="text-primary/70" />
                                    </div>
                                    <input
                                        type="date"
                                        id="tripDate"
                                        name="tripDate"
                                        required
                                        min={today}
                                        value={formData.tripDate}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                {errors.tripDate && (
                                    <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.tripDate}</p>
                                )}
                            </div>

                            {/* Trip Time */}
                            <div className="space-y-2">
                                <label htmlFor="tripTime" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Trip Time
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaClock className="text-primary/70" />
                                    </div>
                                    <input
                                        type="time"
                                        id="tripTime"
                                        name="tripTime"
                                        required
                                        value={formData.tripTime}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Driving Duration */}
                            <div className="space-y-2">
                                <label htmlFor="drivingDuration" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Estimated Duration (Hours)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaClock className="text-primary/70" />
                                    </div>
                                    <input
                                        type="number"
                                        id="drivingDuration"
                                        name="drivingDuration"
                                        required
                                        min="1"
                                        max="24"
                                        step="0.5"
                                        placeholder="e.g. 2"
                                        value={formData.drivingDuration}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                {errors.drivingDuration && (
                                    <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.drivingDuration}</p>
                                )}
                            </div>

                            {/* Driver Gender Preference - Custom Select */}
                            <CustomSelect
                                label="Preferred Driver Gender"
                                icon={FaUserTie}
                                options={driverGenderOptions}
                                value={formData.driverGender}
                                onChange={handleChange}
                                name="driverGender"
                                placeholder="Select Preferred Gender"
                                required
                            />

                            {/* Trip Type - Custom Select */}
                            <CustomSelect
                                label="Trip Type"
                                icon={FaRoute}
                                options={tripTypeOptions}
                                value={formData.tripType}
                                onChange={handleChange}
                                name="tripType"
                                placeholder="Select Trip Type"
                                required
                            />

                            {/* Contact Number */}
                            <div className="space-y-2">
                                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Contact Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaPhone className="text-primary/70" />
                                    </div>
                                    <input
                                        type="tel"
                                        id="contactNumber"
                                        name="contactNumber"
                                        required
                                        placeholder="0300-1234567"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                {errors.contactNumber && (
                                    <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.contactNumber}</p>
                                )}
                            </div>

                            {/* Special Requirements */}
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 dark:text-text-muted">
                                    Special Requirements (Optional)
                                </label>
                                <div className="relative">
                                    <textarea
                                        id="specialRequirements"
                                        name="specialRequirements"
                                        rows="3"
                                        placeholder="Any specific requirements or preferences for the driver..."
                                        value={formData.specialRequirements}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-3 bg-white dark:bg-[#121A2A]/50 border border-gray-300 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300"
                            >
                                Find Best Driver with AI
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                /* Style date and time inputs */
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default TemporaryDriver;
