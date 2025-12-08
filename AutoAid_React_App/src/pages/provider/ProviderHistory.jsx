import React from 'react';
import { FaCalendarAlt, FaStar, FaMoneyBillWave, FaSearch, FaFilter } from 'react-icons/fa';

const ProviderHistory = () => {
  const history = [
    {
      id: 'JOB-12340',
      date: '2023-11-28',
      service: 'Towing Service',
      customer: 'Usman Ali',
      amount: 'PKR 2,500',
      rating: 5,
      status: 'Completed'
    },
    {
      id: 'JOB-12339',
      date: '2023-11-27',
      service: 'Jumpstart',
      customer: 'Fatima Bibi',
      amount: 'PKR 1,000',
      rating: 4,
      status: 'Completed'
    },
    {
      id: 'JOB-12338',
      date: '2023-11-26',
      service: 'Fuel Delivery',
      customer: 'Kamran Khan',
      amount: 'PKR 800',
      rating: 5,
      status: 'Completed'
    },
    {
      id: 'JOB-12337',
      date: '2023-11-25',
      service: 'Breakdown Repair',
      customer: 'Sara Ahmed',
      amount: 'PKR 3,500',
      rating: 5,
      status: 'Completed'
    },
  ];

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
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{job.id}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400 dark:text-gray-600" /> {job.date}
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">{job.service}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">{job.customer}</td>
                  <td className="p-4 text-green-600 dark:text-green-400 font-bold">{job.amount}</td>
                  <td className="p-4">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < job.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
          <button className="text-primary hover:text-primary-light font-medium transition-colors">
            Load More History
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderHistory;
