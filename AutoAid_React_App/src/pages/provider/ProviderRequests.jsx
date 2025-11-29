import React, { useState } from 'react';
import { FaMapMarkerAlt, FaUser, FaCar, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

const ProviderRequests = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      user: 'Ahmed Khan',
      service: 'Breakdown Repair',
      vehicle: 'Honda Civic 2019',
      location: 'Main Boulevard, Gulberg III, Lahore',
      distance: '2.5 km',
      time: '5 mins ago',
      issue: 'Engine overheating, smoke coming from hood.',
    },
    {
      id: 2,
      user: 'Sarah Ali',
      service: 'Flat Tire',
      vehicle: 'Toyota Yaris 2021',
      location: 'DHA Phase 5, Lahore',
      distance: '4.8 km',
      time: '12 mins ago',
      issue: 'Front right tire flat, spare wheel available.',
    },
    {
      id: 3,
      user: 'Bilal Ahmed',
      service: 'Fuel Delivery',
      vehicle: 'Suzuki Alto 2022',
      location: 'Canal Road, Near PU, Lahore',
      distance: '1.2 km',
      time: 'Just now',
      issue: 'Out of fuel, need 5 liters of Petrol.',
    },
  ]);

  const handleAccept = (id) => {
    // Logic to accept request
    console.log(`Accepted request ${id}`);
    setRequests(requests.filter(req => req.id !== id));
  };

  const handleReject = (id) => {
    // Logic to reject request
    console.log(`Rejected request ${id}`);
    setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Incoming Requests</h1>
        <span className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold">
          {requests.length} New Requests
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((request) => (
          <div key={request.id} className="bg-surface-dark rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:border-primary/50 transition-all duration-300">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl text-gray-300">
                    <FaUser />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{request.user}</h3>
                    <p className="text-primary font-medium">{request.service}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <FaClock /> {request.time}
                </span>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="flex items-start gap-3">
                  <FaCar className="mt-1 text-gray-500" />
                  <span>{request.vehicle}</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="mt-1 text-gray-500" />
                  <span>{request.location} <span className="text-primary text-sm ml-2">({request.distance})</span></span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-sm text-gray-400 mt-2">
                  <span className="font-semibold text-gray-300">Issue:</span> {request.issue}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-700">
                <button 
                  onClick={() => handleReject(request.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                >
                  <FaTimes /> Reject
                </button>
                <button 
                  onClick={() => handleAccept(request.id)}
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
