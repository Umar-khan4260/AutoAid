import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPhoneAlt, FaCommentAlt, FaMapMarkerAlt, FaCheckCircle, FaLocationArrow, FaArrowLeft, FaTimes, FaPaperPlane, FaCheckDouble } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { io } from 'socket.io-client';

const defaultCenter = { lat: 31.5204, lng: 74.3587 }; // Lahore default

const ProviderActiveJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, fetchUserProfile } = useAuth();
  const { success, error } = useNotification();
  
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!job);
  const [jobStatus, setJobStatus] = useState(job?.status || 'Accepted'); 
  
  // Map states
  const [providerLocation, setProviderLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const providerLocationRef = useRef(null);

  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // Setup sockets
  useEffect(() => {
    if (!job || !currentUser) return;
    
    socketRef.current = io('http://localhost:3000', { withCredentials: true });
    
    socketRef.current.on('connect', () => {
        socketRef.current.emit('register_provider', currentUser.uid);
        socketRef.current.emit('join_job_room', job._id);
    });

    socketRef.current.on('new_job_message', (message) => {
        setMessages((prev) => [...prev, message]);
        // Auto-mark seen if chat is open
        if (isChatOpen && message.senderId !== currentUser.uid) {
            socketRef.current.emit('mark_messages_seen', { requestId: job._id, readerId: currentUser.uid });
        }
    });

    socketRef.current.on('messages_updated', (updatedMessages) => {
        setMessages(updatedMessages);
    });

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, [job, currentUser, isChatOpen]);

  // Handle Mark Seen when opening chat
  useEffect(() => {
    if (isChatOpen && job && socketRef.current) {
        socketRef.current.emit('mark_messages_seen', { requestId: job._id, readerId: currentUser.uid });
    }
  }, [isChatOpen, job, currentUser]);

  // Load existing messages when job is fetched
  useEffect(() => {
    if (job?.messages) {
        setMessages(job.messages);
    }
  }, [job]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !job || jobStatus === 'Completed') return;

    socketRef.current.emit('send_job_message', {
        requestId: job._id,
        senderId: currentUser.uid,
        senderModel: 'Provider',
        text: newMessage.trim()
    });
    setNewMessage('');
  };

  useEffect(() => {
    // Scroll chat to bottom
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

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

  // Function to calculate and display route
  const calculateAndDisplayRoute = useCallback((origin, destination) => {
    if (!window.google || !directionsRendererRef.current) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
        {
            origin: origin,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                directionsRendererRef.current.setDirections(result);
            } else {
                console.error(`Error fetching directions: ${status}`);
            }
        }
    );
  }, []);

  // Initialize Map
  const initMap = useCallback(() => {
    if (!mapRef.current || !job || !job.userLocation || !window.google) return;

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

    // User Marker
    new window.google.maps.Marker({
        position: job.userLocation,
        map: map,
        title: 'Customer Location',
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
    });

    // Provider Marker (initially at user or specific location if known)
    providerMarkerRef.current = new window.google.maps.Marker({
        position: providerLocation || defaultCenter,
        map: map,
        title: 'Your Location',
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
    });

    // Initialize DirectionsRenderer
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // We draw our own markers
        polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 6,
            strokeOpacity: 0.8
        }
    });

    directionsRendererRef.current = directionsRenderer;

    // If we already have provider location, draw route
    if (providerLocation) {
        calculateAndDisplayRoute(providerLocation, job.userLocation);
    }

  }, [job, calculateAndDisplayRoute]); // Removed providerLocation from deps to avoid map re-init

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

  // LIVE TRACKING & UI UPDATES
  useEffect(() => {
      if (!job || jobStatus === 'Completed') return;

      if (navigator.geolocation) {
          // Watch position for smooth UI updates
          watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  const newLoc = { lat, lng };
                  
                  setProviderLocation(newLoc);
                  providerLocationRef.current = newLoc;

                  // Update provider marker on map
                  if (providerMarkerRef.current) {
                      providerMarkerRef.current.setPosition(newLoc);
                  }

                  // Recalculate route whenever location updates (or can throttle this)
                  if (job.userLocation) {
                      calculateAndDisplayRoute(newLoc, job.userLocation);
                  }
              },
              (err) => console.error("Watch position error:", err),
              { enableHighAccuracy: true }
          );

          // Still use interval for backend updates to avoid overwhelming server
          const backendInterval = setInterval(async () => {
              const currentLoc = providerLocationRef.current;
              if (currentLoc) {
                  try {
                      await fetch('http://localhost:3000/api/services/provider/location', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ lat: currentLoc.lat, lng: currentLoc.lng })
                      });
                  } catch (error) {
                      console.error("Failed to send live location update:", error);
                  }
              }
          }, 10000);

          return () => {
              if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
              clearInterval(backendInterval);
          };
      }
  }, [job, jobStatus, calculateAndDisplayRoute]); // providerLocation intentionally omitted from deps to avoid infinite loops, we use the state inside watchPosition callback or interval


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
                success('Job marked as completed successfully!');
                setJob(null); // Empties the active job page
            }
        } else {
            error(`Failed to update status: ${data.error}`);
        }
      } catch (err) {
          console.error("Error updating status:", err);
          error('Network error while updating status.');
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
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                disabled={jobStatus === 'Completed'}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white transition-colors font-medium ${jobStatus === 'Completed' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <FaCommentAlt /> Chat 
                {messages.filter(m => !m.seen && m.senderId !== currentUser.uid).length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                        {messages.filter(m => !m.seen && m.senderId !== currentUser.uid).length}
                    </span>
                )}
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
      
      {/* Floating Chat Modal */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white dark:bg-surface-dark rounded-t-xl rounded-bl-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden transform transition-all animate-fade-in h-[500px]">
            {/* Header */}
            <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-xl shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                        {displayJob.user.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">{displayJob.user}</h3>
                        <p className="text-[10px] text-primary-100">{jobStatus === 'Completed' ? 'Chat Closed' : 'Active Job'}</p>
                    </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:text-gray-200 transition-colors p-2">
                    <FaTimes />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-[#0B1120] space-y-3 custom-scrollbar relative">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs mt-10">Start communicating with the customer...</div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === currentUser.uid;
                        return (
                            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                                    {msg.text}
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1">
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                        <FaCheckDouble className={`text-[10px] ${msg.seen ? 'text-blue-500' : 'text-gray-400'}`} />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                {jobStatus === 'Completed' && (
                    <div className="text-center bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs py-2 rounded-lg my-4">
                        Job is completed. Chat is read-only.
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={jobStatus === 'Completed'}
                        placeholder={jobStatus === 'Completed' ? "Chat disabled" : "Type a message..."}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary/50 text-gray-900 dark:text-white rounded-full px-4 py-2 text-sm outline-none transition-colors disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || jobStatus === 'Completed'}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:bg-gray-400"
                    >
                        <FaPaperPlane className="text-xs ml-1" />
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProviderActiveJob;
