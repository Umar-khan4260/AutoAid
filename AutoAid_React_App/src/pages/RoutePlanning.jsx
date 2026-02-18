import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaSearch, FaExclamationTriangle, FaRoad, FaClock, FaSyncAlt, FaMap, FaDirections, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const RoutePlanning = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        startLocation: '',
        endLocation: '',
        travelDate: ''
    });

    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Mock NHA announcements
    const mockAnnouncements = [
        {
            id: 1,
            type: 'Roadblock',
            severity: 'high',
            title: 'Roadblock: M-2 North',
            description: 'Major accident near Chakri Interchange. All lanes blocked. Reported 15 mins ago.',
            color: 'border-red-500',
            iconColor: 'text-red-500'
        },
        {
            id: 2,
            type: 'Construction',
            severity: 'medium',
            title: 'Construction: Lahore Ring Road',
            description: 'Lane closures for repair work between Gaju Matta and DHA. Expect delays.',
            color: 'border-yellow-500',
            iconColor: 'text-yellow-500'
        },
        {
            id: 3,
            type: 'Protest',
            severity: 'low',
            title: 'Protest: Faizabad Interchange',
            description: 'Political rally causing slow traffic on Islamabad Expressway.',
            color: 'border-blue-500',
            iconColor: 'text-blue-500'
        }
    ];

    const mockAlternativeRoutes = [
        {
            id: 1,
            name: 'Alternative via N-5',
            description: 'Avoids M-2 accident. Longer distance but faster currently.',
            distance: '410 km',
            time: '5h 15m',
            status: 'Recommended'
        },
        {
            id: 2,
            name: 'Original Route (Delayed)',
            description: 'Wait for M-2 clearance. Significant delays expected.',
            distance: '375 km',
            time: '> 6h 30m',
            status: 'Delayed'
        }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please login to use route planning features.');
            return;
        }

        setIsSearching(true);

        // Try to get location, but don't block if it fails
        const getLocation = () => new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
                    () => resolve(null)
                );
            } else {
                resolve(null);
            }
        });

        const userLocation = await getLocation();

        try {
            const response = await fetch('http://localhost:3000/api/services/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    uid: currentUser.uid,
                    serviceType: 'Route Planning',
                    contactNumber: currentUser.contactNumber || '',
                    details: formData,
                    userLocation: userLocation
                }),
            });
            if (!response.ok) {
                 console.error('Failed to save route request');
            }
        } catch (error) {
            console.error('Error saving route request:', error);
        }

        // Show results on the same page
        setTimeout(() => {
            setIsSearching(false);
            setShowResults(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        NHA Route Announcements
                    </h1>
                    <p className="text-text-muted">
                        Get real-time updates on roadblocks, construction, and other alerts for your planned route.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Plan Your Route Card */}
                        <div className="glassmorphism rounded-2xl p-6 border border-border-dark">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Plan Your Route</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="startLocation" className="block text-sm font-medium text-text-muted">
                                        Starting Point
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="startLocation"
                                            name="startLocation"
                                            required
                                            placeholder="e.g., Islamabad Toll Plaza"
                                            value={formData.startLocation}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="endLocation" className="block text-sm font-medium text-text-muted">
                                        Destination
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="endLocation"
                                            name="endLocation"
                                            required
                                            placeholder="e.g., Lahore"
                                            value={formData.endLocation}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="travelDate" className="block text-sm font-medium text-text-muted">
                                        Travel Date
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaCalendarAlt className="text-text-muted" />
                                        </div>
                                        <input
                                            type="date"
                                            id="travelDate"
                                            name="travelDate"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.travelDate}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-4 py-3 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all duration-300 mt-4"
                                >
                                    {isSearching ? (
                                        <FaSyncAlt className="animate-spin" />
                                    ) : (
                                        <FaSearch />
                                    )}
                                    {isSearching ? 'Searching...' : 'Find Announcements'}
                                </button>
                            </form>
                        </div>

                        {/* Real-Time NHA Alerts Card */}
                        <div className="glassmorphism rounded-2xl p-6 border border-border-dark min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Real-Time NHA Alerts</h2>
                                <button className="text-text-muted hover:text-primary transition-colors">
                                    <FaSyncAlt className="text-sm" />
                                    <span className="sr-only">Refresh</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {showResults ? (
                                    mockAnnouncements.map((alert) => (
                                        <div 
                                            key={alert.id} 
                                            className={`bg-white/50 dark:bg-[#121A2A]/50 rounded-xl p-4 border-l-4 ${alert.color} hover:bg-white dark:hover:bg-[#121A2A] shadow-sm transition-all cursor-pointer`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <FaExclamationTriangle className={`${alert.iconColor} mt-1 flex-shrink-0`} />
                                                <div>
                                                    <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{alert.title}</h3>
                                                    <p className="text-text-muted text-xs leading-relaxed">
                                                        {alert.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-text-muted/50">
                                        <FaRoad className="text-4xl mx-auto mb-3 opacity-30" />
                                        <p>Enter route details to view alerts</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Map Container */}
                        <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-200 dark:border-border-dark h-[500px] relative bg-surface-light dark:bg-surface-dark group">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d425291.3881526467!2d72.76655610811828!3d33.61606277732232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfbfd07891722f%3A0x6059515c3bdb02b6!2sIslamabad%2C%20Islamabad%20Capital%20Territory%2C%20Pakistan!5e0!3m2!1sen!2s!4v1709765432100!5m2!1sen!2s" 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Google Map"
                            ></iframe>
                        </div>

                        {/* Suggested Alternative Routes */}
                        <div className="glassmorphism rounded-2xl p-6 border border-border-dark">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Suggested Alternative Routes</h2>
                            
                            <div className="space-y-4">
                                {showResults ? (
                                    mockAlternativeRoutes.map((route) => (
                                        <div key={route.id} className="bg-white/50 dark:bg-[#121A2A]/50 rounded-xl p-5 border border-gray-200 dark:border-border-dark/50 hover:border-primary/30 transition-all shadow-sm">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{route.name}</h3>
                                                    <p className="text-text-muted text-sm">{route.description}</p>
                                                </div>
                                                
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-gray-900 dark:text-white font-bold text-lg">{route.distance}</div>
                                                        <div className="text-text-muted text-xs">Distance</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-bold text-lg ${route.status === 'Delayed' ? 'text-red-400' : 'text-green-400'}`}>
                                                            {route.time}
                                                        </div>
                                                        <div className="text-text-muted text-xs">Est. Time</div>
                                                    </div>
                                                    <button className="px-4 py-2 bg-[#1E293B] hover:bg-primary hover:text-white text-text-muted rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                                                        <FaDirections />
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-text-muted/50">
                                        <p>Search for a route to see alternatives</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoutePlanning;
