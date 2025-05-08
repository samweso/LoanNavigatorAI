import { useEffect, lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/ui/loader';

// Layout components
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Dashboard pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const CallDetailPage = lazy(() => import('./pages/dashboard/CallDetailPage'));
const RecordCallPage = lazy(() => import('./pages/dashboard/RecordCallPage'));
const LoanApplicationPage = lazy(() => import('./pages/dashboard/LoanApplicationPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));

// Subscription pages
const SubscriptionPage = lazy(() => import('./pages/subscription/SubscriptionPage'));

function App() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Update document title based on route
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const pageName = pathSegments.length > 0 
      ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() + 
        pathSegments[pathSegments.length - 1].slice(1)
      : 'Dashboard';
    
    document.title = `LoanNavigator AI | ${pageName}`;
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader size="lg" />
        </div>
      }
    >
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/dashboard" replace />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/call/:id" element={user ? <CallDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/record" element={user ? <RecordCallPage /> : <Navigate to="/login" replace />} />
          <Route path="/application/:id" element={user ? <LoanApplicationPage /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
          <Route path="/subscription" element={user ? <SubscriptionPage /> : <Navigate to="/login" replace />} />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        
        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;