import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaFilter, FaSearch, FaChevronLeft, FaClock, FaPhone, FaLocationArrow, FaTools } from 'react-icons/fa';
import { MdMyLocation } from 'react-icons/md';

const NearbyProviders = () => {
    const location = useLocation();
    const serviceType = location.state?.serviceType || 'Service';
    const [searchRadius, setSearchRadius] = useState(5);

    // Mock Data for Providers
    const providers = [
        {
            id: 1,
            name: 'Pro Towing',
            service: 'Towing Service',
            rating: 4.5,
            reviews: 120,
            distance: '2.3 miles',
            eta: '~15 min',
            image: 'https://images.unsplash.com/photo-1626847037657-fd3622613ce3?w=150&h=150&fit=crop',
            lat: 40.7128,
            lng: -74.0060,
        },
        {
            id: 2,
            name: 'QuickFix Mechanics',
            service: 'Mechanic',
            rating: 4.8,
            reviews: 85,
            distance: '3.1 miles',
            eta: '~20 min',
            image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=150&h=150&fit=crop',
            lat: 40.7150,
            lng: -74.0020,
        },
        {
            id: 3,
            name: 'Citywide Tow & Go',
            service: 'Towing Service',
            rating: 4.2,
            reviews: 45,
            distance: '4.5 miles',
            eta: '~25 min',
            image: 'https://images.unsplash.com/photo-1562920616-0b60b74c5d8a?w=150&h=150&fit=crop',
            lat: 40.7100,
            lng: -74.0090,
        },
        {
            id: 4,
            name: '24/7 Roadside Heroes',
            service: 'Towing Service',
            rating: 4.9,
            reviews: 210,
            distance: '5.0 miles',
            eta: '~28 min',
            image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=150&h=150&fit=crop',
            lat: 40.7200,
            lng: -74.0100,
        }
    ];

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#0B1120] overflow-hidden">
            {/* Sidebar - Provider List */}
            <div className="w-full md:w-[400px] flex flex-col border-r border-border-dark bg-[#121A2A] z-20">
                {/* Header */}
                <div className="p-4 border-b border-border-dark flex flex-col gap-3">
                    <h2 className="text-xl font-bold text-white">Nearby {serviceType} Providers</h2>
                    
                    {/* Filter Bar */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <MdMyLocation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select className="w-full bg-[#0B1120] text-sm text-white pl-9 pr-8 py-2.5 rounded-lg border border-border-dark focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                <option>Sort by: Distance</option>
                                <option>Sort by: Rating</option>
                                <option>Sort by: ETA</option>
                            </select>
                            <FaChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] text-xs pointer-events-none" />
                        </div>
                        <button className="p-2.5 bg-[#0B1120] border border-border-dark rounded-lg text-white hover:bg-white/5 transition-colors">
                            <FaFilter />
                        </button>
                    </div>
                </div>

                {/* Provider List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {providers.map((provider) => (
                        <div key={provider.id} className="bg-[#0B1120] rounded-xl p-3 border border-border-dark hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                                    <img src={provider.image} alt={provider.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <FaStar className="text-yellow-500 text-xs" />
                                            <span className="text-white text-sm font-bold">{provider.rating}</span>
                                        </div>
                                        <h3 className="text-white font-bold text-base leading-tight mb-1">{provider.name}</h3>
                                        <p className="text-text-muted text-xs">{provider.service}</p>
                                    </div>
                                    
                                    <button className="mt-2 w-fit px-4 py-1.5 bg-[#1E293B] hover:bg-primary text-white text-xs font-semibold rounded-md transition-colors duration-300 border border-white/10">
                                        Request
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between text-xs text-text-muted border-t border-white/5 pt-2">
                                <div className="flex items-center gap-1">
                                    <FaLocationArrow className="text-[10px]" />
                                    {provider.distance}
                                </div>
                                <div className="flex items-center gap-1">
                                    <FaClock className="text-[10px]" />
                                    {provider.eta}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer - Search Radius */}
                <div className="p-4 border-t border-border-dark bg-[#121A2A]">
                    <div className="bg-primary hover:bg-cyan-500 text-white font-bold py-3 rounded-lg text-center cursor-pointer transition-colors shadow-lg shadow-primary/20">
                        Search radius: {searchRadius} miles
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="hidden md:block flex-1 relative bg-gray-900 overflow-hidden group">
                 <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.119763973046!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1709765432100!5m2!1sen!2s" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map"
                ></iframe>

                {/* Current Content Overlay (Top Left) */}
                <div className="absolute top-4 left-4 bg-[#121A2A] p-3 rounded-xl border border-border-dark shadow-lg max-w-xs pointer-events-none">
                    <div className="flex items-start justify-between mb-1">
                        <h4 className="text-white text-sm font-bold">New York</h4>
                    </div>
                    <p className="text-text-muted text-xs">New York, USA</p>
                </div>
            </div>
        </div>
    );
};

export default NearbyProviders;
