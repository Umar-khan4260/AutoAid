import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPhoneAlt, FaCommentAlt, FaMapMarkerAlt, FaCheckCircle, FaLocationArrow, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const defaultCenter = { lat: 31.5204, lng: 74.3587 }; // Lahore default

const ProviderActiveJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, fetchUserProfile } = useAuth();
  
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!job);
  const [jobStatus, setJobStatus] = useState(job?.status || 'Accepted'); 
  
  // Map states
  const [providerLocation, setProviderLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  // Fetch active job consistently
  useEffect(() => {
    const fetchActiveJob = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/services/active-job', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.request) {
            setJob(data.request);
            setJobStatus(data.request.status);
        } else if (!location.state?.job) {
            setJob(null);
        }
      } catch (error) {
        console.error("Error fetching active job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveJob();
  }, [location.state?.job]);

  // Initialize Map and Draw Directions
  const initMap = useCallback(() => {
    if (!mapRef.current || !job || !job.userLocation || !window.google) return;

    // Initialize Map
    const map = new window.google.maps.Map(mapRef.current, {
        center: job.userLocation || defaultCenter,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] }
        ]
    });

    mapInstanceRef.current = map;

    // Initialize DirectionsRenderer
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: "#db2b39",
            strokeWeight: 5
        }
    });

    directionsRendererRef.current = directionsRenderer;

    // Get Provider Location & Fetch Route
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setProviderLocation(currentLoc);

                const directionsService = new window.google.maps.DirectionsService();
                directionsService.route(
                    {
                        origin: currentLoc,
                        destination: job.userLocation,
                        travelMode: window.google.maps.TravelMode.DRIVING
                    },
                    (result, status) => {
                        if (status === window.google.maps.DirectionsStatus.OK) {
                            directionsRenderer.setDirections(result);
                        } else {
                            console.error(`Error fetching directions: ${status}`);
                            // Fallback to just marking the user location if routing fails
                            new window.google.maps.Marker({
                                position: job.userLocation,
                                map: map,
                                title: 'User Location'
                            });
                        }
                    }
                );
            },
            () => {
                console.error("Error getting provider location for directions");
                // Just place a marker on user if provider loc fails
                new window.google.maps.Marker({
                    position: job.userLocation,
                    map: map,
                    title: 'User Location'
                });
            },
            { enableHighAccuracy: true }
        );
    } else {
        // Just place marker if no geolocation support
        new window.google.maps.Marker({
            position: job.userLocation,
            map: map,
            title: 'User Location'
        });
    }

  }, [job]);

  useEffect(() => {
      // Small timeout to ensure DOM is ready
      if (job && !loading) {
          setTimeout(() => {
              if (window.google && mapRef.current) {
                  initMap();
              } else {
                  // If google maps is not yet loaded, try setting up an interval
                  const checkGoogle = setInterval(() => {
                      if (window.google && mapRef.current) {
                          initMap();
                          clearInterval(checkGoogle);
                      }
                  }, 500);
                  setTimeout(() => clearInterval(checkGoogle), 10000); // 10s timeout
              }
          }, 300);
      }
  }, [job, loading, initMap]);

  // LIVE TRACKING: 10-second interval to send location to backend
  useEffect(() => {
      if (!job || jobStatus === 'Completed') return;

      const trackingInterval = setInterval(() => {
          if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                  async (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      setProviderLocation({ lat, lng });

                      try {
                          await fetch('http://localhost:3000/api/services/provider/location', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ lat, lng })
                          });
                      } catch (error) {
                          console.error("Failed to send live location update:", error);
                      }
                  },
                  (error) => console.error("Live tracking error:", error),
                  { enableHighAccuracy: true }
              );
          }
      }, 10000); // 10 seconds

      return () => clearInterval(trackingInterval);
  }, [job, jobStatus]);


  const steps = [
    { id: 'Accepted', label: 'Job Accepted' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Completed', label: 'Completed' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === jobStatus);

  const handleStatusUpdate = async (nextStatus) => {
      console.log(`Updating status to: ${nextStatus} for job ${job?._id}`);
      try {
        const response = await fetch(`http://localhost:3000/api/services/request/${job._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: nextStatus })
        });
        const data = await response.json();
        console.log("Status update response:", data);
        
        if (response.ok) {
            setJobStatus(nextStatus);
            if (nextStatus === 'Completed') {
                console.log("Job completed successfully, clearing local state and refreshing profile.");
                // Refresh context so the frontend knows we are now 'available' again
                if (currentUser) {
                    await fetchUserProfile(currentUser);
                }
                alert('Job marked as completed successfully!');
                setJob(null); // Empties the active job page
            }
        } else {
            alert(`Failed to update status: ${data.error}`);
        }
      } catch (error) {
          console.error("Error updating status:", error);
          alert('Network error while updating status.');
      }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-full">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 mt-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">No Active Job Found</h2>
        <button 
          onClick={() => navigate('/provider/requests')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FaArrowLeft /> View Incoming Requests
        </button>
      </div>
    );
  }

  // Map the real request data to our UI
  const displayJob = {
    id: job.requestId || job._id?.slice(-6).toUpperCase(),
    user: job.userInfo?.name || job.user?.name || 'Customer',
    phone: job.contactNumber || job.userInfo?.contactNumber || job.user?.contact || 'Not provided',
    service: job.serviceType,
    vehicle: job.details?.carCompany || job.details?.makeModel ? 
             `${job.details?.carCompany || ''} ${job.details?.makeModel || ''}` : 'Vehicle Unspecified',
    location: job.userLocation ? `${job.userLocation.lat.toFixed(4)}, ${job.userLocation.lng.toFixed(4)}` : 'Location not provided',
    issue: job.details?.issueDescription || job.details?.lockoutType || job.details?.destination || job.details?.fuelType || 'No additional details',
    amount: 'TBD upon inspection'
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Job</h1>
        <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-bold">
          ID: {displayJob.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Job Details & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Card */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg transition-colors duration-300">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Customer Details</h3>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayJob.user}</h2>
                <p className="text-primary">{displayJob.vehicle}</p>
                <p className="text-sm text-gray-500 mt-1">{displayJob.phone}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl text-gray-600 dark:text-white">
                {displayJob.user.charAt(0)}
              </div>
            </div>
            
            <div className="flex gap-3">
              <a href={`tel:${displayJob.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors font-medium">
                <FaPhoneAlt /> Call
              </a>
              <button disabled className="opacity-50 cursor-not-allowed flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium">
                <FaCommentAlt /> Chat
              </button>
            </div>
          </div>

          {/* Job Info */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg transition-colors duration-300">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Service Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Service Type</label>
                <p className="text-gray-900 dark:text-white font-medium">{displayJob.service}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Location Coordinate</label>
                <p className="text-gray-900 dark:text-white font-medium flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-1 text-primary" />
                  {displayJob.location}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Reported Issue / Details</label>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mt-1 text-sm">
                  {displayJob.issue}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="text-xs text-gray-500">Estimated Earnings</label>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{displayJob.amount}</p>
              </div>
            </div>
          </div>

          {/* Status Control */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg transition-colors duration-300">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Update Status</h3>
            {jobStatus !== 'Completed' ? (
              <div className="space-y-3">
                {jobStatus === 'Accepted' && (
                  <button 
                    onClick={() => handleStatusUpdate('In Progress')}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transition-all"
                  >
                    Mark as In Progress
                  </button>
                )}
                <button 
                  onClick={() => handleStatusUpdate('Completed')}
                  className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FaCheckCircle className="inline mr-2" /> Complete Job
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-green-500 dark:text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                <FaCheckCircle /> Job Completed
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Map & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Map */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 min-h-[400px] relative overflow-hidden group transition-colors duration-300">
            
            <div ref={mapRef} className="w-full h-full rounded-xl"></div>
            
            {/* Overlay Controls */}
            {providerLocation && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&origin=${providerLocation.lat},${providerLocation.lng}&destination=${job.userLocation.lat},${job.userLocation.lng}`, '_blank');
                    }}
                    className="bg-primary p-3 rounded-lg text-white shadow-lg flex items-center gap-2 hover:bg-primary-dark transition-colors z-10"
                  >
                    <FaLocationArrow /> Navigate Externally
                  </button>
                </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex justify-between items-center relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2 transition-colors duration-300"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 transform -translate-y-1/2 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-white dark:bg-surface-dark border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-600'
                      } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}
                    >
                      {isCompleted ? <FaCheckCircle /> : <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600" />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderActiveJob;
