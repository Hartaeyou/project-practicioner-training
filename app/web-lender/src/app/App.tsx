import { BrowserRouter as Router, Routes, Route } from 'react-router';
import DashboardLayout from './components/DashboardLayout';
import MainDashboard from './components/screens/MainDashboard';
import ApprovalQueue from './components/screens/ApprovalQueue';
import DataInsightsDetail from './components/screens/DataInsightsDetail';
import TrustNetworkAnalysis from './components/screens/TrustNetworkAnalysis';
import Settings from './components/screens/Settings';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<MainDashboard />} />
          <Route path="wawasan-data" element={<ApprovalQueue />} />
          <Route path="wawasan-data/:id" element={<DataInsightsDetail />} />
          <Route path="analisis-jaringan" element={<TrustNetworkAnalysis />} />
          <Route path="pengaturan" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
