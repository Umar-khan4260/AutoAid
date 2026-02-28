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
    const [advisories, setAdvisories] = useState([]);
    const [advisoryError, setAdvisoryError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    // Color assignment based on index for visual variety
    const alertColors = [
        { color: 'border-red-500', iconColor: 'text-red-500' },
        { color: 'border-yellow-500', iconColor: 'text-yellow-500' },
        { color: 'border-blue-500', iconColor: 'text-blue-500' },
        { color: 'border-orange-500', iconColor: 'text-orange-500' },
        { color: 'border-purple-500', iconColor: 'text-purple-500' },
        { color: 'border-teal-500', iconColor: 'text-teal-500' },
    ];

    const fetchAdvisories = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/services/nha-advisories', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success && data.data) {
                setAdvisories(data.data);
                setAdvisoryError('');
            } else {
                setAdvisoryError(data.error || 'Failed to fetch advisories');
                setAdvisories([]);
            }
        } catch (error) {
            console.error('Error fetching NHA advisories:', error);
            setAdvisoryError('Failed to connect to advisory service. Please try again.');
            setAdvisories([]);
        }
    };

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
        setAdvisoryError('');

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

        // Fetch real NHA advisories
        await fetchAdvisories();

        setIsSearching(false);
        setShowResults(true);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAdvisories();
        setIsRefreshing(false);
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
                                    {isSearching ? 'Fetching Advisories...' : 'Find Announcements'}
                                </button>
                            </form>
                        </div>

                        {/* Real-Time NHA Alerts Card */}
                        <div className="glassmorphism rounded-2xl p-6 border border-border-dark min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Real-Time NHA Alerts</h2>
                                {showResults && (
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="text-text-muted hover:text-primary transition-colors"
                                        title="Refresh advisories"
                                    >
                                        <FaSyncAlt className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`} />
                                        <span className="sr-only">Refresh</span>
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {isSearching ? (
                                    <div className="text-center py-10">
                                        <FaSyncAlt className="text-3xl mx-auto mb-3 text-primary animate-spin" />
                                        <p className="text-text-muted">Scraping NHA website for latest advisories...</p>
                                        <p className="text-text-muted/50 text-xs mt-2">This may take up to 15 seconds</p>
                                    </div>
                                ) : showResults ? (
                                    <>
                                        {advisoryError && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                                                <p className="font-medium">⚠️ {advisoryError}</p>
                                                <button
                                                    onClick={handleRefresh}
                                                    className="text-xs mt-2 underline hover:text-red-300"
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        )}
                                        {advisories.length > 0 ? (
                                            advisories.map((advisory, index) => {
                                                const colorSet = alertColors[index % alertColors.length];
                                                return (
                                                    <div
                                                        key={advisory.id}
                                                        className={`bg-white/50 dark:bg-[#121A2A]/50 rounded-xl p-4 border-l-4 ${colorSet.color} hover:bg-white dark:hover:bg-[#121A2A] shadow-sm transition-all cursor-pointer`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <FaExclamationTriangle className={`${colorSet.iconColor} mt-1 flex-shrink-0`} />
                                                            <div>
                                                                <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{advisory.title}</h3>
                                                                <p className="text-text-muted text-xs leading-relaxed whitespace-pre-line">
                                                                    {advisory.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            !advisoryError && (
                                                <div className="text-center py-10 text-text-muted/50">
                                                    <FaRoad className="text-4xl mx-auto mb-3 opacity-30" />
                                                    <p>No active advisories found</p>
                                                </div>
                                            )
                                        )}
                                        {advisories.length > 0 && (
                                            <p className="text-[10px] text-text-muted/40 text-center mt-2">
                                                Source: NHMP Travel Advisory Portal
                                            </p>
                                        )}
                                    </>
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
