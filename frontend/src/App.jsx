import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';

// Student pages
import StudentDashboard  from './pages/student/StudentDashboard';
import StudentCourses    from './pages/student/StudentCourses';
import StudentEnrollments from './pages/student/StudentEnrollments';
import AiChatPage        from './pages/student/AiChatPage';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import StudentSchedule from './pages/student/StudentSchedule';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/student/CartPage';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminCourses     from './pages/admin/AdminCourses';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminSessions from './pages/admin/AdminSessions';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

            {/* Student routes */}
            <Route path="/student/dashboard"   element={<ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/courses"     element={<ProtectedRoute role="STUDENT"><StudentCourses /></ProtectedRoute>} />
            <Route path="/student/enrollments" element={<ProtectedRoute role="STUDENT"><StudentEnrollments /></ProtectedRoute>} />
            <Route path="/student/ai-chat"     element={<ProtectedRoute role="STUDENT"><AiChatPage /></ProtectedRoute>} />
            <Route path="/student/announcements" element={<ProtectedRoute role="STUDENT"><StudentAnnouncements /></ProtectedRoute>} />
            <Route path="/student/schedule" element={<ProtectedRoute role="STUDENT"><StudentSchedule /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute role="STUDENT"><ProfilePage /></ProtectedRoute>} />
            <Route path="/student/cart" element={<ProtectedRoute role="STUDENT"><CartPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard"   element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/courses"     element={<ProtectedRoute role="ADMIN"><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/enrollments" element={<ProtectedRoute role="ADMIN"><AdminEnrollments /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute role="ADMIN"><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/sessions" element={<ProtectedRoute role="ADMIN"><AdminSessions /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute role="ADMIN"><ProfilePage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
