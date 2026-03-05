import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPhoneAlt, FaCommentAlt, FaMapMarkerAlt, FaCheckCircle, FaLocationArrow, FaArrowLeft } from 'react-icons/fa';

const ProviderActiveJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job;

  const [jobStatus, setJobStatus] = useState('accepted'); // accepted, on_way, arrived, working, completed

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 mt-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">No Active Job Found</h2>
        <button 
          onClick={() => navigate('/provider/requests')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FaArrowLeft /> View New Requests
        </button>
      </div>
    );
  }

  // Map the real request data to our UI
  const displayJob = {
    id: job.requestId || job._id?.slice(-6).toUpperCase(),
    user: job.userInfo?.name || 'Customer',
    phone: job.contactNumber || job.userInfo?.contactNumber || 'Not provided',
    service: job.serviceType,
    vehicle: job.details?.vehicleMake || job.details?.vehicleModel ? 
             `${job.details.vehicleMake || ''} ${job.details.vehicleModel || ''}` : 'Vehicle Unspecified',
    location: job.userLocation ? `Lat: ${job.userLocation.lat.toFixed(4)}, Lng: ${job.userLocation.lng.toFixed(4)}` : 'Location not provided',
    issue: job.details?.issueDescription || 'No details provided',
    amount: 'TBD upon inspection'
  };

  const steps = [
    { id: 'accepted', label: 'Job Accepted' },
    { id: 'on_way', label: 'On the Way' },
    { id: 'arrived', label: 'Arrived' },
    { id: 'working', label: 'Work in Progress' },
    { id: 'completed', label: 'Completed' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === jobStatus);

  const handleStatusUpdate = () => {
    if (currentStepIndex < steps.length - 1) {
      setJobStatus(steps[currentStepIndex + 1].id);
    }
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
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors font-medium">
                <FaPhoneAlt /> Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium">
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
                <label className="text-xs text-gray-500">Location</label>
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
            {jobStatus !== 'completed' ? (
              <button 
                onClick={handleStatusUpdate}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Mark as {steps[currentStepIndex + 1]?.label}
              </button>
            ) : (
              <div className="text-center py-4 text-green-500 dark:text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                <FaCheckCircle /> Job Completed
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Map & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Map Placeholder */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 min-h-[400px] relative overflow-hidden group transition-colors duration-300">
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <FaLocationArrow className="text-6xl text-gray-400 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">Map Integration Placeholder</p>
                <p className="text-sm text-gray-600">Real-time tracking would be displayed here</p>
              </div>
            </div>
            {/* Overlay Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className="bg-white dark:bg-surface-dark p-3 rounded-lg text-gray-700 dark:text-white shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FaLocationArrow />
              </button>
            </div>
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
