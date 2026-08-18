import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import APSCalculator from './pages/APSCalculator.jsx';
import CourseRecommendations from './pages/CourseRecommendations.jsx';
import UniversityBrowser from './pages/UniversityBrowser.jsx';
import ApplicationPage from './pages/ApplicationPage.jsx';
import ApplicationTracker from './pages/ApplicationTracker.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminUserManagement from './pages/AdminUserManagement.jsx';
import AdminReports from './pages/AdminReports.jsx';
import StudentNav from './components/StudentNav.jsx';
import AdminNav from './components/AdminNav.jsx';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  return isLoggedIn ? children : <Navigate to="/auth" replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  return isAdmin ? children : <Navigate to="/admin" replace />;
}

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-primary">
      Loading...
    </div>
  );
}

function App() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {!loading && isLoggedIn && !isAdmin && <StudentNav />}
      {!loading && isAdmin && <AdminNav />}
      <main className={isLoggedIn || isAdmin ? 'pt-16' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/calculator" element={<ProtectedRoute><APSCalculator /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><CourseRecommendations /></ProtectedRoute>} />
          <Route path="/universities" element={<ProtectedRoute><UniversityBrowser /></ProtectedRoute>} />
          <Route path="/apply" element={<ProtectedRoute><ApplicationPage /></ProtectedRoute>} />
          <Route path="/track" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
