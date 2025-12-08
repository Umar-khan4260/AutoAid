import React, { useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Vehicle Owner', status: 'Active', joined: '2023-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Mechanic', status: 'Active', joined: '2023-02-20' },
    { id: 3, name: 'Mike Ross', email: 'mike@example.com', role: 'Driver', status: 'Suspended', joined: '2023-03-10' },
    { id: 4, name: 'Sarah Connor', email: 'sarah@example.com', role: 'Vehicle Owner', status: 'Active', joined: '2023-04-05' },
  ]);

  const handleStatusChange = (id, newStatus) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    // API call would go here
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="UserManagement">
        <div className="relative">
            <input 
                type="text" 
                placeholder="Search users..." 
                className="bg-white dark:bg-card-dark border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 w-64 shadow-sm dark:shadow-none transition-colors"
            />
        </div>
      </AdminPageHeader>

      <AdminTable headers={['User', 'Role', 'Status', 'Joined', 'Actions']}>
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
            <td className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                </div>
              </div>
            </td>
            <td className="p-4">
              <StatusBadge status={user.role} />
            </td>
            <td className="p-4">
              <StatusBadge status={user.status} />
            </td>
            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{user.joined}</td>
            <td className="p-4 text-right">
              {user.status === 'Active' ? (
                  <button 
                      onClick={() => handleStatusChange(user.id, 'Suspended')}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                      Suspend
                  </button>
              ) : (
                  <button 
                      onClick={() => handleStatusChange(user.id, 'Active')}
                      className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                  >
                      Activate
                  </button>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
};

export default UserManagement;
