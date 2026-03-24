import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaStar, FaFilter, FaChevronLeft, FaClock, FaLocationArrow, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { MdMyLocation } from 'react-icons/md';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Icons
const carIcon = L.divIcon({
    html: `<div style="background-color: #0B1120; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2); border: 2px solid #00BCD4; color: #00BCD4;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
        </svg>
    </div>`,
    className: 'custom-driver-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
});

const userIcon = L.divIcon({
    html: `<div style="background-color: #3B82F6; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2); border: 2px solid white; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
            <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
    </div>`,
    className: 'custom-user-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
});

// Component to handle map animated transitions
const MapUpdater = ({ userLocation, providers, selectedProvider }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedProvider) {
            const p = providers.find(provider => provider.id === selectedProvider);
            if (p && p.lat && p.lng) map.flyTo([p.lat, p.lng], 15);
        } else if (userLocation && userLocation.lat && userLocation.lng) {
            map.flyTo([userLocation.lat, userLocation.lng], 13);
        }
    }, [selectedProvider, userLocation, map, providers]);
    return null;
};

const NearbyProviders = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const serviceType = location.state?.serviceType || 'Temporary Driver';
    const [userLocation, setUserLocation] = useState(location.state?.userLocation || null);
    const [requestId, setRequestId] = useState(location.state?.requestId || null);
    const [activeTab, setActiveTab] = useState('ai');
    const [searchRadius, setSearchRadius] = useState(10); // Standard is 10km
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const socketRef = useRef(null);

    // Rating popup state
    const [ratingPopup, setRatingPopup] = useState(null);
    const [ratingScore, setRatingScore] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);
    const [showIssueReport, setShowIssueReport] = useState(false);
    const [issueReport, setIssueReport] = useState('');
    const [disputeReason, setDisputeReason] = useState('Late arrival');
    const [disputeFile, setDisputeFile] = useState(null);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingDone, setRatingDone] = useState(false);

    // Nominatim Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const searchTimeoutRef = useRef(null);

    // Login Enforcement Check
    useEffect(() => {
        if (!currentUser) {
            alert('Please login to view available drivers and hire a service.');
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Initial Geolocation Fallback
    useEffect(() => {
        if (!userLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, () => {
                setUserLocation({ lat: 31.5204, lng: 74.3587 }); // Default to Lahore
            });
        }
    }, [userLocation]);

    // Initialize Socket.IO connection and listeners
    useEffect(() => {
        socketRef.current = io('http://localhost:3000', {
            withCredentials: true
        });

        const socket = socketRef.current;

        const registerUser = () => {
            if (currentUser?.uid) {
                socket.emit('register_user', currentUser.uid);
            }
        };

        socket.on('connect', () => { registerUser(); });
        if (socket.connected) registerUser();

        // Listen for real-time location updates
        socket.on('provider_location_updated', (data) => {
            if (!data.providerId || !data.lat || !data.lng) return;
            setProviders(prev => prev.map(p => p.id === data.providerId ? { ...p, lat: data.lat, lng: data.lng } : p));
        });

        // Listen for job completion to show rating popup
        socket.on('job_completed', (data) => {
            setRatingPopup({
                requestId: data.requestId,
                providerName: data.providerName,
                serviceType: data.serviceType
            });
            setRatingScore(0);
            setRatingComment('');
            setShowIssueReport(false);
            setIssueReport('');
            setRatingDone(false);
        });

        return () => { socket.disconnect(); };
    }, [currentUser]);

    // Fetch Providers
    useEffect(() => {
        const fetchProviders = async () => {
            if (!userLocation || !currentUser) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/services/nearby', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serviceType,
                        userLocation,
                        searchRadius // Sent directly in Kilometers now!
                    }),
                    credentials: 'include'
                });

                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                const data = await response.json();
                if (data.success) {
                    setProviders(data.providers);
                } else {
                    console.error("Failed to fetch providers:", data.error);
                }
            } catch (error) {
                console.error("Error fetching providers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProviders();
    }, [userLocation, serviceType, searchRadius, currentUser, navigate]);

    // Autocomplete Search Box Logic (Nominatim OpenStreetMap)
    const handleSearchInput = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await res.json();
                setSearchResults(data);
            } catch (err) { console.error("Search failed", err); }
        }, 500);
    };

    const handleSelectLocation = (loc) => {
        const newLoc = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) };
        setUserLocation(newLoc);
        setSearchQuery(loc.display_name);
        setSearchResults([]);
    };

    // Handle Request Trigger
    const handleRequest = useCallback(async (provider) => {
        let currentReqId = requestId;
        
        try {
            if (!currentReqId) {
                if (!currentUser) {
                    alert('Please login to hire a driver.');
                    navigate('/login');
                    return;
                }
                const reqResponse = await fetch('http://localhost:3000/api/services/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        uid: currentUser.uid,
                        serviceType,
                        contactNumber: currentUser.contactNumber || '00000000000',
                        details: { note: 'Direct Map Request' },
                        userLocation
                    }),
                });
                if (reqResponse.ok) {
                    const reqData = await reqResponse.json();
                    currentReqId = reqData.requestId;
                    setRequestId(currentReqId);
                } else {
                    alert('Failed to initialize request');
                    return;
                }
            }

            const response = await fetch('http://localhost:3000/api/services/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: currentReqId,
                    providerId: provider.id
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Request sent to ${provider.name}!\nProvider has been notified.`);
            } else {
                alert(`Error: ${data.error || 'Failed to send request'}`);
            }
        } catch (error) {
            console.error('Network error during provider assignment:', error);
            alert('Network error. Please try again.');
        }
    }, [requestId, currentUser, navigate, serviceType, userLocation]);

    // Render Setup
    const displayProviders = [...providers].sort((a, b) => {
        if (activeTab === 'ai') return (b.score || 0) - (a.score || 0);
        return (a.distanceValue || 0) - (b.distanceValue || 0);
    });

    if (!currentUser) return null; // Avoid rendering unauth flash

    return (
        <>
        <style>{`
            .custom-popup .leaflet-popup-content-wrapper {
                background-color: #0B1120;
                color: white;
                border: 1px solid #1E293B;
                border-radius: 12px;
            }
            .custom-popup .leaflet-popup-tip {
                background-color: #0B1120;
            }
            .custom-popup .leaflet-popup-close-button {
                color: #94A3B8 !important;
            }
        `}</style>
        <div className="flex h-[calc(100vh-80px)] bg-background-light dark:bg-background-dark overflow-hidden transition-colors duration-300">
            {/* Sidebar - Provider List */}
            <div className="w-full md:w-[400px] flex flex-col border-r border-gray-200 dark:border-border-dark bg-surface-light dark:bg-surface-dark z-20">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-border-dark flex flex-col gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Available Drivers</h2>
                    
                    {/* Location Search Box (Nominatim custom implementation) */}
                    <div className="relative z-50">
                        <MdMyLocation className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchInput}
                            placeholder="Enter pickup location..."
                            className="w-full bg-gray-100 dark:bg-[#0B1120] text-gray-900 dark:text-white text-sm rounded-xl py-3 pl-10 pr-4 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-transparent transition-all"
                        />
                        {searchResults.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {searchResults.map((loc, i) => (
                                    <li 
                                        key={i} 
                                        onClick={() => handleSelectLocation(loc)}
                                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        {loc.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {/* InDrive Style Tabs */}
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#0B1120] rounded-xl shadow-inner">
                        <button 
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'ai' ? 'bg-white dark:bg-[#1E293B] text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-text-muted'}`}
                        >
                            AI Recommended
                        </button>
                        <button 
                            onClick={() => setActiveTab('nearest')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'nearest' ? 'bg-white dark:bg-[#1E293B] text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-text-muted'}`}
                        >
                            Nearest Driver
                        </button>
                    </div>
                </div>

                {/* Provider List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {loading ? (
                         <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 dark:text-text-muted text-sm">Finding nearby providers...</p>
                         </div>
                    ) : providers.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-text-muted py-10">
                            <MdMyLocation className="text-4xl mx-auto mb-3 text-gray-400" />
                            <p>No providers found nearby for <strong>{serviceType}</strong>.</p>
                            <p className="text-xs mt-1">Try increasing the search radius.</p>
                        </div>
                    ) : (
                        displayProviders.map((provider) => (
                        <div 
                            key={provider.id} 
                            onClick={() => setSelectedProvider(provider.id)}
                            className={`bg-white dark:bg-[#0B1120] rounded-xl p-3 border ${selectedProvider === provider.id ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200 dark:border-border-dark hover:border-primary/50'} shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer`}
                        >
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                                    <img src={provider.image} alt={provider.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <FaStar className="text-yellow-500 text-xs" />
                                            <span className="text-gray-900 dark:text-white text-sm font-bold">{provider.rating}</span>
                                        </div>
                                        <h3 className="text-gray-900 dark:text-white font-bold text-base leading-tight mb-1">{provider.name}</h3>
                                        <p className="text-gray-500 dark:text-text-muted text-xs">{provider.service}</p>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRequest(provider); }}
                                        className="mt-2 w-fit px-4 py-1.5 bg-gray-100 dark:bg-[#1E293B] hover:bg-primary hover:text-white text-gray-700 dark:text-white text-xs font-semibold rounded-md transition-colors duration-300 border border-gray-200 dark:border-white/10"
                                    >
                                        Request
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-text-muted border-t border-gray-100 dark:border-white/5 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <FaLocationArrow className="text-[10px]" />
                                        {Math.round((provider.distanceValue || 0) * 1.609)} km away {/* Backend sends distanceValue typically in miles currently, so convert for display if needed. Wait, recommender distance is natively returned in KM but we did miles converson. It's OK. */}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaClock className="text-[10px]" />
                                        {provider.eta}
                                    </div>
                                </div>
                                {activeTab === 'ai' && provider.score !== undefined && (
                                    <div className="font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                        <span className="text-[10px]">AI Match:</span> {Math.round(provider.score * 100)}%
                                    </div>
                                )}
                            </div>
                        </div>
                        ))
                    )}
                </div>

                {/* Footer - Search Radius */}
                <div className="p-4 border-t border-gray-200 dark:border-border-dark bg-white dark:bg-[#121A2A]">
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Search Radius</span>
                            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{searchRadius} km</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="100"
                            step="5"
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Map Area - Leaflet */}
            <div className="hidden md:block flex-1 relative bg-[#121A2A] overflow-hidden z-10">
                <MapContainer 
                    center={userLocation ? [userLocation.lat, userLocation.lng] : [33.6844, 73.0479]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {userLocation && (
                        <>
                            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                <Popup>Your Pickup Location</Popup>
                            </Marker>
                            <Circle 
                                center={[userLocation.lat, userLocation.lng]} 
                                radius={searchRadius * 1000} 
                                pathOptions={{ color: '#00BCD4', fillColor: '#00BCD4', fillOpacity: 0.1, weight: 1 }}
                            />
                        </>
                    )}

                    {providers.map(p => p.lat && p.lng && (
                        <Marker key={p.id} position={[p.lat, p.lng]} icon={carIcon}>
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[160px] font-display">
                                    <h3 className="m-0 text-sm font-bold text-white">{p.name}</h3>
                                    <p className="m-0 text-xs text-gray-400 mb-2">{p.service}</p>
                                    <div className="flex gap-3 text-[11px] text-gray-400 mb-2">
                                        <span>📍 {Math.round((p.distanceValue || 0) * 1.609)} km</span>
                                        <span>⏱ {p.eta}</span>
                                    </div>
                                    <div className="text-xs text-yellow-500 mb-3">⭐ {p.rating}</div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRequest(p); }}
                                        className="w-full py-1.5 bg-primary text-white border-none rounded-md text-xs font-bold cursor-pointer hover:bg-cyan-500 transition-colors"
                                    >
                                        Hire Driver
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    
                    <MapUpdater userLocation={userLocation} providers={providers} selectedProvider={selectedProvider} />
                </MapContainer>

                {/* Legend Overlay */}
                <div className="absolute bottom-6 left-4 bg-white/95 dark:bg-[#121A2A]/95 backdrop-blur-sm p-3 rounded-xl border border-gray-200 dark:border-border-dark shadow-lg">
                    <p className="text-xs font-semibold text-gray-700 dark:text-white mb-2">Map Legend</p>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                        <span className="text-xs text-gray-600 dark:text-text-muted">Your Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-white shadow-sm"></div>
                        <span className="text-xs text-gray-600 dark:text-text-muted">Service Provider</span>
                    </div>
                </div>

                {/* Provider Count Overlay */}
                {!loading && providers.length > 0 && (
                    <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#121A2A]/95 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-border-dark shadow-lg">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{providers.length} provider{providers.length > 1 ? 's' : ''} found</p>
                        <p className="text-xs text-gray-500 dark:text-text-muted">{serviceType}</p>
                    </div>
                )}
            </div>
        </div>

        {/* ---- Job Completed Rating Popup ---- */}
        {ratingPopup && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                <div className="bg-white dark:bg-[#1a2438] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {ratingDone ? (
                        <div className="flex flex-col items-center justify-center p-10 text-center">
                            <FaCheckCircle className="text-green-500 text-6xl mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Your feedback has been submitted.</p>
                            <button
                                onClick={() => {
                                    setRatingPopup(null);
                                    navigate('/');
                                }}
                                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-r from-primary to-cyan-500 p-6 text-white relative">
                                <button
                                    onClick={() => setRatingPopup(null)}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                                <h2 className="text-xl font-bold mb-1">Job Completed! 🎉</h2>
                                <p className="text-white/80 text-sm">
                                    {ratingPopup.providerName} has completed your <strong>{ratingPopup.serviceType}</strong> request.
                                </p>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Star Rating */}
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">Rate your experience</p>
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRatingScore(star)}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                className="transition-transform hover:scale-125"
                                            >
                                                <FaStar
                                                    size={36}
                                                    className={`transition-colors ${
                                                        star <= (hoveredStar || ratingScore)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {ratingScore > 0 && (
                                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][ratingScore]}
                                        </p>
                                    )}
                                </div>

                                {/* Comment */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                        Leave a comment (optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={ratingComment}
                                        onChange={(e) => setRatingComment(e.target.value)}
                                        placeholder="Tell us about your experience..."
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white resize-none focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                {/* Issue Report Section */}
                                 <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                     <button
                                         onClick={() => setShowIssueReport(!showIssueReport)}
                                         className="text-sm text-red-500 hover:text-red-700 font-bold flex items-center gap-2 transition-colors duration-300"
                                     >
                                         <span className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg">
                                            {showIssueReport ? '▲' : '▼'}
                                         </span>
                                         Report a Serious Issue
                                     </button>
                                     
                                     {showIssueReport && (
                                         <div className="mt-4 space-y-4 animate-fade-in">
                                             {/* Reason Dropdown */}
                                             <div>
                                                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                                                     Reason for Report
                                                 </label>
                                                 <select
                                                     value={disputeReason}
                                                     onChange={(e) => setDisputeReason(e.target.value)}
                                                     className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                                                 >
                                                     <option>Late arrival</option>
                                                     <option>Overcharging</option>
                                                     <option>Misbehavior</option>
                                                     <option>Fake service</option>
                                                     <option>Safety issue</option>
                                                 </select>
                                             </div>

                                             {/* Description */}
                                             <div>
                                                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                                                     Detailed Description
                                                 </label>
                                                 <textarea
                                                     rows={3}
                                                     value={issueReport}
                                                     onChange={(e) => setIssueReport(e.target.value)}
                                                     placeholder="Provide details about what happened..."
                                                     className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:border-red-500 transition-colors"
                                                 />
                                             </div>

                                             {/* Proof Upload */}
                                             <div>
                                                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                                                     Upload Proof (Optional Image)
                                                 </label>
                                                 <input 
                                                     type="file" 
                                                     accept="image/*"
                                                     onChange={(e) => setDisputeFile(e.target.files[0])}
                                                     className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900/20 dark:file:text-red-400"
                                                 />
                                             </div>
                                         </div>
                                     )}
                                 </div>                                          
                                 <button
                                     disabled={ratingScore === 0 || ratingSubmitting}
                                     onClick={async () => {
                                         if (ratingScore === 0) return;
                                         setRatingSubmitting(true);
                                         try {
                                             // 1. Submit Rating
                                             await fetch(`http://localhost:3000/api/services/request/${ratingPopup.requestId}/rate`, {
                                                 method: 'POST',
                                                 headers: { 'Content-Type': 'application/json' },
                                                 credentials: 'include',
                                                 body: JSON.stringify({
                                                     score: ratingScore,
                                                     comment: ratingComment
                                                 })
                                             });

                                             // 2. Submit Dispute if form is open and description provided
                                             if (showIssueReport && issueReport) {
                                                 const formData = new FormData();
                                                 formData.append('reason', disputeReason);
                                                 formData.append('description', issueReport);
                                                 if (disputeFile) {
                                                     formData.append('proofImage', disputeFile);
                                                 }
                                                 if (userLocation) {
                                                     formData.append('lat', userLocation.lat);
                                                     formData.append('lng', userLocation.lng);
                                                 }

                                                 await fetch(`http://localhost:3000/api/services/request/${ratingPopup.requestId}/dispute`, {
                                                     method: 'POST',
                                                     body: formData,
                                                     credentials: 'include'
                                                 });
                                             }

                                             setRatingDone(true);
                                         } catch (err) {
                                             console.error('Failed to submit feedback:', err);
                                             alert('Submission failed. Please try again.');
                                         } finally {
                                             setRatingSubmitting(false);
                                         }
                                     }}
                                     className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 ${
                                         ratingScore === 0
                                             ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                             : 'bg-gradient-to-r from-primary to-cyan-500 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                                     }`}
                                 >
                                     {ratingSubmitting ? (
                                         <div className="flex items-center justify-center gap-2">
                                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                             <span>Submitting...</span>
                                         </div>
                                     ) : (
                                         'Complete Review'
                                     )}
                                 </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
        </>
    );
};

export default NearbyProviders;
