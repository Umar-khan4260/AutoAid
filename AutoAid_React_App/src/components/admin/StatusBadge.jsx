import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    
    if (['active', 'approved', 'resolved', 'completed'].includes(lowerStatus)) {
      return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
    }
    if (['pending', 'in progress', 'open', 'review'].includes(lowerStatus)) {
      return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
    }
    if (['suspended', 'rejected', 'banned', 'closed'].includes(lowerStatus)) {
      return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
    }
    if (['mechanic', 'vehicle owner'].includes(lowerStatus)) { // Role badges
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
    }
    if (['driver', 'towing'].includes(lowerStatus)) { // Role badges
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    }
    
    return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
  };

  return (
    <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
