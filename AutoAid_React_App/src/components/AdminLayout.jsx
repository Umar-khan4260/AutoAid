import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin';

    const isActive = (path) => {
        return location.pathname === path ? 'bg-primary/20 text-primary border-r-2 border-primary' : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5';
    };

    const getPageTitle = () => {
        const titles = {
            '/admin': 'Dashboard Overview',
            '/admin/providers': 'Provider Approvals',
            '/admin/users': 'User Management',
            '/admin/disputes': 'Dispute Resolution',
            '/admin/audit-logs': 'Audit Logs',
            '/admin/contact-messages': 'Contact Messages',
            '/admin/manage-admins': 'Admin Management',
        };
        return titles[location.pathname] || 'Admin Panel';
    };

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-card-dark border-r border-gray-200 dark:border-white/10 flex flex-col transition-colors duration-300">
                <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-white/10">
                    <Link to="/" className="text-2xl font-bold gradient-text">AutoAid Admin</Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1">
                        <li>
                            <Link to="/admin" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin')}`}>
                                <span className="mr-3">📊</span>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/providers" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin/providers')}`}>
                                <span className="mr-3">🔧</span>
                                Provider Approvals
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/users" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin/users')}`}>
                                <span className="mr-3">👥</span>
                                User Management
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/disputes" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin/disputes')}`}>
                                <span className="mr-3">⚖️</span>
                                Dispute Resolution
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/audit-logs" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin/audit-logs')}`}>
                                <span className="mr-3">📝</span>
                                Audit Logs
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/contact-messages" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin/contact-messages')}`}>
                                <span className="mr-3">💬</span>
                                Contact Messages
                            </Link>
                        </li>
                        {isSuperAdmin && (
                            <li>
                                <Link to="/admin/manage-admins" className={`flex items-center px-6 py-3 transition-colors ${isActive('/admin/manage-admins')}`}>
                                    <span className="mr-3">🛡️</span>
                                    Admin Management
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                    <Link to="/" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors">
                        <span className="mr-3">🚪</span>
                        Exit Admin
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white dark:bg-card-dark border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 transition-colors duration-300">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {getPageTitle()}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm border ${isSuperAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/50' : 'bg-primary/20 text-primary border-primary/50'}`}>
                            {isSuperAdmin ? 'S' : 'A'}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{isSuperAdmin ? 'Super Admin' : 'Admin User'}</span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark transition-colors duration-300">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
