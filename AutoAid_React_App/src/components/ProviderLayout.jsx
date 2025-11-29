import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaClipboardList, 
  FaHardHat, 
  FaUser, 
  FaHistory, 
  FaBars, 
  FaTimes,
  FaSignOutAlt
} from 'react-icons/fa';

const ProviderLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: '/provider', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/provider/requests', label: 'Requests', icon: <FaClipboardList /> },
    { path: '/provider/active-job', label: 'Active Job', icon: <FaHardHat /> },
    { path: '/provider/history', label: 'History', icon: <FaHistory /> },
    { path: '/provider/profile', label: 'Profile', icon: <FaUser /> },
  ];

  return (
    <div className="flex h-screen bg-background-dark text-white font-display">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-surface-dark border-r border-gray-700 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">AutoAid <span className="text-sm text-gray-400">Provider</span></h1>
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
              <FaTimes size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-4">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      location.pathname === item.path || (item.path !== '/provider' && location.pathname.startsWith(item.path))
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors duration-200">
              <FaSignOutAlt className="text-xl" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header (Mobile only) */}
        <header className="lg:hidden bg-surface-dark border-b border-gray-700 p-4 flex justify-between items-center">
          <button onClick={toggleSidebar} className="text-white">
            <FaBars size={24} />
          </button>
          <span className="font-bold text-lg">Provider Portal</span>
          <div className="w-6"></div> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-dark p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
