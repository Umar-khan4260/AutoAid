import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

/**
 * CustomSelect - A themed dropdown component with smooth animations
 * @param {string} label - Label text for the select field
 * @param {React.Component} icon - Icon component to display (e.g., FaCar)
 * @param {Array} options - Array of {value, label, disabled} objects
 * @param {string} value - Current selected value
 * @param {function} onChange - Change handler function
 * @param {string} name - Input name for form handling
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether field is required
 */
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

export default CustomSelect;
