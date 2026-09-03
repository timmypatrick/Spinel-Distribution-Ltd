import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Filter, Search } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(actionFilter || undefined);
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Security & Mutation Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically structured immutable ledger of all administrative and privileged actions
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 text-xs">
        <span className="text-slate-400 font-semibold">Filter by Action:</span>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value="">All Security Events</option>
          <option value="AUTH_LOGIN">AUTH_LOGIN</option>
          <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
          <option value="INVENTORY_ADJUST">INVENTORY_ADJUST</option>
          <option value="ORDER_STATUS_CHANGE">ORDER_STATUS_CHANGE</option>
          <option value="IMPORT_JOB_CREATE">IMPORT_JOB_CREATE</option>
          <option value="ROLE_UPDATE">ROLE_UPDATE</option>
          <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
        </select>
        <span className="text-slate-500 font-mono ml-auto">
          {logs.length} logged events
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Entity</th>
              <th className="p-3.5">IP Address</th>
              <th className="p-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="p-4">
                    <div className="h-4 bg-slate-800 rounded" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No security audit logs recorded matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-800 text-amber-400 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-white font-medium">{log.user_email}</td>
                  <td className="p-3.5 text-slate-400">
                    {log.entity_type} {log.entity_id && `(${log.entity_id})`}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.ip_address}</td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
