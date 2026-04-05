import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUser, FaCar, FaClock, FaCheck, FaTimes, FaExclamationTriangle, FaIdCard, FaBriefcase, FaTag } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { io } from 'socket.io-client';

const ProviderRequests = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { success, error, info, warn } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  // Counter offer UI state: { [requestId]: { open: bool, value: string, sending: bool } }
  const [counterState, setCounterState] = useState({});

  // Fetch initial requests
  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/services/provider', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Show pending AND countered requests (driver needs to see them too)
        const active = data.requests.filter(req => ['Pending', 'Countered'].includes(req.status));
        setRequests(active);
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

      const socket = io('http://localhost:3000', { withCredentials: true });

      socket.on('connect', () => {
        socket.emit('register_provider', currentUser.uid);
      });

      socket.on('new_service_request', (data) => {
        console.log('New request received via socket:', data);
        const formattedRequest = { ...data.request, userInfo: data.user };
        setRequests(prev => {
          if (prev.find(r => r._id === formattedRequest._id)) return prev;
          return [formattedRequest, ...prev];
        });
        if (Notification.permission === 'granted') {
          new Notification('New Service Request', {
            body: `${data.user?.name || 'A user'} needs your help!`,
            icon: '/Autologo.png'
          });
        }
      });

      // Counter was accepted by user — remove from list, go to active job
      socket.on('counter_accepted', ({ requestId, finalRate }) => {
        success(`Your counter offer was accepted! Final rate: PKR ${finalRate}/hr`);
        setRequests(prev => {
          const req = prev.find(r => r._id === requestId);
          if (req) navigate('/provider/active-job', { state: { job: req } });
          return prev.filter(r => r._id !== requestId);
        });
      });

      // Counter was rejected by user
      socket.on('counter_rejected', ({ requestId }) => {
        warn('The user declined your counter offer. The request has been cancelled.');
        setRequests(prev => prev.filter(r => r._id !== requestId));
      });

      return () => { socket.disconnect(); };
    }
  }, [currentUser]);

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
        success('Request Accepted!');
        setRequests(requests.filter(req => req._id !== request._id));
        navigate('/provider/active-job', { state: { job: request } });
      } else {
        error(`Failed to accept: ${data.error}`);
      }
    } catch (err) {
      console.error("Error accepting request:", err);
      error('Network error. Failed to accept request.');
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
        success('Request rejected.');
      } else {
        error(`Failed to reject: ${data.error}`);
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      error('Network error. Failed to reject request.');
    }
  };

  const openCounterInput = (requestId) => {
    setCounterState(prev => ({ ...prev, [requestId]: { open: true, value: '', sending: false } }));
  };

  const handleCounterChange = (requestId, value) => {
    setCounterState(prev => ({ ...prev, [requestId]: { ...prev[requestId], value } }));
  };

  const handleSendCounter = async (requestId) => {
    const state = counterState[requestId];
    const rate = parseInt(state?.value, 10);
    if (!rate || rate <= 0) { warn('Please enter a valid rate.'); return; }

    setCounterState(prev => ({ ...prev, [requestId]: { ...prev[requestId], sending: true } }));
    try {
      const res = await fetch(`http://localhost:3000/api/services/request/${requestId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ counterRate: rate })
      });
      const data = await res.json();
      if (res.ok) {
        success('Counter offer sent! Waiting for user response.');
        // Update local request status to Countered so buttons update
        setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'Countered', negotiation: { ...(r.negotiation || {}), counterSent: true, counterRate: rate } } : r));
        setCounterState(prev => ({ ...prev, [requestId]: { open: false, value: '', sending: false } }));
      } else {
        error(`Error: ${data.error}`);
        setCounterState(prev => ({ ...prev, [requestId]: { ...prev[requestId], sending: false } }));
      }
    } catch (err) {
      console.error('Counter offer error:', err);
      error('Network error.');
      setCounterState(prev => ({ ...prev, [requestId]: { ...prev[requestId], sending: false } }));
    }
  };

  const calculateDistanceStr = (req) => {
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
              <DetailItem label="To" value={details.destinationLocation || details.destination} icon={FaMapMarkerAlt} />
              <div className="grid grid-cols-2 gap-2">
                <DetailItem label="Duration" value={details.drivingDuration ? `${details.drivingDuration} hr(s)` : null} icon={FaClock} />
                <DetailItem label="Offered Rate" value={request.negotiation?.offeredRate ? `PKR ${request.negotiation.offeredRate}/hr` : (details.estimatedCost ? `PKR ${details.estimatedCost} total` : null)} icon={FaTag} />
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
        {requests.map((request) => {
          const isTemporaryDriver = request.serviceType === 'Temporary Driver';
          const isCountered = request.status === 'Countered';
          const alreadyCountered = request.negotiation?.counterSent;
          const cs = counterState[request._id] || {};

          return (
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
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <FaClock /> {getTimeAgo(request.createdAt)}
                    </span>
                    {isCountered && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                        ⏳ Awaiting User Response
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-3">
                    <FaCar className="mt-1 text-gray-500" />
                    <span>
                      {request.details?.carCompany || request.details?.makeModel
                        ? `${request.details?.carCompany || ''} ${request.details?.makeModel || ''}`
                        : 'Vehicle not specified'}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="mt-1 text-gray-500" />
                    <span className="text-sm">{calculateDistanceStr(request)}</span>
                  </div>
                  {renderServiceDetails(request)}
                </div>

                {/* ── Action Buttons ── */}
                {!isCountered ? (
                  <>
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleReject(request._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                      >
                        <FaTimes /> Reject
                      </button>

                      {/* Counter Offer button — only for Temporary Driver, one time */}
                      {isTemporaryDriver && !alreadyCountered && (
                        <button
                          onClick={() => openCounterInput(request._id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-amber-500/60 text-amber-500 hover:bg-amber-500/10 transition-colors font-medium"
                        >
                          <FaTag /> Counter
                        </button>
                      )}

                      <button
                        onClick={() => handleAccept(request)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors font-bold shadow-lg shadow-primary/20"
                      >
                        <FaCheck /> {request.negotiation?.offeredRate ? `Accept Rate (PKR ${request.negotiation.offeredRate}/hr)` : 'Accept Job'}
                      </button>
                    </div>

                    {/* Inline counter input */}
                    {isTemporaryDriver && cs.open && (
                      <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide">
                          Enter your counter price (PKR / hour)
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={cs.value}
                            onChange={(e) => handleCounterChange(request._id, e.target.value)}
                            placeholder="e.g. 600"
                            className="flex-1 py-2 px-3 rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <button
                            disabled={cs.sending}
                            onClick={() => handleSendCounter(request._id)}
                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-60"
                          >
                            {cs.sending ? 'Sending…' : 'Send'}
                          </button>
                          <button
                            onClick={() => setCounterState(prev => ({ ...prev, [request._id]: { open: false, value: '', sending: false } }))}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Waiting state after counter sent */
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                      <span className="text-2xl">⏳</span>
                      <div>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          Counter Sent — PKR {request.negotiation?.counterRate}/hr
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Waiting for user to accept or reject…</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

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
