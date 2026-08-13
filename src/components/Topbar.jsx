import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Notification Data (simulated — replace with real API later) ───────────────
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'warning', icon: 'inventory_2', title: 'Low Stock Alert', message: 'Ivory Pearl GVT is below reorder point (12 left).', time: '5 min ago', read: false },
  { id: 2, type: 'success', icon: 'local_shipping', title: 'Shipment Delivered', message: 'Order #ORD-4821 was delivered to Ravi Sharma.', time: '28 min ago', read: false },
  { id: 3, type: 'info', icon: 'person_add', title: 'New Staff Added', message: 'A new staff account was assigned by Admin.', time: '1 hr ago', read: true },
  { id: 4, type: 'warning', icon: 'payments', title: 'Payment Overdue', message: 'Invoice #INV-302 from Kajaria Ceramics is 5 days overdue.', time: '3 hr ago', read: true },
];

const INITIAL_HISTORY = [
  { id: 1, icon: 'edit', action: 'Updated inventory stock', detail: 'Carrara White Marble — qty changed to 120', time: '2 min ago' },
  { id: 2, icon: 'shopping_bag', action: 'Created sales order', detail: 'Order #ORD-4856 for Sunita Patel', time: '18 min ago' },
  { id: 3, icon: 'person_add', action: 'Assigned new staff', detail: 'stock.handler@company.com added as Staff', time: '45 min ago' },
  { id: 4, icon: 'delete', action: 'Removed supplier', detail: 'Sunhearrt Ceramics marked as Inactive', time: '2 hr ago' },
  { id: 5, icon: 'login', action: 'Logged in', detail: 'Session started from Chrome / Windows', time: '3 hr ago' },
];

// ── Notification type → color mapping ────────────────────────────────────────
const typeColors = {
  warning: 'text-amber-500 bg-amber-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  info: 'text-executive-blue bg-executive-blue/10',
};

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Dropdown states
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Refs for click-outside detection
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const historyRef = useRef(null);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (historyRef.current && !historyRef.current.contains(e.target)) setShowHistory(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close others when one opens
  const openPanel = (panel) => {
    setShowProfile(panel === 'profile' ? (p) => !p : false);
    setShowNotifications(panel === 'notif' ? (p) => !p : false);
    setShowHistory(panel === 'history' ? (p) => !p : false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Build user display info
  const userName = user?.name || 'User';
  const userRole = user?.role || 'staff';
  const userAvatar = user?.avatar || userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const userEmail = user?.email || '';

  const roleBadge = {
    owner: { label: 'Owner', color: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
    admin: { label: 'Admin', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' },
    staff: { label: 'Staff', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
  };
  const badge = roleBadge[userRole] || roleBadge.staff;

  return (
    <header className="fixed top-0 right-0 lg:left-64 left-0 h-16 px-4 lg:px-8 flex items-center justify-between z-40 glass-header transition-all duration-300">
      
      {/* Left — Hamburger + Search */}
      <div className="flex items-center gap-6 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden hover:bg-white/10 rounded-full p-2 transition-all flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-gray-400">menu</span>
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-theme-textMuted text-lg">search</span>
          <input 
            className="w-full bg-theme-bgInput border border-theme-border rounded-lg py-2 pl-10 pr-4 text-sm text-theme-text focus:border-executive-blue focus:ring-0 focus:bg-theme-bgHover transition-all placeholder:text-theme-textMuted outline-none" 
            placeholder="Search inventory..." 
            type="text"
          />
        </div>
      </div>

      {/* Right — Actions + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="hidden sm:flex hover:bg-theme-bgHover rounded-full p-2 transition-all cursor-pointer active:opacity-70 items-center justify-center text-theme-textMuted hover:text-theme-text"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => openPanel('notif')}
            className="relative hover:bg-theme-bgHover rounded-full p-2 transition-all cursor-pointer active:opacity-70 flex items-center justify-center text-theme-textMuted hover:text-theme-text"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-[-40px] sm:right-0 top-12 w-[90vw] sm:w-[360px] bg-[#f8f9fa] dark:bg-[#0f0f0f] border border-black/10 dark:border-white/8 rounded-lg shadow-2xl overflow-hidden animate-modal-pop font-[Manrope] z-50">
              <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-executive-blue hover:underline cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length > 0 ? notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 transition-colors hover:bg-black/3 dark:hover:bg-white/3 ${!n.read ? 'bg-executive-blue/5' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[n.type] || typeColors.info}`}>
                      <span className="material-symbols-outlined text-[16px]">{n.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {n.title}
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-executive-blue shrink-0"></span>}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-gray-400 text-xs">No notifications</div>
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-black/5 dark:border-white/5 text-center">
                <button className="text-[11px] font-semibold text-executive-blue hover:underline cursor-pointer">View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Activity History ──────────────────────────────────────────────── */}
        <div className="relative hidden sm:block" ref={historyRef}>
          <button
            onClick={() => openPanel('history')}
            className="hover:bg-theme-bgHover rounded-full p-2 transition-all cursor-pointer active:opacity-70 flex items-center justify-center text-theme-textMuted hover:text-theme-text"
            title="Activity History"
          >
            <span className="material-symbols-outlined">history</span>
          </button>

          {showHistory && (
            <div className="absolute right-[-20px] sm:right-0 top-12 w-[90vw] sm:w-[340px] bg-[#f8f9fa] dark:bg-[#0f0f0f] border border-black/10 dark:border-white/8 rounded-lg shadow-2xl overflow-hidden animate-modal-pop font-[Manrope] z-50">
              <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {INITIAL_HISTORY.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 hover:bg-black/3 dark:hover:bg-white/3 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 text-gray-500">
                      <span className="material-symbols-outlined text-[14px]">{h.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-900 dark:text-white">{h.action}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{h.detail}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{h.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-black/5 dark:border-white/5 text-center">
                <button className="text-[11px] font-semibold text-executive-blue hover:underline cursor-pointer">View Full History</button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-[1px] bg-theme-border mx-1"></div>

        {/* ── User Profile Dropdown ────────────────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => openPanel('profile')}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group"
          >
            {/* Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-executive-blue/15 border border-executive-blue/25 flex items-center justify-center text-executive-blue font-bold text-[12px] shrink-0">
              {userAvatar}
            </div>
            {/* Name + Role */}
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight">{userName}</p>
              <p className="text-[10px] text-gray-500 capitalize leading-tight mt-0.5">{badge.label}</p>
            </div>
            <span className="material-symbols-outlined text-gray-400 text-[16px] hidden sm:block transition-transform group-hover:translate-y-0.5">
              expand_more
            </span>
          </button>

          {showProfile && (
            <div className="absolute right-[-10px] sm:right-0 top-12 w-[90vw] sm:w-[260px] bg-[#f8f9fa] dark:bg-[#0f0f0f] border border-black/10 dark:border-white/8 rounded-lg shadow-2xl overflow-hidden animate-modal-pop font-[Manrope] z-50">
              {/* User Info Header */}
              <div className="px-4 py-4 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-executive-blue/15 border border-executive-blue/25 flex items-center justify-center text-executive-blue font-bold text-sm shrink-0">
                    {userAvatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <button
                  onClick={() => { setShowProfile(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-gray-400">settings</span>
                  Account Settings
                </button>
                <button
                  onClick={() => { setShowProfile(false); toggleTheme(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer sm:hidden"
                >
                  <span className="material-symbols-outlined text-[18px] text-gray-400">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-black/5 dark:border-white/5 py-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}