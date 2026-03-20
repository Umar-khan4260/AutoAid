import React, { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
      try {
          const response = await fetch('http://localhost:3000/api/admin/users?role=provider', {
              credentials: 'include'
          });
          const data = await response.json();
          if (data.success) {
              setUsers(data.data);
          }
      } catch (error) {
          console.error("Failed to fetch users", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchUsers();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} this user?`)) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/users/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            setUsers(users.map(u => u._id === id ? { ...u, status: newStatus } : u));
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Failed to update status", error);
        alert("Status update failed");
    }
  };

  const filteredUsers = users.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="User Management">
        <div className="relative">
            <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-card-dark border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 w-64 shadow-sm dark:shadow-none transition-colors"
            />
        </div>
      </AdminPageHeader>

      <AdminTable headers={['User', 'Role', 'Status', 'Joined', 'Actions']}>
        {loading ? (
             <tr><td colSpan="5" className="p-8 text-center text-white">Loading...</td></tr>
        ) : (
            filteredUsers.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
                <td className="p-4">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.fullName.charAt(0)}
                    </div>
                    <div>
                    <div className="text-gray-900 dark:text-white font-medium">{user.fullName}</div>
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
                <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                {user.status === 'active' ? (
                    <button 
                        onClick={() => handleStatusChange(user._id, 'suspended')}
                        className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                        Suspend
                    </button>
                ) : (
                    <button 
                        onClick={() => handleStatusChange(user._id, 'active')}
                        className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                    >
                        Activate
                    </button>
                )}
                </td>
            </tr>
            ))
        )}
         {!loading && filteredUsers.length === 0 && (
          <tr>
              <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No users found.
              </td>
          </tr>
        )}
      </AdminTable>
    </div>
  );
};

export default UserManagement;
