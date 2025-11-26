import React, { useState } from 'react';
import { FaCar, FaPhone, FaIdCard, FaTruck } from 'react-icons/fa';
import CustomSelect from '../components/CustomSelect';
import { 
    validatePhoneNumber, 
    validateModelYear, 
    validateOtherManufacturer,
    manufacturerOptions 
} from '../utils/formValidation';

const TowingService = () => {
    const [formData, setFormData] = useState({
        carCompany: '',
        otherCompany: '',
        vehicleNumber: '',
        makeModel: '',
        contactNumber: ''
    });

    const [errors, setErrors] = useState({});

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

        // Validate make/model year
        const yearValidation = validateModelYear(formData.makeModel);
        if (!yearValidation.isValid) {
            newErrors.makeModel = yearValidation.error;
        }

        // Validate other company name if "Other" is selected
        if (!validateOtherManufacturer(formData.carCompany, formData.otherCompany)) {
            newErrors.otherCompany = 'Please specify the manufacturer name';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            const submissionData = {
                ...formData,
                carCompany: formData.carCompany === 'Other' ? formData.otherCompany : formData.carCompany
            };
            console.log('Towing Service Request submitted:', submissionData);
            alert('Towing service request submitted successfully!');
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
                        <span className="gradient-text">Towing Service</span>
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Vehicle not running? We'll connect you with reliable towing services to transport your vehicle safely to your destination.
                    </p>
                </div>

                <div className="glassmorphism rounded-2xl p-8 md:p-10 shadow-glow-lg border border-border-dark">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Car Company - Custom Select */}
                            <CustomSelect
                                label="Car Manufacturer"
                                icon={FaCar}
                                options={manufacturerOptions}
                                value={formData.carCompany}
                                onChange={handleChange}
                                name="carCompany"
                                placeholder="Select Manufacturer"
                                required
                            />

                            {/* Vehicle Number */}
                            <div className="space-y-2">
                                <label htmlFor="vehicleNumber" className="block text-sm font-medium text-text-muted">
                                    Vehicle Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaIdCard className="text-primary/70" />
                                    </div>
                                    <input
                                        type="text"
                                        id="vehicleNumber"
                                        name="vehicleNumber"
                                        required
                                        placeholder="ABC-123"
                                        value={formData.vehicleNumber}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-[#121A2A]/50 border border-border-dark rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Other Company Input (conditional) */}
                            {formData.carCompany === 'Other' && (
                                <div className="space-y-2 md:col-span-2 animate-fadeIn">
                                    <label htmlFor="otherCompany" className="block text-sm font-medium text-text-muted">
                                        Specify Manufacturer
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaCar className="text-primary/70" />
                                        </div>
                                        <input
                                            type="text"
                                            id="otherCompany"
                                            name="otherCompany"
                                            required
                                            placeholder="Enter manufacturer name"
                                            value={formData.otherCompany}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-3 bg-[#121A2A]/50 border border-border-dark rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        />
                                    </div>
                                    {errors.otherCompany && (
                                        <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.otherCompany}</p>
                                    )}
                                </div>
                            )}

                            {/* Make/Model */}
                            <div className="space-y-2">
                                <label htmlFor="makeModel" className="block text-sm font-medium text-text-muted">
                                    Car Model & Year
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCar className="text-primary/70" />
                                    </div>
                                    <input
                                        type="text"
                                        id="makeModel"
                                        name="makeModel"
                                        required
                                        placeholder="e.g. Corolla 2020"
                                        value={formData.makeModel}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-[#121A2A]/50 border border-border-dark rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                {errors.makeModel && (
                                    <p className="text-red-400 text-sm mt-1 animate-fadeIn">{errors.makeModel}</p>
                                )}
                            </div>

                            {/* Contact Number */}
                            <div className="space-y-2">
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
                                Request Towing Service
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

export default TowingService;
