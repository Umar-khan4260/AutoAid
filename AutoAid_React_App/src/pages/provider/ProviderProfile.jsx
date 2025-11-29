import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaToolbox, FaIdCard, FaEdit, FaSave } from 'react-icons/fa';

const ProviderProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Ali Mechanic',
    email: 'ali.mechanic@example.com',
    phone: '+92 300 1234567',
    location: 'Gulberg III, Lahore',
    services: ['Breakdown Repair', 'Jumpstart', 'Tire Change'],
    documents: [
      { name: 'CNIC', status: 'Verified' },
      { name: 'Driving License', status: 'Verified' },
      { name: 'Workshop Registration', status: 'Pending' }
    ]
  });

  const handleSave = () => {
    setIsEditing(false);
    // Logic to save profile updates
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-colors ${
            isEditing 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-primary hover:bg-primary-dark text-white'
          }`}
        >
          {isEditing ? <><FaSave /> Save Changes</> : <><FaEdit /> Edit Profile</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-dark rounded-xl border border-gray-700 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FaUser className="text-primary" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-white font-medium text-lg">{profile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Email Address</label>
                <div className="flex items-center gap-2 text-gray-300">
                  <FaEnvelope className="text-gray-500" />
                  {profile.email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    <FaPhone className="text-gray-500" /> {profile.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Base Location</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-500" /> {profile.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-surface-dark rounded-xl border border-gray-700 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FaToolbox className="text-primary" /> Services Offered
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.services.map((service, index) => (
                <span key={index} className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full border border-gray-600">
                  {service}
                </span>
              ))}
              {isEditing && (
                <button className="bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/50 hover:bg-primary/30 transition-colors">
                  + Add Service
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents & Verification */}
        <div className="lg:col-span-1">
          <div className="bg-surface-dark rounded-xl border border-gray-700 p-6 shadow-lg h-full">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FaIdCard className="text-primary" /> Verification
            </h3>
            
            <div className="space-y-4">
              {profile.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <p className="text-white font-medium">{doc.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                      doc.status === 'Verified' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <button className="text-sm text-primary hover:text-primary-light underline">
                    View
                  </button>
                </div>
              ))}
              
              <button className="w-full py-3 mt-4 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-primary hover:text-primary transition-colors">
                Upload New Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
