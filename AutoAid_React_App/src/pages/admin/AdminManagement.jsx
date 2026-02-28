import React, { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    const fetchAdmins = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/admins', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setAdmins(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newAdminEmail }),
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                setAdmins([data.data, ...admins]);
                setNewAdminEmail('');
                setShowAddModal(false);
            } else {
                setAddError(data.error || 'Failed to add admin');
            }
        } catch (error) {
            console.error("Failed to add admin", error);
            setAddError('Network error. Please try again.');
        } finally {
            setAddLoading(false);
        }
    };

    const handleRemoveAdmin = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove "${name}" as admin? They will be demoted to a regular user.`)) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/admins/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                setAdmins(admins.filter(a => a._id !== id));
            } else {
                alert(data.error || 'Failed to remove admin');
            }
        } catch (error) {
            console.error("Failed to remove admin", error);
            alert('Network error. Please try again.');
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Admin Management">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white dark:bg-card-dark border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 w-64 shadow-sm dark:shadow-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => { setShowAddModal(true); setAddError(''); setNewAdminEmail(''); }}
                        className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-md"
                    >
                        <span>+</span>
                        <span>Add Admin</span>
                    </button>
                </div>
            </AdminPageHeader>

            <AdminTable headers={['Admin', 'Email', 'Status', 'Joined', 'Actions']}>
                {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-white">Loading...</td></tr>
                ) : (
                    filteredAdmins.map((admin) => (
                        <tr key={admin._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
                            <td className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                        {admin.fullName.charAt(0)}
                                    </div>
                                    <div className="text-gray-900 dark:text-white font-medium">{admin.fullName}</div>
                                </div>
                            </td>
                            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{admin.email}</td>
                            <td className="p-4">
                                <StatusBadge status={admin.status} />
                            </td>
                            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(admin.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => handleRemoveAdmin(admin._id, admin.fullName)}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                                >
                                    Remove Admin
                                </button>
                            </td>
                        </tr>
                    ))
                )}
                {!loading && filteredAdmins.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No admins found.
                        </td>
                    </tr>
                )}
            </AdminTable>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Admin</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddAdmin}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    User Email
                                </label>
                                <input
                                    type="email"
                                    value={newAdminEmail}
                                    onChange={(e) => { setNewAdminEmail(e.target.value); setAddError(''); }}
                                    placeholder="Enter user's email address"
                                    required
                                    className="w-full bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    The user must already have a registered account. They will be promoted to admin role.
                                </p>
                            </div>

                            {addError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {addError}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addLoading}
                                    className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    {addLoading ? 'Adding...' : 'Add Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
