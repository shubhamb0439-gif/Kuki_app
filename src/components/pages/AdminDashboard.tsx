import React, { useState, useEffect } from 'react';
import { Users, Briefcase, TrendingUp, Activity, Plus, Edit2, Trash2, Save, X, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';

interface DashboardStats {
  totalUsers: number;
  totalEmployees: number;
  totalEmployers: number;
  activeJobPosts: number;
  totalApplications: number;
  activeApplications: number;
}

interface JobRole {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminDashboardProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function AdminDashboard({ onReferFriend, onMessages }: AdminDashboardProps) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEmployees: 0,
    totalEmployers: 0,
    activeJobPosts: 0,
    totalApplications: 0,
    activeApplications: 0
  });
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editRole, setEditRole] = useState({ name: '', description: '' });

  useEffect(() => {
    if (user) {
      loadStats();
      loadJobRoles();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [usersRes, employeesRes, employersRes, jobPostsRes, applicationsRes, activeAppsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employee'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employer'),
        supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalEmployees: employeesRes.count || 0,
        totalEmployers: employersRes.count || 0,
        activeJobPosts: jobPostsRes.count || 0,
        totalApplications: applicationsRes.count || 0,
        activeApplications: activeAppsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setJobRoles(data);
      }
    } catch (error) {
      console.error('Error loading job roles:', error);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name.trim()) return;

    try {
      const { error } = await supabase
        .from('job_roles')
        .insert([{
          name: newRole.name.trim(),
          description: newRole.description.trim() || null,
          is_active: true
        }]);

      if (!error) {
        setNewRole({ name: '', description: '' });
        setIsAddingRole(false);
        loadJobRoles();
      }
    } catch (error) {
      console.error('Error adding job role:', error);
    }
  };

  const handleUpdateRole = async (id: string) => {
    if (!editRole.name.trim()) return;

    try {
      const { error } = await supabase
        .from('job_roles')
        .update({
          name: editRole.name.trim(),
          description: editRole.description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        setEditingRole(null);
        loadJobRoles();
      }
    } catch (error) {
      console.error('Error updating job role:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('job_roles')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        loadJobRoles();
      }
    } catch (error) {
      console.error('Error toggling job role status:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job role? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('job_roles')
        .delete()
        .eq('id', id);

      if (!error) {
        loadJobRoles();
      }
    } catch (error) {
      console.error('Error deleting job role:', error);
    }
  };

  const startEditing = (role: JobRole) => {
    setEditingRole(role.id);
    setEditRole({ name: role.name, description: role.description || '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header onReferFriend={onReferFriend} onMessages={onMessages} />

      <div className="pt-20 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your platform and monitor key metrics</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.totalUsers}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
              <p className="text-xs text-gray-500">
                {stats.totalEmployees} employees, {stats.totalEmployers} employers
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.activeJobPosts}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Active Job Posts</h3>
              <p className="text-xs text-gray-500">Currently open positions</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.activeApplications}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Applications</h3>
              <p className="text-xs text-gray-500">
                {stats.totalApplications} total applications
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Job Roles Management</h2>
                <p className="text-sm text-gray-600">Add, edit, or remove available job roles</p>
              </div>
              <button
                onClick={() => setIsAddingRole(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Role</span>
              </button>
            </div>

            {isAddingRole && (
              <div className="mb-6 p-4 border-2 border-blue-200 rounded-xl bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-3">Add New Job Role</h3>
                <input
                  type="text"
                  placeholder="Role name (e.g., Chef, Butler)"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddRole}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingRole(false);
                      setNewRole({ name: '', description: '' });
                    }}
                    className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {jobRoles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role.is_active
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  {editingRole === role.id ? (
                    <div>
                      <input
                        type="text"
                        value={editRole.name}
                        onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        value={editRole.description}
                        onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateRole(role.id)}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="flex items-center space-x-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{role.name}</h3>
                        {role.description && (
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleActive(role.id, role.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            role.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {role.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => startEditing(role)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
