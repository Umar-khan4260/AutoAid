import React, { useState } from 'react';
import { FaWallet, FaCheckCircle, FaStar, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const ProviderDashboard = () => {
  const [isAvailable, setIsAvailable] = useState(true);

  const stats = [
    { label: 'Total Earnings', value: 'PKR 45,200', icon: <FaWallet />, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Jobs Completed', value: '28', icon: <FaCheckCircle />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Average Rating', value: '4.8', icon: <FaStar />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  const recentActivity = [
    { id: 1, type: 'Job Completed', detail: 'Towing Service for Honda Civic', time: '2 hours ago', amount: '+ PKR 2,500' },
    { id: 2, type: 'Job Completed', detail: 'Jumpstart for Toyota Corolla', time: '5 hours ago', amount: '+ PKR 1,000' },
    { id: 3, type: 'Payout', detail: 'Weekly Payout to Bank Account', time: '1 day ago', amount: '- PKR 15,000' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, Ali Mechanic</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
          <span className={`text-sm font-medium ${isAvailable ? 'text-green-500' : 'text-gray-500'}`}>
            {isAvailable ? 'You are Online' : 'You are Offline'}
          </span>
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`text-3xl transition-colors duration-300 ${isAvailable ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {isAvailable ? <FaToggleOn /> : <FaToggleOff />}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:border-primary/50 transition-colors duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{activity.type}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.detail}</p>
                <span className="text-xs text-gray-500 mt-1 block sm:hidden">{activity.time}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`font-bold ${activity.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {activity.amount}
                </span>
                <span className="text-xs text-gray-500 hidden sm:block">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
          <button className="text-primary hover:text-primary-light text-sm font-medium transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
