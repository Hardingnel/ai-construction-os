'use client';
import { useState, useEffect } from 'react';
import { Calculator, FileSpreadsheet, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
function downloadPDF(path: string, filename: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('aicos-token') : null;
  fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((r) => r.blob())
    .then((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); });
}

export default function BOQPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get<any[]>('/projects').then(setProjects).catch(() => {}); }, []);

  const loadItems = async (pid: string) => {
    setSelectedProject(pid);
    setLoading(true);
    try { const res = await api.get<any[]>(`/boq/${pid}`); setItems(res); } catch { setItems([]); }
    setLoading(false);
  };

  const total = items.reduce((s, i) => s + (i.quantity || 0) * (i.rate || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">BOQ Estimation</h1><p className="text-muted-foreground mt-1">Bill of Quantities and cost estimation</p></div>
        {selectedProject && items.length > 0 && (
          <button onClick={() => downloadPDF(`/pdf/boq/${selectedProject}`, `boq-${selectedProject}.pdf`)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background text-sm hover:bg-accent"><FileText className="w-4 h-4" /> Export PDF</button>
        )}
      </div>
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Select Project</h3>
        <select value={selectedProject} onChange={e => loadItems(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Choose a project...</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>}
      {!loading && selectedProject && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Calculator className="w-12 h-12 mb-3 opacity-40" /><p>No BOQ items for this project</p></div>
      )}
      {!loading && items.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-accent/30"><th className="text-left p-3">Item</th><th className="text-left p-3">Unit</th><th className="text-right p-3">Qty</th><th className="text-right p-3">Rate</th><th className="text-right p-3">Total</th></tr></thead>
            <tbody>{items.map((i: any) => (<tr key={i.id} className="border-b border-border/50"><td className="p-3">{i.item || i.description}</td><td className="p-3">{i.unit}</td><td className="p-3 text-right">{i.quantity}</td><td className="p-3 text-right">${i.rate?.toFixed(2)}</td><td className="p-3 text-right font-medium">${((i.quantity || 0) * (i.rate || 0)).toFixed(2)}</td></tr>))}</tbody>
          </table>
          <div className="p-3 border-t bg-accent/20 flex justify-between font-bold"><span>Grand Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
}
