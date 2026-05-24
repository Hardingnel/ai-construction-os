'use client';
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
function downloadPDF(path: string, filename: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('aicos-token') : null;
  fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((r) => r.blob())
    .then((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); });
}

export default function CompliancePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [country, setCountry] = useState('Sierra Leone');
  const [result, setResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => { api.get<any[]>('/projects').then(setProjects).catch(() => {}); }, []);

  const handleCheck = async () => {
    if (!selectedProject) return;
    setChecking(true);
    try { const res: any = await api.post(`/compliance/check/${selectedProject}`, { country }); setResult(res); toast.success('Check complete'); } catch (e: any) { toast.error(e.message); }
    setChecking(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Compliance</h1><p className="text-muted-foreground mt-1">AI-powered building code compliance checking</p></div>
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-xs text-muted-foreground">Project</label><select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select...</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="text-xs text-muted-foreground">Country</label><select value={country} onChange={e => setCountry(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option>Sierra Leone</option><option>Nigeria</option><option>Ghana</option></select></div>
          <div className="flex items-end"><button onClick={handleCheck} disabled={checking || !selectedProject} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"><Shield className="w-4 h-4" />{checking ? 'Checking...' : 'Run Check'}</button></div>
        </div>
      </div>
      {result && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5 flex items-center justify-between">
            <div><p className="text-lg font-bold">Score: {result.score}%</p><p className="text-xs text-muted-foreground">{result.passed} passed · {result.warnings} warnings · {result.failed} failed</p></div>
            <div className="flex items-center gap-3">
              <button onClick={() => downloadPDF(`/pdf/compliance/${result.id}`, `compliance-${result.id}.pdf`)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background text-sm hover:bg-accent"><FileText className="w-4 h-4" /> Export PDF</button>
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${result.score >= 80 ? 'bg-emerald-500/20 text-emerald-500' : result.score >= 50 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>{result.score >= 80 ? 'Compliant' : result.score >= 50 ? 'Needs Review' : 'Non-Compliant'}</div>
            </div>
          </div>
          <div className="space-y-2">{result.results?.map((r: any, i: number) => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-start gap-3">
              {r.status === 'passed' ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" /> : r.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
              <div><p className="font-medium text-sm">{r.title || r.code}</p><p className="text-xs text-muted-foreground mt-0.5">{r.finding || r.description}</p></div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
