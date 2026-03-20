import React from 'react';

const StatCard = ({ title, value, change, icon, color }) => (
  <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-white/10 relative overflow-hidden group hover:border-primary/50 transition-all duration-300 shadow-lg dark:shadow-none">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500`}>
      <span className="text-6xl">{icon}</span>
    </div>
    <div className="relative z-10">
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="flex items-end mt-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className={`ml-2 text-sm ${change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'} flex items-center mb-1`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      </div>
    </div>
  </div>
);

export default StatCard;
