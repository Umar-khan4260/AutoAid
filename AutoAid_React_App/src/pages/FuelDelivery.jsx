import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPhone, FaGasPump, FaTint } from 'react-icons/fa';
import CustomSelect from '../components/CustomSelect';
import { validatePhoneNumber } from '../utils/formValidation';

const FuelDelivery = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        fuelType: '',
        quantity: '',
        contactNumber: ''
    });

    const [errors, setErrors] = useState({});

    const fuelTypeOptions = [
        { value: '', label: 'Select Fuel Type', disabled: true },
        { value: 'Petrol', label: 'Petrol' },
        { value: 'Diesel', label: 'Diesel' }
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

        // Validate quantity
        const quantity = parseFloat(formData.quantity);
        if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
            newErrors.quantity = 'Please enter a valid quantity (greater than 0)';
        } else if (quantity > 100) {
            newErrors.quantity = 'Maximum quantity is 100 liters';
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
                        serviceType: 'Fuel Delivery',
                        contactNumber: formData.contactNumber,
                        details: formData
                    }),
                });

                if (response.ok) {
                    console.log('Fuel Delivery Request submitted:', formData);
                    navigate('/nearby-providers', { state: { serviceType: 'Fuel Delivery' } });
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

    return (
        <div className="min-h-screen bg-[#0B1120] pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="gradient-text">Fuel Delivery Service</span>
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Running out of fuel? We'll deliver petrol or diesel directly to your location quickly and conveniently.
                    </p>
                </div>

                <div className="glassmorphism rounded-2xl p-8 md:p-10 shadow-glow-lg border border-border-dark">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Fuel Type - Custom Select */}
                            <CustomSelect
                                label="Fuel Type"
                                icon={FaGasPump}
                                options={fuelTypeOptions}
                                value={formData.fuelType}
                                onChange={handleChange}
                                name="fuelType"
                                placeholder="Select Fuel Type"
                                required
                            />

                            {/* Quantity */}
                            <div className="space-y-2">
                                <label htmlFor="quantity" className="block text-sm font-medium text-text-muted">
                                    Quantity (Liters)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaTint className="text-primary/70" />
                                    </div>
                                    <input
                                        type="number"
                                        id="quantity"
                                        name="quantity"
                                        required
                                        min="1"
                                        max="100"
                                        step="0.1"
                                        placeholder="e.g. 10"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-[#121A2A]/50 border border-border-dark rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                {errors.quantity && (
                                    <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.quantity}</p>
                                )}
                            </div>

                            {/* Contact Number */}
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="contactNumber" className="block text-sm font-medium text-text-muted">
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
                                        className="block w-full pl-10 pr-3 py-3 bg-[#121A2A]/50 border border-border-dark rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                {errors.contactNumber && (
                                    <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.contactNumber}</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300"
                            >
                                Request Fuel Delivery
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
            `}</style>
        </div>
    );
};

export default FuelDelivery;
