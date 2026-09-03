import React, { useState, useEffect } from 'react';
import { Users, Shield, ShieldAlert, CheckCircle2, XCircle, X } from 'lucide-react';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit user role modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<Role>('customer');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenRoleModal = (u: User) => {
    setSelectedUser(u);
    setNewRole(u.roles[0] || 'customer');
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    try {
      await api.updateUserRole(selectedUser.id, newRole);
      success(`Updated role for ${selectedUser.email} to ${newRole}`);
      setSelectedUser(null);
      loadUsers();
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'catalog_manager':
      case 'inventory_manager':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'order_manager':
      case 'customer_support':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Accounts & RBAC Roles</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-Based Access Control matrix with server-side privilege escalation protection
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5 text-center">System Role</th>
              <th className="p-3.5 text-center">Active</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="p-4">
                    <div className="h-4 bg-slate-800 rounded" />
                  </td>
                </tr>
              ))
            ) : (
              users.map((u) => (
                <tr key={u.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="p-3.5 font-semibold text-white">
                    {u.first_name} {u.last_name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-[10px] text-amber-400 font-mono">(You)</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400">{u.email}</td>
                  <td className="p-3.5 text-slate-400">{u.phone || 'N/A'}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadge(u.roles[0] || 'customer')}`}>
                      {(u.roles[0] || 'customer').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="text-emerald-400 font-bold text-[10px]">Active</span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleOpenRoleModal(u)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px]"
                    >
                      Change Role
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role Changer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-xs">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Modify Role for {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Privilege Escalation Protection</span>
                </div>
                <p>
                  Only administrators with `users:manage` permissions may assign elevated roles. Non-super-admins cannot elevate another user to super_admin.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assign Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-bold focus:ring-1 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="customer">Customer (Storefront Only)</option>
                  <option value="customer_support">Customer Support (Read-Only Ops)</option>
                  <option value="order_manager">Order Manager (Fulfillment & Invoicing)</option>
                  <option value="inventory_manager">Inventory Manager (Stock Adjustments)</option>
                  <option value="catalog_manager">Catalog Manager (Products & Excel Imports)</option>
                  <option value="admin">Administrator (Full Operations)</option>
                  <option value="super_admin">Super Administrator (Full System Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded shadow"
                >
                  {saving ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
