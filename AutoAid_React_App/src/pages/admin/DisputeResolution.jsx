import React, { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const DisputeResolution = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/disputes', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setDisputes(data.data);
      } else {
        setError(data.error || 'Failed to fetch disputes');
      }
    } catch (err) {
      console.error('Failed to fetch disputes', err);
      setError('A network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id) => {
    if (!window.confirm('Are you sure you want to mark this dispute as resolved?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/disputes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Resolved' }),
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setDisputes(disputes.map(d => d._id === id ? { ...d, status: 'Resolved' } : d));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to resolve dispute', err);
      alert('An error occurred during resolution');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dispute Resolution">
        <button 
          onClick={fetchDisputes}
          className="px-4 py-2 bg-white dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg transition-colors border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none"
        >
          Refresh
        </button>
      </AdminPageHeader>

      <AdminTable headers={['Reporter', 'Reported User', 'Service', 'Issue', 'Date', 'Status', 'Actions']}>
        {loading ? (
          <tr><td colSpan="7" className="p-8 text-center text-white">Loading...</td></tr>
        ) : error ? (
          <tr><td colSpan="7" className="p-8 text-center text-red-400">{error}</td></tr>
        ) : disputes.length === 0 ? (
          <tr><td colSpan="7" className="p-8 text-center text-gray-500">No disputes found.</td></tr>
        ) : (
          disputes.map((dispute) => (
            <tr key={dispute._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
              <td className="p-4">
                <div className="text-gray-900 dark:text-white font-medium">
                  {dispute.userId?.fullName || 'Unknown User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dispute.userId?.email || dispute.userId || 'N/A'}
                </div>
              </td>
              <td className="p-4 text-gray-700 dark:text-gray-300">
                <div className="text-gray-900 dark:text-white font-medium">
                   {dispute.providerId?.fullName || 'Unknown Provider'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dispute.providerId?.email || dispute.providerId || 'N/A'}
                </div>
              </td>
              <td className="p-4 text-gray-700 dark:text-gray-300">
                <StatusBadge status={dispute.serviceType || 'N/A'} type="role" />
              </td>
              <td className="p-4">
                <div className="text-gray-900 dark:text-white">{dispute.reason}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{dispute.description}</div>
                {dispute.proofImage && (
                  <a 
                    href={`http://localhost:3000/${dispute.proofImage}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline block mt-1"
                  >
                    View Proof
                  </a>
                )}
              </td>
              <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                {new Date(dispute.timestamp).toLocaleDateString()}
              </td>
              <td className="p-4">
                <StatusBadge status={dispute.status} />
              </td>
              <td className="p-4 text-right">
                {dispute.status !== 'Resolved' && (
                    <button 
                        onClick={() => handleResolve(dispute._id)}
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors border border-blue-500/30 text-sm"
                    >
                        Mark Resolved
                    </button>
                )}
                {dispute.status === 'Resolved' && (
                    <span className="text-gray-500 text-sm italic">No actions</span>
                )}
              </td>
            </tr>
          ))
        )}
      </AdminTable>
    </div>
  );
};

export default DisputeResolution;
