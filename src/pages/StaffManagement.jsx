import { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';

export default function StaffManagement() {
  const { user: currentUser, usersList, addUser, removeUser, updateUser } = useAuth();
  
  // Search and Filter State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);

  // Form fields state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState(ROLES.STAFF);
  const [formError, setFormError] = useState('');

  // Password Generation Helper
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    // ensure at least one letter, number, and special character
    pass += 'Staff_';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pass);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalType('add');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole(ROLES.STAFF);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setModalType('edit');
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(''); // leave blank unless resetting password
    setFormRole(user.role);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formName.trim()) {
      setFormError('Please enter a full name.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (modalType === 'add' && !formPassword) {
      setFormError('Please enter a password.');
      return;
    }

    if (modalType === 'add' && formPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    // Check duplicate email
    const duplicate = usersList.find(
      (u) => u.email.toLowerCase() === formEmail.toLowerCase() && u.id !== editingUserId
    );
    if (duplicate) {
      setFormError('An account with this email address already exists.');
      return;
    }

    if (modalType === 'add') {
      addUser({
        name: formName.trim(),
        email: formEmail.toLowerCase().trim(),
        password: formPassword,
        role: formRole,
      });
    } else {
      const updateData = {
        name: formName.trim(),
        email: formEmail.toLowerCase().trim(),
        role: formRole,
      };
      if (formPassword) {
        updateData.password = formPassword;
      }
      updateUser(editingUserId, updateData);
    }

    setIsModalOpen(false);
  };

  // Handle Delete Action
  const handleDeleteUser = (userId) => {
    if (userId === currentUser.id) {
      alert("Self-Safety Action: You cannot delete the account you are currently logged into.");
      return;
    }
    if (window.confirm("Are you sure you want to revoke access and delete this user?")) {
      removeUser(userId);
    }
  };

  // Filtered list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Role display details helper
  const getRoleDetails = (role) => {
    switch (role) {
      case ROLES.OWNER:
        return {
          label: 'Owner / Executive',
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
          icon: 'shield_person',
        };
      case ROLES.ADMIN:
        return {
          label: 'System Admin',
          color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400',
          icon: 'admin_panel_settings',
        };
      case ROLES.STAFF:
      default:
        return {
          label: 'Inventory Staff',
          color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
          icon: 'group',
        };
    }
  };

  return (
    <>
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Assign, configure and audit administrative or inventory operator accounts.</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white text-[14px] font-semibold transition-all rounded shadow-lg shadow-executive-blue/20 active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Assign Account
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 font-[Manrope] mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all"
          />
        </div>
        
        {/* Role Segmented Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg shrink-0 overflow-x-auto">
          {[
            { key: 'all', label: 'All Accounts' },
            { key: ROLES.OWNER, label: 'Owners' },
            { key: ROLES.ADMIN, label: 'Admins' },
            { key: ROLES.STAFF, label: 'Staff' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === tab.key
                  ? 'bg-white dark:bg-white/10 text-executive-blue dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-[Manrope]">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => {
            const isSelf = u.id === currentUser.id;
            const details = getRoleDetails(u.role);
            
            return (
              <div 
                key={u.id} 
                className="glass-panel p-6 rounded-lg flex flex-col justify-between hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 relative group"
              >
                <div>
                  {/* Top Line Meta */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {/* Initials Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-executive-blue/15 border border-executive-blue/20 text-executive-blue font-bold text-sm shrink-0">
                        {u.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-[15px] flex items-center gap-1.5">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-executive-blue/10 text-executive-blue dark:bg-executive-blue/20 dark:text-white border border-executive-blue/25">
                              You
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-gray-500 lowercase tracking-wide">{u.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Privileges */}
                  <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-500">Access Privilege:</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${details.color}`}>
                        <span className="material-symbols-outlined text-[12px]">{details.icon}</span>
                        {details.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-500">Organization:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{u.company || 'Hansa Marble'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-500">Status:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Status
                      </span>
                    </div>
                  </div>
                </div>

                {/* Directory Controls */}
                <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-900 dark:text-white text-[12px] font-semibold border border-black/10 dark:border-white/10 rounded transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Modify
                  </button>
                  
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={isSelf}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded border transition-all active:scale-[0.98] ${
                      isSelf
                        ? 'bg-black/5 text-gray-400 dark:bg-white/5 dark:text-zinc-600 border-none cursor-not-allowed'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 cursor-pointer'
                    }`}
                    title={isSelf ? "Self-Safety: Cannot delete your own logged-in session" : "Revoke User Access"}
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    Revoke
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-gray-400 text-[48px] mb-3">badge_critical_status</span>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">No Users Found</h3>
            <p className="text-gray-500 text-xs mt-1">Try broadening your search filter or assign a new operator.</p>
          </div>
        )}
      </div>

      {/* CREATE & EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md animate-fade-backdrop"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="glass-panel w-full max-w-md p-6 rounded-lg shadow-2xl relative z-[101] font-[Manrope] animate-modal-pop">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">
                  {modalType === 'add' ? 'Assign New Account' : 'Modify Account Access'}
                </h2>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {modalType === 'add' ? 'Create a brand new secure account for administrators or staff.' : 'Modify account details, roles, or update authentication credentials.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all"
                  placeholder="e.g. Jameson Vance"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">Email address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all"
                  placeholder="e.g. logistics@company.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                    {modalType === 'add' ? 'Secure Password' : 'Reset Password (Optional)'}
                  </label>
                  <button 
                    type="button" 
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-executive-blue hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">key</span>
                    Generate password
                  </button>
                </div>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full p-2.5 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all"
                  placeholder={modalType === 'add' ? 'Password (minimum 6 chars)' : 'Leave blank to preserve current password'}
                  required={modalType === 'add'}
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">Role & Access Privilege</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full p-2.5 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none cursor-pointer focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all"
                >
                  <option value={ROLES.STAFF} className="bg-white dark:bg-charcoal text-gray-900 dark:text-white">Staff (Limited Access — Stock & Orders Only)</option>
                  <option value={ROLES.ADMIN} className="bg-white dark:bg-charcoal text-gray-900 dark:text-white">Admin (Full System Privilege)</option>
                  <option value={ROLES.OWNER} className="bg-white dark:bg-charcoal text-gray-900 dark:text-white">Owner (Full System & Session Privilege)</option>
                </select>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[12px] font-medium text-center">
                  {formError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent text-gray-600 dark:text-gray-400 text-sm font-semibold rounded hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white text-sm font-semibold rounded shadow-lg shadow-executive-blue/25 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {modalType === 'add' ? 'Assign Access' : 'Save Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
