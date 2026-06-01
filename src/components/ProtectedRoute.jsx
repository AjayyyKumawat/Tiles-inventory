import { Navigate, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, canAccess } = useAuth();
  const location = useLocation();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role doesn't allow this route → 403 page
  if (!canAccess(location.pathname)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">Access Restricted</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xs">
            Your <span className="font-medium capitalize">{user.role}</span> role doesn't have permission to view this page.
            Contact your Owner to request access.
          </p>
        </div>
        <a
          href="/"
          className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return children;
}
