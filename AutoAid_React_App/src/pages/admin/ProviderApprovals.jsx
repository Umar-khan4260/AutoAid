import React, { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const ProviderApprovals = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null); // For modal

  const fetchProviders = async () => {
      try {
          const response = await fetch('http://localhost:3000/api/admin/providers/pending', {
              credentials: 'include'
          });
          const data = await response.json();
          if (data.success) {
              setProviders(data.data);
          }
      } catch (error) {
          console.error("Failed to fetch providers", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchProviders();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/providers/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            setProviders(providers.filter(p => p._id !== id));
            alert(status === 'active' ? 'Provider Approved' : 'Provider Rejected');
            if (selectedProvider && selectedProvider._id === id) {
                setSelectedProvider(null);
            }
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Failed to update status", error);
        alert("Failed to update status");
    }
  };

  const handleApprove = (id) => handleStatusUpdate(id, 'active');
  const handleReject = (id) => handleStatusUpdate(id, 'suspended');

  const openModal = (provider) => {
      setSelectedProvider(provider);
  };

  const closeModal = () => {
      setSelectedProvider(null);
  };

  return (
    <div className="space-y-6 relative">
      <AdminPageHeader title="Provider Approvals">
        <button className="px-4 py-2 bg-white dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg transition-colors border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">Filter</button>
      </AdminPageHeader>

      <AdminTable headers={['Provider', 'Type', 'Location', 'Date Applied', 'Details', 'Actions']}>
        {loading ? (
            <tr><td colSpan="6" className="p-8 text-center text-white">Loading...</td></tr>
        ) : (
            providers.map((provider) => (
            <tr key={provider._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
                <td className="p-4">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {provider.fullName.charAt(0)}
                    </div>
                    <div>
                        <span className="text-gray-900 dark:text-white font-medium block">{provider.fullName}</span>
                        <span className="text-xs text-text-muted">{provider.email}</span>
                    </div>
                </div>
                </td>
                <td className="p-4">
                <StatusBadge status={provider.providerDetails?.serviceType || 'N/A'} />
                </td>
                <td className="p-4 text-gray-700 dark:text-gray-300">Lahore</td> {/* Location mocked for now as it's not in schema explicitly yet */}
                <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(provider.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                     <button onClick={() => openModal(provider)} className="text-sm text-primary underline hover:text-primary/80">View Details</button>
                </td>
                <td className="p-4 text-right space-x-2">
                <button 
                    onClick={() => handleApprove(provider._id)}
                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors border border-green-500/30 text-sm"
                >
                    Approve
                </button>
                <button 
                    onClick={() => handleReject(provider._id)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors border border-red-500/30 text-sm"
                >
                    Reject
                </button>
                </td>
            </tr>
            ))
        )}
        {!loading && providers.length === 0 && (
          <tr>
              <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No pending approvals found.
              </td>
          </tr>
        )}
      </AdminTable>

      {/* Modal Overlay */}
      {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-card-dark border border-border-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border-dark flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Provider Details</h3>
                      <button onClick={closeModal} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                           <div><strong>Full Name:</strong> {selectedProvider.fullName}</div>
                           <div><strong>Email:</strong> {selectedProvider.email}</div>
                           <div><strong>Phone:</strong> {selectedProvider.contactNumber}</div>
                           <div><strong>Service:</strong> {selectedProvider.providerDetails?.serviceType}</div>
                           <div><strong>Age:</strong> {selectedProvider.providerDetails?.age}</div>
                           <div><strong>Gender:</strong> {selectedProvider.providerDetails?.gender}</div>
                           <div><strong>Vehicle:</strong> {selectedProvider.providerDetails?.vehicleDetails?.make} {selectedProvider.providerDetails?.vehicleDetails?.model} ({selectedProvider.providerDetails?.vehicleDetails?.number})</div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="font-semibold text-white border-b border-white/10 pb-2">Documents</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedProvider.providerDetails?.profileImage && (
                                  <div>
                                      <p className="text-xs text-gray-400 mb-1">Profile Image</p>
                                      <img src={`http://localhost:3000/${selectedProvider.providerDetails.profileImage.replace(/\\/g, '/')}`} alt="Profile" className="w-full h-40 object-cover rounded border border-white/10" />
                                  </div>
                              )}
                              {selectedProvider.providerDetails?.cnicImage && (
                                  <div>
                                       <p className="text-xs text-gray-400 mb-1">CNIC</p>
                                      <img src={`http://localhost:3000/${selectedProvider.providerDetails.cnicImage.replace(/\\/g, '/')}`} alt="CNIC" className="w-full h-40 object-cover rounded border border-white/10" />
                                  </div>
                              )}
                              {selectedProvider.providerDetails?.licenseImage && (
                                  <div>
                                       <p className="text-xs text-gray-400 mb-1">License</p>
                                      <img src={`http://localhost:3000/${selectedProvider.providerDetails.licenseImage.replace(/\\/g, '/')}`} alt="License" className="w-full h-40 object-cover rounded border border-white/10" />
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-border-dark flex justify-end gap-3">
                       <button onClick={closeModal} className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-white/5">Close</button>
                       <button onClick={() => handleApprove(selectedProvider._id)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded">Approve</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ProviderApprovals;
