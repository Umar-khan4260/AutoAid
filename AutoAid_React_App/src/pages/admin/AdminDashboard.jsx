import React, { useState, useEffect } from 'react';
import StatCard from '../../components/admin/StatCard';
import { FaUsers, FaTools, FaHourglassHalf, FaBalanceScale } from 'react-icons/fa';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState({
        totalUsers: 0,
        activeProviders: 0,
        pendingApprovals: 0,
        activeDisputes: 0
    });
    const [distributionData, setDistributionData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [period, setPeriod] = useState('this-month');
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/stats', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) setStatsData(data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDistribution = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/service-distribution?period=${period}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) setDistributionData(data.data);
        } catch (error) {
            console.error('Error fetching distribution:', error);
        }
    };

    const fetchTrend = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/service-trend', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) setTrendData(data.data);
        } catch (error) {
            console.error('Error fetching trend:', error);
        }
    };

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            await Promise.all([fetchStats(), fetchDistribution(), fetchTrend()]);
            setLoading(false);
        };
        loadDashboard();
    }, [period]);

    const stats = [
        { title: 'Total Users', value: loading ? '...' : statsData.totalUsers.toLocaleString(), change: 12, icon: <FaUsers />, color: 'blue' },
        { title: 'Active Providers', value: loading ? '...' : statsData.activeProviders.toLocaleString(), change: 5, icon: <FaTools />, color: 'green' },
        { title: 'Pending Approvals', value: loading ? '...' : statsData.pendingApprovals.toLocaleString(), change: -2, icon: <FaHourglassHalf />, color: 'yellow' },
        { title: 'Active Disputes', value: loading ? '...' : statsData.activeDisputes.toLocaleString(), change: 0, icon: <FaBalanceScale />, color: 'red' },
    ];

    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 border border-white/10 p-2 rounded shadow-lg text-white text-xs">
                    <p className="font-semibold">{`${payload[0].name}`}</p>
                    <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                    <p className="text-gray-400">{`${((payload[0].value / distributionData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service Requests Trend Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-lg transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Service Requests Trend</h3>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading Chart...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="#888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        contentStyle={{ backgroundColor: '#1a1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#8b5cf6' }}
                                    />
                                    <Bar 
                                        dataKey="count" 
                                        fill="#8b5cf6" 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={30}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Service Distribution Pie Chart */}
                <div className="bg-white dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-lg transition-colors duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribution</h3>
                        <select 
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-white dark:bg-[#1a1c1e] border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                        >
                            <option value="this-month" className="bg-white dark:bg-[#1a1c1e] text-gray-700 dark:text-white">This Month</option>
                            <option value="last-month" className="bg-white dark:bg-[#1a1c1e] text-gray-700 dark:text-white">Last Month</option>
                            <option value="last-6-months" className="bg-white dark:bg-[#1a1c1e] text-gray-700 dark:text-white">Last 6 Months</option>
                            <option value="overall" className="bg-white dark:bg-[#1a1c1e] text-gray-700 dark:text-white">Overall</option>
                        </select>
                    </div>

                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading Chart...</div>
                        ) : distributionData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomPieTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center"
                                        iconType="circle"
                                        layout="horizontal"
                                        formatter={(value) => <span className="text-[10px] text-gray-500 dark:text-gray-400">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
