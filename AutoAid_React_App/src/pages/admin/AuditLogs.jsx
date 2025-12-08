import React, { useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const AuditLogs = () => {
  const [logs] = useState([
    { id: 1, admin: 'Admin User', action: 'Approved Provider', target: 'Ali Khan', date: '2023-10-25 10:30 AM', details: 'Verified documents and approved application.' },
    { id: 2, admin: 'Admin User', action: 'Suspended User', target: 'Mike Ross', date: '2023-10-24 02:15 PM', details: 'Suspended due to multiple reports.' },
    { id: 3, admin: 'Super Admin', action: 'Resolved Dispute', target: 'Dispute #2', date: '2023-10-23 09:45 AM', details: 'Refund issued to user.' },
    { id: 4, admin: 'Admin User', action: 'Updated Settings', target: 'System', date: '2023-10-22 11:20 AM', details: 'Changed default commission rate.' },
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit Logs">
        <button className="px-4 py-2 bg-white dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg transition-colors border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">Export Logs</button>
      </AdminPageHeader>

      <AdminTable headers={['Date & Time', 'Admin', 'Action', 'Target', 'Details']}>
        {logs.map((log) => (
          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">{log.date}</td>
            <td className="p-4 text-gray-900 dark:text-white font-medium">{log.admin}</td>
            <td className="p-4">
              <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary border border-primary/30">
                {log.action}
              </span>
            </td>
            <td className="p-4 text-gray-700 dark:text-gray-300">{log.target}</td>
            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{log.details}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
};

export default AuditLogs;
