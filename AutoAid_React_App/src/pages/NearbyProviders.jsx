import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaStar, FaFilter, FaChevronLeft, FaClock, FaLocationArrow, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { MdMyLocation } from 'react-icons/md';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const NearbyProviders = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const serviceType = location.state?.serviceType || 'Service';
    const userLocation = location.state?.userLocation;
    const requestId = location.state?.requestId;
    const [searchRadius, setSearchRadius] = useState(50);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);
    const socketRef = useRef(null);
    const selectedProviderRef = useRef(null);

    // Sync selectedProviderRef with state
    useEffect(() => {
        selectedProviderRef.current = selectedProvider;
    }, [selectedProvider]);

    // Rating popup state
    const [ratingPopup, setRatingPopup] = useState(null); // { requestId, providerName, serviceType }
    const [ratingScore, setRatingScore] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);
    const [showIssueReport, setShowIssueReport] = useState(false);
    const [issueReport, setIssueReport] = useState('');
    const [disputeReason, setDisputeReason] = useState('Late arrival');
    const [disputeFile, setDisputeFile] = useState(null);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingDone, setRatingDone] = useState(false);
    
    // Timeout/Countdown state
    const [requestCountdown, setRequestCountdown] = useState(0);
    const [isWaitingForProvider, setIsWaitingForProvider] = useState(false);
    const [activeRequestProvider, setActiveRequestProvider] = useState(null);
    const countdownIntervalRef = useRef(null);

    // Initialize Socket.IO connection and listeners
    useEffect(() => {
        console.log("Initializing socket connection...");
        socketRef.current = io('http://localhost:3000', {
            withCredentials: true
        });

        const socket = socketRef.current;

        const registerUser = () => {
            if (currentUser?.uid) {
                console.log("Registering user socket with UID:", currentUser.uid);
                socket.emit('register_user', currentUser.uid);
            } else {
                console.log("Cannot register user: currentUser.uid is missing", currentUser);
            }
        };

        socket.on('connect', () => {
            console.log("Socket connected:", socket.id);
            registerUser();
        });

        // If already connected when this effect runs
        if (socket.connected) {
            console.log("Socket already connected, registering immediately:", socket.id);
            registerUser();
        }

        // Listen for real-time location updates from any provider
        socket.on('provider_location_updated', (data) => {
            // console.log("Provider location update received:", data); // Spammy
            if (!data.providerId || !data.lat || !data.lng) return;

            setProviders(prevProviders => prevProviders.map(p => 
                p.id === data.providerId ? { ...p, lat: data.lat, lng: data.lng } : p
            ));

            const markerToUpdate = markersRef.current.find(m => m._providerId === data.providerId);
            if (markerToUpdate && window.google) {
                const newPos = new window.google.maps.LatLng(data.lat, data.lng);
                
                if (selectedProviderRef.current === data.providerId && mapInstanceRef.current) {
                    mapInstanceRef.current.panTo(newPos);
                }
                
                markerToUpdate.setPosition(newPos);
            }
        });

        // Listen for job acceptance to clear timer
        socket.on('job_accepted', (data) => {
            console.log("JOB ACCEPTED:", data);
            setIsWaitingForProvider(false);
            setRequestCountdown(0);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            alert(`Great news! ${data.providerName} has accepted your request.`);
            // You could navigate to a tracking page here
        });

        // Listen for job completion to show rating popup
        socket.on('job_completed', (data) => {
            console.log("JOB COMPLETED EVENT RECEIVED:", data);
            // window.alert("Job Completed! Opening rating popup..."); // Optional: extreme debug
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

        socket.on('disconnect', (reason) => {
            console.log("Socket disconnected:", reason);
        });

        socket.on('error', (err) => {
            console.error("Socket error:", err);
        });

        return () => {
            console.log("Cleaning up socket...");
            socket.disconnect();
        };
    }, [currentUser]);

    // Fetch providers from backend
    useEffect(() => {
        const fetchProviders = async () => {
            if (!userLocation) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/services/nearby', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        serviceType,
                        userLocation,
                        searchRadius
                    }),
                    credentials: 'include'
                });

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
    }, [userLocation, serviceType, searchRadius]);

    // Initialize Google Map
    const initMap = useCallback(() => {
        if (!mapRef.current || !userLocation || !window.google) return;

        const center = { lat: userLocation.lat, lng: userLocation.lng };

        const map = new window.google.maps.Map(mapRef.current, {
            center: center,
            zoom: 13,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
                { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
                { featureType: "land", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
                { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
                { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
                { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
                { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
                { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#0e1626" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
            ],
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        // User Location Marker (Blue pulsing dot)
        new window.google.maps.Marker({
            position: center,
            map: map,
            title: 'Your Location',
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
            },
            zIndex: 999,
        });

        // Accuracy circle around user
        new window.google.maps.Circle({
            strokeColor: '#4285F4',
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: '#4285F4',
            fillOpacity: 0.1,
            map: map,
            center: center,
            radius: 200,
        });

    }, [userLocation]);

    // Handle auto-cancelling the request
    const handleAutoCancel = useCallback(async () => {
        if (!requestId) return;

        try {
            const response = await fetch(`http://localhost:3000/api/services/request/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'Cancelled' }),
                credentials: 'include'
            });

            if (response.ok) {
                alert("No response from provider. Please select another provider or try again.");
                setIsWaitingForProvider(false);
                setRequestCountdown(0);
                setActiveRequestProvider(null);
            }
        } catch (error) {
            console.error('Error auto-cancelling request:', error);
        }
    }, [requestId]);

    // Timer effect for countdown
    useEffect(() => {
        if (isWaitingForProvider && requestCountdown > 0) {
            countdownIntervalRef.current = setInterval(() => {
                setRequestCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownIntervalRef.current);
                        handleAutoCancel();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isWaitingForProvider, handleAutoCancel]);

    // Handle requesting a specific provider
    const handleRequest = useCallback(async (provider) => {
        if (!requestId) {
            alert("No active request found. Please go back and request again.");
            return;
        }

        if (isWaitingForProvider) {
            alert("Please wait for the current provider to respond or for the timeout.");
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/services/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    providerId: provider.id
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                // Start 60s countdown
                setIsWaitingForProvider(true);
                setRequestCountdown(60);
                setActiveRequestProvider(provider);
                // alert(`Request sent to ${provider.name}!\nProvider has been notified.`);
            } else {
                alert(`Error: ${data.error || 'Failed to send request'}`);
            }
        } catch (error) {
            console.error('Network error during provider assignment:', error);
            alert('Network error. Please try again.');
        }
    }, [requestId, isWaitingForProvider]);

    // Add provider markers to map
    const addProviderMarkers = useCallback(() => {
        if (!mapInstanceRef.current || !window.google) return;

        // Clear existing provider markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();
        
        // Include user location in bounds
        if (userLocation) {
            bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
        }

        providers.forEach((provider) => {
            if (!provider.lat || !provider.lng) return;

            const position = { lat: provider.lat, lng: provider.lng };
            bounds.extend(position);

            const marker = new window.google.maps.Marker({
                position: position,
                map: mapInstanceRef.current,
                title: provider.name,
                icon: {
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: '#00BCD4',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 1.5,
                    scale: 1.8,
                    anchor: new window.google.maps.Point(12, 22),
                },
                animation: window.google.maps.Animation.DROP,
            });

            // Tag marker for real-time tracking updates via socket
            marker._providerId = provider.id;

            const infoContent = `
                <div style="padding: 8px; min-width: 180px; font-family: 'Inter', sans-serif;">
                    <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #1a1a2e;">${provider.name}</h3>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${provider.service}</p>
                    <div style="display: flex; gap: 12px; font-size: 11px; color: #888;">
                        <span>📍 ${provider.distance}</span>
                        <span>⏱ ${provider.eta}</span>
                    </div>
                    <div style="margin-top: 4px; font-size: 12px; color: #f59e0b;">⭐ ${provider.rating}</div>
                    <button id="iw-request-btn-${provider.id}" style="margin-top: 12px; width: 100%; padding: 6px 12px; background-color: #00BCD4; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;">
                        Request Service
                    </button>
                </div>
            `;

            marker.addListener('click', () => {
                infoWindowRef.current.setContent(infoContent);
                infoWindowRef.current.open(mapInstanceRef.current, marker);
                setSelectedProvider(provider.id);

                // Add event listener to the button once the InfoWindow is rendered in the DOM
                window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
                    const btn = document.getElementById(`iw-request-btn-${provider.id}`);
                    if (btn) {
                        btn.addEventListener('click', () => {
                            handleRequest(provider);
                        });
                    }
                });
            });

            markersRef.current.push(marker);
        });

        // Fit map to show all markers
        if (providers.length > 0 && userLocation) {
            mapInstanceRef.current.fitBounds(bounds, { padding: 60 });
            // Don't zoom in too much
            const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
                if (mapInstanceRef.current.getZoom() > 15) {
                    mapInstanceRef.current.setZoom(15);
                }
                window.google.maps.event.removeListener(listener);
            });
        }
    }, [providers, userLocation, handleRequest]);

    // Wait for Google Maps to load, then initialize
    useEffect(() => {
        const checkGoogleMaps = () => {
            if (window.google && window.google.maps) {
                initMap();
            } else {
                setTimeout(checkGoogleMaps, 200);
            }
        };
        checkGoogleMaps();
    }, [initMap]);

    // Add markers when providers change
    useEffect(() => {
        if (mapInstanceRef.current && providers.length > 0) {
            addProviderMarkers();
        }
    }, [providers, addProviderMarkers]);

    // Handle clicking a provider card in the sidebar
    const handleProviderClick = (provider) => {
        setSelectedProvider(provider.id);
        if (mapInstanceRef.current && provider.lat && provider.lng) {
            mapInstanceRef.current.panTo({ lat: provider.lat, lng: provider.lng });
            mapInstanceRef.current.setZoom(15);

            // Find and trigger click on the corresponding marker
            const marker = markersRef.current.find(m => 
                m.getPosition().lat() === provider.lat && m.getPosition().lng() === provider.lng
            );
            if (marker) {
                window.google.maps.event.trigger(marker, 'click');
            }
        }
    };

    return (
        <>
        <div className="flex h-[calc(100vh-80px)] bg-background-light dark:bg-background-dark overflow-hidden transition-colors duration-300">
            {/* Sidebar - Provider List */}
            <div className="w-full md:w-[400px] flex flex-col border-r border-gray-200 dark:border-border-dark bg-surface-light dark:bg-surface-dark z-20">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-border-dark flex flex-col gap-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nearby {serviceType} Providers</h2>
                    
                    {/* Filter Bar */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <MdMyLocation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select className="w-full bg-white dark:bg-[#0B1120] text-sm text-gray-700 dark:text-white pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-border-dark focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                <option>Sort by: Distance</option>
                                <option>Sort by: Rating</option>
                                <option>Sort by: ETA</option>
                            </select>
                            <FaChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-[-90deg] text-xs pointer-events-none" />
                        </div>
                        <button className="p-2.5 bg-white dark:bg-[#0B1120] border border-gray-300 dark:border-border-dark rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <FaFilter />
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
                        providers.map((provider) => (
                        <div 
                            key={provider.id} 
                            onClick={() => handleProviderClick(provider)}
                            className={`bg-white dark:bg-[#0B1120] rounded-xl p-3 border ${selectedProvider === provider.id ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200 dark:border-border-dark hover:border-primary/50'} shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer`}
                        >
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
                        ))
                    )}
                </div>

                {/* Footer - Search Radius */}
                <div className="p-4 border-t border-gray-200 dark:border-border-dark bg-white dark:bg-[#121A2A]">
                    <div className="bg-primary hover:bg-cyan-500 text-white font-bold py-3 rounded-lg text-center cursor-pointer transition-colors shadow-lg shadow-primary/20">
                        Search radius: {searchRadius} miles
                    </div>
                </div>
            </div>

            {/* Map Area - Google Maps */}
            <div className="hidden md:block flex-1 relative bg-gray-900 overflow-hidden">
                <div ref={mapRef} className="w-full h-full" />

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
                    <div className="absolute top-4 left-4 bg-white/95 dark:bg-[#121A2A]/95 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-border-dark shadow-lg">
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
                            {/* Header */}
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
                                 </div>                                          <button
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
                                                 // Add location if available
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
        {/* ---- Waiting for Provider Overlay ---- */}
        {isWaitingForProvider && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
                <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800 p-8 text-center space-y-6 animate-scale-in">
                    <div className="relative w-32 h-32 mx-auto">
                        {/* Circular Progress */}
                        <svg className="w-full h-full rotate-[-90deg]">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-gray-100 dark:text-gray-800"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray="364.4"
                                strokeDashoffset={364.4 - (364.4 * requestCountdown) / 60}
                                strokeLinecap="round"
                                className="text-primary transition-all duration-1000 ease-linear"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{requestCountdown}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Waiting for {activeRequestProvider?.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            The provider has 60 seconds to accept your <strong>{serviceType}</strong> request.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm animate-pulse">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            Connecting to provider...
                        </div>
                        <button
                            onClick={handleAutoCancel}
                            className="text-gray-500 hover:text-red-500 text-sm font-semibold transition-colors pt-2"
                        >
                            Cancel Request
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>

    );
};

export default NearbyProviders;
