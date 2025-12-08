import React, { useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const DisputeResolution = () => {
  const [disputes, setDisputes] = useState([
    { id: 1, reporter: 'John Doe', reported: 'Ali Khan (Mechanic)', issue: 'Overcharged', status: 'Open', date: '2023-10-25', description: 'Mechanic charged 5000 PKR instead of 3000 PKR agreed upon.' },
    { id: 2, reporter: 'Jane Smith', reported: 'Bilal Ahmed (Driver)', issue: 'Late Arrival', status: 'Resolved', date: '2023-10-20', description: 'Driver was 45 minutes late.' },
    { id: 3, reporter: 'Mike Ross', reported: 'City Towing', issue: 'Vehicle Damage', status: 'In Progress', date: '2023-10-22', description: 'Scratch on bumper during towing.' },
  ]);

  const handleResolve = (id) => {
    setDisputes(disputes.map(d => d.id === id ? { ...d, status: 'Resolved' } : d));
    // API call would go here
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dispute Resolution">
        <button className="px-4 py-2 bg-white dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg transition-colors border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">Filter</button>
      </AdminPageHeader>

      <AdminTable headers={['Reporter', 'Reported User', 'Issue', 'Date', 'Status', 'Actions']}>
        {disputes.map((dispute) => (
          <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
            <td className="p-4 text-gray-900 dark:text-white font-medium">{dispute.reporter}</td>
            <td className="p-4 text-gray-700 dark:text-gray-300">{dispute.reported}</td>
            <td className="p-4">
              <div className="text-gray-900 dark:text-white">{dispute.issue}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{dispute.description}</div>
            </td>
            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{dispute.date}</td>
            <td className="p-4">
              <StatusBadge status={dispute.status} />
            </td>
            <td className="p-4 text-right">
              {dispute.status !== 'Resolved' && (
                  <button 
                      onClick={() => handleResolve(dispute.id)}
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
        ))}
      </AdminTable>
    </div>
  );
};

export default DisputeResolution;
