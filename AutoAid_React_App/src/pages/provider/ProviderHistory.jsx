import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaStar, FaMoneyBillWave, FaSearch, FaFilter } from 'react-icons/fa';

const ProviderHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/services/provider', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            // Filter out 'Pending' requests to show actual history
            const pastRequests = data.requests.filter(req => req.status !== 'Pending');
            setHistory(pastRequests);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
      switch (status) {
          case 'Completed': return 'bg-green-500/20 text-green-600 dark:text-green-400';
          case 'Accepted': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
          case 'Rejected': return 'bg-red-500/20 text-red-600 dark:text-red-400';
          default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job History</h1>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Search history..." 
              className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <button className="bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:border-primary dark:hover:border-gray-500 transition-colors">
            <FaFilter />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4">Job ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Service</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No job history found.</td>
                </tr>
              ) : (
                history.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">#{job._id.slice(-6).toUpperCase()}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400 dark:text-gray-600" /> {formatDate(job.createdAt)}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">{job.serviceType}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{job.userInfo?.name || 'User'}</td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-bold">TBD</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProviderHistory;
