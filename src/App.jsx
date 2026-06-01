import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import SalesOrders from './pages/SalesOrders';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import StaffManagement from './pages/StaffManagement';


export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
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
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  );
}