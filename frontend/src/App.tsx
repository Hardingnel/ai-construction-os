import { Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
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
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
