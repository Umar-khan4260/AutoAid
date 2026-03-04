import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FaStar, FaFilter, FaChevronLeft, FaClock, FaLocationArrow } from 'react-icons/fa';
import { MdMyLocation } from 'react-icons/md';

const NearbyProviders = () => {
    const location = useLocation();
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

    // Handle requesting a specific provider
    const handleRequest = useCallback(async (provider) => {
        if (!requestId) {
            alert("No active request found. Please go back and request again.");
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
                alert(`Request sent to ${provider.name}!\nProvider has been notified.`);
            } else {
                alert(`Error: ${data.error || 'Failed to send request'}`);
            }
        } catch (error) {
            console.error('Network error during provider assignment:', error);
            alert('Network error. Please try again.');
        }
    }, [requestId]);

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
    );
};

export default NearbyProviders;
