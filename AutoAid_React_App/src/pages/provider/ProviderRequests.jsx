import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUser, FaCar, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const ProviderRequests = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial requests
  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/services/provider', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Only show pending requests
        const pending = data.requests.filter(req => req.status === 'Pending');
        setRequests(pending);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
      
      const socket = io('http://localhost:3000', {
          withCredentials: true
      });

      socket.on('connect', () => {
          socket.emit('register_provider', currentUser.uid);
      });

      socket.on('new_service_request', (data) => {
          console.log('New request received via socket:', data);
          
          // data contains { request, user: { name, contact } }
          const formattedRequest = {
            ...data.request,
            userInfo: data.user
          };
          
          setRequests(prev => {
              // Avoid duplicates
              if (prev.find(r => r._id === formattedRequest._id)) return prev;
              return [formattedRequest, ...prev];
          });

          // Optional: Browser Notification if permission granted
          if (Notification.permission === 'granted') {
              new Notification('New Service Request', {
                  body: `${data.user?.name || 'A user'} needs your help!`,
                  icon: '/Autologo.png' // assuming this is in public folder
              });
          }
      });

      return () => {
          socket.disconnect();
      };
    }
  }, [currentUser]);

  // Request browser notification permission on mount
  useEffect(() => {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
      }
  }, []);

  const handleAccept = async (request) => {
    try {
        const response = await fetch(`http://localhost:3000/api/services/request/${request._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'Accepted' })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert('Request Accepted!');
            setRequests(requests.filter(req => req._id !== request._id));
            navigate('/provider/active-job', { state: { job: request } });
        } else {
            alert(`Failed to accept: ${data.error}`);
        }
    } catch (error) {
        console.error("Error accepting request:", error);
        alert('Network error. Failed to accept request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
        const response = await fetch(`http://localhost:3000/api/services/request/${requestId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'Rejected' })
        });
        const data = await response.json();
        
        if (response.ok) {
            setRequests(requests.filter(req => req._id !== requestId));
        } else {
            alert(`Failed to reject: ${data.error}`);
        }
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert('Network error. Failed to reject request.');
    }
  };

  const calculateDistanceStr = (req) => {
      // We could calculate distance from provider's current location here
      // but for now we'll just show "Live Location"
      if (req.userLocation) {
          return `Live Location (${req.userLocation.lat.toFixed(4)}, ${req.userLocation.lng.toFixed(4)})`;
      }
      return 'Location not provided';
  };

  const getTimeAgo = (dateStr) => {
      const msAgo = new Date() - new Date(dateStr);
      const minsAgo = Math.floor(msAgo / 60000);
      if (minsAgo < 1) return 'Just now';
      if (minsAgo < 60) return `${minsAgo} min${minsAgo > 1 ? 's' : ''} ago`;
      const hoursAgo = Math.floor(minsAgo / 60);
      return `${hoursAgo} hr${hoursAgo > 1 ? 's' : ''} ago`;
  };

  const renderServiceDetails = (request) => {
    const details = request.details || {};
    const type = request.serviceType;

    const DetailItem = ({ label, value, icon: Icon }) => {
        if (!value) return null;
        return (
            <div className="flex items-center gap-2 py-1 px-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700/50">
                <Icon className="text-primary shrink-0" size={14} />
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter whitespace-nowrap">{label}:</span>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">{value}</span>
            </div>
        );
    };

    const renderHeader = (title) => (
        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700/50 pb-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h4>
        </div>
    );

    switch (type) {
        case 'Breakdown Repair':
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Breakdown Information')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DetailItem label="Issue" value={details.issueType} icon={FaExclamationTriangle} />
                        <DetailItem label="Manufacturer" value={details.carCompany} icon={FaCar} />
                        <DetailItem label="Plate #" value={details.vehicleNumber} icon={FaIdCard} />
                        <DetailItem label="Model/Year" value={details.makeModel} icon={FaCar} />
                    </div>
                    {details.description && (
                        <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Issue Description</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{details.description}"</p>
                        </div>
                    )}
                </div>
            );
        case 'Fuel Delivery':
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Fuel Request Details')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DetailItem label="Fuel Type" value={details.fuelType} icon={FaCar} />
                        <DetailItem label="Quantity" value={details.quantity ? `${details.quantity} Liters` : null} icon={FaClock} />
                    </div>
                </div>
            );
        case 'Lockout Service':
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Lockout Assistance Details')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DetailItem label="Lock Type" value={details.lockoutType} icon={FaExclamationTriangle} />
                        <DetailItem label="Manufacturer" value={details.carCompany} icon={FaCar} />
                        <DetailItem label="Model/Year" value={details.makeModel} icon={FaCar} />
                    </div>
                </div>
            );
        case 'Towing Service':
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Towing Logistics')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DetailItem label="Manufacturer" value={details.carCompany} icon={FaCar} />
                        <DetailItem label="Model/Year" value={details.makeModel} icon={FaCar} />
                        <DetailItem label="Plate #" value={details.vehicleNumber} icon={FaIdCard} />
                    </div>
                </div>
            );
        case 'Temporary Driver':
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Trip Itinerary')}
                    <div className="grid grid-cols-1 gap-2">
                        <DetailItem label="From" value={details.pickupLocation} icon={FaMapMarkerAlt} />
                        <DetailItem label="To" value={details.destination} icon={FaMapMarkerAlt} />
                        <div className="grid grid-cols-2 gap-2">
                            <DetailItem label="Date" value={details.tripDate} icon={FaClock} />
                            <DetailItem label="Time" value={details.tripTime} icon={FaClock} />
                            <DetailItem label="Duration" value={details.drivingDuration} icon={FaClock} />
                            <DetailItem label="Type" value={details.tripType} icon={FaBriefcase} />
                        </div>
                    </div>
                </div>
            );
        case 'Route Planning':
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Route Parameters')}
                    <div className="grid grid-cols-1 gap-2">
                        <DetailItem label="Start" value={details.startLocation} icon={FaMapMarkerAlt} />
                        <DetailItem label="End" value={details.endLocation} icon={FaMapMarkerAlt} />
                        <DetailItem label="Travel Date" value={details.travelDate} icon={FaClock} />
                    </div>
                </div>
            );
        default:
            return (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-inner">
                    {renderHeader('Request Summary')}
                    <p className="text-xs text-gray-500 italic">No specific details available for this service type.</p>
                </div>
            );
    }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Incoming Requests</h1>
        <span className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold animate-pulse">
          {requests.length} New Requests
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((request) => (
          <div key={request._id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg hover:border-primary/50 transition-all duration-300">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl text-gray-600 dark:text-gray-300">
                    <FaUser />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{request.userInfo?.name || 'User'}</h3>
                    <p className="text-primary font-medium">{request.serviceType}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <FaClock /> {getTimeAgo(request.createdAt)}
                </span>
              </div>

              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <FaCar className="mt-1 text-gray-500" />
                  <span>
                    {request.details?.carCompany || request.details?.makeModel ? 
                      `${request.details?.carCompany || ''} ${request.details?.makeModel || ''}` 
                      : 'Vehicle not specified'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="mt-1 text-gray-500" />
                  <span className="text-sm">{calculateDistanceStr(request)}</span>
                </div>
                
                {/* Dynamically Rendered Details */}
                {renderServiceDetails(request)}
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => handleReject(request._id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                >
                  <FaTimes /> Reject
                </button>
                <button 
                  onClick={() => handleAccept(request)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors font-bold shadow-lg shadow-primary/20"
                >
                  <FaCheck /> Accept Job
                </button>
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-xl">No new requests at the moment.</p>
            <p className="text-sm mt-2">Stay online to receive notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderRequests;
