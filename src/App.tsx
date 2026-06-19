import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/Login';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import IDEPage from '@/pages/dashboard/IDEPage';
import SQLWorkbenchPage from '@/pages/dashboard/SQLWorkbenchPage';
import DashboardStudioPage from '@/pages/dashboard/DashboardStudioPage';
import AIAnalystPage from '@/pages/dashboard/AIAnalystPage';
import WorkspacePage from '@/pages/dashboard/WorkspacePage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import DataSourcesPage from '@/pages/dashboard/DataSourcesPage';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminAuditLogs from '@/pages/admin/AdminAuditLogs';
import AdminAIConfig from '@/pages/admin/AdminAIConfig';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const authed = !isLoading && isAuthenticated;
  const notAuthed = !isLoading && !isAuthenticated;

  return (
    <ErrorBoundary label="Application">
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={authed ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route
          path="/dashboard"
          element={notAuthed ? <Navigate to="/login" replace /> : <DashboardLayout />}
        >
          <Route index element={<ErrorBoundary label="Dashboard Home"><DashboardHome /></ErrorBoundary>} />
          <Route path="ide" element={<ErrorBoundary label="IDE"><IDEPage /></ErrorBoundary>} />
          <Route path="sql" element={<ErrorBoundary label="SQL Workbench"><SQLWorkbenchPage /></ErrorBoundary>} />
          <Route path="studio" element={<ErrorBoundary label="Dashboard Studio"><DashboardStudioPage /></ErrorBoundary>} />
          <Route path="ai" element={<ErrorBoundary label="AI Analyst"><AIAnalystPage /></ErrorBoundary>} />
          <Route path="workspace" element={<ErrorBoundary label="Workspace"><WorkspacePage /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary label="Settings"><SettingsPage /></ErrorBoundary>} />
          <Route path="datasources" element={<ErrorBoundary label="Data Sources"><DataSourcesPage /></ErrorBoundary>} />
        </Route>

        <Route
          path="/admin"
          element={notAuthed || user?.role !== 'admin' ? <Navigate to="/" replace /> : <AdminLayout />}
        >
          <Route index element={<ErrorBoundary label="Admin Dashboard"><AdminDashboard /></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary label="Admin Users"><AdminUsers /></ErrorBoundary>} />
          <Route path="audit" element={<ErrorBoundary label="Audit Logs"><AdminAuditLogs /></ErrorBoundary>} />
          <Route path="ai-config" element={<ErrorBoundary label="AI Config"><AdminAIConfig /></ErrorBoundary>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" theme="dark" />
    </ErrorBoundary>
  );
}

export default App;
