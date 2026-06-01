import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLES, ROLE_PERMISSIONS } from '../context/AuthContext';

const ALL_NAV_ITEMS = [
  { label: 'Dashboard',       icon: 'dashboard',     path: '/' },
  { label: 'Stock Inventory', icon: 'inventory_2',   path: '/inventory' },
  { label: 'Sales Orders',    icon: 'shopping_bag',  path: '/sales-orders' },
  { label: 'Suppliers',       icon: 'local_shipping',path: '/suppliers' },
  { label: 'Reporting',       icon: 'analytics',     path: '/reports' },
  { label: 'Billing',         icon: 'receipt_long',  path: '/billing' },
  { label: 'Staff Management',icon: 'people',        path: '/staff' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const allowedPaths = user ? (ROLE_PERMISSIONS[user.role] || []) : [];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-[#050505]/80 backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto w-64 h-screen glass-nav font-[Manrope] tracking-tight antialiased transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-executive-blue rounded flex items-center justify-center shadow-lg shadow-executive-blue/20 shrink-0">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          </div>
          <span className="text-lg font-bold tracking-tighter text-gray-900 dark:text-white uppercase m-0">Inventory OS</span>
        </div>
        
        <div className="flex-1 px-4 space-y-1">
          {ALL_NAV_ITEMS.filter(item => allowedPaths.includes(item.path)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()} // close on mobile
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-all group ${
                  isActive
                    ? 'text-executive-blue bg-black/5 dark:bg-white/5 border-r-2 border-executive-blue rounded-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg'
                }`
              }
              end={item.path === '/'}
            >
              {({ isActive }) => (
                <>
                  <span 
                    className={`material-symbols-outlined ${!isActive ? 'group-hover:text-executive-blue' : ''}`} 
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[14px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 transition-all group text-[14px] font-medium ${
                isActive
                  ? 'text-executive-blue bg-black/5 dark:bg-white/5 border-r-2 border-executive-blue rounded-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${!isActive ? 'group-hover:text-gray-900 dark:group-hover:text-white' : ''}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
                <span>Settings</span>
              </>
            )}
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all rounded-lg group text-[14px] font-medium">
            <span className="material-symbols-outlined group-hover:text-red-600 dark:group-hover:text-red-400">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}