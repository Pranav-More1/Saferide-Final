import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
<<<<<<< HEAD
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import LiveTracking from './pages/LiveTracking';
import History from './pages/History';
=======
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyChildren from './pages/MyChildren';
import TrackBus from './pages/TrackBus';
import AttendanceHistory from './pages/AttendanceHistory';
>>>>>>> friend/main
import Notifications from './pages/Notifications';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

<<<<<<< HEAD
// Public Route wrapper
=======
// Public Route wrapper (redirects if already authenticated)
>>>>>>> friend/main
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
<<<<<<< HEAD
            <Home />
=======
            <Dashboard />
>>>>>>> friend/main
          </ProtectedRoute>
        }
      />
      <Route
        path="/children"
        element={
          <ProtectedRoute>
<<<<<<< HEAD
            <Home />
=======
            <MyChildren />
>>>>>>> friend/main
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
<<<<<<< HEAD
            <LiveTracking />
=======
            <TrackBus />
>>>>>>> friend/main
          </ProtectedRoute>
        }
      />
      <Route
<<<<<<< HEAD
        path="/history"
        element={
          <ProtectedRoute>
            <History />
=======
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendanceHistory />
>>>>>>> friend/main
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
<<<<<<< HEAD
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
=======
    <BrowserRouter>
      <AuthProvider>
>>>>>>> friend/main
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
<<<<<<< HEAD
                primary: '#22C55E',
=======
                primary: '#10B981',
>>>>>>> friend/main
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
<<<<<<< HEAD
    </ThemeProvider>
=======
>>>>>>> friend/main
  );
}
