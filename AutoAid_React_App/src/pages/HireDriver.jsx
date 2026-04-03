import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaStar, FaChevronLeft, FaClock, FaLocationArrow,
    FaCheckCircle, FaTimes, FaBrain, FaMapPin, FaSearch, FaRoute, FaMapMarkerAlt
} from 'react-icons/fa';
import { MdMyLocation } from 'react-icons/md';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// React-Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix default Leaflet marker icons broken by Webpack/Vite ─────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom car icon for providers ──────────────────────────────────────────
const providerIcon = new L.DivIcon({
    html: `<div style="
        background: linear-gradient(135deg, #06b6d4, #3b82f6);
        border: 2px solid white;
        border-radius: 50%;
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(6,182,212,0.6);
    ">🚗</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
});

const selectedProviderIcon = new L.DivIcon({
    html: `<div style="
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        border: 3px solid white;
        border-radius: 50%;
        width: 42px; height: 42px;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
        box-shadow: 0 3px 12px rgba(245,158,11,0.7);
        animation: pulse 1.5s infinite;
    ">🚗</div>`,
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
});

const userIcon = new L.DivIcon({
    html: `<div style="
        background: #4285F4;
        border: 3px solid white;
        border-radius: 50%;
        width: 20px; height: 20px;
        box-shadow: 0 2px 8px rgba(66,133,244,0.7);
    "></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const pickupIcon = new L.DivIcon({
    html: `<div style="background: #22c55e; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(34,197,94,0.6);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const destinationIcon = new L.DivIcon({
    html: `<div style="background: #ef4444; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(239,68,68,0.6);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// ─── Map sub-component: handles clicks to place markers ───────────────────────
function MapClickHandler({ pickingMode, onMapClick }) {
    useMapEvents({
        click(e) {
            if (pickingMode) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
}

// ─── Map sub-component: pans map to new center ───────────────────────────────
function MapFlyTo({ center, zoom = 13 }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { animate: true, duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

// ─── ETA helper (rough: 3 min per km) ────────────────────────────────────────
function etaFromKm(km) {
    const mins = Math.round(km * 3);
    if (mins < 1) return '< 1 min';
    return `${mins} min`;
}

// ─────────────────────────────────────────────────────────────────────────────
const HireDriver = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const serviceType = location.state?.serviceType || 'Service';
    const userLocation = location.state?.userLocation;   // { lat, lng }
    const requestId    = location.state?.requestId;
    const drivingDuration = location.state?.drivingDuration;
    // Duration for cost calculation
    const hours = drivingDuration ? parseFloat(drivingDuration) : 0;

    // ── AI / UI state ────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('ai');       // 'ai' | 'nearest'
    const [providers, setProviders] = useState([]);         // raw AI results
    const [displayProviders, setDisplayProviders] = useState([]); // sorted for current tab
    const [loading, setLoading] = useState(true);
    const [aiError, setAiError] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [interactionId, setInteractionId] = useState(null);

    // ── Map state ────────────────────────────────────────────────────────────
    const [mapCenter, setMapCenter] = useState(
        userLocation ? [userLocation.lat, userLocation.lng] : [31.5204, 74.3587]
    );
    const [pickupQuery, setPickupQuery] = useState('');
    const [destinationQuery, setDestinationQuery] = useState('');
    const [pickupCoords, setPickupCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [pickingMode, setPickingMode] = useState(null); // 'pickup' | 'destination' | null
    const [useCurrentLocationForPickup, setUseCurrentLocationForPickup] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // ── Real-time marker refs ─────────────────────────────────────────────────
    const markerRefs = useRef({});   // { driver_id: leaflet marker ref }
    const socketRef  = useRef(null);

    // ── Rating popup state (kept intact from original) ────────────────────────
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
    
    // Timeout/Countdown state
    const [requestCountdown, setRequestCountdown] = useState(0);
    const [isWaitingForProvider, setIsWaitingForProvider] = useState(false);
    const [activeRequestProvider, setActiveRequestProvider] = useState(null);
    const countdownIntervalRef = useRef(null);

    // ── Socket.IO ─────────────────────────────────────────────────────────────
    useEffect(() => {
        socketRef.current = io('http://localhost:3000', { withCredentials: true });
        const socket = socketRef.current;

        const register = () => {
            if (currentUser?.uid) socket.emit('register_user', currentUser.uid);
        };
        socket.on('connect', register);
        if (socket.connected) register();

        // Real-time provider location updates → move Leaflet marker
        socket.on('provider_location_updated', ({ providerId, lat, lng }) => {
            if (!providerId || !lat || !lng) return;
            // Update providers state
            setProviders(prev => prev.map(p =>
                p.driver_id === providerId ? { ...p, lat, lon: lng } : p
            ));
            // Move the Leaflet marker directly via ref
            const markerRef = markerRefs.current[providerId];
            if (markerRef) {
                markerRef.setLatLng([lat, lng]);
            }
        });

        // Job completed → show rating popup
        socket.on('job_completed', (data) => {
            setRatingPopup({
                requestId: data.requestId,
                providerName: data.providerName,
                serviceType: data.serviceType,
            });
            setRatingScore(0);
            setRatingComment('');
            setShowIssueReport(false);
            setIssueReport('');
            setRatingDone(false);
        });

        // Listen for job acceptance to clear timer
        socket.on('job_accepted', (data) => {
            console.log("JOB ACCEPTED:", data);
            setIsWaitingForProvider(false);
            setRequestCountdown(0);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            alert(`Great news! ${data.providerName} has accepted your request.`);
        });

        socket.on('disconnect', () => {});
        return () => socket.disconnect();
    }, [currentUser]);

    // ── Tab switching: re-sort display list ───────────────────────────────────
    useEffect(() => {
        if (!providers.length) return;
        if (activeTab === 'ai') {
            // Already sorted by Ridge AI score (rank)
            setDisplayProviders([...providers].sort((a, b) => a.rank - b.rank));
        } else {
            // Sort by raw Haversine distance
            setDisplayProviders([...providers].sort((a, b) => a.distance_km - b.distance_km));
        }
    }, [providers, activeTab]);

    // ── Fetch AI recommendations from Node.js proxy → Python FastAPI ──────────
    const fetchRecommendations = useCallback(async (lat, lon) => {
        setLoading(true);
        setAiError(null);
        try {
            const res = await fetch('http://localhost:3000/api/recommend/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: currentUser?.uid || 'guest',
                    lat,
                    lon,
                    radius_km: 50,
                    top_n: 20,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setProviders(data.results || []);
            setInteractionId(data.interaction_id || null);
        } catch (err) {
            console.error('[Recommender] Search failed:', err);
            setAiError('AI recommender is offline. Retrying with local data…');
            // Fall through — Python API CSV fallback already handles empty results
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (userLocation) {
            fetchRecommendations(userLocation.lat, userLocation.lng);
        } else {
            setLoading(false);
        }
    }, [userLocation, fetchRecommendations]);

    // ── Search with Pickup & Destination ──────────────────────────────────────
    const handleSearch = async (e) => {
        e.preventDefault();
        
        let targetLat, targetLon;

        setSearchLoading(true);
        try {
            if (useCurrentLocationForPickup && userLocation) {
                targetLat = userLocation.lat;
                targetLon = userLocation.lng;
            } else if (pickupCoords && pickupQuery === `${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}`) {
                targetLat = pickupCoords.lat;
                targetLon = pickupCoords.lng;
            } else if (pickupQuery.trim()) {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pickupQuery)}&format=json&limit=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const results = await res.json();
                if (results.length > 0) {
                    targetLat = parseFloat(results[0].lat);
                    targetLon = parseFloat(results[0].lon);
                } else {
                    alert('Pickup location not found. Try a more specific place.');
                    setSearchLoading(false);
                    return;
                }
            } else {
                alert('Please enter a pickup location.');
                setSearchLoading(false);
                return;
            }

            setMapCenter([targetLat, targetLon]);
            // Re-fetch recommendations for the pickup location
            await fetchRecommendations(targetLat, targetLon);
        } catch (err) {
            console.error('[Nominatim] Search error:', err);
            alert('Error fetching location.');
        } finally {
            setSearchLoading(false);
        }
    };

    // ── Handle Map Clicks for Picking ─────────────────────────────────────────
    const handleMapClick = useCallback((latlng) => {
        if (pickingMode === 'pickup') {
            setPickupCoords(latlng);
            setPickupQuery(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
            setUseCurrentLocationForPickup(false);
            setPickingMode(null);
            setMapCenter([latlng.lat, latlng.lng]);
        } else if (pickingMode === 'destination') {
            setDestinationCoords(latlng);
            setDestinationQuery(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
            setPickingMode(null);
            setMapCenter([latlng.lat, latlng.lng]);
        }
    }, [pickingMode]);

    // Handle auto-cancelling the request
    const handleAutoCancel = useCallback(async () => {
        if (!requestId) return;

        try {
            const response = await fetch(`http://localhost:3000/api/services/request/${requestId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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

    // ── Hire Driver: assign provider + log AI feedback ────────────────────────
    const handleHire = useCallback(async (provider) => {
        if (!requestId) {
            alert('No active request found. Please go back and submit a service request first.');
            return;
        }

        if (isWaitingForProvider) {
            alert("Please wait for the current driver to respond or for the timeout.");
            return;
        }

        try {
            // 1. Update the ServiceRequest with the specific details from this page
            const updateDetails = {
                pickupLocation: pickupQuery,
                destinationLocation: destinationQuery,
                contactNumber: currentUser?.contactNumber || '',
                drivingDuration: drivingDuration,
                estimatedCost: provider.charges_per_hour ? provider.charges_per_hour * hours : null
            };

            const updateRes = await fetch(`http://localhost:3000/api/services/request/${requestId}/details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ details: updateDetails }),
            });

            if (!updateRes.ok) {
                console.warn('Failed to update request details, proceeding with assignment anyway...');
            }

            // 2. Assign provider via existing Node.js endpoint
            const assignRes = await fetch('http://localhost:3000/api/services/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ requestId, providerId: provider.driver_id }),
            });
            const assignData = await assignRes.json();
            if (!assignRes.ok) {
                alert(`Error: ${assignData.error || 'Failed to send request'}`);
                return;
            }
            
            // Start 60s countdown
            setIsWaitingForProvider(true);
            setRequestCountdown(60);
            setActiveRequestProvider(provider);

        } catch (err) {
            console.error('Hire process error:', err);
            alert('Network error. Please try again.');
            return;
        }

        // 3. Log feedback to AI model (fire-and-forget — don't block UX)
        if (interactionId) {
            const shownDriverIds = displayProviders.map(p => p.driver_id);
            fetch('http://localhost:3000/api/recommend/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: currentUser?.uid || 'guest',
                    interaction_id: interactionId,
                    selected_driver_id: provider.driver_id,
                    shown_driver_ids: shownDriverIds,
                }),
            }).catch(err => console.warn('[Feedback] Log failed (non-critical):', err));
        }
    }, [requestId, interactionId, displayProviders, currentUser, pickupQuery, destinationQuery, drivingDuration, hours]);

    // ── Submit rating helper ──────────────────────────────────────────────────
    const handleRatingSubmit = async () => {
        if (ratingScore === 0) return;
        setRatingSubmitting(true);
        try {
            await fetch(`http://localhost:3000/api/services/request/${ratingPopup.requestId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ score: ratingScore, comment: ratingComment }),
            });

            if (showIssueReport && issueReport) {
                const formData = new FormData();
                formData.append('reason', disputeReason);
                formData.append('description', issueReport);
                if (disputeFile) formData.append('proofImage', disputeFile);
                if (userLocation) {
                    formData.append('lat', userLocation.lat);
                    formData.append('lng', userLocation.lng);
                }
                await fetch(`http://localhost:3000/api/services/request/${ratingPopup.requestId}/dispute`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });
            }
            setRatingDone(true);
        } catch (err) {
            console.error('Rating submit error:', err);
            alert('Submission failed. Please try again.');
        } finally {
            setRatingSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden', background: 'var(--color-bg, #0f172a)' }}>

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <div style={{
                width: '400px', minWidth: '320px', maxWidth: '420px',
                display: 'flex', flexDirection: 'column',
                background: '#0f172a',
                borderRight: '1px solid #1e293b',
                zIndex: 20,
            }}>

                {/* Header */}
                <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                            {serviceType} — Find a Provider
                        </h2>
                        {hours > 0 && (
                            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                Duration: <span style={{ color: '#06b6d4', fontWeight: 700 }}>{hours} hr{hours !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Location Selections */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <FaMapPin style={{
                                position: 'absolute', left: '10px', top: '50%',
                                transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px'
                            }} />
                            <input
                                value={pickupQuery}
                                onChange={e => {
                                    setPickupQuery(e.target.value);
                                    setUseCurrentLocationForPickup(false);
                                }}
                                placeholder="Pickup location..."
                                required
                                style={{
                                    width: '100%', paddingLeft: '32px', paddingRight: '36px',
                                    paddingTop: '10px', paddingBottom: '10px',
                                    background: '#1e293b', border: '1px solid #334155',
                                    borderRadius: '8px', color: '#f1f5f9', fontSize: '13px',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                                {userLocation && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPickupQuery('Current Location');
                                            setUseCurrentLocationForPickup(true);
                                        }}
                                        style={{
                                            background: 'transparent', border: 'none', color: useCurrentLocationForPickup ? '#06b6d4' : '#64748b',
                                            cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title="Use Current Location"
                                    >
                                        <MdMyLocation size={16} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPickingMode(pickingMode === 'pickup' ? null : 'pickup')}
                                    style={{
                                        background: 'transparent', border: 'none', color: pickingMode === 'pickup' ? '#22c55e' : '#64748b',
                                        cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title="Pick on Map"
                                >
                                    <FaMapMarkerAlt size={16} />
                                </button>
                            </div>
                        </div>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <FaRoute style={{
                                position: 'absolute', left: '10px', top: '50%',
                                transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px'
                            }} />
                            <input
                                value={destinationQuery}
                                onChange={e => setDestinationQuery(e.target.value)}
                                placeholder="Destination location..."
                                required
                                style={{
                                    width: '100%', paddingLeft: '32px', paddingRight: '12px',
                                    paddingTop: '10px', paddingBottom: '10px',
                                    background: '#1e293b', border: '1px solid #334155',
                                    borderRadius: '8px', color: '#f1f5f9', fontSize: '13px',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setPickingMode(pickingMode === 'destination' ? null : 'destination')}
                                style={{
                                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'transparent', border: 'none', color: pickingMode === 'destination' ? '#ef4444' : '#64748b',
                                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Pick on Map"
                            >
                                <FaMapMarkerAlt size={16} />
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={searchLoading}
                            style={{
                                width: '100%',
                                padding: '10px 14px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                border: 'none', borderRadius: '8px', color: 'white',
                                fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                                opacity: searchLoading ? 0.6 : 1, transition: 'all 0.2s',
                                marginTop: '4px'
                            }}
                        >
                            {searchLoading ? 'Finding providers...' : 'Go'}
                        </button>
                    </form>

                    {/* AI / Nearest tabs */}
                    <div style={{ display: 'flex', background: '#1e293b', borderRadius: '10px', padding: '3px', gap: '3px' }}>
                        <button
                            onClick={() => setActiveTab('ai')}
                            style={{
                                flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: activeTab === 'ai'
                                    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                                    : 'transparent',
                                color: activeTab === 'ai' ? 'white' : '#94a3b8',
                                boxShadow: activeTab === 'ai' ? '0 2px 8px rgba(6,182,212,0.4)' : 'none',
                            }}
                        >
                            ✨ AI Recommended
                        </button>
                        <button
                            onClick={() => setActiveTab('nearest')}
                            style={{
                                flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: activeTab === 'nearest'
                                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                                    : 'transparent',
                                color: activeTab === 'nearest' ? 'white' : '#94a3b8',
                                boxShadow: activeTab === 'nearest' ? '0 2px 8px rgba(139,92,246,0.4)' : 'none',
                            }}
                        >
                            📍 Nearest Driver
                        </button>
                    </div>
                </div>

                {/* AI Error Banner */}
                {aiError && (
                    <div style={{
                        margin: '8px 12px', padding: '8px 12px',
                        background: '#7c2d12', borderRadius: '8px',
                        fontSize: '12px', color: '#fca5a5',
                    }}>
                        ⚠️ {aiError}
                    </div>
                )}

                {/* Source badge */}
                {!loading && providers.length > 0 && (
                    <div style={{ padding: '6px 16px' }}>
                        <span style={{
                            fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                            background: providers[0]?.source === 'mongodb' ? '#064e3b' : '#1e1b4b',
                            color: providers[0]?.source === 'mongodb' ? '#6ee7b7' : '#a5b4fc',
                            fontWeight: 600,
                        }}>
                            {providers[0]?.source === 'mongodb' ? '🟢 Live Drivers' : '📂 Demo Data (CSV Fallback)'}
                        </span>
                    </div>
                )}

                {/* Provider List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', border: '4px solid rgba(6,182,212,0.2)',
                                borderTop: '4px solid #06b6d4', borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }} />
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                                {activeTab === 'ai' ? 'AI is ranking drivers…' : 'Finding nearby drivers…'}
                            </p>
                        </div>
                    ) : displayProviders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
                            <MdMyLocation style={{ fontSize: '40px', marginBottom: '12px', color: '#334155' }} />
                            <p style={{ margin: 0, fontSize: '14px' }}>No providers found nearby.</p>
                            <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>Try searching for a different city above.</p>
                        </div>
                    ) : (
                        displayProviders.map((provider) => {
                            const isSelected = selectedProvider === provider.driver_id;
                            const aiPercent = Math.round(provider.score * 100);

                            return (
                                <div
                                    key={provider.driver_id}
                                    onClick={() => {
                                        setSelectedProvider(provider.driver_id);
                                        setMapCenter([provider.lat, provider.lon]);
                                    }}
                                    style={{
                                        background: isSelected ? '#0f2d4a' : '#1e293b',
                                        border: isSelected ? '1.5px solid #06b6d4' : '1px solid #334155',
                                        borderRadius: '12px', padding: '12px',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 0 0 2px rgba(6,182,212,0.2)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #064e3b, #0e7490)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '20px', flexShrink: 0,
                                        }}>
                                            🚗
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Name + AI Badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>
                                                    {provider.name}
                                                </span>
                                                {activeTab === 'ai' && provider.score !== undefined && (
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #0e7490, #1d4ed8)',
                                                        color: 'white', fontSize: '10px', fontWeight: 700,
                                                        padding: '2px 7px', borderRadius: '20px',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        ✨ AI Match: {aiPercent}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rating + Jobs */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#fbbf24', fontSize: '12px' }}>
                                                    <FaStar style={{ fontSize: '10px' }} />
                                                    {provider.rating?.toFixed(1) || '4.0'}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {provider.jobs_completed || 0} jobs
                                                </span>
                                                <span style={{
                                                    fontSize: '10px', padding: '1px 6px', borderRadius: '20px',
                                                    background: provider.is_online ? '#064e3b' : '#1e293b',
                                                    color: provider.is_online ? '#6ee7b7' : '#64748b',
                                                    fontWeight: 600,
                                                }}>
                                                    {provider.is_online ? '● Online' : '○ Offline'}
                                                </span>
                                            </div>

                                            {/* Distance + ETA */}
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <FaLocationArrow style={{ fontSize: '9px' }} />
                                                    {provider.distance_km?.toFixed(1)} km away
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <FaClock style={{ fontSize: '9px' }} />
                                                    ETA: {etaFromKm(provider.distance_km || 0)}
                                                </span>
                                            </div>

                                            {/* Per-driver cost */}
                                            {hours > 0 && provider.charges_per_hour && (
                                                <div style={{
                                                    marginTop: '6px', padding: '6px 10px',
                                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    borderRadius: '8px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                        PKR {provider.charges_per_hour}/hr × {hours} hr{hours !== 1 ? 's' : ''}
                                                    </span>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                                                        PKR {provider.charges_per_hour * hours}
                                                    </span>
                                                </div>
                                            )}

                                            {/* License */}
                                            {provider.license && provider.license !== 'N/A' && (
                                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                                                    License: {provider.license}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hire button */}
                                    <button
                                        onClick={e => { e.stopPropagation(); handleHire(provider); }}
                                        style={{
                                            marginTop: '10px', width: '100%',
                                            padding: '8px 0',
                                            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                            border: 'none', borderRadius: '8px',
                                            color: 'white', fontWeight: 700, fontSize: '13px',
                                            cursor: 'pointer', transition: 'opacity 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        Hire Driver
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer count */}
                {!loading && displayProviders.length > 0 && (
                    <div style={{
                        padding: '12px 16px', borderTop: '1px solid #1e293b',
                        background: '#0a1628', fontSize: '13px', color: '#64748b',
                        textAlign: 'center',
                    }}>
                        {displayProviders.length} driver{displayProviders.length !== 1 ? 's' : ''} found •{' '}
                        <span style={{ color: '#06b6d4', fontWeight: 600 }}>
                            {activeTab === 'ai' ? 'Sorted by AI Score' : 'Sorted by Distance'}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Map Area (React-Leaflet) ──────────────────────────────────── */}
            <div style={{ flex: 1, position: 'relative', background: '#020617' }}>

                {/* Nominatim attribution note */}
                <div style={{
                    position: 'absolute', top: '12px', left: '12px', zIndex: 1000,
                    background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
                    border: '1px solid #1e293b', borderRadius: '10px',
                    padding: '8px 14px', color: '#f1f5f9',
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>
                        {displayProviders.length} driver{displayProviders.length !== 1 ? 's' : ''} found
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{serviceType}</div>
                </div>

                {pickingMode && (
                    <div style={{
                        position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
                        background: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '30px',
                        zIndex: 1000, fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 12px rgba(59,130,246,0.5)',
                        display: 'flex', alignItems: 'center', gap: '12px', cursor: 'default'
                    }}>
                        Click map to set {pickingMode === 'pickup' ? 'Pickup' : 'Destination'}
                        <button onClick={() => setPickingMode(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.6)', color: 'white', borderRadius: '16px', padding: '2px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                )}

                <MapContainer
                    center={mapCenter}
                    zoom={12}
                    style={{ width: '100%', height: '100%', cursor: pickingMode ? 'crosshair' : 'grab' }}
                    zoomControl={true}
                >
                    <MapClickHandler pickingMode={pickingMode} onMapClick={handleMapClick} />

                    {/* CARTO Dark Basemap */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={20}
                    />

                    {/* Fly-to helper */}
                    <MapFlyTo center={mapCenter} zoom={selectedProvider ? 14 : 12} />

                    {/* User location marker */}
                    {userLocation && (
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                            <Popup>
                                <div style={{ textAlign: 'center', padding: '4px' }}>
                                    <strong>Your Location</strong>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Pickup marker */}
                    {pickupCoords && (
                        <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
                            <Popup>Pickup Location</Popup>
                        </Marker>
                    )}

                    {/* Destination marker */}
                    {destinationCoords && (
                        <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
                            <Popup>Destination</Popup>
                        </Marker>
                    )}

                    {/* Provider markers */}
                    {displayProviders.map((provider) => {
                        if (!provider.lat || !provider.lon) return null;
                        const isSelected = selectedProvider === provider.driver_id;
                        const aiPercent = Math.round(provider.score * 100);

                        return (
                            <Marker
                                key={provider.driver_id}
                                position={[provider.lat, provider.lon]}
                                icon={isSelected ? selectedProviderIcon : providerIcon}
                                ref={ref => { if (ref) markerRefs.current[provider.driver_id] = ref; }}
                                eventHandlers={{
                                    click: () => setSelectedProvider(provider.driver_id),
                                }}
                            >
                                <Popup>
                                    <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                            {provider.name}
                                        </div>
                                        {activeTab === 'ai' && (
                                            <div style={{
                                                display: 'inline-block',
                                                background: 'linear-gradient(135deg, #0e7490, #1d4ed8)',
                                                color: 'white', fontSize: '10px', fontWeight: 700,
                                                padding: '2px 7px', borderRadius: '20px', marginBottom: '6px',
                                            }}>
                                                ✨ AI Match: {aiPercent}%
                                            </div>
                                        )}
                                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                                            ⭐ {provider.rating?.toFixed(1)} · {provider.jobs_completed} jobs
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                                            📍 {provider.distance_km?.toFixed(1)} km · ⏱ {etaFromKm(provider.distance_km || 0)}
                                        </div>
                                        <button
                                            onClick={() => handleHire(provider)}
                                            style={{
                                                width: '100%', padding: '6px 0',
                                                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                                border: 'none', borderRadius: '6px',
                                                color: 'white', fontWeight: 700,
                                                fontSize: '12px', cursor: 'pointer',
                                            }}
                                        >
                                            Hire Driver
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Map legend */}
                <div style={{
                    position: 'absolute', bottom: '24px', left: '12px', zIndex: 1000,
                    background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
                    border: '1px solid #1e293b', borderRadius: '10px',
                    padding: '10px 14px',
                }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px 0' }}>Map Legend</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4285F4', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Your Location</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Available Driver</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Selected Driver</span>
                    </div>
                </div>
            </div>
        </div>

        {/* ── Spinner keyframe ───────────────────────────────────────────── */}
        <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse {
                0%, 100% { box-shadow: 0 3px 12px rgba(245,158,11,0.7); }
                50% { box-shadow: 0 3px 20px rgba(245,158,11,1); }
            }
            .pulse-dot {
                animation: pulse-dot 1.5s infinite;
            }
            @keyframes pulse-dot {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
            }
            /* Make Leaflet popups match dark theme */
            .leaflet-popup-content-wrapper {
                background: #1e293b !important;
                color: #f1f5f9 !important;
                border: 1px solid #334155 !important;
                border-radius: 10px !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
            }
            .leaflet-popup-tip { background: #1e293b !important; }
            .leaflet-popup-content { color: #f1f5f9 !important; }
            .leaflet-popup-content p, .leaflet-popup-content div { color: inherit !important; }
            /* Leaflet control buttons dark theme */
            .leaflet-control-zoom a {
                background: #1e293b !important;
                color: #f1f5f9 !important;
                border-color: #334155 !important;
            }
            .leaflet-control-zoom a:hover { background: #334155 !important; }
            .leaflet-bar { border-color: #334155 !important; }
            /* Custom scrollbar for sidebar */
            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        `}</style>

        {/* ── Rating Popup (preserved from original) ─────────────────────── */}
        {ratingPopup && (
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
            }}>
                <div style={{
                    background: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '440px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid #334155', overflow: 'hidden',
                }}>
                    {ratingDone ? (
                        <div style={{ padding: '48px', textAlign: 'center' }}>
                            <FaCheckCircle style={{ fontSize: '56px', color: '#22c55e', marginBottom: '16px' }} />
                            <h2 style={{ margin: '0 0 8px 0', color: '#f1f5f9' }}>Thank You!</h2>
                            <p style={{ color: '#94a3b8', margin: '0 0 24px 0' }}>Your feedback has been submitted.</p>
                            <button
                                onClick={() => { setRatingPopup(null); navigate('/'); }}
                                style={{
                                    padding: '12px 32px', background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                                    border: 'none', borderRadius: '12px', color: 'white',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '15px',
                                }}
                            >
                                Back to Home
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                padding: '24px', position: 'relative',
                            }}>
                                <button
                                    onClick={() => setRatingPopup(null)}
                                    style={{
                                        position: 'absolute', top: '16px', right: '16px',
                                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer', fontSize: '18px',
                                    }}
                                >
                                    <FaTimes />
                                </button>
                                <h2 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '18px' }}>Job Completed! 🎉</h2>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                                    {ratingPopup.providerName} completed your <strong>{ratingPopup.serviceType}</strong> request.
                                </p>
                            </div>

                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Star Rating */}
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>
                                        Rate your experience
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setRatingScore(star)}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    transition: 'transform 0.15s',
                                                    transform: star <= (hoveredStar || ratingScore) ? 'scale(1.2)' : 'scale(1)',
                                                }}
                                            >
                                                <FaStar size={32} style={{
                                                    color: star <= (hoveredStar || ratingScore) ? '#fbbf24' : '#334155',
                                                    transition: 'color 0.15s',
                                                }} />
                                            </button>
                                        ))}
                                    </div>
                                    {ratingScore > 0 && (
                                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][ratingScore]}
                                        </p>
                                    )}
                                </div>

                                {/* Comment */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                                        Leave a comment (optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={ratingComment}
                                        onChange={e => setRatingComment(e.target.value)}
                                        placeholder="Tell us about your experience…"
                                        style={{
                                            width: '100%', background: '#0f172a', border: '1px solid #334155',
                                            borderRadius: '10px', padding: '10px 12px', color: '#f1f5f9',
                                            resize: 'none', fontSize: '13px', outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                {/* Issue Report */}
                                <div style={{ borderTop: '1px solid #334155', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => setShowIssueReport(!showIssueReport)}
                                        style={{
                                            background: 'none', border: 'none', color: '#f87171',
                                            fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}
                                    >
                                        <span style={{ background: 'rgba(239,68,68,0.1)', padding: '4px 6px', borderRadius: '6px' }}>
                                            {showIssueReport ? '▲' : '▼'}
                                        </span>
                                        Report a Serious Issue
                                    </button>

                                    {showIssueReport && (
                                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                    Reason
                                                </label>
                                                <select
                                                    value={disputeReason}
                                                    onChange={e => setDisputeReason(e.target.value)}
                                                    style={{
                                                        width: '100%', background: '#0f172a', border: '1px solid #334155',
                                                        borderRadius: '10px', padding: '8px 12px', color: '#f1f5f9', fontSize: '13px',
                                                        outline: 'none',
                                                    }}
                                                >
                                                    <option>Late arrival</option>
                                                    <option>Overcharging</option>
                                                    <option>Misbehavior</option>
                                                    <option>Fake service</option>
                                                    <option>Safety issue</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                    Description
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={issueReport}
                                                    onChange={e => setIssueReport(e.target.value)}
                                                    placeholder="Provide details about what happened…"
                                                    style={{
                                                        width: '100%', background: '#0f172a', border: '1px solid #334155',
                                                        borderRadius: '10px', padding: '10px 12px', color: '#f1f5f9',
                                                        resize: 'none', fontSize: '13px', outline: 'none',
                                                        boxSizing: 'border-box',
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                    Upload Proof (Optional)
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => setDisputeFile(e.target.files[0])}
                                                    style={{ fontSize: '12px', color: '#94a3b8' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    disabled={ratingScore === 0 || ratingSubmitting}
                                    onClick={handleRatingSubmit}
                                    style={{
                                        width: '100%', padding: '14px 0',
                                        background: ratingScore === 0
                                            ? '#334155'
                                            : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                        border: 'none', borderRadius: '12px',
                                        color: 'white', fontWeight: 700, fontSize: '15px',
                                        cursor: ratingScore === 0 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: ratingSubmitting ? 0.7 : 1,
                                    }}
                                >
                                    {ratingSubmitting ? (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '16px', height: '16px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTop: '2px solid white', borderRadius: '50%',
                                                animation: 'spin 1s linear infinite',
                                            }} />
                                            Submitting…
                                        </span>
                                    ) : 'Complete Review'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
        {/* ── Waiting for Provider Overlay ── */}
        {isWaitingForProvider && (
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px',
            }}>
                <div style={{
                    background: '#111827', borderRadius: '24px', width: '100%', maxWidth: '380px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid #1e293b',
                    padding: '32px', textAlign: 'center',
                }}>
                    <div style={{ position: 'relative', width: '128px', height: '128px', margin: '0 auto 24px' }}>
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle
                                cx="64" cy="64" r="58"
                                fill="transparent" stroke="#1f2937" strokeWidth="8"
                            />
                            <circle
                                cx="64" cy="64" r="58"
                                fill="transparent" stroke="#06b6d4" strokeWidth="8"
                                strokeDasharray="364.4"
                                strokeDashoffset={364.4 - (364.4 * requestCountdown) / 60}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '36px', fontWeight: 800, color: 'white',
                        }}>
                            {requestCountdown}
                        </div>
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '20px', fontWeight: 700 }}>
                        Waiting for {activeRequestProvider?.name}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                        The driver has 60 seconds to accept your hire request.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', color: '#06b6d4', fontSize: '14px', fontWeight: 600,
                        }}>
                            <div className="pulse-dot" style={{ width: '8px', height: '8px', background: '#06b6d4', borderRadius: '50%' }}></div>
                            Connecting to driver...
                        </div>
                        <button
                            onClick={handleAutoCancel}
                            style={{
                                background: 'transparent', border: 'none', color: '#64748b',
                                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                                transition: 'color 0.2s', padding: '8px',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
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

export default HireDriver;
