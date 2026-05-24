import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { AiGenerator } from '@/pages/AiGenerator';
import { DesignStudio } from '@/pages/DesignStudio';
import { BIMViewer } from '@/pages/BIMViewer';
import { GISAnalysis } from '@/pages/GISAnalysis';
import { BOQEstimation } from '@/pages/BOQEstimation';
import { Projects } from '@/pages/Projects';
import { Marketplace } from '@/pages/Marketplace';
import { Team } from '@/pages/Team';
import { Settings } from '@/pages/Settings';
import { Compliance } from '@/pages/Compliance';
import { Sustainability } from '@/pages/Sustainability';
import { Tutor } from '@/pages/Tutor';
import { Interoperability } from '@/pages/Interoperability';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { useAppStore } from '@/store/appStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />

      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generator" element={<AiGenerator />} />
              <Route path="/design" element={<DesignStudio />} />
              <Route path="/bim" element={<BIMViewer />} />
              <Route path="/gis" element={<GISAnalysis />} />
              <Route path="/boq" element={<BOQEstimation />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/team" element={<Team />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/interoperability" element={<Interoperability />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
