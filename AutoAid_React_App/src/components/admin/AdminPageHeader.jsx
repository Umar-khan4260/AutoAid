import React from 'react';

const AdminPageHeader = ({ title, children }) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="flex space-x-2">
        {children}
      </div>
    </div>
  );
};

export default AdminPageHeader;
