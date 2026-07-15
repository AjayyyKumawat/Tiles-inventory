import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Suspense, lazy } from 'react';
import { store } from './store';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Billing = lazy(() => import('./pages/Billing'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      <p className="text-sm font-medium text-gray-500">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* Protected layout — all children are role-guarded */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="inventory"       element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                  <Route path="sales-orders"    element={<ProtectedRoute><SalesOrders /></ProtectedRoute>} />
                  <Route path="customers"       element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                  <Route path="suppliers"       element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                  <Route path="reports"         element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="billing"          element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                  <Route path="staff"            element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  );
}