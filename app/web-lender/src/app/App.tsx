import { BrowserRouter as Router, Routes, Route } from 'react-router';
import DashboardLayout from './components/DashboardLayout';
import MainDashboard from './components/screens/MainDashboard';
import ApprovalQueue from './components/screens/ApprovalQueue';
import DataInsightsDetail from './components/screens/DataInsightsDetail';
import TrustNetworkAnalysis from './components/screens/TrustNetworkAnalysis';
import Settings from './components/screens/Settings';
import LoginPage from './components/auth/Loginpage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from '../lib/AuthContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MainDashboard />} />
            <Route path="wawasan-data" element={<ApprovalQueue />} />
            <Route path="wawasan-data/:id" element={<DataInsightsDetail />} />
            <Route path="analisis-jaringan/:id" element={<TrustNetworkAnalysis />} />
            <Route path="pengaturan" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}