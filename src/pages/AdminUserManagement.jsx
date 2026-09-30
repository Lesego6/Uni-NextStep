import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserStatus,
} from '../services/api.js';
import {
  AlertCircle,
  Filter,
  Lock,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Unlock,
  UserPlus,
  X,
} from 'lucide-react';
import SelectMenu from '../components/SelectMenu.jsx';

const roles = ['All', 'Student', 'Admin'];
const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Matriculated'];
const statuses = ['Active', 'Inactive'];
const blankUser = {
  name: '',
  email: '',
  password: '',
  role: 'Student',
  grade: 'Grade 12',
  aps_score: '0',
  status: 'Active',
};

export default function AdminUserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState(blankUser);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const loadUsers = async () => {
    try {
      setPageError('');
      setLoading(true);

      const data = await getAdminUsers();
      setUsers(data.users);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.display_id.toLowerCase().includes(search);
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const resetAddModal = () => {
    setNewUser(blankUser);
    setFormError('');
    setShowAddModal(false);
  };

  const toggleStatus = async (selectedUser) => {
    const nextStatus = selectedUser.status === 'Active' ? 'Inactive' : 'Active';

    try {
      setPageError('');
      setBusyUserId(selectedUser.id);

      const data = await updateAdminUserStatus(selectedUser.id, nextStatus);
      setUsers((current) => current.map((user) => (
        user.id === selectedUser.id ? data.user : user
      )));
    } catch (error) {
      setPageError(error.message);
    } finally {
      setBusyUserId(null);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      setPageError('');
      setBusyUserId(userToDelete.id);

      await deleteAdminUser(userToDelete.id);
      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = newUser.name.trim();

    if (!trimmedName.includes(' ')) {
      setFormError('Please enter a first and last name.');
      return;
    }

    try {
      setIsSaving(true);

      const data = await createAdminUser({
        name: trimmedName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        status: newUser.status,
        grade: newUser.grade,
        aps_score: Number(newUser.aps_score || 0),
      });

      setUsers((current) => [data.user, ...current]);
      resetAddModal();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">User Management</h1>
          <p className="text-gray-500">Manage student and admin accounts</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition-all hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {pageError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{pageError}</span>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <div className="flex gap-3">
            <div className="w-40">
              <SelectMenu
                value={roleFilter}
                options={roles}
                onChange={setRoleFilter}
                icon={Filter}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">APS</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Apps</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-sm font-semibold text-primary">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-sm text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isBusy = busyUserId === user.id;
                  const isCurrentUser = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-500">{user.display_id}</td>
                      <td className="py-3 px-4 text-sm font-semibold">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`badge text-xs ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{user.aps}</td>
                      <td className="py-3 px-4 text-sm">{user.applications}</td>
                      <td className="py-3 px-4">
                        <span className={`badge text-xs ${
                          user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(user)}
                            disabled={isBusy || (isCurrentUser && user.status === 'Active')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-blue-50 transition-all disabled:cursor-not-allowed disabled:opacity-30"
                            title={user.status === 'Active' ? 'Lock user' : 'Unlock user'}
                          >
                            {user.status === 'Active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setUserToDelete(user)}
                            disabled={isBusy || isCurrentUser}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:cursor-not-allowed disabled:opacity-30"
                            title={isCurrentUser ? 'You cannot delete your own account' : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={resetAddModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-accent" />
                Add New User
              </h2>
              <button onClick={resetAddModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newUser.name}
                  onChange={(e) => {
                    setFormError('');
                    setNewUser({ ...newUser, name: e.target.value });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={newUser.email}
                  onChange={(e) => {
                    setFormError('');
                    setNewUser({ ...newUser, email: e.target.value });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength="8"
                  className="input-field"
                  value={newUser.password}
                  onChange={(e) => {
                    setFormError('');
                    setNewUser({ ...newUser, password: e.target.value });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectMenu
                  label="Role"
                  value={newUser.role}
                  options={roles.filter((role) => role !== 'All')}
                  onChange={(role) => setNewUser({ ...newUser, role })}
                />
                <SelectMenu
                  label="Status"
                  value={newUser.status}
                  options={statuses}
                  onChange={(status) => setNewUser({ ...newUser, status })}
                />
              </div>
              {newUser.role === 'Student' && (
                <div className="grid grid-cols-2 gap-3">
                  <SelectMenu
                    label="Grade"
                    value={newUser.grade}
                    options={grades}
                    onChange={(grade) => setNewUser({ ...newUser, grade })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">APS Score</label>
                    <input
                      type="number"
                      min="0"
                      max="42"
                      className="input-field"
                      value={newUser.aps_score}
                      onChange={(e) => setNewUser({ ...newUser, aps_score: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setUserToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-primary">Delete User</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {userToDelete.name} will be removed from the system.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              This also removes this user's profile and applications.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteUser}
                disabled={busyUserId === userToDelete.id}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                {busyUserId === userToDelete.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
