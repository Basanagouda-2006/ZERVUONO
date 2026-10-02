import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Public pages
import { LandingPage } from '../features/public/LandingPage';
import { HowItWorks } from '../features/public/HowItWorks';
import { Capabilities } from '../features/public/Capabilities';
import { PricingPage } from '../features/public/PricingPage';
import { TeamsPage } from '../features/public/TeamsPage';
import { ContactPage } from '../features/public/ContactPage';
import { PrivacyPolicy, TermsOfService } from '../features/public/LegalPages';
import { NotFoundPage } from '../features/public/NotFoundPage';

// Auth pages
import { Login } from '../features/auth/Login';
import { Register } from '../features/auth/Register';
import { ForgotPassword } from '../features/auth/ForgotPassword';
import { ResetPassword } from '../features/auth/ResetPassword';
import { AcceptInvitation } from '../features/auth/AcceptInvitation';

// Workspace pages
import { CustomerDashboard } from '../features/customer/CustomerDashboard';
import { TechnicianDashboard } from '../features/technician/TechnicianDashboard';
import { ManagerDashboard } from '../features/manager/ManagerDashboard';
import { AdminDashboard } from '../features/admin/AdminDashboard';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs font-semibold text-brand-forest/60">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // If user role is different, gracefully route to their dedicated workspace
    if (user.role === 'Customer') return <Navigate to="/customer" replace />;
    if (user.role === 'Technician') return <Navigate to="/technician" replace />;
    if (user.role === 'Manager') return <Navigate to="/manager" replace />;
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Auto-routing workspace dispatcher
const WorkspaceDispatcher: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs font-semibold text-brand-forest/60">
        Loading workspace...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case 'Customer':
      return <Navigate to="/customer" replace />;
    case 'Technician':
      return <Navigate to="/technician" replace />;
    case 'Manager':
      return <Navigate to="/manager" replace />;
    case 'Admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/customer" replace />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/capabilities" element={<Capabilities />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

      {/* Role Workspaces */}
      <Route path="/workspace" element={<WorkspaceDispatcher />} />
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['Customer', 'Admin', 'Manager']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={['Technician', 'Admin', 'Manager']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
