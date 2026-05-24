'use client';
import { useState, useEffect } from 'react';
import { Leaf, Zap, Droplets, Sun, Loader2, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
function downloadPDF(path: string, filename: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('aicos-token') : null;
  fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((r) => r.blob())
    .then((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); });
}

export default function SustainabilityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => { api.get<any[]>('/projects').then(setProjects).catch(() => {}); }, []);

  const runAssessment = async () => {
    if (!selectedProject) return;
    setAssessing(true);
    try { const res: any = await api.post(`/sustainability/assess/${selectedProject}`); setAssessment(res); toast.success('Assessment complete'); } catch (e: any) { toast.error(e.message); }
    setAssessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Sustainability</h1><p className="text-muted-foreground mt-1">Environmental impact and sustainability assessment</p></div>
        {assessment && (
          <button onClick={() => downloadPDF(`/pdf/sustainability/${selectedProject}`, `sustainability-${selectedProject}.pdf`)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background text-sm hover:bg-accent"><BarChart3 className="w-4 h-4" /> Export PDF</button>
        )}
      </div>
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-muted-foreground">Project</label><select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select...</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="flex items-end"><button onClick={runAssessment} disabled={assessing || !selectedProject} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"><Leaf className="w-4 h-4" />{assessing ? 'Assessing...' : 'Run Assessment'}</button></div>
        </div>
      </div>
      {assessment && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-500" /> Overview</h3>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Overall Score</span><span className="text-2xl font-bold">{assessment.overallScore}/100</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Rating</span><span className={`px-3 py-1 rounded-lg text-sm font-bold ${assessment.overallRating === 'A+' || assessment.overallRating === 'A' ? 'bg-emerald-500/20 text-emerald-500' : assessment.overallRating === 'B' ? 'bg-blue-500/20 text-blue-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{assessment.overallRating}</span></div>
          </div>
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Energy</h3>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Energy Score</span><span className="text-lg font-bold">{assessment.energyScore}/100</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Solar Potential</span><span className="text-lg font-bold">{assessment.solarKwhYear?.toLocaleString()} kWh/yr</span></div>
          </div>
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /> Water & Climate</h3>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Water Efficiency</span><span className="text-lg font-bold">{assessment.waterEfficiency}/100</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Flood Resilience</span><span className="text-lg font-bold">{assessment.floodResilience}</span></div>
          </div>
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Sun className="w-4 h-4 text-amber-500" /> Carbon</h3>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Carbon Rating</span><span className="text-lg font-bold">{assessment.carbonRating}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Footprint</span><span className="text-lg font-bold">{(assessment.carbonFootprint / 1000).toFixed(1)}t CO₂</span></div>
          </div>
          {assessment.recommendations && (
            <div className="col-span-2 glass-card rounded-xl p-5 space-y-2">
              <h3 className="font-semibold">Recommendations</h3>
              {assessment.recommendations.map((r: string, i: number) => <p key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{r}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
