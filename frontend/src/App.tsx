import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import UploadForm from './components/UploadForm';
import AIDetectionPage from './components/AIDetectionPage';
import AdminPage from './components/AdminPage';
import BatchResultsPage from './components/BatchResultsPage';
import LibraryManagePage from './components/LibraryManagePage';
import LibraryDetailPage from './components/LibraryDetailPage';
import GuidePage from './components/GuidePage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="upload" element={<ProtectedRoute><UploadForm /></ProtectedRoute>} />
            <Route path="ai-check" element={<ProtectedRoute><AIDetectionPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="libraries" element={<ProtectedRoute requiredRole="moderator"><LibraryManagePage /></ProtectedRoute>} />
            <Route path="libraries/:libraryId" element={<ProtectedRoute requiredRole="moderator"><LibraryDetailPage /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredRole="admin"><SettingsPage /></ProtectedRoute>} />
            <Route path="batch/:batchId" element={<ProtectedRoute><BatchResultsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
