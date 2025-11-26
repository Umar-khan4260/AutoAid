import React, { useState, useRef, useEffect } from 'react';
import { FaCar, FaTools, FaPhone, FaExclamationTriangle, FaIdCard, FaChevronDown } from 'react-icons/fa';

// Custom Select Component
const CustomSelect = ({ label, icon: Icon, options, value, onChange, name, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label htmlFor={name} className="block text-sm font-medium text-text-muted">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Icon className="text-primary/70" />
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`block w-full pl-10 pr-10 py-3 bg-[#121A2A]/50 border rounded-xl text-left transition-all duration-300 cursor-pointer hover:bg-[#121A2A]/70 ${
                        isOpen 
                            ? 'border-primary ring-2 ring-primary/50' 
                            : 'border-border-dark'
                    } ${!value ? 'text-text-muted' : 'text-white'}`}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </button>
                <div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <FaChevronDown className="h-4 w-4 text-primary" />
                </div>

                {/* Custom Dropdown */}
                <div className={`absolute z-20 w-full mt-2 glassmorphism rounded-xl border border-border-dark overflow-hidden shadow-glow-lg transition-all duration-300 origin-top ${
                    isOpen 
                        ? 'opacity-100 visible scale-y-100 translate-y-0' 
                        : 'opacity-0 invisible scale-y-95 -translate-y-2'
                }`}>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option, index) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                disabled={option.disabled}
                                className={`w-full text-left px-4 py-3 transition-all duration-300 ${
                                    option.disabled 
                                        ? 'text-text-muted cursor-not-allowed opacity-50' 
                                        : 'text-white hover:bg-primary/20 hover:text-primary cursor-pointer'
                                } ${value === option.value ? 'bg-primary/10 text-primary' : ''}`}
                                style={{
                                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                                    opacity: isOpen ? 1 : 0,
                                    transform: isOpen ? 'translateX(0)' : 'translateX(-10px)'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BreakdownRepair = () => {
    const [formData, setFormData] = useState({
        issueType: '',
        carCompany: '',
        otherCompany: '',
        vehicleNumber: '',
        makeModel: '',
        contactNumber: '',
        description: ''
    });

    const [errors, setErrors] = useState({});

    const currentYear = new Date().getFullYear();

    const issueTypeOptions = [
        { value: '', label: 'Select Issue Type', disabled: true },
        { value: 'Flat Tyre', label: 'Flat Tyre' },
        { value: 'Battery Issue', label: 'Battery Issue' },
        { value: 'Engine Issue', label: 'Engine Issue' },
        { value: 'Unknown Issue', label: 'Unknown Issue' }
    ];

    const manufacturerOptions = [
        { value: '', label: 'Select Manufacturer', disabled: true },
        { value: 'Toyota', label: 'Toyota' },
        { value: 'Honda', label: 'Honda' },
        { value: 'Suzuki', label: 'Suzuki' },
        { value: 'Hyundai', label: 'Hyundai' },
        { value: 'Kia', label: 'Kia' },
        { value: 'MG', label: 'MG' },
        { value: 'Changan', label: 'Changan' },
        { value: 'Other', label: 'Other' }
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

        // Validate contact number (Pakistani format: 03XX-XXXXXXX or 03XXXXXXXXX)
        const phoneRegex = /^(03\d{2}-?\d{7})$/;
        if (!phoneRegex.test(formData.contactNumber.replace(/\s/g, ''))) {
            newErrors.contactNumber = 'Please enter a valid Pakistani phone number (e.g., 0300-1234567)';
        }

        // Validate make/model year (must be 4 digits between 1950 and current year)
        const yearMatch = formData.makeModel.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
        if (!yearMatch) {
            newErrors.makeModel = `Please include a valid year (1950-${currentYear}) in the model`;
        } else {
            const year = parseInt(yearMatch[0]);
            if (year < 1950 || year > currentYear) {
                newErrors.makeModel = `Year must be between 1950 and ${currentYear}`;
            }
        }

        // Validate other company name if "Other" is selected
        if (formData.carCompany === 'Other' && !formData.otherCompany.trim()) {
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
            console.log('Form submitted:', submissionData);
            alert('Request submitted successfully!');
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
                        <span className="gradient-text">Breakdown Repair</span>
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Stranded? Don't worry. Fill out the form below and we'll connect you with the nearest certified mechanic immediately.
                    </p>
                </div>

                <div className="glassmorphism rounded-2xl p-8 md:p-10 shadow-glow-lg border border-border-dark">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Issue Type - Custom Select */}
                            <CustomSelect
                                label="Issue Type"
                                icon={FaExclamationTriangle}
                                options={issueTypeOptions}
                                value={formData.issueType}
                                onChange={handleChange}
                                name="issueType"
                                placeholder="Select Issue Type"
                                required
                            />

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

                            {/* Description */}
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-text-muted">
                                    Issue Description
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <FaTools className="text-primary/70" />
                                    </div>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows="4"
                                        placeholder="Please describe the issue in a little more detail..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 bg-[#121A2A]/50 border border-border-dark rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300"
                            >
                                Request Assistance
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

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(18, 26, 42, 0.5);
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #13c8ec;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #0fa3c7;
                }
            `}</style>
        </div>
    );
};

export default BreakdownRepair;
