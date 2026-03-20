import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaToolbox, FaIdCard, FaEdit, FaSave } from 'react-icons/fa';

const ProviderProfile = () => {
  const { currentUser, fetchUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    services: [],
    documents: []
  });

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.contactNumber || '',
        location: currentUser.location || '',
        services: currentUser.providerDetails?.serviceType ? currentUser.providerDetails.serviceType.split(',').map(s => s.trim()) : [],
        documents: [
          { name: 'Profile Picture', status: currentUser.providerDetails?.profileImage ? 'Uploaded' : 'Pending', path: currentUser.providerDetails?.profileImage },
          { name: 'CNIC', status: currentUser.providerDetails?.cnicImage ? 'Uploaded' : 'Pending', path: currentUser.providerDetails?.cnicImage },
          { name: 'Driving License', status: currentUser.providerDetails?.licenseImage ? 'Uploaded' : 'Pending', path: currentUser.providerDetails?.licenseImage },
        ]
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    setIsEditing(false);
    try {
        const response = await fetch('http://localhost:3000/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName: profile.name,
                contactNumber: profile.phone,
                location: profile.location,
                services: profile.services
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
            // Refresh context data
            await fetchUserProfile(currentUser); 
            alert('Profile updated successfully!');
        } else {
            alert('Failed to update profile: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating profile');
    }
  };
  
  const handleServiceChange = (e) => {
      // Allow comma separated input for now or just single text
      const val = e.target.value;
      setProfile({...profile, services: val.split(',').map(s => s.trim())});
  };

  if (!currentUser) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
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
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FaUser className="text-primary" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium text-lg">{profile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Email Address</label>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaEnvelope className="text-gray-500" />
                  {profile.email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                    <FaPhone className="text-gray-500" /> {profile.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Base Location</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    placeholder="e.g. Gulberg III, Lahore"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-500" /> {profile.location || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FaToolbox className="text-primary" /> Services Offered
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.services.length > 0 ? profile.services.map((service, index) => (
                <span key={index} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600">
                  {service}
                </span>
              )) : <p className="text-gray-500">No services listed.</p>}
              
              {isEditing && (
                 <input 
                    type="text"
                    placeholder="Add services (comma separated)"
                    value={profile.services.join(', ')}
                    onChange={handleServiceChange}
                    className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                 />
              )}
            </div>
          </div>
        </div>

        {/* Documents & Verification */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg h-full transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FaIdCard className="text-primary" /> Verification
            </h3>
            
            <div className="space-y-4">
              {profile.documents.map((doc, index) => (
                <div key={index} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                     <p className="text-gray-900 dark:text-white font-medium">{doc.name}</p>
                     <span className={`text-xs px-2 py-1 rounded-full ${
                       doc.status === 'Verified' || doc.status === 'Uploaded'
                         ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                         : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                     }`}>
                       {doc.status}
                     </span>
                  </div>
                  {doc.path ? (
                      <a href={`http://localhost:3000${doc.path}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-primary-light underline">
                        View Document
                      </a>
                  ) : (
                      <span className="text-xs text-gray-500">No file uploaded</span>
                  )}
                </div>
              ))}
              
              <button disabled className="w-full py-3 mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 rounded-lg cursor-not-allowed">
                Upload New Document (Contact Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
