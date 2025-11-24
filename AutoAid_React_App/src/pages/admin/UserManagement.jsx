import React, { useState } from 'react';

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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">User Management</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 w-64"
                    />
                </div>
            </div>

            <div className="glassmorphism rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Joined</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{user.name}</div>
                                                <div className="text-xs text-gray-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${user.role === 'Vehicle Owner' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${user.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">{user.joined}</td>
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
