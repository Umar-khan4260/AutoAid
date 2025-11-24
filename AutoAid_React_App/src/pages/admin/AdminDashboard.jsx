import React from 'react';

const StatCard = ({ title, value, change, icon, color }) => (
    <div className="glassmorphism p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500`}>
            <span className="text-6xl">{icon}</span>
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <div className="flex items-end mt-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className={`ml-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center mb-1`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                </span>
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    // Mock data
    const stats = [
        { title: 'Total Users', value: '12,345', change: 12, icon: '👥', color: 'blue' },
        { title: 'Active Providers', value: '1,234', change: 5, icon: '🔧', color: 'green' },
        { title: 'Pending Approvals', value: '45', change: -2, icon: '⏳', color: 'yellow' },
        { title: 'Active Disputes', value: '8', change: 0, icon: '⚖️', color: 'red' },
    ];

    const recentActivity = [
        { id: 1, user: 'John Doe', action: 'Registered as Mechanic', time: '2 mins ago', status: 'Pending' },
        { id: 2, user: 'Jane Smith', action: 'Requested Towing', time: '15 mins ago', status: 'Completed' },
        { id: 3, user: 'Mike Ross', action: 'Uploaded Documents', time: '1 hour ago', status: 'Review' },
        { id: 4, user: 'Sarah Connor', action: 'Reported Issue', time: '2 hours ago', status: 'Open' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area (Mock) */}
                <div className="lg:col-span-2 glassmorphism rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Platform Activity</h3>
                    <div className="h-64 flex items-end justify-between space-x-2 px-4">
                        {/* Simple CSS Bar Chart Mock */}
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((height, i) => (
                            <div key={i} className="w-full bg-primary/20 rounded-t hover:bg-primary/40 transition-colors relative group" style={{ height: `${height}%` }}>
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {height}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="glassmorphism rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start space-x-3 pb-3 border-b border-white/5 last:border-0">
                                <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                                <div>
                                    <p className="text-sm text-white font-medium">{item.user}</p>
                                    <p className="text-xs text-gray-400">{item.action}</p>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-[10px] text-gray-500">{item.time}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                item.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                                    item.status === 'Review' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-red-500/20 text-red-400'
                                            }`}>{item.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
