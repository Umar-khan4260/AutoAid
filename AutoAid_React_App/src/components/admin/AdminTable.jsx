import React from 'react';

const AdminTable = ({ headers, children }) => {
  return (
    <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-none transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
              {headers.map((header, index) => (
                <th key={index} className={`p-4 font-medium ${index === headers.length - 1 ? 'text-right' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
