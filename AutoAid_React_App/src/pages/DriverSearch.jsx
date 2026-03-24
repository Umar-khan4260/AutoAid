import React, { useState, useEffect, useMemo } from 'react';
import { 
  GoogleMap, 
  useLoadScript, 
  MarkerF, 
  InfoWindowF,
  CircleF
} from '@react-google-maps/api';
import { Search, MapPin, Star, Shield, Crosshair, ChevronRight, Navigation, Zap, Clock, ThumbsUp, Loader2 } from 'lucide-react';

// Default to Lahore Center if geolocation fails
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };
const SEARCH_RADIUS_KM = 10;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DriverSearch = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    // We removed 'places' library to bypass Google billing issues 
  });

  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  
  // Custom Autocomplete State (OpenStreetMap Nominatim)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Backend States
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [interactionId, setInteractionId] = useState(null);
  const [hiredDriverId, setHiredDriverId] = useState(null);
  const [error, setError] = useState(null);
  const [userId] = useState(() => `USR_${Math.floor(Math.random() * 10000)}`);

  // UI States
  const [useAiRanking, setUseAiRanking] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  // Get User Location on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          fetchDrivers(loc);
        },
        (err) => {
          console.log("Geolocation permission denied or failed, using default.");
          fetchDrivers(DEFAULT_CENTER);
        }
      );
    } else {
      fetchDrivers(DEFAULT_CENTER);
    }
  }, []);

  const fetchDrivers = async (location) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedMarkerId(null);

    try {
      const response = await fetch('http://localhost:8000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          lat: location.lat,
          lon: location.lng,
          city: "Location-based search",
          radius_km: SEARCH_RADIUS_KM,   
          top_n: 20
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to Recommender API');

      const data = await response.json();
      setResults(data.results);
      setInteractionId(data.interaction_id);
      
      if (map) {
        map.panTo(location);
        map.setZoom(13);
      }
    } catch (err) {
      setError(err.message || 'Error finding drivers near you.');
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (driverId) => {
    setHiredDriverId(driverId);
    try {
      await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          interaction_id: interactionId,
          selected_driver_id: driverId,
          shown_driver_ids: sortedResults.map(r => r.driver_id)
        }),
      });
    } catch (err) {
      console.error("Failed to log feedback:", err);
    }
  };

  // OpenStreetMap Nominatim Free Geocoding API
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowDropdown(true);
    try {
      // Use OSM Nominatim text search restricted to Pakistan (&countrycodes=pk)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=pk`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (place) => {
    const newLoc = {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    };
    setSearchQuery(place.display_name);
    setShowDropdown(false);
    setUserLocation(newLoc);
    fetchDrivers(newLoc);
  };

  // Simulate live driver movement (InDrive style)
  useEffect(() => {
    if (results.length === 0) return;

    const interval = setInterval(() => {
      setResults(prevResults => 
        prevResults.map(driver => {
          // Tiny nudge - approx 5-10 meters
          const nudgeLat = (Math.random() - 0.5) * 0.00015;
          const nudgeLon = (Math.random() - 0.5) * 0.00015;
          
          return {
            ...driver,
            lat: driver.lat + nudgeLat,
            lon: driver.lon + nudgeLon,
            // Recalculate distance to user dynamically
            distance_km: parseFloat(
              haversine(userLocation.lat, userLocation.lng, driver.lat + nudgeLat, driver.lon + nudgeLon).toFixed(2)
            )
          };
        })
      );
    }, 3000); // Nudge every 3 seconds

    return () => clearInterval(interval);
  }, [results.length, userLocation]);

  const sortedResults = useMemo(() => {
    let sorted = [...results];
    if (useAiRanking) {
      sorted.sort((a, b) => b.score - a.score);
    } else {
      sorted.sort((a, b) => a.distance_km - b.distance_km);
    }
    return sorted;
  }, [results, useAiRanking]);

  if (loadError) return <div className="p-8 text-center text-red-500">Error loading Google Maps API</div>;
  if (!isLoaded) return <div className="p-8 text-center text-white h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex flex-1 flex-col md:flex-row relative">
        
        {/* Left Side (Map) */}
        <div className="flex-1 relative order-2 md:order-1 h-[50vh] md:h-full">
          
          {/* Top Search Bar Overlay (Custom OSM Geocoding) */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] md:w-full max-w-lg">
            <div className="bg-surface-dark border border-gray-800 rounded-2xl p-2 shadow-2xl flex items-center gap-2 relative">
               <form onSubmit={handleLocationSearch} className="relative flex-grow">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-gray-400" />
                 </div>
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onFocus={() => {if (searchResults.length > 0) setShowDropdown(true)}}
                   placeholder="Enter pickup location (e.g. Lahore)..."
                   className="block w-full min-w-[200px] md:min-w-[300px] pl-10 pr-10 py-3 rounded-xl bg-background-dark/50 text-white placeholder-gray-500 border-none focus:ring-2 focus:ring-primary backdrop-blur-sm transition-all"
                 />
                 {isSearching && (
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                     <Loader2 className="h-5 w-5 text-primary animate-spin" />
                   </div>
                 )}
               </form>

               <button 
                 onClick={() => {
                   if (navigator.geolocation) {
                     navigator.geolocation.getCurrentPosition(pos => {
                       const loc = {lat: pos.coords.latitude, lng: pos.coords.longitude};
                       setSearchQuery("My Location");
                       setShowDropdown(false);
                       setUserLocation(loc);
                       fetchDrivers(loc);
                     });
                   }
                 }}
                 className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-primary transition-colors cursor-pointer"
                 title="Use my location"
               >
                 <Crosshair className="h-5 w-5" />
               </button>

               {/* Custom Dropdown Results */}
               {showDropdown && searchResults.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                   {searchResults.map((place, idx) => (
                     <button
                       key={idx}
                       onClick={() => selectLocation(place)}
                       className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm text-gray-300 border-b border-gray-800/50 last:border-0 transition-colors flex items-start gap-2"
                     >
                       <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                       <span className="truncate">{place.display_name}</span>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          </div>

          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={userLocation}
            zoom={13}
            onLoad={mapInstance => setMap(mapInstance)}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
                { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
              ]
            }}
          >
            <CircleF
              center={userLocation}
              radius={SEARCH_RADIUS_KM * 1000}
              options={{
                fillColor: "rgba(230, 57, 70, 0.05)",
                fillOpacity: 0.1,
                strokeColor: "rgba(230, 57, 70, 0.3)",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                clickable: false,
                zIndex: 1
              }}
            />

            <MarkerF
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              zIndex={50}
            />

            {sortedResults.map((driver, idx) => {
              const isSelected = selectedMarkerId === driver.driver_id;
              const isTopAiMatch = useAiRanking && idx === 0;
              
              return (
                <MarkerF
                  key={driver.driver_id}
                  position={{ lat: driver.lat, lng: driver.lon }}
                  onClick={() => setSelectedMarkerId(driver.driver_id)}
                  icon={{
                    // Car Icon SVG Path
                    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
                    fillColor: isTopAiMatch ? "#E63946" : isSelected ? "#ffffff" : "#32CD32", // Green for online cars
                    fillOpacity: 1,
                    strokeColor: isTopAiMatch ? "#ffffff" : "#111827",
                    strokeWeight: 1,
                    scale: isSelected || isTopAiMatch ? 1.4 : 1.1,
                    anchor: new window.google.maps.Point(12, 12),
                  }}
                  zIndex={isSelected ? 40 : isTopAiMatch ? 30 : 20}
                >
                  {isSelected && (
                    <InfoWindowF
                      position={{ lat: driver.lat, lng: driver.lon }}
                      onCloseClick={() => setSelectedMarkerId(null)}
                      options={{ pixelOffset: new window.google.maps.Size(0, -25) }}
                    >
                      <div className="p-2 text-gray-900 min-w-[150px]">
                        <h4 className="font-bold text-base m-0">{driver.name}</h4>
                        <div className="text-sm font-medium text-gray-700 flex justify-between mt-1">
                          <span>★ {driver.rating.toFixed(1)}</span>
                          <span>{driver.distance_km} km</span>
                        </div>
                        <button 
                          disabled={hiredDriverId !== null}
                          className="w-full mt-2 bg-black text-white py-1.5 rounded-md text-xs font-bold hover:bg-gray-800"
                          onClick={() => handleHire(driver.driver_id)}
                        >
                          {hiredDriverId === driver.driver_id ? 'Hired' : 'Hire Now'}
                        </button>
                      </div>
                    </InfoWindowF>
                  )}
                </MarkerF>
              );
            })}
          </GoogleMap>
        </div>

        {/* Right Sidebar - Driver List */}
        <div className="w-full md:w-[400px] lg:w-[450px] bg-background-dark border-r md:border-r-0 md:border-l border-gray-800 flex flex-col z-20 shadow-xl overflow-hidden order-1 md:order-2 h-[50vh] md:h-full">
          
          {/* Header & Toggle */}
          <div className="p-5 border-b border-gray-800 bg-surface-dark/50">
            <h2 className="text-xl font-bold mb-4">Nearby Drivers ({results.length})</h2>
            
            <div className="flex bg-gray-900 rounded-lg p-1 relative shadow-inner">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 z-10 flex items-center justify-center gap-2 ${useAiRanking ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setUseAiRanking(true)}
              >
                <Zap className={`h-4 w-4 ${useAiRanking ? 'text-primary' : ''}`} />
                AI Match
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 z-10 flex items-center justify-center gap-2 ${!useAiRanking ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setUseAiRanking(false)}
              >
                <MapPin className={`h-4 w-4 ${!useAiRanking ? 'text-blue-400' : ''}`} />
                Nearest
              </button>
              
              {/* Sliding background indicator */}
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gray-800 border border-gray-700 rounded-md transition-transform duration-300 ease-out shadow-sm"
                style={{ transform: useAiRanking ? 'translateX(0)' : 'translateX(100%)' }}
              />
            </div>
            {useAiRanking ? (
                <p className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" /> AI ranks by reliability, sentiment, and distance.
                </p>
            ) : (
                <p className="text-xs text-blue-400 mt-2 text-center flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" /> Drivers strictly sorted by distance.
                </p>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                Finding best matches within 10km...
              </div>
            ) : error ? (
              <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-xl border border-red-500/20">{error}</div>
            ) : sortedResults.length === 0 ? (
              <div className="text-center text-gray-500 p-8">No drivers found within 10km. Try moving the map.</div>
            ) : (
              sortedResults.map((driver, idx) => {
                const isHired = hiredDriverId === driver.driver_id;
                const isSelected = selectedMarkerId === driver.driver_id;
                const isTopMatch = useAiRanking && idx === 0;

                return (
                  <div 
                    key={driver.driver_id}
                    onClick={() => {
                      setSelectedMarkerId(driver.driver_id);
                      map?.panTo({lat: driver.lat, lng: driver.lon});
                    }}
                    className={`bg-surface-dark border p-4 rounded-xl transition-all duration-200 cursor-pointer hover:border-gray-600
                      ${isSelected ? 'border-primary shadow-lg ring-1 ring-primary/50' : 'border-gray-800'}
                      ${isHired ? 'opacity-50 grayscale' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold border border-gray-700">
                            {driver.name.charAt(0)}
                          </div>
                          {driver.is_online && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-surface-dark rounded-full"></div>}
                        </div>
                        <div>
                          <h3 className="font-bold text-white flex items-center gap-2">
                            {driver.name}
                            {isTopMatch && <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30"><Zap className="inline w-3 h-3 mr-1" />Best AI Match</span>}
                          </h3>
                          <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-current" />{driver.rating.toFixed(1)}</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{driver.jobs_completed} trips</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{driver.distance_km} km</div>
                        <div className="text-xs text-gray-500 mt-1">~{Math.max(2, Math.round(driver.distance_km * 2.5))} min</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-600">Model Rank: {(driver.score * 100).toFixed(0)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleHire(driver.driver_id); }}
                        disabled={hiredDriverId !== null}
                        className={`text-sm px-4 py-1.5 rounded-lg font-semibold transition-all ${
                          isHired ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                          hiredDriverId !== null ? 'bg-gray-800 text-gray-600' : 
                          'bg-white text-black hover:bg-gray-200'
                        }`}
                      >
                        {isHired ? 'Hiring...' : hiredDriverId !== null ? 'Skipped' : 'Hire'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DriverSearch;
